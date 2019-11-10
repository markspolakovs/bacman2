import { createStore, applyMiddleware, combineReducers } from "redux";
import { createEpicMiddleware, combineEpics } from "redux-observable";
import { composeWithDevTools } from "redux-devtools-extension";
import { dataReducer, DataActions, DataEpic } from "./data";
import { filtersReducer, FiltersActions } from "./filters";
import { ActionType, StateType } from "typesafe-actions";

const rootReducer = combineReducers({
  data: dataReducer,
  filters: filtersReducer
});

export type AppState = StateType<typeof rootReducer>;

export const Actions = {
  Data: DataActions,
  Filters: FiltersActions
};

export type Actions = ActionType<typeof Actions>;

const RootEpic = combineEpics(DataEpic);

const epicMiddleware = createEpicMiddleware();

export function configureStore(initialState?: AppState) {
  const store = createStore(
    rootReducer,
    initialState,
    composeWithDevTools(applyMiddleware(epicMiddleware))
  );
  epicMiddleware.run(RootEpic);
  return store;
}
