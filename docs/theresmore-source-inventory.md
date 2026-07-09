# Theresmore source inventory

Generated on 2026-07-09 for the Cangling Jiyuan integration.

## Source analysis directory

`C:\Users\Windows11\OneDrive\open ai\theresmore_analysis_2026-07-09\analysis`

## Extracted source files

- `all_data.json`: full merged extraction, 1,065,740 bytes.
- `resources.json` / `resources.csv`: 30 extracted resources before game filtering.
- `buildings.json` / `buildings.csv`: 218 buildings with costs, requirements, generation effects, caps, and branches.
- `techs.json` / `techs.csv`: 372 technologies and branch choices.
- `population.json` / `population.csv`: 21 population/job records.
- `units.json` / `units.csv`: 215 unit records, including settlement, recon, spy, army, and enemy units.
- `enemies.json` / `enemies_locations.csv`: 123 enemy location expeditions.
- `ancestors.json` / `ancestors.csv`: 9 ancestor/path lines.
- `legacy.json` / `legacy.csv`: 173 legacy records.
- `magic.json` / `magic.csv`: 172 magic records, including 111 prayers and 61 spells.
- `diplomacy.json` / `diplomacy.csv`: 39 diplomacy records.
- `market.json` / `market.csv`: 8 market records.
- `achievements.json`: 214 achievement records.
- `rewards.json`: 7 reward records.
- `generation_index.csv`: normalized generated-output index.
- `requirements_index.csv`: normalized requirement/cost index.
- `reverse_requirements.json`: reverse dependency lookup.
- `translation_prefix_counts.json` and `translations_sampled_keys.json`: translation/key audit helpers.
- `README_中文分析.md`: Chinese analysis notes from the extraction pass.
- `summary.json`: compact extraction counts.

## Generated game pack

`theresmore-data.generated.js` is built by `tools/build-theresmore-pack.js` from the extracted JSON/CSV files.

Current generated pack:

- Version: `theresmore-main.480437b3-phase1`
- Resources: 28
- Ancestor/path lines: 9
- Jobs: 20
- Buildings: 218
- Technologies: 372
- Units: 61
- Expeditions/enemy locations: 123

## Runtime mapping status

- Resource costs are mapped into card costs.
- Building, technology, resource, enemy, stat, legacy, prayer, spell, and diplomacy requirements are represented in a common `requires` format.
- Building and technology effects map into caps, flat rates, percentage rates, population, job caps, army cap, morale, all-rate, and army-power bonuses.
- One-shot outputs map into `grantResources`, `grantsTechs`, and `removesTechs`.
- Enemy requirements are satisfied by completed expedition ids, including `enemy_<id>`.
- Legacy, prayer, spell, and diplomacy requirements are reserved as save flags for later systems.
