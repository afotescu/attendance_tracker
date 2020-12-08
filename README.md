# WoW Classic Guilds Attendance

This is a small script I've made for my guild to be able to track attendance of people for raid nights since I was too lazy to do it by my hands

## How It Works

1. Gets your calendar from WCL website
2. Checks all people who were present in at least one boss during this night
3. Collects the data for a specified period of time
4. Generates CSV (or any other separator) data and copies it to your clipboard

## Usage

1. Download the source code or get an executable file from [release page](https://github.com/afotescu/attendance_tracker/releases)

2. Create 2 txt file called [replacements.txt](https://github.com/afotescu/attendance_tracker/blob/master/replacements.txt) and [setup.txt](https://github.com/afotescu/attendance_tracker/blob/master/setup.txt) and populate them with your raid setup and replacements for specific dates.
   Also you can specify people alts divided by `|` please check the example file from the source code

3. Run the code or executable from console using following options:

```
  -g --guild <string>      guild ID
  -s --separator <string>  set data separator (default: "\t")
  -f --from <string>       from date in format YYYY-MM-DD default is first day of current month (default: "2020-12-01")
  -t --to <string>         to date in format YYYY-MM-DDt default is last day of current month (default: "2020-12-31")
```

Example for my guild:

```
    wow-attendance.exe -g 487625 -f 2020-12-01 -t 2020-12-31
    or
    node index.js -g 487625 -f 2020-12-01 -t 2020-12-31
```

4. Paste it in google sheets (keep default separator) or CSV file (set seaparator to `,`) to be see the attendance of your guild.
   Example:
   ![alt text](https://raw.githubusercontent.com/afotescu/attendance_tracker/master/example.png)

## Contacts

Feel free to contact me on reddit or in discord `Ellex#1111` if you have any issues or questions

You can also open issues directly here
