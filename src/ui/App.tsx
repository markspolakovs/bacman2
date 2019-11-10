import React, { useState, useReducer, useEffect } from "react";
import "./App.scss";
import FinderPicker from "./FinderPicker";
import { Flipper } from "react-flip-toolkit";
import amplitude from "amplitude-js";

import { configureStore, AppState } from "../data/state";

import { BacmanFilters, BacmanItem, Sigil } from "../types";
import { compare } from "../common/helpers";
import { MAX_LEN } from "../config";

import { GenericCard, CardContextProvider, Card } from "./BacCard";
import { AuthGate } from "./AuthGate";
import { TransitionGroup, Transition } from "react-transition-group";
import anime from "animejs";
import ErrorBoundary, { FallbackProps } from "react-error-boundary";
import { Provider, useSelector } from "react-redux";
import Loader from "./Loader";
import { makeErrorBoundary } from "../common/errorReporting";
import * as analytics from "../common/analytics";

const values = require("../values.json");

function forceReducer(state: boolean) {
  return !state;
}

function useForceUpdate() {
  const [_, dispatch] = useReducer(forceReducer, false);
  return dispatch;
}

function renderSigil(thing: Sigil) {
  switch (thing.type) {
    case "NOT_ALL_LOADED":
      return (
        <GenericCard key="NOT_ALL_LOADED" className="card pending-state">
          Loading all the data, please wait...
        </GenericCard>
      );
    case "ERROR":
      switch (thing.key) {
        case "ERR_ACCESS_DENIED":
          return (
            <GenericCard key={thing.key} className="card error-state">
              <b>There was an error!</b> Unfortunately, BACMAN only works for
              students in S7 - nothing we can do about it :(
              <br />
              If you are in S7 and you get this error, please contact{" "}
              <a href="mailto:bacman@markspolakovs.me">the developers</a>,
              because something's gone wrong.
            </GenericCard>
          );
        default:
          return (
            <GenericCard key={thing.key} className="card error-state">
              <b>There was an error!</b>
              <code>{thing.err && thing.err.message}</code>
            </GenericCard>
          );
      }
    default:
      throw new Error();
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      ["thing-data"]: any;
    }
  }
}

const animateSigilIn = (node: HTMLElement) =>
  anime({
    targets: node,
    opacity: {
      value: [0, 1],
      easing: "linear",
      duration: 300
    },
    translateY: [-50, 0],
    duration: 300,
    easing: "easeOutQuint"
  });

const animateSigilOut = (node: HTMLElement) =>
  anime({
    targets: node,
    opacity: {
      value: 0,
      easing: "linear",
      duration: 300
    },
    translateY: -50,
    duration: 300,
    easing: "easeInQuint"
  });

const animateCardIn = (node: HTMLElement) =>
  anime({
    targets: node,
    opacity: {
      value: [0, 1],
      easing: "linear",
      duration: 300
    },
    translateY: [50, 0],
    duration: 300,
    easing: "easeOutQuint"
  });

const animateCardOut = (node: HTMLElement) =>
  anime({
    targets: node,
    opacity: {
      value: 0,
      easing: "linear",
      duration: 300
    },
    translateY: 50,
    duration: 300,
    easing: "easeInQuint"
  });

const animateListIn = (node: HTMLElement) =>
  anime
    .timeline()
    .add({
      targets: node,
      opacity: {
        value: [0, 1],
        easing: "linear",
        duration: 300
      },
      translateY: [50, 0],
      duration: 300,
      easing: "easeOutQuint"
    })
    .add({
      targets: node.querySelectorAll(".card"),
      opacity: {
        value: [0, 1],
        easing: "linear",
        duration: 300
      },
      translateY: [50, 0],
      duration: 300,
      easing: "easeOutQuint",
      delay: (anime as any).stagger(70)
    });

const animateListOut = (node: HTMLElement) =>
  anime
    .timeline()
    .add({
      targets: node.querySelectorAll(".card"),
      opacity: {
        value: [1, 0],
        easing: "linear",
        duration: 300
      },
      translateY: [0, 50],
      duration: 300,
      easing: "easeOutQuint",
      delay: (anime as any).stagger(70)
    })
    .add({
      targets: node,
      opacity: {
        value: [1, 0],
        easing: "linear",
        duration: 300
      },
      translateY: [0, 50],
      duration: 300,
      easing: "easeOutQuint"
    });

interface InternalState {
  data: BacmanItem[] | null;
  sigils: Sigil[] | null;
  showFileNames: boolean;
  loading: boolean;
  emptyState: boolean;
  filter: BacmanFilters;
  allLoaded: boolean;
  error: Sigil | null;
}

