import Rollbar from "rollbar";
import { FallbackProps } from "react-error-boundary";
import React, { useEffect, useState } from "react";

export const rollbar = new Rollbar({
  accessToken: "f12a96dff6ce4148a203a3e30217a8ce",
  captureUncaught: true,
  captureUnhandledRejections: true,
  captureEmail: true,
  payload: {
    environment: process.env.NODE_ENV,
    host: window.location.host
  }
});

export function makeErrorBoundary(location: string): React.FC<FallbackProps> {
  return function({ error, componentStack }) {
    const [reported, setReported] = useState(false);
    const [reportError, setReportError] = useState<Error | null>(null);
    const [errorId, setErrorId] = useState<string | null>(null);
    useEffect(() => {
      rollbar.error(
        error || "ERROR UNDEFINED",
        componentStack || "COMPONENT STACK UNDEFINED",
        location,
        (err, data) => {
          if (err) {
            setReportError(err);
          } else {
            setReported(true);
            setErrorId((data as any).result.uuid as string);
          }
        }
      );
    }, [error, componentStack]);
    return (
      <div>
        <h5>Well. This is embarrassing.</h5>
        <p>BACMAN has totally and utterly crashed.</p>
        {reportError === null ? (
          <p>
            This error{" "}
            {reported ? (
              <>
                was automatically reported to the people that make it.
                {typeof errorId === "string" && (
                  <>
                    {" "}
                    Here's a number you can give them if you get in touch about
                    this error: <code>{errorId}</code>
                  </>
                )}
              </>
            ) : (
              "is being reported to the people that make it as we speak (or, read)."
            )}
          </p>
        ) : (
          <p>
            Embarrassingly enough, while trying to report this error to the
            people that make it, BACMAN suffered... an error. Here's what we
            know about it - please pass this along to{" "}
            <a href="mailto:bacman@markspolakovs.me">the developers</a> so they
            can get this fixed:{" "}
            <code>
              {reportError.message}
              {reportError.stack}
            </code>
          </p>
        )}
        <p>Please try refreshing the page if it doesn't work.</p>
        <p>
          Here's all we know about the error - this could be helpful in fixing
          it:
        </p>
        <p>
          Message: <code>{error && error.message}</code>
        </p>
        <p>
          Error stack: <code>{error && error.stack}</code>
        </p>
        <p>
          Component stack: <code>{componentStack}</code>
        </p>
      </div>
    );
  };
}
