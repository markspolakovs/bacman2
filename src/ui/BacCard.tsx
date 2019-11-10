import React from "react";
import ErrorBoundary, { FallbackProps } from "react-error-boundary";
import { IoIosDownload, IoIosBook } from "react-icons/io";
import { BacmanItem } from "../types";
import { Flipped } from "react-flip-toolkit";
import { Transition } from "react-transition-group";
import anime from "animejs";
import { makeErrorBoundary } from "../common/errorReporting";
import amplitude from "amplitude-js";

interface CardContextType {
  showFileNames: boolean;
}

const DefaultCardContext: CardContextType = {
  showFileNames: false
};

const CardContext = React.createContext(DefaultCardContext);

export const CardContextProvider = CardContext.Provider;

export const GenericCard: React.FC<any> = props => {
  const { children, ...pro } = props;
  return (
    <div className="card" {...pro}>
      {children}
    </div>
  );
};

const animFilenameIn = (node: HTMLElement) =>
  anime({
    targets: node,
    opacity: 1
  });

const animFilenameOut = (node: HTMLElement) =>
  anime({
    targets: node,
    opacity: 0,
    height: 0,
    duration: 300
  });

export const Card: React.FC<{ thing: BacmanItem }> = ({ thing }) => {
  const ctx = React.useContext(CardContext);

  function stat(button: "download" | "preview") {
    return function() {
      amplitude.getInstance().logEvent("Paper Opened", {
        Type: thing.type,
        Subject: thing.subject,
        Language: thing.lang,
        Year: thing.year,
        Source: thing.$source,
        "File Name": thing.fileName,
        Button: button
      });
    };
  }

  return (
    <ErrorBoundary
      FallbackComponent={makeErrorBoundary(
        `BacCard ${thing.id} ${thing.$source}/${thing.type}/${thing.subject}/${thing.lang}/${thing.year}/${thing.fileName}`
      )}
    >
      <Flipped flipId={thing.$source + thing.id}>
        <div className="card">
          <div className="grid">
            <div className="download-icon">
              <a
                href={thing.fileUrl}
                target="_blank"
                onClick={stat("download")}
                rel="noopener noreferrer"
              >
                <IoIosDownload size="1.5em" />
              </a>
            </div>
            <div className="download-icon">
              {typeof thing.previewUrl === "string" && (
                <a
                  href={thing.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={stat("preview")}
                >
                  <IoIosBook size="1.5em" />
                </a>
              )}
            </div>
            <div className="field">
              <span className="key mobile-only">Type</span>
              <span
                className={`val type ${thing.type === "Main Paper" && "main"}`}
              >
                {thing.type}
              </span>
            </div>
            <div className="field">
              <span className="key mobile-only">Subject</span>
              <span className="val subject">{thing.subject}</span>
            </div>
            <div className="field">
              <span className="key mobile-only">Language</span>
              <span className="val language">{thing.lang}</span>
            </div>
            <div className="field">
              <span className="key mobile-only">Year</span>
              <span className="val year">{thing.year}</span>
            </div>
            <Transition
              in={ctx.showFileNames}
              timeout={300}
              onEnter={animFilenameIn}
              onExit={animFilenameOut}
              mountOnEnter
              unmountOnExit
            >
              <div className="field">
                <span className="key mobile-only">Original File Name</span>
                <span className="val fileName">{thing.fileName}</span>
              </div>
            </Transition>
          </div>
          <thing-data style={{ display: "none" }}>
            {JSON.stringify(thing)}
          </thing-data>
        </div>
      </Flipped>
    </ErrorBoundary>
  );
};
