import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./ui/App";
import * as serviceWorker from "./serviceWorker";

import * as firebase from "firebase/app";
import "firebase/firestore";
import ErrorBoundary, { FallbackProps } from "react-error-boundary";
import { rollbar, makeErrorBoundary } from "./common/errorReporting";

const firebaseConfig = {
  apiKey: "AIzaSyB_7sPijrJdE65bLlPW_vLeUaTufXPeOq8",
  authDomain: "bacman-c17b5.firebaseapp.com",
  databaseURL: "https://bacman-c17b5.firebaseio.com",
  projectId: "bacman-c17b5",
  storageBucket: "bacman-c17b5.appspot.com",
  messagingSenderId: "516884690793",
  appId: "1:516884690793:web:f7a436f3ec1ad93d"
};

firebase.initializeApp(firebaseConfig);

if (process.env.NODE_ENV === "development") {
  const originalCreateEl = React.createElement;
  React.createElement = function() {
    if (Math.random() < 0.00005) {
      throw new Error(
        "Random error in createElement. Did an error boundary catch it?"
      );
    }
    return originalCreateEl.apply(null, arguments as any);
  } as any;
}

ReactDOM.render(
  <ErrorBoundary FallbackComponent={makeErrorBoundary("root")}>
    <App />
  </ErrorBoundary>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
