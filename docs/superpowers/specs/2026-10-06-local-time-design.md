# Local time and simpler estimates — design

Date: 2026-10-06
Branch: `local-time`
Issue: [#2 Show local time instead of server time](https://github.com/Seeker14491/genshin-schedule/issues/2)

## Goal

Show times in the user's own time zone by default, in their own 12- or 24-hour convention, and simplify the resin and realm currency estimates. Also fix two timing problems: the resin counter reaches the threshold up to a minute after the Discord notification arrives, and an open page can cancel a notification just before it's sent.

The `sync` backend is not changed.

## Background

Game servers use fixed UTC offsets and don't observe daylight saving time. Until [d5fba84](https://github.com/Seeker14491/genshin-schedule/commit/d5fba84c69d6e0500bbf00810e51255c5e945827) the Europe server used `Europe/Berlin`, so for users in most of western Europe the clock happened to match their own all year. Since then it's an hour behind in summer, which is what the issue reports.

## Time zone setting

- New config key `timeZone: "server" | "local"`, default `"local"`. The value type leaves room for IANA zone names later.
- `getDisplayTime(ms, config)` in `utils/time.ts` returns the time in the zone to display: the browser's zone (luxon's `"system"`) for `"local"`, or the server's fixed offset. Daily reset keeps using `getServerTime`, since it's a server event.
- Times that follow the setting: the clock, resin estimates, the notification line and realm currency estimates. The reset countdown doesn't change.
- **Settings:** a "Time zone" field with "Local time" and "Server time".
- **Clock heading:** "Local time" or "Time in Teyvat". The server moves to the line under the clock, since "Local time (Europe server)" could be read as the local time of the Europe server.
- **Line under the clock:** "Europe server: Thursday, 2h 16m until reset (117 resin)", replacing "Thursday, 13 hours until reset (+97 resin)".
  - The weekday is the server day, which starts at reset (4:00 on the server) rather than at midnight. After the server's name, it's clearly not the local day.
  - The server is the button that switches servers. Its text is a `{server} server` message so that each language can order it, and the whole line is one message with the button as a placeholder (`splitMessage`). The tooltip still shows the server's offset, e.g. "Switch server (UTC+1)".
  - The duration is compact and counted like the estimates' (from the current minute to the reset).
  - The resin is how much there will be at reset, instead of how much is gained until then.

## Time formatting

One formatter for every time on the site, replacing the fixed `HH:mm:ss` of the clock, the padded `HH:mm` of the resin estimates and luxon's `DATETIME_SHORT` of the realm currency dates.

- The text (separators, AM/PM markers and their position) comes from the site's language.
- 12- or 24-hour comes from the browser's own locale: `new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hourCycle`. The site language alone isn't enough, since English is always `en-US` on the site and would give British users 12-hour time.
- 12-hour times use `hour12: true` and a numeric hour: "4:05 PM", "午後4:05", "오후 4:05". 24-hour times use `hourCycle: "h23"` (not `hour12: false`, which some browsers have resolved to `h24`, showing "24:05") and a 2-digit hour: "04:05", "16:05".
- Explicit Intl options instead of luxon's presets, which give e.g. "4시 5분 9초" for Korean 24-hour time with seconds.
- Realm currency estimates more than a day away keep showing the date, now with the same hour convention. Resin estimates don't need one, since resin fills up in under 27 hours.

## Clock

- Formatted into parts (`toLocaleParts`), so that the AM/PM marker can be shown smaller than the digits.
- The AM/PM marker has a line height of 1, since the text styles' line heights are absolute and a smaller marker would otherwise make the clock taller.
- **Fixed digit widths.** The Genshin font has no tabular figures, so `tabular-nums` does nothing, and digits range from 0.39em ("1") to 0.75em ("0"). As the clock is centered, it moves every second. Each digit is put in an inline box as wide as the widest digit, centered in it. Separators and the AM/PM marker keep their own width. In 12-hour time the width still changes once an hour, e.g. from 9:59 to 10:00.

## Estimates

- **Time steps are removed** from both the resin and realm currency widgets. Both always show value steps, as "value steps" does today:
  - Resin: every multiple of 20 above the current resin, up to the cap.
  - Realm currency: 80, 160, 320… up to the cap, then the cap.
