const got = require("got");
const moment = require("moment");
const _ = require("lodash");
const { writeSync } = require("clipboardy");
const { program } = require("commander");
const {
  getReplacements,
  getMemebers,
  getParticipantsURL,
} = require("./helpers");
const { replace } = require("lodash");

program.version("1.0.0");
program
  .option("-g --guild <string>", "guild ID")
  .option("-s --separator <string>", "set data separator", "\t")
  .option(
    "-f --from <string>",
    "from date in format YYYY-MM-DD default is first day of current month",
    moment().startOf("month").format("YYYY-MM-DD")
  )
  .option(
    "-t --to <string>",
    "to date in format YYYY-MM-DD default is last day of current month",
    moment().endOf("month").format("YYYY-MM-DD")
  );

program.parse(process.argv);

const firstDay = program.from;
const lastDay = program.to;
const separator = program.separator;
const guildID = program.guild; // 487625
if (!guildID) {
  console.error("No guild ID specified");
  process.exit(1);
}

if (moment(lastDay).diff(moment(firstDay), "d") > 30) {
  console.error("Difference between dates shouldn't be more than a month");
  process.exit(1);
}

console.log(`Trying to get reports from ${firstDay} to ${lastDay}`);

const logsURL = "https://classic.warcraftlogs.com";
const guildCalendarURL = `${logsURL}/guild/calendar-feed/${guildID}/0/0?&start=${firstDay}&end=${lastDay}`;
const replacements = getReplacements();
let members = getMemebers();

(async () => {
  try {
    const response = await got(guildCalendarURL).json();
    const reports = _.sortBy(response, ["id"]);
    if (!reports.length) {
      console.log("No reports were found");
      process.exit(0);
    }
    console.log(`Found ${reports.length} reports.`);
    const attendance = {};
    for (const report of reports) {
      const { url, start, title, id } = report;
      const date = moment(start).format("YYYY-MM-DD");
      console.log(`Processing report ${title} with id ${id} from ${date}`);
      if (!attendance[date]) {
        attendance[date] = [];
      }
      const participantsURL = getParticipantsURL(url);

      const { friendlies } = await got(participantsURL).json();
      attendance[date].push(...friendlies.map((f) => f.name));
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
          (replacements &&
            replacements[date] &&
            replacements[date].includes(member))
        ) {
          members[m].attended.push(1);
        } else {
          members[m].attended.push(0);
          members[m].missed += 1;
        }

        if (index === dates.length - 1) {
          const att = +(
            members[m].attended.reduce((acc, cur) => acc + cur, 0) /
            dates.length
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
    let csv = `Attendance from ${firstDay} to ${lastDay}\n`;
    csv += `${separator}${
      averageAttendance * 100
    }%${separator}Missed${separator}${dates.join(separator)}\n`;
    Object.keys(members).forEach((member) => {
      const { missed, attendance, attended } = members[member];
      csv += `${member}${separator}${
        attendance * 100
      }%${separator}${missed}${separator}${attended.join(separator)}\n`;
    });
    writeSync(csv);
    console.log("Report was copied to your clipboard");
  } catch (e) {
    console.error("An error occured", e);
  } finally {
    process.exit(0);
  }
})();
