# Simplifae Tender Processing Method

This is the operating method for turning PLACSP tenders into Simplifae Discovery, Tender Detail, and document-viewer evidence without relying on chat history.

## Core Principle

Fast ingestion may publish structured Discovery data quickly, but premium Tender Detail content is only allowed when it satisfies the same source-backed evidence contract as the previous slow method.

Correctness wins over speed. If a tender cannot be completed with exact document/page evidence, downgrade it to review, OCR, or docs-required. Never fill the prototype with fake certainty.

## Processing Lanes

### Discovery Fast Lane

Purpose: make newly published tenders visible quickly.

Allowed sources:

- PLACSP live `Bids` search result.
- PLACSP detail-page structured fields.
- Structured notice fields when already available without expensive document processing.

Allowed outputs:

- Tender card.
- Title, buyer, reference, procedure, CPVs, budget/value, deadline, submission mode, URL.
- Short factual object summary when structured data is explicit.

Not allowed:

- Source-backed required documents.
- Detailed scope rows that need document interpretation.
- Admission/award criteria unless recovered from source documents.
- Premium-ready status.

### Premium Evidence Lane

Purpose: complete Tender Detail and document viewer with slow-method quality.

Required sources:

- Recovered local tender documents.
- Page-level text per PDF/document.
- Exact document/page evidence for every document-derived field.

Required outputs:

- Commercial facts with provenance.
- Detailed Scope.
- Required Documents.
- Admission Criteria.
- Award Criteria.
- Tender Documents.
- Document viewer evidence rail with linked source chips.

Downgrade conditions:

- Missing documents.
- OCR candidate documents with insufficient text.
- Evidence rows without doc/page.
- Mixed admission/award labels.
- Raw source snippets posing as checklist rows.
- Viewer links that cannot resolve to local rendered pages.

## Conceptual Model

Every evidence item must belong to exactly one conceptual category:

- `Detailed Scope`: what the contract is about.
- `Required Documents`: what the bidder must submit or later accredit.
- `Admission Criteria`: eligibility/capacity/solvency/guarantees/declarations.
- `Award Criteria`: scoring, formulas, price, quality, value judgment, weights.

Forbidden mixed categories:

- `award/admission summary`
- `structured award/admission`
- any row where admission requirements and award scoring are merged.

## Quality Gates

Run these before promotion:

```bash
node tools/simplifae-ingestion/simplifae.js check
node tools/simplifae-ingestion/simplifae.js smoke --premium-root /path/to/premium
node tools/simplifae-ingestion/simplifae.js manifest --premium-root /path/to/premium
```

The validation loop must report:

- tender ID and reference
- failing section/component
- error details
- relevant input payload
- deterministic/intermittent classification
- OCR blocker status
- source/tooling environment when relevant

## Promotion Rule

Promotion into `discovery-v2` is a publishing step, not a processing shortcut.

Before promotion:

1. `quality_gate` passes.
2. `semantic_quality_audit` passes.
3. `golden_parity_benchmark` passes.
4. `packet_manifest` passes and resolves every premium source chip to a local recovered document/page.
5. OCR-blocked tenders are not marked premium-ready.

Promotion is gate-enforced by code. `promote_live_publicada_premium.js` must refuse to write prototype files unless it receives passing quality, semantic, parity and packet-manifest reports for the same `premium_root`.

Promotion may only publish packets with both:

- quality status `premium_ready`
- manifest flag `promotion_eligible`

All other packets remain Discovery-fast or review/OCR/confidence-only. Do not publish their Tender Detail premium overrides.

After promotion:

1. Render viewer pages.
2. Run UI/viewer validation.
3. Confirm source chips point to active tender documents.

## Mass Processing Rule

At scale, slow-method references will not exist for every tender. The reusable contract is therefore:

- `simplifae_field_contract.json`
- `simplifae_slow_method_inventory.json`
- `quality_gate.js`
- `semantic_quality_audit.js`
- `golden_parity_benchmark.js`
- regression tests in `tools/simplifae-ingestion/tests/`

The point of slow-method goldens is to teach the field contract. Once encoded, mass tenders are judged by the contract, not by manual screenshots.
