# Verification

[Cronsense Verification](https://github.com/jishnuteegala/cronsense-verification) records GitHub Actions schedule predictions, workflow validation probes, and observed runs. Its `@hourly`, sixth-field, `L`, `W`, and `#` probes each produced an immediate failed run after workflow registration; the available API exposes no validator annotation or log, so the parser's presumed-rejected error copy remains pending UI inspection. The invalid `W` and `#` probe files remain only on their dedicated branches. The name-range probe has no API-visible run or workflow registration and is likewise pending UI inspection.

The initial observation window runs from 2026-07-24 through 2026-07-31 UTC.
