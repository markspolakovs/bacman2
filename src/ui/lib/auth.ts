import * as Msal from "msal";
import {
  tokenReceivedCallback,
  errorReceivedCallback
} from "msal/lib-commonjs/UserAgentApplication";
import { Graph } from "./graph";
import { setUserInfo } from "../../common/analytics";

export const msal = new Msal.UserAgentApplication({
  auth: {
    clientId: "1a9f84f6-c4f7-4358-a3df-536b875f3474"
  },
  cache: {
    cacheLocation: "localStorage"
  },
  system: {
    logger: {
      level: Msal.LogLevel.Verbose,
      correlationId: "BCMN",
      piiLoggingEnabled: false,
      localCallback: (level: any, msg: any, pii: any) => console.debug(msg),
      warning: console.warn,
      error: console.error,
      info: console.log,
      verbose: console.debug,
      infoPii: console.log,
      errorPii: console.error,
      warningPii: console.warn,
      verbosePii: console.debug,
      logMessage: console.log,
      executeCallback: console.log
    } as any
  }
});

const tokenCallbacks: Array<tokenReceivedCallback> = [];
const errorCallbacks: Array<errorReceivedCallback> = [];

let tokenArguments: [Msal.AuthResponse],
  errorArguments: [Msal.AuthError, string];

msal.handleRedirectCallback(
  function() {
    tokenArguments = arguments as any;
    tokenCallbacks.forEach(x => x.apply(null, tokenArguments));
  },
  function() {
    errorArguments = arguments as any;
    errorCallbacks.forEach(x => x.apply(null, errorArguments));
  }
);

export function onToken(callback: tokenReceivedCallback) {
  tokenCallbacks.push(callback);
  if (tokenArguments) {
    callback.apply(null, tokenArguments);
  }
}

export function onError(callback: errorReceivedCallback) {
  errorCallbacks.push(callback);
  if (errorArguments) {
    callback.apply(null, errorArguments);
  }
}

export function hasError() {
  return !!errorArguments;
}

onError(console.warn);

let accessToken: string | null = null;

onToken(tok => {
  accessToken = tok.accessToken;
});

export function getAccessToken() {
  return accessToken;
}

export function signIn() {
  msal.loginRedirect({});
}

async function loadUserInfo() {
  const info = await Graph.api("/me").get();
  setUserInfo(info);
}

const request: Msal.AuthenticationParameters = { scopes: ["User.Read", "Sites.Read.All"] };

export async function checkSignIn(): Promise<boolean> {
  if (window !== window.parent) {
    return false;
  }
  if (errorArguments) {
    throw errorArguments[0];
  }
  // If we already have a token, we're already signed in.
  // Else, check if we're signed in.
  //  If not, launch the flow.
  //  Else, (we're signed in but have no token) => try to acquire a token, first silently, then less so.
  if (typeof accessToken === "string") {
    await loadUserInfo();
    return true;
  }
  const account = msal.getAccount();
  if (account === null) {
    return false;
  }
  try {
    const silent = await msal.acquireTokenSilent(request);
    accessToken = silent.accessToken;
    await loadUserInfo();
    return true;
  } catch (e) {
    if (e instanceof Msal.InteractionRequiredAuthError) {
      await msal.acquireTokenRedirect(request);
    } else {
      throw e;
    }
  }
  return false;
}
