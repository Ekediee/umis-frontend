# Google SSO (Babcock accounts)

"Sign in with your Babcock email" on the login page. Only Google accounts on an allowed
Babcock domain can get through, and each one must map to a UMIS student record.

The feature is **off by default**: the button only appears when `GOOGLE_CLIENT_ID`
and `GOOGLE_CLIENT_SECRET` are both set. Unsetting either one is the rollback.

## How it works

```
[Sign in with your Babcock email]  plain <a href="/api/auth/google">
  -> GET /api/auth/google            state + nonce + PKCE verifier -> signed httpOnly cookie (10 min) -> 302 Google
  -> Google account chooser (prompt=select_account)
  -> GET /api/auth/google/callback   1. cookie + state check   4. backend verifies the token and issues the UMIS token
                                     2. code -> id_token       5. createSession() -> /dashboard?login=success
                                     3. verify id_token + Babcock domain check
  -> any failure: 302 /?sso_error=<code>   (the login form maps the code to friendly copy)
```

Google only proves who the user is. The UMIS session token is still issued by the
backend, so a backend endpoint is required (below).

### Domain enforcement (all server-side)

The `hd=*` request parameter is only a picker hint and can be edited out of the URL,
so it is **not** relied on. The callback checks the verified ID token:

1. `email_verified` is true.
2. The email host is an allowed domain (`GOOGLE_ALLOWED_DOMAINS`, default `babcock.edu.ng`).
   An entry matches itself and its subdomains, with a dot boundary, so
   `evilbabcock.edu.ng` and `babcock.edu.ng.evil.io` are rejected.
3. The `hd` claim is present and is the email's domain or a parent of it
   (proves a Workspace-managed account, not a consumer account using a look-alike address).
4. The backend repeats verification independently and finds a student record.

## Setup

### 1. Google Cloud (needs a Babcock Workspace admin)

1. Create a project **inside the Babcock Workspace organisation**.
2. *APIs & Services -> OAuth consent screen*: choose **Internal**. Google then
   refuses every non-Babcock account itself and no app verification is needed.
   (If Internal is unavailable, choose External and publish to *In production*.
   Testing mode caps at 100 users. Scopes used are `openid email profile` only.)
3. *Credentials -> Create OAuth client ID -> Web application*. Add **Authorised redirect URIs**:
   - `https://<production-host>/api/auth/google/callback`
   - `http://localhost:3000/api/auth/google/callback` (development)
4. Copy the client ID and secret.

Google rejects `http://` redirect URIs for any host except `localhost`, so production
must be served over HTTPS on a real hostname.

### 2. Environment variables

| Variable | Notes |
|---|---|
| `GOOGLE_CLIENT_ID` | From step 1. |
| `GOOGLE_CLIENT_SECRET` | From step 1. Server-only; never `NEXT_PUBLIC_`. |
| `GOOGLE_ALLOWED_DOMAINS` | Default `babcock.edu.ng` (staff + students). Students only: `student.babcock.edu.ng,pg.babcock.edu.ng`. |
| `APP_URL` | Optional public origin. Defaults to `NEXTAUTH_URL`. Must be the URL users see, because it becomes the redirect URI. |
| `NEXTAUTH_SECRET` | Already present. Also signs the short-lived OAuth flow cookie, so it must be set and stable. |

Set them in `.env` (production) or `.env.dev` (development), then restart the container.
They are read at runtime, so no image rebuild is needed.

### 3. Backend endpoint (required)

`POST {API_URL}/api/auth/google`

```json
{ "id_token": "<Google ID token JWT>" }
```

The backend **must** verify the token itself. Never accept a bare email from the frontend.

1. Verify the signature against Google's keys (`https://www.googleapis.com/oauth2/v3/certs`).
2. Check `iss` is `https://accounts.google.com`, `aud` equals the OAuth client ID, and `exp`.
3. Require `email_verified === true` and an allowed Babcock domain.
4. Look up the student by the email stored in UMIS (`contact_information.email`), case-insensitively.
5. Issue the UMIS token exactly as `/api/auth/login` does.

**Success (200)** uses the same shape as login:

```json
{ "data": { "token": "<umis jwt>", "user": { "entity_id": 1, "entity_name": "...", "user_data": { } } } }
```

**Failure (non-2xx)**:

```json
{ "status": false, "message": "human readable, for logs", "code": "no_student_record" }
```

| `code` | Suggested HTTP | Shown to the student |
|---|---|---|
| `invalid_token` | 401 | "Google sign-in could not be verified." |
| `domain_not_allowed` | 403 | "Please sign in with your Babcock email address." |
| `no_student_record` | 404 | "We couldn't find a student account linked to that email..." |
| `account_inactive` | 423 | "This student account can't sign in right now." |

If `code` is absent or unknown the frontend falls back to the HTTP status (401, 403, 404, 423 as above; anything else
shows the generic "couldn't complete Google sign-in" message).

## Testing checklist

- [ ] Student email signs in and lands on the dashboard with the right profile.
- [ ] Staff email behaves as intended (`GOOGLE_ALLOWED_DOMAINS`).
- [ ] Personal Gmail is refused (by Google when Internal, otherwise by the callback).
- [ ] Babcock account with no UMIS record shows the "couldn't find a student account" banner.
- [ ] Cancelling at Google returns to the login page with no error banner.
- [ ] Log out, then click "Sign in with your Babcock email": the account chooser appears (shared lab computers).
- [ ] Back button from Google leaves the form usable.
- [ ] Works on mobile Safari/Chrome and in the installed PWA.
- [ ] Refreshing the login page after an error does not show the error again.

## Operational notes

- **Server egress**: the app server must reach `accounts.google.com`, `oauth2.googleapis.com`
  and `www.googleapis.com` over HTTPS. The production compose file pins an internal DNS
  server, so confirm these resolve from inside the container.
- **TLS**: the container sets `NODE_TLS_REJECT_UNAUTHORIZED=0` because of the expired
  backend certificate, which Node applies process-wide. Google calls use a dedicated agent
  that forces certificate verification regardless (see `lib/auth/google.ts`), so the client
  secret and Google's signing keys are not exposed to that setting. Still, remove the
  variable as soon as the backend certificate is renewed.
- **Logs**: failures log a code plus the email *domain* only (never the address or tokens).
  Search `app.log`/container output for `[google-sso]`.
