#!/usr/bin/env node
/* Simplifae ingestion command wrapper. Safe commands do not mutate discovery-v2. */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "../..");
const defaultSeedFile = "/tmp/simplifae-ingestion/live-publicada-50.json";

function usage() {
  console.log(`Simplifae ingestion commands

Usage:
  node tools/simplifae-ingestion/simplifae.js <command> [options]

Safe commands:
  check                     Run focused regression and syntax checks.
  smoke --premium-root DIR  Run quality gate + semantic audit + parity on an existing premium batch.
  full-50                   Run a fresh 50-tender premium validation batch without promotion/render/UI mutation.
  ocr-50                    Run a fresh 50-tender premium validation batch with local OCR enabled.
  manifest --premium-root DIR
                            Build/validate the canonical packet manifest for an existing premium batch.
  ocr-audit --premium-root DIR
                            Run quality gate and print OCR blockers/environment summary.

Useful options:
  --premium-root DIR        Existing premium packet root.
  --seed-file FILE          Seed file for full-50. Default: ${defaultSeedFile}
  --limit N                 Batch limit. Default: 50
  --workers N               Batch workers. Default: 6
  --timeout N               Per-tender timeout seconds. Default: 120
  --ocr-provider NAME       none or local. Default depends on command.
  --ocr-lang LANGS          OCR languages, e.g. spa+cat+eng.
  --ocr-timeout N           Per-document OCR timeout seconds. Default: 180
  --ocr-force               Force OCR even when a PDF has a text layer.
  --out-root DIR            Output root. Defaults to /tmp/simplifae-ingestion/<command>-<timestamp>

Promotion is intentionally not wrapped here because it mutates discovery-v2. Run promote_live_publicada_premium.js directly after smoke passes.`);
}

function argValue(args, name, fallback = null) {
  const index = args.indexOf(name);
  if (index === -1 || index + 1 >= args.length) return fallback;
  return args[index + 1];
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: options.capture ? "pipe" : "inherit",
    encoding: "utf8",
    env: { ...process.env, ...(options.env || {}) },
    maxBuffer: 1024 * 1024 * 50,
  });
  if (options.capture) return result;
  if (result.status !== 0) process.exit(result.status || 1);
  return result;
}

function hasPythonDeps(candidate) {
  if (!candidate) return false;
  const result = spawnSync(candidate, ["-c", "import fitz, requests"], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
  });
  return result.status === 0;
}

function pythonBin() {
  const candidates = [
    process.env.SIMPLIFAE_PYTHON,
    "/usr/local/bin/python3",
    "python3",
    "/usr/bin/python3",
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (hasPythonDeps(candidate)) return candidate;
  }
  return process.env.SIMPLIFAE_PYTHON || "python3";
}

function runSequence(steps) {
  for (const [command, args] of steps) run(command, args);
}

function findPremiumPackets(root) {
  const packets = [];
  function walk(dir, depth = 0) {
    if (!fs.existsSync(dir) || depth > 5) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isFile() && entry.name === "premium.json") packets.push(full);
      if (entry.isDirectory()) walk(full, depth + 1);
    }
  }
  walk(root);
  return packets;
}

function latestPremiumRoot() {
  if (process.env.SIMPLIFAE_PREMIUM_ROOT) return process.env.SIMPLIFAE_PREMIUM_ROOT;
  const roots = [];
  const base = "/tmp/simplifae-ingestion";
  function walk(dir, depth = 0) {
    if (!fs.existsSync(dir) || depth > 5) return;
    if (findPremiumPackets(dir).length) {
      roots.push({ dir, mtimeMs: fs.statSync(dir).mtimeMs });
      return;
    }
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(path.join(dir, entry.name), depth + 1);
    }
  }
  walk(base);
  roots.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return roots[0] && roots[0].dir;
}

function requirePremiumRoot(args) {
  const root = argValue(args, "--premium-root", latestPremiumRoot());
  if (!root) {
    console.error("Missing --premium-root and no SIMPLIFAE_PREMIUM_ROOT/latest /tmp premium batch was found.");
    process.exit(2);
  }
  if (!findPremiumPackets(root).length) {
    console.error(`No premium.json packets found under: ${root}`);
    process.exit(2);
  }
  return path.resolve(root);
}

function commandCheck() {
  const py = pythonBin();
  runSequence([
    [py, ["-m", "unittest", "tools/simplifae-ingestion/tests/test_semantic_regressions.py"]],
    [process.execPath, ["tools/simplifae-ingestion/tests/test_quality_gate_ocr_environment.js"]],
    [py, ["-m", "py_compile", "tools/simplifae-ingestion/placsp_pipeline.py"]],
    [py, ["-m", "py_compile", "tools/simplifae-ingestion/train_batch.py"]],
    [process.execPath, ["tools/simplifae-ingestion/tests/test_packet_manifest_and_promotion_gate.js"]],
    [process.execPath, ["--check", "tools/simplifae-ingestion/quality_gate.js"]],
    [process.execPath, ["--check", "tools/simplifae-ingestion/run_quality_loop.js"]],
    [process.execPath, ["--check", "tools/simplifae-ingestion/semantic_quality_audit.js"]],
    [process.execPath, ["--check", "tools/simplifae-ingestion/golden_parity_benchmark.js"]],
    [process.execPath, ["--check", "tools/simplifae-ingestion/packet_manifest.js"]],
    [process.execPath, ["--check", "tools/simplifae-ingestion/simplifae.js"]],
  ]);
}

