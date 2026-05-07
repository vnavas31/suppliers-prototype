# Hook Policy

This repo does not install automatic hooks by default, because some Simplifae commands are intentionally heavy or mutate the prototype.

Safe hook candidates:

- On changes to ingestion scripts: `node tools/simplifae-ingestion/simplifae.js check`
- On changes to quality/semantic/parity validators: `node tools/simplifae-ingestion/simplifae.js check`

Manual gate candidates:

- Before promotion: `node tools/simplifae-ingestion/simplifae.js smoke --premium-root /path/to/premium`
- Before publishing prototype changes: render evidence pages and run `validate_tender_processing.js`.

Never auto-run:

- `promote_live_publicada_premium.js`
- render commands that overwrite viewer page assets
- any command that mutates `discovery-v2` without an explicit human/agent decision
