# Simplifae Prototype Handoff For Codex Cloud

Last updated: 2026-05-04

This file is the operating brief for continuing the Simplifae suppliers prototype in Codex Cloud. Read it before making changes.

## Repository

- Local repo: `/Users/victornavas/Documents/Claude/Projects/SUPPLIERS Prototype/github-pages-ready/simplifae-prototypes`
- Branch: `gh-pages`
- Remote: `https://github.com/vnavas31/suppliers-prototype.git`
- Public app, once pushed to GitHub Pages: `https://vnavas31.github.io/suppliers-prototype/discovery-v2/`
- Main prototype file: `discovery-v2/index.html`
- Document viewer file: `discovery-v2/document-viewer.html`
- Tender PDFs: `discovery-v2/docs/`
- Rendered document pages: `discovery-v2/doc-pages/`

## Protected Backups

Never overwrite this protected backup:

- `/Users/victornavas/Documents/Claude/Projects/SUPPLIERS Prototype/github-pages-ready/simplifae-prototypes/discovery-v2/index.backup-20260422-153433.html`

Current handoff backups created before this handoff:

- `discovery-v2/index.backup-20260504-095921-before-cloud-handoff.html`
- `discovery-v2/document-viewer.backup-20260504-095921-before-cloud-handoff.html`

Do not commit timestamped local backups unless Victor explicitly asks.

## Current Product State

The prototype has two main surfaces:

- Discovery: search, presets, minimum-match bar, tender list, fit/risk signals, Go/Validate actions.
- Tender Detail: decision layer, evidence layer, Proto toggle, source-backed document viewer.

The evidence layer uses one shared expand/collapse family:

- Review detailed scope
- Required documents
- Tender Documents
- Contracting Authority
- Competitor Analysis
- Partner Match

The internal evidence bodies should remain scalable and calm. Do not create bespoke components per section unless there is genuinely new functionality.

## Current Processed Tenders

### B41632266-2026/000071-PaA

Huesna water and sanitation infrastructure works.

Source-backed items already processed:

- Detailed scope bullets.
- Required documents with envelopes.
- Tender documents and rendered document pages.
- Viewer evidence rail with grouped references.

### EC-1750/2026

Paiporta DANA works tender.

Important correction already made:

- EC-1750 `Required documents` must not reuse Huesna rows.
- EC-1750 owns its own envelopes, requirements, source chips, tender documents, and viewer mapping.
- If a future agent sees EC-1750 and Huesna legal/evidence rows looking identical, treat that as a bug and re-check the extraction.

EC-1750 document files currently present:

- `discovery-v2/docs/ec1750-pcap-administrative-clauses.pdf`
- `discovery-v2/docs/ec1750-technical-specifications.pdf`
- `discovery-v2/docs/ec1750-justification-report.pdf`
- `discovery-v2/docs/ec1750-lot1-industrial-technical-offer.pdf`
- `discovery-v2/docs/ec1750-lot2-urban-core-technical-offer.pdf`
- `discovery-v2/docs/ec1750-lot3-residential-technical-offer.pdf`

EC-1750 rendered pages currently present:

- `discovery-v2/doc-pages/ec1750-pcap/`
- `discovery-v2/doc-pages/ec1750-ppt/`
- `discovery-v2/doc-pages/ec1750-mj/`
- `discovery-v2/doc-pages/ec1750-lot1/`
- `discovery-v2/doc-pages/ec1750-lot2/`
- `discovery-v2/doc-pages/ec1750-lot3/`

## Critical Product Rules

- Visible prototype copy is English.
- Preserve official identifiers exactly: tender references, buyer names, CPVs, NIFs, URLs.
- Do not mention upstream competitor/source systems by name in the UI.
- Never present mock data as verified evidence.
- Never reuse another tender's evidence rows, requirement rows, source chips, or viewer map.
- Reusable components are correct. Reused evidence content is a bug.
- Create a fresh backup before prototype edits.
- Do not use destructive git commands.
- Do not overwrite user changes or unrelated dirty files.

## Tender Summary Rule

The summary below the Tender Detail title has one job only: explain what the tender is about.

- Maximum two visual lines.
- If an expanded source description exists and fits, use it.
- If it is too long, summarize it to two lines.
- If no expanded description exists, read the tender documents and write a factual source-backed summary.
- Do not mention company fit, match percentage, risk, scoring logic, import/source systems, or internal processing status.

Good style:

`Renewal of the high-pressure bulk water supply pipeline in the northern Huesna system, including replacement works, crossings and execution milestones.`

Bad style:

`Imported opportunity assessed against Ferrovial capabilities.`

## Provenance And Proto Toggle

Every Tender Detail field should be classified internally as:

- `structured`: present in source/scraper structured data.
- `document`: extracted from documents with exact document-page evidence.
- `mock`: simulated for prototype continuity.
- `unavailable`: cannot be completed until tender documents are provided.

Proto toggle behavior:

