import React, { useState } from "react";
import { range } from "lodash";
import { BacmanFilters } from "../types";
import values from "../values.json";
import { useSelector, useDispatch } from "react-redux";
import { AppState, Actions } from "../data/state";

const date = new Date();
const maxYear =
  date.getMonth() >= 9 - 1 ? date.getFullYear() : date.getFullYear() - 1;

function useChanger() {
  const filters = useSelector<AppState, BacmanFilters>(
    state => state.filters.filters
  );
  const dispatch = useDispatch();
  return function<K extends keyof BacmanFilters>(
    key: K,
    val: BacmanFilters[K]
  ) {
    dispatch(
      Actions.Filters.ChangeFilters({
        ...filters,
        [key]: val
      })
    );
  };
}

function getMessage(k: keyof BacmanFilters) {
  switch (k) {
    case "type":
      return "What are you looking for?";
    case "subject":
      return "For which subject?";
    case "language":
      return "In which language?";
    case "year":
      return "From which year?";
    default:
      throw new Error();
  }
}

type PickerProps = {
  wat: keyof BacmanFilters;
  options: { [K: string]: string };
};

const Picker: React.FC<PickerProps> = ({ wat, options }) => {
  const filters = useSelector<AppState, BacmanFilters>(
    state => state.filters.filters
  );
  const change = useChanger();
  if (wat === "includeLG") {
    throw new Error("Can't use includeLG with pickBox!");
  }
  return (
    <div className={`pickBox pickBox-${wat}`}>
      <span>{getMessage(wat)}</span>
      <select
        className={wat}
        name={wat}
        value={filters[wat]}
        onChange={e => change(wat, e.target.value)}
      >
        {Object.keys(options).map(opt => (
          <option key={opt} value={opt}>
            {options[opt]}
          </option>
        ))}
      </select>
    </div>
  );
};

function renderYearPickbox(includeLG?: boolean) {
  let minYear = new Date().getFullYear();
  const years = includeLG ? values.years.lg : values.years.sp;
  Object.keys(years).forEach(x => {
    if (x === "any") {
      return;
    }
    const n = parseInt(x, 10);
    if (n < minYear) {
      minYear = n;
    }
  });
  const vals = range(minYear, maxYear + 1)
    .reverse()
    .reduce(
      (obj, year) => ({ ...obj, [year.toString(10)]: year.toString(10) }),
      { any: "any" }
    );
  return <Picker wat={"year"} options={vals} />;
}

const PickBox: React.FC<{}> = () => {
  const [advanced, setAdvanced] = useState(false);
  const filters = useSelector<AppState, BacmanFilters>(
    state => state.filters.filters
  );
  const showNames = useSelector<AppState, boolean>(
    state => state.filters.showFileNames
  );
  const dispatch = useDispatch();
  const change = useChanger();

  return (
    <div className="finder-picker">
      <Picker wat="type" options={values.types} />
      <Picker wat="subject" options={values.subjects} />
      <Picker wat="language" options={values.languages} />
      {renderYearPickbox(filters.includeLG)}
      <button className="link-btn" onClick={() => setAdvanced(!advanced)}>
        Advanced
      </button>
      {advanced && (
        <>
          <div className="pickBox">
            <span>Show original file names?</span>
            <select
              value={showNames ? "true" : "false"}
              onChange={e =>
                dispatch(
                  Actions.Filters.ShowFileNames(e.target.value === "true")
                )
              }
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
};

export default PickBox;
