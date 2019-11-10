import { createAction, createReducer } from "typesafe-actions";
import { BacmanFilters } from "../../types";
import { Actions } from ".";

export interface IFiltersState {
  filters: BacmanFilters;
  showFileNames: boolean;
}

const initialState: IFiltersState = {
  filters: {
    type: "any",
    subject: "any",
    language: "any",
    year: "any",
    includeLG: false
  },
  showFileNames: false
};

const TChangeFilters = "Filters.ChangeFilters()" as const;
const ChangeFilters = createAction(
  TChangeFilters,
  action => (filters: BacmanFilters) => action(filters)
);

const TShowFileNames = "Filters.ShowFileNames()" as const;
const ShowFileNames = createAction(TShowFileNames, action => (val: boolean) =>
  action(val)
);

export const FiltersActions = {
  ChangeFilters,
  ShowFileNames
};

export const filtersReducer = createReducer<IFiltersState, Actions>(
  initialState
)
  .handleAction(ChangeFilters, (state, action) => ({
    ...state,
    filters: action.payload
  }))
  .handleAction(ShowFileNames, (state, action) => ({
    ...state,
    showFileNames: action.payload
  }));
