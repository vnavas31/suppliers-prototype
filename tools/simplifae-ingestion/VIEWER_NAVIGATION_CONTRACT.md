# Viewer Navigation Contract

The document viewer is part of the evidence contract. It is not a cosmetic preview.

## Required Behavior

Tender Detail source chips must:

- refer to a document belonging to the active tender
- include exact document label and page
- open/reuse the tender-specific viewer
- navigate to the cited document/page
- avoid opening duplicate random tabs for the same tender

Document viewer evidence rail must:

- show Detailed Scope first when available
- visually separate Detailed Scope, Required Documents, Admission Criteria, and Award Criteria
- group repeated references under one evidence card
- keep source chips clickable
- switch documents for cross-document references
- scroll/navigate within the same document for same-document references

Rendered document pages must:

- exist locally under `discovery-v2/doc-pages/...`
- match the document key used by viewer metadata
- support full-page navigation when `--all-pages` was used

## Forbidden Regressions

- Native PDF iframe as the primary viewer.
- Source chip with no active tender document key.
- Source chip pointing to a previous tender's document.
- Mixed category labels such as `Structured award/admission summary`.
- Evidence rail grouping by raw extraction label rather than conceptual category.
- Missing rendered pages for cited evidence.

## Validation

Run the UI validation after promotion/render:

```bash
node tools/simplifae-ingestion/validate_tender_processing.js \
  --limit 50 \
  --runs 2 \
  --include-imported \
  --out /tmp/simplifae-ingestion/validation-report.json
```

Use packet-level smoke before promotion:

```bash
node tools/simplifae-ingestion/simplifae.js smoke --premium-root /path/to/premium
```

Viewer validation is heavier than packet validation and should run before publishing or when `discovery-v2/index.html`, `discovery-v2/document-viewer.html`, promotion, rendering, or source-chip mapping changes.
