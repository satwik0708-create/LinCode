"use client";

/**
 * Last resort: an error in the root layout itself.
 *
 * This boundary *replaces* the root layout, so none of the app is available to
 * it — no providers, no theme class on <html>, and no guarantee the stylesheet
 * applies, since a failure in the layout is exactly what would have prevented
 * it loading. Everything here is therefore self-contained: it renders its own
 * document, styles inline, and adapts to light and dark through the OS
 * preference rather than the app's theme store.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const showDetail = process.env.NODE_ENV === "development";

  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <style>{`
          .lc-fatal {
            --bg: #fbfcfe; --fg: #101828; --muted: #667085;
            --card: #ffffff; --border: #e4e7ec; --accent: #2f43c4;
          }
          @media (prefers-color-scheme: dark) {
            .lc-fatal {
              --bg: #0a0f1c; --fg: #e7ebf3; --muted: #98a2b3;
              --card: #111827; --border: #1f2937; --accent: #8b9bff;
            }
          }
          .lc-fatal {
            min-height: 100vh; display: flex; align-items: center; justify-content: center;
            background: var(--bg); color: var(--fg); padding: 24px;
            font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
          }
          .lc-card {
            width: 100%; max-width: 34rem; background: var(--card);
            border: 1px solid var(--border); border-radius: 16px; padding: 28px;
          }
          .lc-title { margin: 0 0 8px; font-size: 20px; font-weight: 600; letter-spacing: -0.01em; }
          .lc-body { margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: var(--muted); }
          .lc-pre {
            margin: 0 0 16px; padding: 12px; max-height: 10rem; overflow: auto;
            background: var(--bg); border: 1px solid var(--border); border-radius: 10px;
            font-size: 12px; white-space: pre-wrap; word-break: break-word; color: var(--muted);
          }
          .lc-row { display: flex; flex-wrap: wrap; gap: 8px; }
          .lc-btn {
            font: inherit; font-size: 14px; font-weight: 500; cursor: pointer;
            padding: 9px 16px; border-radius: 10px; border: 1px solid transparent;
            background: var(--accent); color: #fff; text-decoration: none; display: inline-block;
          }
          .lc-btn-alt { background: transparent; color: var(--fg); border-color: var(--border); }
          .lc-ref { margin: 0 0 16px; font-size: 12px; color: var(--muted); }
        `}</style>

        <div className="lc-fatal">
          <div className="lc-card">
            <h1 className="lc-title">LinCode could not start this page</h1>
            <p className="lc-body">
              Something failed before the application finished loading. Reloading usually clears it. If it
              persists, the reference below identifies this failure in the server log.
            </p>

            {showDetail && <pre className="lc-pre">{error.message}</pre>}
            {error.digest && <p className="lc-ref">Reference: {error.digest}</p>}

            <div className="lc-row">
              <button type="button" className="lc-btn" onClick={reset}>
                Try again
              </button>
              {/*
                A plain anchor, deliberately. next/link would attempt a client-side
                navigation through the very router this boundary exists because it
                failed; a full document load is the only reliable way out.
              */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a className="lc-btn lc-btn-alt" href="/">
                Go to the home page
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
