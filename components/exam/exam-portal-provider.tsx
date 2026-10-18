"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { accessExamPortalAction } from "@/app/actions/exam-portal";

interface ExamPortalContextValue {
  /** Initiates the POST request to a randomized exam server and displays the returned HTML page in-app. */
  openExamPortal: () => Promise<void>;
  /** Closes the in-app exam portal view. */
  closeExamPortal: () => void;
  /** True while the POST request to the exam portal is in flight. */
  isLoading: boolean;
  /** True when the exam portal HTML view is currently displayed. */
  isOpen: boolean;
}

const ExamPortalContext = createContext<ExamPortalContextValue>({
  openExamPortal: async () => {},
  closeExamPortal: () => {},
  isLoading: false,
  isOpen: false,
});

export function useExamPortal(): ExamPortalContextValue {
  return useContext(ExamPortalContext);
}

interface PortalSessionState {
  html: string;
  portalOrigin: string;
  portalUrl: string;
}

/**
 * Injects a <base href="..." target="_top"> tag and a bridge script into the
 * HTML returned by the exam portal so that:
 *  1. Relative CSS, JS, images, and AJAX calls resolve against the selected exam server origin.
 *  2. The page is rendered inside the application without changing the browser URL initially.
 *  3. Clicking the "Verify" button redirects the top-level browser window to the exam portal.
 */
export function prepareExamPortalHtml(
  rawHtml: string,
  portalOrigin: string,
  portalUrl: string
): string {
  const safeOrigin = portalOrigin.replace(/\/$/, "");
  const injection = `
<base href="${safeOrigin}/" target="_top" />
<script>
(function() {
  var PORTAL_ORIGIN = ${JSON.stringify(safeOrigin)};
  var PORTAL_URL = ${JSON.stringify(portalUrl)};

  function resolveAgainstOrigin(rawUrl) {
    if (!rawUrl || rawUrl === "#" || rawUrl.indexOf("javascript:") === 0) {
      return PORTAL_ORIGIN;
    }
    try {
      return new URL(rawUrl, PORTAL_ORIGIN + "/").toString();
    } catch (e) {
      return PORTAL_ORIGIN;
    }
  }

  function isVerifyElement(el) {
    if (!el) return false;
    var tag = (el.tagName || "").toLowerCase();
    var text = (el.textContent || el.innerText || "").trim().toLowerCase();
    var val = (el.value || "").trim().toLowerCase();
    var id = (el.id || "").toLowerCase();
    var name = (el.name || "").toLowerCase();
    return (
      (tag === "button" || tag === "a" || tag === "input") &&
      (text === "verify" || val === "verify" || id.indexOf("verify") !== -1 || name.indexOf("verify") !== -1)
    );
  }

  function isLogoutElement(el) {
    if (!el) return false;
    var text = (el.textContent || el.innerText || "").trim().toLowerCase();
    return text === "logout" || text === "log out";
  }

  // Ensure all forms submit in the top-level window so Verify form submissions redirect the browser
  document.addEventListener("submit", function(e) {
    var form = e.target;
    if (form && form.tagName === "FORM") {
      form.setAttribute("target", "_top");
      var rawAction = form.getAttribute("action");
      if (rawAction) {
        form.setAttribute("action", resolveAgainstOrigin(rawAction));
      } else {
        form.setAttribute("action", PORTAL_URL);
      }
    }
  }, true);

  document.addEventListener("click", function(e) {
    var target = e.target;
    var el = target && target.closest ? target.closest("button, input, a") : target;
    if (!el) return;

    if (isLogoutElement(el)) {
      e.preventDefault();
      window.parent.postMessage({ type: "EXAM_PORTAL_CLOSE" }, "*");
      return;
    }

    if (isVerifyElement(el)) {
      var form = el.closest ? el.closest("form") : null;
      if (form) {
        form.setAttribute("target", "_top");
        var rawAction = form.getAttribute("action");
        if (rawAction) {
          form.setAttribute("action", resolveAgainstOrigin(rawAction));
        } else {
          form.setAttribute("action", PORTAL_URL);
        }
        return;
      }

      var href = el.getAttribute("href") || el.getAttribute("data-url") || el.getAttribute("data-href");
      var redirectTarget = resolveAgainstOrigin(href);

      // Allow any inline onclick handler on the Verify button to run first;
      // then trigger top-level navigation to the exam portal.
      setTimeout(function() {
        window.parent.postMessage(
          { type: "EXAM_PORTAL_VERIFY_REDIRECT", url: redirectTarget },
          "*"
        );
      }, 50);
    }
  }, true);
})();
</script>`;

  if (/<head[^>]*>/i.test(rawHtml)) {
    return rawHtml.replace(/<head[^>]*>/i, (match) => `${match}${injection}`);
  }
  if (/<html[^>]*>/i.test(rawHtml)) {
    return rawHtml.replace(/<html[^>]*>/i, (match) => `${match}<head>${injection}</head>`);
  }
  return `<!DOCTYPE html><html><head>${injection}</head><body>${rawHtml}</body></html>`;
}

export function ExamPortalProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [sessionState, setSessionState] = useState<PortalSessionState | null>(null);

  const closeExamPortal = useCallback(() => {
    setSessionState(null);
  }, []);

  const openExamPortal = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    const toastId = toast.loading("Connecting to Online Exam Portal...");

    try {
      const result = await accessExamPortalAction();
      toast.dismiss(toastId);

      if (!result.success || !result.html) {
        toast.error(
          result.error || "Failed to connect to the Online Exam Portal. Please try again."
        );
        return;
      }

      setSessionState({
        html: result.html,
        portalOrigin: result.portalOrigin || "https://exam.babcock.edu.ng",
        portalUrl: result.portalUrl || "https://exam.babcock.edu.ng/session",
      });
    } catch (error) {
      toast.dismiss(toastId);
      console.error("Failed to open Online Exam Portal:", error);
      toast.error("Could not connect to the Online Exam Portal. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Listen for Verify redirect or Logout messages from the embedded CBT HTML page
  useEffect(() => {
    if (!sessionState) return;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "EXAM_PORTAL_CLOSE") {
        setSessionState(null);
      } else if (data.type === "EXAM_PORTAL_VERIFY_REDIRECT") {
        const targetUrl =
          typeof data.url === "string" && data.url.startsWith("http")
            ? data.url
            : sessionState.portalOrigin;
        window.location.href = targetUrl;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [sessionState]);

  const preparedHtml = useMemo(() => {
    if (!sessionState) return null;
    return prepareExamPortalHtml(
      sessionState.html,
      sessionState.portalOrigin,
      sessionState.portalUrl
    );
  }, [sessionState]);

  const contextValue = useMemo<ExamPortalContextValue>(
    () => ({
      openExamPortal,
      closeExamPortal,
      isLoading,
      isOpen: Boolean(sessionState),
    }),
    [openExamPortal, closeExamPortal, isLoading, sessionState]
  );

  return (
    <ExamPortalContext.Provider value={contextValue}>
      {children}
      {preparedHtml && (
        <div
          className="fixed inset-0 z-[9999] w-screen h-screen bg-white"
          role="dialog"
          aria-modal="true"
          aria-label="Online Exam Portal"
        >
          <iframe
            title="Babcock University CBT Platform"
            srcDoc={preparedHtml}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-top-navigation allow-top-navigation-by-user-activation"
          />
        </div>
      )}
    </ExamPortalContext.Provider>
  );
}

