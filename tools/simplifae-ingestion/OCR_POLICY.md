# OCR Policy

OCR is a production enrichment lane, not a reason to invent premium evidence.

## Statuses

`partial_text_review`

- Some text was extracted.
- The document may still need OCR or legal review before premium certainty.
- It can support conservative evidence only when exact document/page text is sufficient.

`hard_ocr_blocker`

- Zero useful text was extracted.
- The tender must not become premium-ready based on that document.
- The quality gate must report tender reference, document title, pages, path, and missing OCR tooling.

## Current Environment Contract

The quality gate reports `ocr_environment`:

- `local_ocr_available`
- PDF-rewrite OCR tools: `tesseract`, `ocrmypdf`
- sidecar OCR tools: `tesseract`, `pdftoppm`
- useful PDF tools: `pdftoppm`, `pdftotext`, `gs`, `magick`, `convert`
- available/missing tools

`local_ocr_available` is true when either the PDF-rewrite lane or the sidecar lane is available. If it is false, hard OCR blockers are expected and must be visible as review debt.

## Local Provider

The premium pipeline supports an explicit local OCR provider:

```bash
python3 tools/simplifae-ingestion/placsp_pipeline.py <PLACSP_URL> \
  --mode premium \
  --ocr-provider local \
  --ocr-lang spa+cat+eng \
  --ocr-timeout 240
```

The batch wrapper exposes the same lane:

```bash
node tools/simplifae-ingestion/simplifae.js ocr-50
```

OCR is not the default fast/premium path. It is opt-in because it is slower and should run as an enrichment lane for tenders that are otherwise blocked.

When local OCR is enabled:

- The pipeline first extracts text normally.
- Only documents still classified as `ocr_candidate` are sent through OCR.
- OCR output is stored under the packet `ocr/` directory.
- Digitally signed or rewrite-blocked PDFs must use `local_sidecar` OCR: render page images, extract text into `.sidecar.txt`, keep the original PDF path/hash unchanged for the viewer, and preserve page numbers.
- The packet records `ocr_applied`, `ocr_provider`, `ocr_status`, `ocr_original_path`, `ocr_sidecar_path`, `ocr_sidecar_pages`, `ocr_sidecar_text_chars`, `ocr_error`, and `ocr_elapsed_seconds` per document.
- Quality and manifest reports keep OCR failures visible instead of silently dropping them.

## Promotion Rules

Never promote OCR-blocked document-derived facts as premium.

Allowed:

- Discovery card from structured source.
- `Docs required`, `Needs OCR`, or review status.
- Conservative source-backed scope anchor from sparse text when page evidence exists.

Not allowed:

- Required Documents from OCR-no-text PDFs.
- Admission/Award criteria with no exact doc/page text.
- Premium-ready status when critical evidence depends on OCR.

## Future OCR Lane

Recommended production design:

1. Fast Discovery immediately.
2. Premium extraction for text-readable documents.
3. OCR queue for hard blockers and critical low-text documents.
4. Re-run premium extraction only for affected tenders.
5. Re-run quality gate and semantic audit.
6. Promote only if evidence contract passes.

OCR can be local or cloud:

- Local: `ocrmypdf` + `tesseract` + `poppler` + `ghostscript`.
- Cloud: Document AI, Textract, Azure Document Intelligence, or equivalent.

OCR output must preserve page numbers.

## GitHub / Public Tooling

The repository includes `.github/workflows/simplifae-ingestion.yml` to prove the OCR stack can be installed outside the local machine. It installs:

- `ocrmypdf`
- `tesseract-ocr`
- `tesseract-ocr-spa`
- `tesseract-ocr-cat`
- `poppler-utils`
- `ghostscript`
- `imagemagick`

For the industrialized public product, the same provider boundary should be kept:

- `local` provider for development, CI, and self-hosted workers.
- cloud/provider-backed OCR for scalable production queues.
- same packet contract and quality gates after OCR, regardless of provider.
