import { from } from "rxjs";

import { compare } from "../../common/helpers";
import { BacmanItem, BacmanFilters } from "../../types";

function filterItem(filters: BacmanFilters, item: BacmanItem) {
  if (filters.type !== "any" && item.type !== filters.type) {
    return false;
  }
  if (filters.subject !== "any" && item.subject !== filters.subject) {
    return false;
  }
  if (filters.language !== "any") {
    if (item.lang !== "N/A") {
      if (
        !(
          (filters.subject === "MA3" || filters.subject === "MA5") &&
          filters.type === "Suggested Answers"
        )
      ) {
        if (item.lang !== filters.language) {
          return false;
        }
      }
    }
  }
  if (filters.year !== "any" && item.year !== filters.year) {
    return false;
  }
  return true;
  // return (
  //   (filters.type === "any" || item.type === filters.type) &&
  //   (filters.subject === "any" || item.subject === filters.subject) &&
  //   (filters.language === "any" ||
  //     item.lang === filters.language ||
  //     (item.lang === "N/A" &&
  //       (filters.subject !== "any" || filters.type !== "any")) ||
  //     ((filters.subject === "MA5" || filters.subject === "MA3") &&
  //       filters.type === "Suggested Answers")) &&
  //   (filters.year === "any" || item.year === filters.year)
  // );
}

/**
 * The SharepointBaked data source uses an offline JSON cache of the Sharepoint data,
 * bundled with the app. This is the legacy data source (1.0).
 * @deprecated use SharepointLive instead, this is no longer updated
 * @param filters filters
 */
export default function(filters: BacmanFilters) {
  return from(
    import("./sharepointData.json").then(x => {
      const dat = x.default as BacmanItem[];
      return dat
        .filter(x => filterItem(filters, x))
        .sort(compare(filters))
        .map(x => ({ ...x, $source: "sp" as "sp" } as BacmanItem));
    })
  );
}
