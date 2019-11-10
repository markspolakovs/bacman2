import { from, merge, of, throwError } from "rxjs";
import * as GraphTypes from "@microsoft/microsoft-graph-types";

import { compare } from "../../common/helpers";
import { BacmanItem, BacmanFilters, error } from "../../types";
import { Graph } from "../../ui/lib/graph";
import { catchError } from "rxjs/operators";
import { GraphError } from "@microsoft/microsoft-graph-client";
import { MAX_LEN } from "../../config";

function makeQuery(filters: BacmanFilters): string {
  let fields = [];
  if (filters.type !== "any") {
    fields.push(`fields/Type_x0020_Exam eq '${filters.type}'`);
  }
  if (filters.subject !== "any") {
    fields.push(`fields/BAC_x0020_Subject eq '${filters.subject}'`);
  }
  if (filters.language !== "any") {
    fields.push(`fields/lANG eq '${filters.language}'`);
  }
  if (filters.year !== "any") {
    fields.push(`fields/Session eq '${filters.year}'`);
  }
  return fields.join(" and ");
}

function makeBacFromItem(item: GraphTypes.ListItem): BacmanItem {
  const fields = item.fields! as any;
  const file = item.driveItem!;
  const data = {
    type: fields.Type_x0020_Exam,
    subject: fields.BAC_x0020_Subject,
    lang: fields.lANG,
    year: fields.Session,
    fileName: file.name,
    id: item.id!,
    $source: "sp"
  } as Partial<BacmanItem>;
  if ("@microsoft.graph.downloadUrl" in file) {
    data.fileUrl = file["@microsoft.graph.downloadUrl"];
    data.previewUrl = (file as any).webUrl;
  } else {
    data.fileUrl = file.webUrl;
  }
  return data as BacmanItem;
}

/**
 * The SharepointLive data source fetches past exam data from Microsoft Graph
 */
export default function(filters: BacmanFilters) {
  return merge(
    of(null),
    from(
      // TODO: use RXJS ajax() instead, so we can cancel requests properly
      Graph.api(
        "/sites/eursc.sharepoint.com,ddd944ea-f4f7-4a94-9324-542b0103ceb5,11d65997-a8ff-4efb-9f5c-c1f060b8b026/lists/PastExams/items"
      )
        // the item fields are not included by default (WTF)
        .expand("fields,driveItem")
        .filter(makeQuery(filters))
        // the person who made this Sharepoint is a genius and didn't index the columns
        // TODO: can we do anything about this?
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        // if we only return MAX_LEN, the "woah there!" warning won't show up,
        // as it checks if (length > MAX_LEN)
        .top(MAX_LEN + 1)
        .get()
        .then((x: any) => {
          const dat = (x.value as GraphTypes.ListItem[]).map(item =>
            makeBacFromItem(item)
          );
          // TODO: potentially redundant, the UI layer sorts it anyway
          return dat.sort(compare(filters));
        })
    ).pipe(
      catchError(err => {
        if (err instanceof GraphError) {
          if (err.code === "accessDenied") {
            // an accessDenied usually indicates someone in < S7 tried to access the data
            return throwError(error("ERR_ACCESS_DENIED"));
          } else {
            return throwError(
              error(
                "ERR_SPO_GRAPH",
                new Error(err.statusCode + " " + err.message)
              )
            );
          }
        } else {
          return throwError(error("ERR_SPO_UNKNOWN", err));
        }
      })
    )
  );
}
