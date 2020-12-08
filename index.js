const got = require("got");
const moment = require("moment");
const _ = require("lodash");
const fs = require("fs");
const clipboardy = require("clipboardy");

const firstDay = moment().startOf("month");
const lastDay = moment().endOf("month");

const guildID = 487625;
console.log(firstDay, lastDay);

const logsURL = "https://classic.warcraftlogs.com";
const guildCalendarURL = `${logsURL}/guild/calendar-feed/${guildID}/0/0?&start=${firstDay.format(
  "YYYY-MM-DD"
)}&end=${lastDay.format("YYYY-MM-DD")}`;
const replacements = fs
  .readFileSync("./replacements.txt", "utf-8")
  .split("\n")
  .reduce((acc, cur) => {
    const [date, people] = cur.split("\t");
    acc[date] = people ? people.split(",").map((p) => p.toUpperCase()) : [];
    return acc;
  }, {});
let members = fs
  .readFileSync("./setup.txt", "utf-8")
  .split("\n")
  .reduce((acc, cur) => {
    const [main, alt] = cur.split("|");
    acc[main] = {
      alt: alt ? alt.toUpperCase() : main,
      attendance: 0,
      missed: 0,
      attended: [],
    };
    return acc;
  }, {});
(async () => {
  const response = await got(guildCalendarURL).json();
  const reports = _.sortBy(response, ["id"]);
  const attendance = {};
  for (const report of reports) {
    const { url, start } = report;
    const date = moment(start).format("DD-MM-YYYY");
    if (!attendance[date]) {
      attendance[date] = [];
    }
    const reportURL = url.split("/");
    reportURL[0] = "https://classic.warcraftlogs.com";
    reportURL.splice(2, 0, "fights-and-participants");
    reportURL.splice(4, 0, "0");
    const participantsURL = reportURL.join("/");

    const { friendlies } = await got(participantsURL).json();
    attendance[date].push(...friendlies.map((f) => f.name), "тест");
  }
  const dates = Object.keys(attendance);
  dates.forEach((key) => (attendance[key] = _.uniq(attendance[key])));

  let sumAttendance = 0;
  Object.keys(members).forEach((m) => {
    dates.forEach((date, index) => {
      const member = m.toUpperCase();
      const dateAttendance = attendance[date].map((n) => n.toUpperCase());
      if (
        dateAttendance.includes(member) ||
        dateAttendance.includes(members[m].alt) ||
        replacements[date].includes(member)
      ) {
        members[m].attended.push(1);
      } else {
        members[m].attended.push(0);
        members[m].missed += 1;
      }

      if (index === dates.length - 1) {
        const att = +(
          members[m].attended.reduce((acc, cur) => acc + cur, 0) / dates.length
        ).toFixed(2);

        sumAttendance += att;
        members[m].attendance = att;
      }
    });
  });
  const averageAttendance = +(
    sumAttendance / Object.keys(members).length
  ).toFixed(2);

  members = _.fromPairs(
    _.sortBy(_.toPairs(members), (v) => v[1].missed).reverse()
  );
  let csv = `Посещаемость с ${firstDay.format(
    "DD-MM-YYYY"
  )} по ${lastDay.format("DD-MM-YYYY")}\n`;
  csv += `\t${averageAttendance * 100}%\tПропусков\t${dates.join("\t")}\n`;
  Object.keys(members).forEach((member) => {
    const { missed, attendance, attended } = members[member];
    csv += `${member}\t${attendance * 100}%\t${missed}\t${attended.join(
      "\t"
    )}\n`;
  });
  clipboardy.writeSync(csv);
  console.log("DONE");
  process.exit(0);
})();
