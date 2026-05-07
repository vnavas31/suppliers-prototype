# simplifae-full-50

Run a fresh 50-tender premium validation batch from the live-publicada seed file.

```bash
node tools/simplifae-ingestion/simplifae.js full-50 \
  --seed-file /tmp/simplifae-ingestion/live-publicada-50.json \
  --limit 50 \
  --workers 6
```

This runs premium extraction, quality gate, semantic audit, and parity benchmark. It skips promotion, rendering, and UI mutation by default.
