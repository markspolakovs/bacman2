export interface BacmanItem {
  type: string;
  subject: string;
  lang: string;
  year: string;
  id: string;
  fileUrl: string;
  previewUrl?: string;
  fileName?: string;
  $source: "lg" | "sp";
  $original: BacmanItem;
}

export interface BacmanFilters {
  type: string;
  subject: string;
  language: string;
  year: string;
  includeLG: boolean;
}

const SIGIL_MARKER = Symbol("sigil");

/**
 * A sigil is a marker for the UI layer to render something that's not a BacmanItem
 * Currently it's used for errors and for when not all datasources have returned their data
 */
export type Sigil = { [SIGIL_MARKER]: true } & (
  | { type: "NOT_ALL_LOADED" }
  | { type: "ERROR"; key: string; err?: Error });

export function notAllLoaded(): Sigil {
  return {
    [SIGIL_MARKER]: true,
    type: "NOT_ALL_LOADED"
  };
}

export function error(key: string, err?: Error): Sigil {
  return {
    [SIGIL_MARKER]: true,
    type: "ERROR",
    key,
    err
  };
}

export function isSigil(thing: any): thing is Sigil {
  return thing[SIGIL_MARKER] === true;
}

export type Transformer = (obj: BacmanItem) => BacmanItem;