- The estimation mode setting, switching it by clicking the resin or realm currency icon, and the `resinEstimateMode` config key go away.
- **Compact durations** with `Intl.DurationFormat` and `style: "narrow"`: "2h 56m", "1d 3h 20m", or each language's own short form ("2h 56min", "2 ч 56 мин", "2시간 56분"). Browsers without it fall back to `Intl.NumberFormat` units with `unitDisplay: "narrow"`, joined with spaces. The time until reset uses them too.
- **Realm currency estimates use its hourly steps.** Currency is added once per full hour since the last change, but the estimates assumed a steady rate from now, so they could be up to an hour late. They now use the time of the step that reaches each value.
- **Rounded up to the minute.** An estimate's time is when the value is reached, rounded up to the next whole minute, and its duration is the time from the current minute until then. This way they always match the clock, and never claim resin arrives before it does. It also fixes a line reading "160 in  (14:00)" (an empty duration) when less than a minute was left.

Resin at 14:00 with 150, in American English:

```
160 in 1h 20m (3:20 PM)
180 in 4h (6:00 PM)
200 in 6h 40m (8:40 PM)
```

## Counters and notifications

- **Counters update every second.** Resin and realm currency are currently calculated from the start of the current minute (`clock.minute`), so a counter can show 199 for up to a minute after resin reached 200, while the Discord notification is sent within 5 seconds (the server checks the queue every 5 seconds). They now use `clock.now`. Estimates are calculated from the same exact time, so a line disappears when its value is reached.
- **Time passing no longer cancels the notification.** The resin notification is turned off as soon as `clock.minute` passes its time, which makes the page delete it from the server a second later. When the time falls in the last few seconds of a minute, the delete can arrive before the server's next check, and the notification is never sent. Instead, whether there is a notification is only decided when its time or the threshold changes: if the time has already passed by then, it's removed, and otherwise it's queued. Reaching the time later changes nothing.
  - This covers what the separate "resin is below the threshold" check did, since resin at or above the threshold always gives a time at or before the last change, so that check goes away.
  - Lowering the threshold below the current resin still removes the queued notification, and a page that receives another device's changes late still doesn't queue one that was already sent.

## Saved data

- `timeZone` is a new key. Existing data doesn't have it, so everyone gets the default, local time. Not stored in the browser while it has the default value, like other keys.
- `resinEstimateMode` is removed from `Config`. Saved values stay in users' data as an unknown key, like the data of features removed in the rewrite. The backup dialog still accepts data containing it.

## Messages

- Added: `local_time` ("Local time"), `server_time` ("Server time"), `time_zone` ("Time zone"), `server_label` ("{server} server"), `server_reset` ("{server}: {weekday}, {duration} until reset ({value} resin)").
- Removed: `resin_estimation_mode`, `estimation_mode_time`, `estimation_mode_value`, `switch_estimation_mode`, `until_reset`, `resin_gain`.

## Tests

- Unit:
  - `timeZone`: default, validation, and not stored while it has the default value. `resinEstimateMode` is kept as an unknown key.
  - When resin and realm currency reach a value.
  - `getDisplayTime` in both modes.
  - The time formatter in both hour conventions, in languages with the AM/PM marker first (ja, ko), and that midnight in 24-hour time is "00:00".
  - Compact durations, with and without `Intl.DurationFormat`.
  - Estimates rounding up to the minute.
- E2E:
  - In `Europe/Madrid` with the Europe server, the clock shows local time (UTC+2 in summer) by default and server time (UTC+1) once chosen in settings, with the same reset line in both, including the resin at reset.
  - 24-hour time from a British English browser, although the site is in American English.
  - Resin estimates in the new format.
  - The resin counter reaches a value at the second it's due, not at the next minute.
  - Time passing the notification's time doesn't delete it, and lowering the threshold below the resin does.
  - Assertions that relied on server time being the default are updated.
- `npm run lint`, `npm run check`, `npm test`, `npm run test:e2e`, and a screenshot comparison with `master`.

## Out of scope

- Choosing an arbitrary time zone.
- A 12/24-hour setting.
