import { recognisePart } from "./mathsPart";
import { niceValues } from "./niceValues";
import { flow } from "lodash";
import { BacmanItem, Transformer } from "../../types";

/**
 * The transform chain is a set of functions that operate on the items before they're presented to the UI layer.
 * They should be pure functions - only touch their output object.
 * In addition, they should also only look at the $original field if they need data as it came down the wire,
 * as any other properties could have been modified by transformers earlier in the chain.
 */
const transformChain: Transformer = flow(
  niceValues,
  recognisePart
);

export function transform(items: BacmanItem[]): BacmanItem[] {
  return items
    .map(x => ({ ...x, $original: x } as BacmanItem))
    .map(transformChain);
}
