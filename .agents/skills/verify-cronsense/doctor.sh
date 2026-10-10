#!/usr/bin/env bash
# Route smoke for the built cronsense site. Usage: doctor.sh <PORT>
# Checks every route in routes[], prints `status path` per route, exits non-zero at the end if any failed.
set -u
PORT="${1:?usage: doctor.sh <PORT>}"
BASE="http://localhost:${PORT}"
fail=0

# Gotcha slugs mirror WARNINGS in src/cron/warnings.ts; update this list when a warning is added.
routes=(
  /
  /llms.txt
  /gotchas/
  /gotchas/gotcha.css
  /gotchas/dom-dow-or-semantics/
  /gotchas/uneven-step-reset/
  /gotchas/never-fires/
  /gotchas/sub-minimum-interval/
  /gotchas/high-load-delay-drop/
  /gotchas/inactivity-pause/
  /gotchas/dom-dow-or-semantics.md
  /gotchas/uneven-step-reset.md
  /gotchas/never-fires.md
  /gotchas/sub-minimum-interval.md
  /gotchas/high-load-delay-drop.md
  /gotchas/inactivity-pause.md
  /design-system/
)

for route in "${routes[@]}"; do
  code=$(curl -s --max-time 10 -o /dev/null -w "%{http_code}" "${BASE}${route}")
  echo "${code} ${route}"
  [ "${code}" = "200" ] || fail=1
done

title=$(curl -sf --max-time 10 "${BASE}/" | grep -o "<title>[^<]*</title>" || true)
echo "title: ${title}"
[ "${title}" = "<title>Cronsense</title>" ] || fail=1

exit "${fail}"
