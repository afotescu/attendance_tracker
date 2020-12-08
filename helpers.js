const { readFileSync } = require("fs");

exports.getMemebers = () =>
  readFileSync("./setup.txt", "utf-8")
    .replace(/[\r\n]/g, "\n")
    .split("\n")
    .reduce((acc, cur) => {
      const [main, alt] = cur.split("|");
      if (main) {
        acc[main] = {
          alt: alt ? alt.toUpperCase() : main.toUpperCase(),
          attendance: 0,
          missed: 0,
          attended: [],
        };
      }
      return acc;
    }, {});

exports.getReplacements = () =>
  readFileSync("./replacements.txt", "utf-8")
    .replace(/[\r\n]/g, "\n")
    .split("\n")
    .reduce((acc, cur) => {
      const [date, ...people] = cur.split(",");
      if (date) {
        acc[date] = people.map((p) => p.toUpperCase());
      }
      return acc;
    }, {});

exports.getParticipantsURL = (url) => {
  const reportURL = url.split("/");
  reportURL[0] = "https://classic.warcraftlogs.com";
  reportURL.splice(2, 0, "fights-and-participants");
  reportURL.splice(4, 0, "0");
  return reportURL.join("/");
};
