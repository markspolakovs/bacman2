import { rollbar } from "./errorReporting";
import * as GraphTypes from "@microsoft/microsoft-graph-types";
import amplitude from "amplitude-js";

amplitude.getInstance().init( process.env.NODE_ENV === "production" ? "2c6e69d29c7f06371e7a5671388219e9" : "f315bfea78c1de00b0aa15352995cb11");

let userInfo: GraphTypes.User | null = null;

function setAnalyticsData() {
  if (userInfo === null) {
    return;
  }
  amplitude.getInstance().setUserId(userInfo.id || null);
  if (userInfo.displayName) {
    const meta = userInfo.displayName.match(/.*\(([A-Z]+)-([A-Za-z0-9]+)\)/);
    if (!meta) {
      console.warn("Could not parse user meta");
    } else {
      const [_, school, clazz] = meta;
      const id = new amplitude.Identify();
      id.set("School", school);
      id.set("Class", clazz);
      console.debug("Identifying", id, meta);
      amplitude.getInstance().identify(id);
    }
  }
  rollbar.configure({
    payload: {
      person: {
        id: userInfo.id,
        email: userInfo.mail,
        name: userInfo.displayName
      }
    }
  });
}

function getOptIn() {
    return window.localStorage.getItem("STATS_OPTIN") === "true";
}

function setOptIn(val: boolean) {
    return window.localStorage.setItem("STATS_OPTIN", val ? "true" : "false");
}

export function setUserInfo(info: GraphTypes.User, state?: string) {
  userInfo = info;
  if (getOptIn()) {
    setAnalyticsData();
  }
}

export function optIn() {
  setOptIn(true);
  amplitude.getInstance().setOptOut(false);
  setAnalyticsData();
}

export function optOut() {
    setOptIn(false);
    amplitude.getInstance().clearUserProperties();
    amplitude.getInstance().setOptOut(true);
}

export function hasOptIn() {
  return getOptIn();
}