- Proto on: mock values are highlighted in red.
- Proto off: mock values that require documents become `Docs required`.
- The `Risk` line is special: it may be red in Proto mode, but it remains visible when Proto is off.
- Competitor Analysis and Partner Match are historical-data sections. Leave them as prototype intelligence until a real historical contracts dataset exists.

Apply provenance rules to:

- Tender Detail header facts.
- Review detailed scope.
- Required documents.
- Tender Documents.
- Contracting Authority.

## Commercial Header Facts

The four commercial bullets in Tender Detail must be completed in this priority order:

1. Use structured scraper/source data if explicit.
2. If missing, read tender documents and extract exact evidence.
3. If unavailable because documents are missing, show `Docs required` when Proto is off.

The four facts are:

- Estimated contract value.
- Contract term.
- Provisional guarantee.
- Definitive guarantee.

Important:

- Do not use warranty period as contract term.
- If a guarantee is a percentage of base price and base price is known, calculate it only when legally supported and keep internal evidence.
- If definitive guarantee is a percentage of future award amount, show formula or source-backed wording rather than inventing a pre-award amount.

## Required Documents Rules

Required documents is both bid-submission readiness and award criteria.

Use only these visible Type labels:

- `Admission`: everything required to participate or prove eligibility/capacity.
- `Award criteria`: everything used to score/evaluate the offer.

Do not expose visible labels such as `Solvency`, `Formula price`, `Value judgment`, or `Solvency means` unless the product taxonomy changes.

Columns:

- Required doc
- Type
- Weight
- Source

Do not include a Status column unless Victor explicitly asks for it.

Envelope rules:

- If envelopes/sobres exist, group rows by envelope.
- Active envelopes contain concrete rows.
- Inactive/not-applicable envelopes may appear as a short note only when this prevents confusion.
- Indent child document rows under the envelope.
- Source chips must be exact: document label + page(s).

## Document Viewer Rules

The document viewer is per tender.

- Tender Detail source chips open the viewer in a named tender-specific browser tab/window.
- If the viewer is already open for that tender, reuse/focus it and send the new document/page.
- If the target reference is in the same document, scroll to the page without reloading.
- If the target reference is in a different document, switch/reload the document and navigate to the page.
- Viewer evidence rail should group repeated references by evidence item.
- Do not repeat the same criterion once per source.
- Detailed scope evidence appears first in the rail, separated from criteria evidence.
- The viewer header must remain compact, sober, and one-row responsive.

## Source Links

Every source chip in Tender Detail should navigate to the document viewer when the referenced document is loaded in the prototype.

Examples:

- `PCAP · p. 8`
- `PCAP · pp. 38-39`
- `MJ · pp. 6-7`

When files are not loaded yet, keep the exact source label but do not invent a working link.

## Skills To Mirror

The local Codex skills contain the most up-to-date procedural rules:

- `/Users/victornavas/.codex/skills/simplifae-tender-doc-processing/SKILL.md`
- `/Users/victornavas/.codex/skills/simplifae-tender-ingestion/SKILL.md`
- `/Users/victornavas/.codex/skills/simplifae-ux-refinement/SKILL.md`

Codex Cloud may not have those local skills. This handoff embeds their critical rules so the work can continue.

## Verification Checklist

Before showing a UI iteration to Victor:

- `discovery-v2/index.html` JavaScript parses.
- `discovery-v2/document-viewer.html` JavaScript parses.
- Discovery opens Tender Detail from a tender card.
- Tender Detail source chips open/reuse the tender viewer.
- Viewer source navigation works for same-document scroll and cross-document switch.
- EC-1750 required documents are not identical to Huesna required documents.
- No horizontal overflow on desktop/mobile.
- The UI remains calm, premium, and component-scalable.

## Git / Commit Notes

Current known dirty state before handoff:

- `discovery-v1/index.html` is modified but unrelated to this handoff. Do not stage or commit it unless Victor explicitly approves.
- `discovery-v2/index.html` and `discovery-v2/document-viewer.html` contain active prototype work.
- EC-1750 PDF/doc-page assets are untracked and should be committed only if the goal is to publish the current EC-1750 prototype state.
- Timestamped backup files should stay local unless explicitly requested.

## Suggested First Codex Cloud Prompt

Use this as the first message to Codex Cloud:

```text
You are taking over the Simplifae suppliers prototype. First read CODEX_HANDOFF_SIMPLIFAE.md in the repository root. Preserve all rules in that handoff. Do not overwrite protected backups, do not mention upstream competitor/source systems in the UI, and do not reuse evidence content between tenders.

First task:
1. Verify the current Discovery, Tender Detail, and document-viewer flows.
2. Confirm EC-1750/2026 does not reuse Huesna required-document evidence.
3. Confirm Tender Documents View buttons open the correct viewer document.
4. If anything is broken, fix it with a backup first and report exactly what changed.
```

## Near-Term Cloud Tasks

1. Freeze a stable GitHub state for the current prototype.
2. Continue processing new tender PDFs using the document-processing workflow.
3. Move repeated inline data/functions toward a maintainable data layer when the prototype stabilizes.
4. Keep UX refinements iterative and visual-review driven.

