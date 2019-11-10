import { Transformer } from "../../types";

const matchers3 = [
  /MATH 3 (A|B)/,
  /(?:P3|3P)(?:-| )[A-Z]{2}(?:-| )*(A|B)/,
  /MATHEMATICS (?:P3|3P)-RESERVE-[A-Z]{2} *(A|B)/
];
const matchers5 = [
  /MATH 5 (A|B)/,
  /(?:P5|5P)-[A-Z]{2} *(A|B)/,
  /MATHEMATICS (?:P5|5P)-RESERVE-[A-Z]{2} *(A|B)/,
  /MATHEMATICS (?:P5|5P)-RESERVE-SOLUTIONS-[A-Z]{2} *(A|B)/,
  /MATHEMATICS (?:P5|5P)-SOLUTIONS-[A-Z]{2} *(A|B)/,
  /MATHEMATICS (?:P5|5P)-SOLUTIONS COMB *(A|B)/
];

export const recognisePart: Transformer = item => {
  if (!item.fileName) {
    return item;
  }
  const matchers = item.$original.subject === "MA3" ? matchers3 : matchers5;
  for (let i = 0; i < matchers.length; i++) {
    const match = matchers[i].exec(item.fileName);
    if (match) {
      const rez = match[1];
      if (rez === "A" || rez === "B") {
        item.subject += ` part ${rez}`;
      }
    }
  }
  return item;
};
