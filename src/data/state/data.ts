import {
  createAsyncAction,
  createReducer,
  getType,
  isActionOf,
  createAction
} from "typesafe-actions";
import { BacmanItem, Sigil, notAllLoaded, isSigil, error } from "../../types";
import { Actions } from ".";
import { Epic, ofType } from "redux-observable";
import { Observable, combineLatest, of, merge } from "rxjs";
import { switchMap, map, takeUntil, catchError, tap } from "rxjs/operators";
import amplitude from "amplitude-js";

import SharepointBakedDataSource from "../dataSources/sharepointBaked";
import SharepointLiveDataSource from "../dataSources/sharepointLive";
import LGDataSource from "../dataSources/lg";

import { transform } from "../transformers";

const DataActionTypes = {
  REQUEST: "Data.LoadData()",
  SUCCESS: "Data.LoadData().Success",
  FAILURE: "Data.LoadData().Failure"
} as const;

const LoadData = createAsyncAction(
  DataActionTypes.REQUEST,
  DataActionTypes.SUCCESS,
  DataActionTypes.FAILURE
)<
  undefined,
  { items: BacmanItem[]; sigils: Sigil[]; allLoaded: boolean },
  { error: Sigil }
>();

const Ready = createAction("Data.Ready()");

export const DataActions = { LoadData, Ready };

export interface IDataState {
  items: BacmanItem[] | null;
  sigils: Sigil[] | null;
  loading: boolean;
  error: Sigil | null;
  allLoaded: boolean;
  initialEmptyState: boolean;
  ready: boolean;
}

const initialState: IDataState = {
  items: null,
  sigils: null,
  loading: false,
  error: null,
  initialEmptyState: true,
  ready: false,
  allLoaded: false
};

export const dataReducer = createReducer<IDataState, Actions>(initialState)
  .handleAction(Ready, state => ({ ...state, ready: true }))
  .handleAction(LoadData.request, (state, action) => ({
    ...state,
    loading: true,
    error: null,
    initialEmptyState: false
  }))
  .handleAction(LoadData.success, (state, action) => ({
    ...state,
    loading: !action.payload.allLoaded,
    items: action.payload.items,
    sigils: action.payload.sigils,
    allLoaded: action.payload.allLoaded
  }))
  .handleAction(LoadData.failure, (state, action) => ({
    ...state,
    loading: false,
    error: action.payload.error
  }));

function removeNulls<T>(input: Array<T | null>): Array<T> {
  return input.filter(x => x !== null) as Array<T>;
}

const DEFAULT_TO_LIVE = true;

function shouldUseLive(): boolean {
  if (DEFAULT_TO_LIVE) {
    return window.location.search.indexOf("useLiveSource=false") === -1;
  } else {
    return window.location.search.indexOf("useLiveSource=true") !== -1;
  }
}

/*
  The data pipeline is:
  1. a ChangeFilters action is triggered
  2. We react to it, starting the data fetch
  3. Trigger a LoadData.Request
  4. Fetch the data
  5. LoadData.Success
*/
export const DataEpic: Epic<Actions> = (action$, state$) =>
  action$.pipe(
    // We only care about filter changes
    ofType(getType(Actions.Filters.ChangeFilters)),
    // we tap into them for analytics
    tap(action => {
      if (!isActionOf(Actions.Filters.ChangeFilters)(action)) {
        throw new Error("Can't happen.");
      }
      amplitude.getInstance().logEvent("Query", {
        ...action.payload
      });
    }),
    // and on every filter change, we want to restart the pipeline
    switchMap((action, index) => {
      if (!isActionOf(Actions.Filters.ChangeFilters)(action)) {
        throw new Error("Can't happen.");
      }
      // "Live" fetches from Microsoft Graph, "Baked" uses the cached dataset
      const spoSauce = shouldUseLive()
        ? SharepointLiveDataSource
        : SharepointBakedDataSource;
      // If the user wants pre-2013 papers, include Learning Gateway too
      const data$: Observable<(BacmanItem[] | null)[]> = action.payload
        .includeLG
        ? combineLatest(spoSauce(action.payload), LGDataSource(action.payload))
        : // this map is necessary to turn BacmanItem[] into BacmanItem[][]
          // because that's what combineLatest will give us - consistency is nice.
          spoSauce(action.payload).pipe(map(x => [x]));
      return merge(
        // fire a LoadData.Request action - sets the "loading" state in the UI
        of(LoadData.request()),
        // When we get some data...
        data$.pipe(
          // Transform it into an action of some kind success, with a certain sigil if necessary
          map(val => {
            let items: BacmanItem[] = [];
            let sigils: Sigil[] = [];
            if (val.every(x => x !== null)) {
              // all datasources have loaded something
              const valNoNull = val as BacmanItem[][];
              items = transform(valNoNull.flat());
              return LoadData.success({ items, sigils, allLoaded: true });
            } else {
              // not all data sources have loaded something
              items = transform(removeNulls(val).flat());
              sigils.push(notAllLoaded());
              return LoadData.success({ items, sigils, allLoaded: false });
            }
          }),
          catchError(err => {
            if (isSigil(err)) {
              return of(LoadData.failure({ error: err }));
            }
            return of(LoadData.failure({ error: error("UNKNOWN") }));
          })
          // TODO: cancelling
          // takeUntil(action$.pipe(ofType(getType(LoadData.cancel))))
        )
      );
    })
  );
