import React, { useState, useReducer, useEffect } from "react";
import anime from "animejs";
import * as auth from "./lib/auth";
import { Transition } from "react-transition-group";
import amplitude from "amplitude-js";
import { useDispatch } from "react-redux";
import { Actions } from "../data/state";
import Loader from "./Loader";

interface AuthGateState {
  proceed: boolean;
  showChecking: boolean;
  showPrompt: boolean;
  showModal: boolean;
  error: any | null;
}
const initialState: AuthGateState = {
  proceed: false,
  showChecking: true,
  showPrompt: false,
  showModal: true,
  error: null
};

type AuthGateAction =
  | { t: "TOKEN_READY" }
  | { t: "SIGNIN_NEEDED" }
  | { t: "ERROR"; e: string };

function reducer(state: AuthGateState, action: AuthGateAction): AuthGateState {
  switch (action.t) {
    case "TOKEN_READY":
      return {
        ...state,
        showModal: false,
        showChecking: false,
        proceed: true
      };
    case "SIGNIN_NEEDED":
      return {
        ...state,
        showModal: true,
        showChecking: false,
        showPrompt: true
      };
    case "ERROR":
      return {
        ...state,
        showModal: true,
        showChecking: false,
        showPrompt: false,
        error: action.e
      };
    default:
      throw new Error();
  }
}

const exit = (node: HTMLElement) =>
  anime({
    targets: node,
    opacity: [1, 0],
    easing: "linear",
    duration: 300
  });

const enter = (node: HTMLElement) =>
  anime({
    targets: node,
    opacity: [0, 1],
    translateY: [200, 0],
    easing: "easeOutQuart",
    duration: 300
  });

interface IAppProps {
  ready: boolean;
}

export const AuthGate: React.FC<{
  children: (props: IAppProps) => React.ReactElement | null;
  renderHeader?: () => React.ReactElement;
}> = ({ children: renderApp, renderHeader }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isWhyOpen, setWhyOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatchRedux = useDispatch();

  useEffect(() => {
    amplitude.getInstance().logEvent("Auth Gate Mount");
  }, []);

  useEffect(() => {
    async function go() {
      try {
        const rez = await auth.checkSignIn();
        if (rez) {
          dispatch({ t: "TOKEN_READY" });
        } else {
          dispatch({ t: "SIGNIN_NEEDED" });
        }
      } catch (e) {
        if (e instanceof Error) {
          dispatch({ t: "ERROR", e: e.message });
        } else {
          dispatch({ t: "ERROR", e });
        }
      }
    }
    auth.onError(err => {
      dispatch({ t: "ERROR", e: err.errorCode + " " + err.errorMessage });
    });
    if (!auth.hasError()) {
      go();
    }
  }, []);

  useEffect(() => {
    if (state.proceed) {
      dispatchRedux(Actions.Data.Ready());
    }
  }, [state.proceed, dispatchRedux]);

  return (
    <>
      <Transition in={state.proceed} timeout={300} onEnter={enter} mountOnEnter>
        {renderApp({ ready: state.proceed })}
      </Transition>
      <Transition in={!state.proceed} timeout={300} onExit={exit} unmountOnExit>
        <div>
          {typeof renderHeader === "function" && renderHeader()}
          {state.error !== null && (
            <>
              <h3>Error</h3>
              <p>We're sorry, there was an error signing you in!</p>
              <p>
                This has been automatically reported to the BACMAN developers.
                Feel free to try again.
              </p>
              <p>If it helps, here's what we know about the error:</p>
              <p>
                <code>{JSON.stringify(state.error)}</code>
              </p>
              <button className="btn big-btn" onClick={auth.signIn}>
                Try Again
              </button>
            </>
          )}
          {state.showChecking && (
            <>
              <h3>Checking your credentials</h3>
              <p>This will only take a moment, please wait&hellip;</p>
              <Loader />
            </>
          )}
          {state.showPrompt && (
            <>
              <div>
                <button
                  className={`btn big-ass-button ${loading && "loading"}`}
                  onClick={() => {
                    setLoading(true);
                    auth.signIn();
                  }}
                >
                  Sign In with Office365
                </button>
              </div>
              <div>
                <button
                  className="link-btn"
                  onClick={() => setWhyOpen(!isWhyOpen)}
                >
                  Why?
                </button>
                {isWhyOpen && (
                  <p>
                    BACMAN uses data from Office 365 SharePoint to build the
                    list of past Bac exams. All the exam files themselves are
                    stored on SharePoint too, so you will need to sign in sooner
                    or later to use BACMAN. (In BACMAN 1.0 you didn't need to
                    sign in to search the past exams, but you needed to when
                    opening one, which is a poor experience - better to sign in
                    immediately and not be bothered again.)
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </Transition>
    </>
  );
};