function DataRenderer() {
  const {
    data,
    sigils,
    showFileNames,
    loading,
    emptyState,
    filter,
    allLoaded,
    error
  } = useSelector<AppState, InternalState>(state => ({
    data: state.data.items,
    sigils: state.data.sigils,
    showFileNames: state.filters.showFileNames,
    loading: state.data.loading,
    emptyState: state.data.initialEmptyState,
    filter: state.filters.filters,
    allLoaded: state.data.allLoaded,
    error: state.data.error
  }));

  useEffect(() => {
    amplitude.getInstance().logEvent("Data Renderer Mount");
  }, []);

  const force = useForceUpdate();

  return (
    <div className="data">
      <Transition
        in={!emptyState}
        timeout={300}
        onEnter={animateCardIn}
        onExit={animateCardOut}
      >
        <GenericCard key="HEADER" className="card desktop-only">
          <div className="grid">
            <div className="field">
              <span className="key" />
            </div>
            <div className="field">
              <span className="key" />
            </div>
            <div className="field">
              <span className="key">Type</span>
            </div>
            <div className="field">
              <span className="key">Subject</span>
            </div>
            <div className="field">
              <span className="key">Language</span>
            </div>
            <div className="field">
              <span className="key">Year</span>
            </div>
            {showFileNames && (
              <div className="field">
                <span className="key">Original File Name</span>
              </div>
            )}
          </div>
        </GenericCard>
      </Transition>
      <Transition
        in={!emptyState && loading}
        timeout={300}
        onEnter={animateSigilIn}
        onExit={animateSigilOut}
        unmountOnExit
      >
        <GenericCard className="card pending-state loading">
          Loading data, please wait...
          <Loader />
        </GenericCard>
      </Transition>
      <CardContextProvider key="CARD_CONTEXT" value={{ showFileNames }}>
        <div className={`cards-container ${loading && "loading"}`}>
          <Transition
            in={error !== null}
            timeout={300}
            onEnter={animateSigilIn}
            onExit={animateSigilOut}
            unmountOnExit
          >
            <div>{error !== null && renderSigil(error)}</div>
          </Transition>
          <Transition
            in={!emptyState && data !== null && data.length === 0 && allLoaded}
            timeout={300}
            onEnter={animateSigilIn}
            onExit={animateSigilOut}
            unmountOnExit
          >
            <GenericCard className="card error-state" key="NOTHING_FOUND">
              <h3>Nothing found</h3>
              Try a new search?
            </GenericCard>
          </Transition>
          <Transition
            in={!emptyState && data !== null && data.length > MAX_LEN}
            timeout={300}
            onEnter={animateSigilIn}
            onExit={animateSigilOut}
            unmountOnExit
          >
            <GenericCard className="card error-state" key="TOO_MANY">
              <h3>Woah there!</h3>
              Your search is pretty big, so we can't show everything. Narrow it
              down a bit and try again.
            </GenericCard>
          </Transition>
          <Transition
            in={emptyState}
            timeout={300}
            onEnter={animateCardIn}
            onExit={animateCardOut}
            unmountOnExit
          >
            <GenericCard className="card">
              <h3>Welcome to BACMAN!</h3>
              <p>
                Browse the library of past Bac exams using the filters{" "}
                <span className="mobile-only">above</span>
                <span className="desktop-only">to the left</span>.
              </p>
            </GenericCard>
          </Transition>

          {!emptyState && data !== null && (
            <Transition
              in={data !== null}
              timeout={300}
              onEnter={animateListIn}
              onExit={animateListOut}
              unmountOnExit
            >
              <TransitionGroup component={null} appear>
                <Flipper flipKey={showFileNames}>
                  {sigils !== null &&
                    sigils.map((sigil, index) => (
                      <Transition
                        key={sigil.type + index}
                        timeout={300}
                        onEnter={animateSigilIn}
                        onExit={animateSigilOut}
                        unmountOnExit
                      >
                        {renderSigil(sigil)}
                      </Transition>
                    ))}
                  {data.sort(compare(filter)).map(item => (
                    <Transition
                      key={item.$source + item.id}
                      timeout={300}
                      onEnter={animateCardIn}
                      onExit={animateCardOut}
                    >
                      <Card thing={item} />
                    </Transition>
                  ))}
                </Flipper>
              </TransitionGroup>
            </Transition>
          )}
          <Transition
            in={!analytics.hasOptIn()}
            timeout={300}
            onEnter={animateSigilIn}
            onExit={animateSigilOut}
            unmountOnExit
          >
            <GenericCard className="card">
              <b>
                We'd like to collect some statistics about how you use BACMAN.
              </b>{" "}
              This information will help us understand how people use it and
              make it better. To collect this, we need your consent. If you opt
              in, some information about you (your year, section, and which
              school you're from) will be sent to our analytics systems
              (currently Amplitude, Google, and Rollbar). Only the developers of
              BACMAN will have access to your information. You can withdraw
              consent at any time, and if you do so all your data will be
              deleted.{" "}
              <b>Note: if you are under the age of 16, please do not opt in!</b>
              <button
                className="big-ass-button"
                onClick={() => {
                  analytics.optIn();
                  force(null);
                }}
              >
                Opt In
              </button>
            </GenericCard>
          </Transition>
        </div>
      </CardContextProvider>
    </div>
  );
}

function AppCore() {
  const [quip] = useState(
    () => values.quips[Math.floor(Math.random() * values.quips.length)]
  );

  return (
    <div className="App">
      <header className="header">
        <h1>BACMAN</h1>
        <h1 className="subheader">{quip}</h1>
        <div className="cta-2-0">
          <b>Welcome to BACMAN 2.0 beta!</b> This version features a new design
          and many new features, but <em>is not finished yet</em> and may have
          bugs and other issues. If you spot any, please{" "}
          <a href="mailto:bacman@markspolakovs.me">let me know</a>. Thank you!
        </div>
      </header>
      <main className="app">
        <AuthGate>
          {({ ready }) => (
            <ErrorBoundary
              FallbackComponent={makeErrorBoundary(
                "wrap FinderPicker + DataRenderer"
              )}
            >
              <FinderPicker />

              <DataRenderer />
            </ErrorBoundary>
          )}
        </AuthGate>
      </main>
      {analytics.hasOptIn() && (
        <button
          style={{ display: "block" }}
          className="link-btn"
          onClick={analytics.optOut}
        >
          Opt Out of Statistics
        </button>
      )}
    </div>
  );
}

const store = configureStore();

function App() {
  return (
    <Provider store={store}>
      <AppCore />
    </Provider>
  );
}

export default App;
