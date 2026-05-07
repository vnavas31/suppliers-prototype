# PLACSP Source Map

This file defines which PLACSP sources are used for each Simplifae field and how they should be prioritized.

## Source Priority

1. Live `Bids` search
   - Used for near-real-time discovery.
   - Provides fresh deeplinks and references.
   - Must be filtered to `State = Publicada`.

2. PLACSP detail page
   - Used for structured facts and official links.
   - Preferred for Discovery-fast fields.
   - Must not be treated as premium evidence for document-derived sections.

3. Structured notice / announcement PDF
   - Usually the fastest document-backed source.
   - Preferred for official timeline, budget/value, CPV, duration, place, guarantees when explicit.

4. PCAP / administrative clauses
   - Primary source for admission requirements, guarantees, envelopes, legal criteria, award criteria, submission structure.

5. PPT / technical specifications
   - Primary source for technical scope, service/work/supply detail, technical obligations, execution context.

6. Memoria / justification reports
   - Primary source for need, rationale, budget justification, lot rationale, estimated value context.

7. Annexes, XLS/XLSX, ZIP contents
   - Source for templates, inventories, price sheets, staff subrogation, technical forms, plans.
   - Should be classified by document role and content before being used as evidence.

8. Atom feed
   - Useful for reconciliation/backfill.
   - Not sufficient for near-real-time Discovery because publication freshness can lag.

9. Historical awards/adjudications
   - Required for competitor analysis, partner match, and success-rate intelligence.
   - Must be a separate dataset; do not fake historical intelligence from active tender documents.

## Field Source Rules

Discovery card:

- Use live search and detail structured data first.
- Use structured notice only if already downloaded cheaply.
- Do not wait for full PCAP/PPT parsing.

Tender Detail summary:

- Use structured title/description if factual and concise.
- Otherwise use document-backed scope evidence.
- Never include match/risk/internal processing status.

Commercial header:

- Use structured data when explicit.
- Validate/enrich with structured notice, PCAP, PPT, or MJ.
- Guarantee formulas must not become invented fixed amounts.

Detailed Scope:

- Prefer MJ/PPT/PCAP scope pages.
- If only sparse OCR text exists, use a conservative source-backed scope anchor and downgrade confidence.
- Do not infer lot structure unless source language is explicit.

Required Documents:

- Use PCAP/annexes.
- Build envelope-aware checklist.
- Do not use contract-object paragraphs as required docs.

Admission Criteria:

- Use PCAP and notice eligibility sections.
- Include capacity, DEUC/ESPD, solvency, guarantees, UTE, insurance, declarations, classification.

Award Criteria:

- Use PCAP and criteria tables.
- Include price/formula/value judgment/quality/timing/scoring weights.
- Never merge with admission logic.

Viewer Documents:

- Use local recovered PDFs only.
- Source chips must point to active tender document keys and rendered pages.

## Conflict Policy

If sources disagree:

- Prefer the most official/current explicit source.
- Preserve exact doc/page evidence.
- Mark residual uncertainty internally.
- If user action is affected, downgrade to legal review instead of merging silently.
