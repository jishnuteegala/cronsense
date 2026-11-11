# Changelog

## [0.1.1](https://github.com/jishnuteegala/cronsense/compare/v0.1.0...v0.1.1) (2026-11-11)


### Features

* first-principles quality pass over surfaces and prose ([#29](https://github.com/jishnuteegala/cronsense/issues/29)) ([3b882d5](https://github.com/jishnuteegala/cronsense/commit/3b882d502c04cdf0980d4296b77551d6ff80869c))
* record docs, build, and ci commits in changelogs ([#25](https://github.com/jishnuteegala/cronsense/issues/25)) ([898d194](https://github.com/jishnuteegala/cronsense/commit/898d19497b3e055d07cd88361ea3bf9ceb18e6a3))


### Performance Improvements

* **firings:** build each firing from the day start time in nextFirings ([2045be1](https://github.com/jishnuteegala/cronsense/commit/2045be1758b94d1945c8878e753d57d66232a836))
* **firings:** copy a prebuilt full Set for a lone wildcard field ([2045be1](https://github.com/jishnuteegala/cronsense/commit/2045be1758b94d1945c8878e753d57d66232a836))
* **firings:** derive start and horizon by arithmetic instead of utcDate ([2045be1](https://github.com/jishnuteegala/cronsense/commit/2045be1758b94d1945c8878e753d57d66232a836))
* **firings:** reuse EVERY_DAY for a full day-of-month set in nextFirings ([2045be1](https://github.com/jishnuteegala/cronsense/commit/2045be1758b94d1945c8878e753d57d66232a836))
* **firings:** scan only listed days of month outside union mode in nextFirings ([2045be1](https://github.com/jishnuteegala/cronsense/commit/2045be1758b94d1945c8878e753d57d66232a836))
* **firings:** walk days by arithmetic in nextFirings instead of stepping a Date ([#42](https://github.com/jishnuteegala/cronsense/issues/42)) ([2045be1](https://github.com/jishnuteegala/cronsense/commit/2045be1758b94d1945c8878e753d57d66232a836))
* **firings:** walk months by arithmetic in nextFirings instead of stepping a Date ([2045be1](https://github.com/jishnuteegala/cronsense/commit/2045be1758b94d1945c8878e753d57d66232a836))
* **firings:** walk only listed months of each year in nextFirings ([2045be1](https://github.com/jishnuteegala/cronsense/commit/2045be1758b94d1945c8878e753d57d66232a836))


### Documentation

* advance formal-verify-cronsense sync commit to 8259994 ([#36](https://github.com/jishnuteegala/cronsense/issues/36)) ([3f4c35a](https://github.com/jishnuteegala/cronsense/commit/3f4c35a2d0673bb374baca3dd5dec4c7e0f3074f))
* fix verify-cronsense drift found in weekly pass ([#35](https://github.com/jishnuteegala/cronsense/issues/35)) ([d6a3ffb](https://github.com/jishnuteegala/cronsense/commit/d6a3ffb33fb3b5ca0d01d17fc5f47313eceb7356))
* fix verify-cronsense map drift and playwright runner recipe ([#31](https://github.com/jishnuteegala/cronsense/issues/31)) ([ad7eee9](https://github.com/jishnuteegala/cronsense/commit/ad7eee9857f5bdd4f45c87b924cc58c8e20939ba))


### Build System

* **deps-dev:** bump vitest, vite, happy-dom and oxfmt to clear security alerts ([#38](https://github.com/jishnuteegala/cronsense/issues/38)) ([8107ed0](https://github.com/jishnuteegala/cronsense/commit/8107ed0634059bc7b519c692105326b614c1ca8b))
* **deps-dev:** move workbox-build to glob 14 to clear the minimatch alert ([#39](https://github.com/jishnuteegala/cronsense/issues/39)) ([2b1c916](https://github.com/jishnuteegala/cronsense/commit/2b1c91684531563ab56eb5a5a68e97223fc65463))
* pin Node 24.22.2 in .node-version ([c539bd7](https://github.com/jishnuteegala/cronsense/commit/c539bd7ec445ba7b5dfd6519762cd443a48153c6))


### Continuous Integration

* drop the post-check build that app-ci already runs ([#41](https://github.com/jishnuteegala/cronsense/issues/41)) ([caebd81](https://github.com/jishnuteegala/cronsense/commit/caebd81485921f9a48edd54c779211680884c7c1))
* keep every main CI result and scope the release caller ([#37](https://github.com/jishnuteegala/cronsense/issues/37)) ([c539bd7](https://github.com/jishnuteegala/cronsense/commit/c539bd7ec445ba7b5dfd6519762cd443a48153c6))

## 0.1.0 (2026-08-03)


### Features

* GHA cron parser with plain-English translation and firings engine ([#11](https://github.com/jishnuteegala/cronsense/issues/11)) ([7fb8d52](https://github.com/jishnuteegala/cronsense/commit/7fb8d521a404f4f3bf549cdbb9103d9432d0f7c1))
* pre-rendered gotcha pages, llms.txt, and searchable README ([#15](https://github.com/jishnuteegala/cronsense/issues/15)) ([cee6406](https://github.com/jishnuteegala/cronsense/commit/cee6406a6f13646ed0248a4892d4c44241db0421)), closes [#8](https://github.com/jishnuteegala/cronsense/issues/8)
* scan workflow schedule crons ([#21](https://github.com/jishnuteegala/cronsense/issues/21)) ([8b66d4d](https://github.com/jishnuteegala/cronsense/commit/8b66d4d07f568260ae08a922e0666025a89c08c2))
* ship v0.1 ([#17](https://github.com/jishnuteegala/cronsense/issues/17)) ([40524e0](https://github.com/jishnuteegala/cronsense/commit/40524e0b7f21b2b0961b03629fb188c39a3a430f)), closes [#10](https://github.com/jishnuteegala/cronsense/issues/10)
* single-page UI with firings table, warnings, and permalinks ([#14](https://github.com/jishnuteegala/cronsense/issues/14)) ([7e74ecb](https://github.com/jishnuteegala/cronsense/commit/7e74ecbe626bae36030b83f22fa7337211d3a00a)), closes [#7](https://github.com/jishnuteegala/cronsense/issues/7)
* sourced warning engine with suppression gates ([#12](https://github.com/jishnuteegala/cronsense/issues/12)) ([f2687ca](https://github.com/jishnuteegala/cronsense/commit/f2687cab0f4f2b020e142a2dfb8b09987a339663))
