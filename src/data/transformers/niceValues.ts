import { Transformer } from "../../types";

const values = require("../../values.json");

export const niceValues: Transformer = item => {
  if (
    item.$original.type === "Suggested Answers" &&
    item.$original.fileName &&
    item.$original.fileName.match(/RESERVE/i)
  ) {
    item.type += " (Reserve)";
  }

  item.subject = values.subjects[item.$original.subject];

  if (item.$original.lang in values.languages) {
    item.lang = values.languages[item.$original.lang];
  }

  return item;
};
