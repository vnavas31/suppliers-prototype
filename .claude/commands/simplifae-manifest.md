# simplifae-manifest

Build and validate the canonical packet manifest for an existing premium batch.

```bash
node tools/simplifae-ingestion/simplifae.js manifest --premium-root /path/to/premium
```

If a sibling `quality-gate.json` exists, the command uses it to mark `promotion_eligible` packets. This command does not mutate the prototype.
