# simplifae-ocr-50

Run a representative 50-tender premium validation batch with local OCR enabled.

```bash
node tools/simplifae-ingestion/simplifae.js ocr-50 \
  --workers 6 \
  --timeout 420 \
  --ocr-timeout 240
```

Use this when OCR blockers need to be resolved or measured. This command does not mutate the prototype.
