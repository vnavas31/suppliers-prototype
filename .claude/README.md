# Simplifae Claude Setup

This folder documents the agent-facing workflow for Simplifae tender ingestion.

The repo source of truth remains:

- `AGENTS.md`
- `tools/simplifae-ingestion/SIMPLIFAE_METHOD.md`
- `tools/simplifae-ingestion/PLACSP_SOURCE_MAP.md`
- `tools/simplifae-ingestion/OCR_POLICY.md`
- `tools/simplifae-ingestion/VIEWER_NAVIGATION_CONTRACT.md`

Use commands in `.claude/commands/` as stable shortcuts. They point to deterministic scripts, not prompt-only behavior.

Recommended hook/CI policy:

- Changes to `placsp_pipeline.py`: run `node tools/simplifae-ingestion/simplifae.js check`.
- Changes to `quality_gate.js`: run `node tools/simplifae-ingestion/simplifae.js check`.
- Changes to `semantic_quality_audit.js`, `golden_parity_benchmark.js`, or `packet_manifest.js`: run `node tools/simplifae-ingestion/simplifae.js check` and `smoke`.
- Changes to OCR provider behavior: run `node tools/simplifae-ingestion/simplifae.js check` and `node tools/simplifae-ingestion/simplifae.js ocr-50`.
- Changes to `promote_live_publicada_premium.js`, `render_live_publicada_evidence_pages.mjs`, `discovery-v2/index.html`, or `discovery-v2/document-viewer.html`: run packet smoke first, then render/UI validation before publishing.

Do not wire prototype-mutating commands as automatic hooks. Promotion must stay intentional.

Promotion is not allowed unless quality, semantic, parity and packet-manifest reports all pass for the same premium root. Non-`premium_ready` packets must be skipped, not promoted as source-backed Tender Detail content.
