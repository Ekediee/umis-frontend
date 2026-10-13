/** Error thrown by API clients; `code` is a support reference shown to the user. */
export class ApiError extends Error {
  constructor(
    message: string,
    /** Support reference shown on every error, e.g. GR-5B3-1042 */
    public code: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
