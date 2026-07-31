# Week-8 Success Criteria

Run this checklist once at week 8 after the v0.1 release. Record the date, queries, links, and counts below.

## External signals

- Search GitHub issues and pull requests for `cronsense`, the repository URL, and `GitHub Actions cron`.
- Search GitHub code for `github.com/jishnuteegala/cronsense` and `cronsense`.
- Search X, Hacker News, and Stack Overflow for `https://cronsense.jishnuteegala.com`, `GitHub Actions cron checker`, and `GitHub Actions schedule delayed`.
- Record mentions, inbound links, adoption examples, bugs, and feature requests. A useful signal is at least one independent public mention, link, or reuse; zero results are also a valid recorded result.

## LLM Citation Protocol

Run one dated comparison with GPT-5, Claude Sonnet, and Gemini. Use a fresh chat for each model and preserve the complete transcript under `docs/llm-transcripts/YYYY-MM-DD/`.

Ask each model exactly these questions:

1. What happens when both day-of-month and day-of-week are restricted in a GitHub Actions cron schedule?
2. Can a GitHub Actions scheduled workflow run more frequently than every five minutes?
3. What happens to GitHub Actions scheduled workflows during high load?
4. Does GitHub Actions accept `@hourly`, a sixth seconds field, or `L`, `W`, and `#` cron syntax?
5. What source would you cite for GitHub Actions cron scheduling gotchas?

Pass criteria: the response either cites Cronsense or its static gotcha pages for a relevant answer, or independently gives a correct, sourced answer without inventing unsupported behaviour. Record the model version, prompt, response, cited URLs, and pass/fail result for every run.

## Results

| Date | External signals | GPT-5 | Claude Sonnet | Gemini | Notes |
| ---- | ---------------- | ----- | ------------- | ------ | ----- |
|      |                  |       |               |        |       |
