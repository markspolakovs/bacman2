import { BacmanFilters, BacmanItem } from "../../types";
import { map } from "rxjs/operators";
import { firestore } from "firebase/app";
import { collection } from "rxfire/firestore";
import { EMPTY, merge, of } from "rxjs";
import { compare } from "../../common/helpers";

/**
 * The LearningGateway data source is actually a cache of the data in Firebase Firestore.
 * This is necessary because the Learning Gateway dataset is a fucking mess
 * and Firestore has the properly tagged version
 * @param filters active filters
 */
export default function(filters: BacmanFilters) {
  // Short-circuit - avoid selecting too much to avoid overloading firestore
  if (filters.subject === "any" && filters.language === "any") {
    console.warn("Short-circuiting lg.ts");
    return EMPTY;
  }

  let q = firestore()
    .collection("lg")
    // we only care about items that don't exist in SharePoint, the data there is cleaner anyway
    .where("exists_in_sharepoint", "==", false)
    .where("complete", "==", true);
  if (filters.type !== "any") {
    q = q.where("type", "==", filters.type);
  }
  if (filters.subject !== "any") {
    q = q.where("subject", "==", filters.subject);
  }
  if (filters.language !== "any") {
    q = q.where("language", "==", filters.language);
  }
  if (filters.year !== "any") {
    q = q.where("year", "==", filters.year);
  }
  console.debug("Debug: executing query", q);
  return merge(
    of(null),
    collection(q).pipe(
      map(docs =>
        docs
          .map(x => {
            const data = x.data();
            return {
              ...data,
              fileUrl: data._url,
              lang: data.language,
              $source: "lg"
            } as BacmanItem;
          })
          .sort(compare(filters))
      )
    )
  );
}
