import qs from "qs";
const CLIENT_ID = "1a9f84f6-c4f7-4358-a3df-536b875f3474";
const LS_KEY = "ACCESS_TOKEN";

interface AuthCache {
  accessToken: string;
  preferred_username: string;
  expiresAtMs: number;
}

function getAuthCache(): AuthCache | null {
  const ls = localStorage.getItem("AUTH_CACHE");
  return ls === null ? null : JSON.parse(ls);
}

function setAuthCache(cache: AuthCache) {
  localStorage.setItem("AUTH_CACHE", JSON.stringify(cache));
}

export function getAccessToken() {
  const cache = getAuthCache();
  return cache === null ? null : cache.accessToken;
}

const scopes = ["User.Read", "Sites.Read.All"];

function acquireTokenSilently(loginHint: string): Promise<boolean> {
  const iframe = document.createElement("iframe");
  return new Promise((resolve, reject) => {
    iframe.onload = function(evt) {
      let url: string;
      try {
        url = (evt.currentTarget! as HTMLIFrameElement).contentWindow!.location
          .href;
      } catch (e) {
        // Probably a cross-domain error
        // in case of failure, AAD shows an error on login.microsoftonline.com
        console.warn(e);
        resolve(false);
        return;
      }
      const query = url!.split("?")[1];
      const data = qs.parse(query);
      if (!("access_token" in data)) {
        console.warn("No access_token in data", data);
        resolve(false);
        return;
      }
      setAuthCache({
        accessToken: data.access_token,
        preferred_username: loginHint,
        expiresAtMs: new Date().valueOf() + data.expires_in * 1000
      });
      resolve(true);
    };
    const parts = [
      `client_id=${CLIENT_ID}`,
      "response_type=token",
      `redirect_uri=${encodeURIComponent(
        window.location.href.replace(/\/$/, "") + "/implicit-redirect.html"
      )}`,
      `scope=${encodeURIComponent(scopes.join(" "))}`,
      "response_mode=query",
      "prompt=none",
      "domain_hint=organizations",
      `login_hint=${encodeURIComponent(loginHint)}`
    ];
    iframe.src =
      "https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize?" +
      parts.join("&");
  });
}

export async function checkSignIn(): Promise<boolean> {
  if (window !== window.parent) {
    return false;
  }
  // If we already have a token, we're already signed in.
  // If we've just been redirected from AAD, store the token
  // Else, try to get a token silently using cached credentials
  // If that fails, throw up a prompt.
  if (typeof getAccessToken() === "string") {
    return true;
  }
  const query = qs.parse(window.location.search);

  return false;
}
