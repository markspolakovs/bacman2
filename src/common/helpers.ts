import { BacmanFilters, BacmanItem } from "../types";

export function compare(filters: BacmanFilters) {
  return function(a: BacmanItem, b: BacmanItem) {
    return (
      a.subject.localeCompare(b.subject) ||
      parseInt(b.year) - parseInt(a.year) ||
      (filters.type === "Suggested Answers" &&
      (filters.subject === "MA3" || filters.subject === "MA5")
        ? 0
        : a.lang.localeCompare(b.lang)) ||
      a.type.localeCompare(b.type)
    );
  };
}
