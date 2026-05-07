# simplifae-smoke

Run quality gate, semantic audit, parity benchmark, and canonical packet manifest validation on an existing premium batch.

```bash
node tools/simplifae-ingestion/simplifae.js smoke --premium-root /path/to/premium
```

If `--premium-root` is omitted, the command tries `SIMPLIFAE_PREMIUM_ROOT` and then the latest `/tmp/simplifae-ingestion` premium batch.

This command does not mutate the prototype.
