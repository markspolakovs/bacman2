import { Client } from "@microsoft/microsoft-graph-client";
import * as auth from "./auth";

export const Graph = Client.init({
  authProvider: done => {
    const tok = auth.getAccessToken();
    if (tok) {
      done(null, tok);
    } else {
      auth.onToken(tok => {
        done(null, tok.accessToken);
      });
    }
  }
});