function commandSmoke(args) {
  const premiumRoot = requirePremiumRoot(args);
  const outRoot = path.resolve(argValue(args, "--out-root", `/tmp/simplifae-ingestion/simplifae-smoke-${timestamp()}`));
  run(process.execPath, [
    "tools/simplifae-ingestion/run_quality_loop.js",
    "--skip-train",
    "--premium-root", premiumRoot,
    "--semantic-audit",
    "--parity-benchmark",
    "--skip-promote",
    "--skip-render",
    "--skip-ui-validation",
    "--out-root", outRoot,
  ]);
}

function commandFull50(args, defaults = {}) {
  const seedFile = argValue(args, "--seed-file", defaultSeedFile);
  const limit = argValue(args, "--limit", "50");
  const workers = argValue(args, "--workers", "6");
  const timeout = argValue(args, "--timeout", "120");
  const ocrProvider = argValue(args, "--ocr-provider", defaults.ocrProvider || "none");
  const ocrLang = argValue(args, "--ocr-lang", "spa+cat+eng");
  const ocrTimeout = argValue(args, "--ocr-timeout", "180");
  const outRoot = path.resolve(argValue(args, "--out-root", `/tmp/simplifae-ingestion/${defaults.name || "simplifae-full-50"}-${timestamp()}`));
  const commandArgs = [
    "tools/simplifae-ingestion/run_quality_loop.js",
    "--seed-file", seedFile,
    "--limit", limit,
    "--workers", workers,
    "--timeout", timeout,
    "--semantic-audit",
    "--parity-benchmark",
    "--skip-promote",
    "--skip-render",
    "--skip-ui-validation",
    "--out-root", outRoot,
  ];
  if (ocrProvider !== "none") {
    commandArgs.push("--ocr-provider", ocrProvider, "--ocr-lang", ocrLang, "--ocr-timeout", ocrTimeout);
    if (args.includes("--ocr-force")) commandArgs.push("--ocr-force");
  }
  commandArgs.push("--python", pythonBin());
  run(process.execPath, commandArgs);
}

function commandOcrAudit(args) {
  const premiumRoot = requirePremiumRoot(args);
  const outFile = path.resolve(argValue(args, "--out", `/tmp/simplifae-ingestion/simplifae-ocr-audit-${timestamp()}.json`));
  const result = run(process.execPath, [
    "tools/simplifae-ingestion/quality_gate.js",
    "--premium-root", premiumRoot,
    "--out", outFile,
  ], { capture: true });
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  if (result.status !== 0) process.exit(result.status || 1);

  const report = JSON.parse(fs.readFileSync(outFile, "utf8"));
  const hard = (report.ocr_blockers || []).filter((item) => item.hard_ocr_blockers > 0);
  const partial = (report.ocr_blockers || []).filter((item) => item.partial_text_review > 0);
  console.log(JSON.stringify({
    out: outFile,
    local_ocr_available: report.ocr_environment && report.ocr_environment.local_ocr_available,
    missing_tools: report.ocr_environment && report.ocr_environment.missing || [],
    ocr_blocked: report.summary && report.summary.ocr_blocked,
    hard_ocr_blocked: hard.length,
    partial_ocr_review: partial.length,
    hard_references: hard.map((item) => item.reference),
  }, null, 2));
}

function commandManifest(args) {
  const premiumRoot = requirePremiumRoot(args);
  const defaultQualityReport = path.join(path.dirname(premiumRoot), "quality-gate.json");
  const qualityReport = argValue(args, "--quality-report", defaultQualityReport);
  const outFile = path.resolve(argValue(args, "--out", path.join(path.dirname(premiumRoot), "packet-manifest.json")));
  const manifestArgs = [
    "tools/simplifae-ingestion/packet_manifest.js",
    "--premium-root", premiumRoot,
    "--out", outFile,
  ];
  if (qualityReport && fs.existsSync(qualityReport)) {
    manifestArgs.push("--quality-report", qualityReport);
  }
  run(process.execPath, manifestArgs);
}

function main() {
  const [, , command, ...args] = process.argv;
  if (!command || command === "-h" || command === "--help" || command === "help") {
    usage();
    return;
  }
  if (command === "check") return commandCheck(args);
  if (command === "smoke") return commandSmoke(args);
  if (command === "full-50") return commandFull50(args);
  if (command === "ocr-50") return commandFull50(args, { name: "simplifae-ocr-50", ocrProvider: "local" });
  if (command === "manifest") return commandManifest(args);
  if (command === "ocr-audit") return commandOcrAudit(args);
  console.error(`Unknown command: ${command}`);
  usage();
  process.exit(2);
}

main();
