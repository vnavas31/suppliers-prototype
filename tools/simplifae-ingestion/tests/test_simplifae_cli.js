#!/usr/bin/env node
const assert = require("assert");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "../../..");

const help = spawnSync(process.execPath, [
  "tools/simplifae-ingestion/simplifae.js",
  "--help",
], {
  cwd: repoRoot,
  encoding: "utf8",
});

assert.strictEqual(help.status, 0, help.stderr || help.stdout);
assert.match(help.stdout, /Simplifae ingestion commands/);
assert.match(help.stdout, /smoke --premium-root DIR/);
assert.match(help.stdout, /full-50/);
assert.match(help.stdout, /ocr-audit/);

const unknown = spawnSync(process.execPath, [
  "tools/simplifae-ingestion/simplifae.js",
  "definitely-not-a-command",
], {
  cwd: repoRoot,
  encoding: "utf8",
});

assert.strictEqual(unknown.status, 2);
assert.match(unknown.stderr, /Unknown command/);

console.log("simplifae CLI regression test passed");
