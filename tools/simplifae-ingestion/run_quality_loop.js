#!/usr/bin/env node
/* Orchestrate Simplifae tender training, quality gating, promotion and UI validation. */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1 || index + 1 >= process.argv.length) return fallback;
  return process.argv[index + 1];
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(value, null, 2), "utf8");
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function runStep(name, command, args, options = {}) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: { ...process.env, ...(options.env || {}) },
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 30,
  });
  return {
    name,
    command: [command, ...args].join(" "),
    status: result.status,
    signal: result.signal,
    elapsed_seconds: Number(((Date.now() - started) / 1000).toFixed(3)),
    stdout_tail: String(result.stdout || "").slice(-4000),
    stderr_tail: String(result.stderr || "").slice(-4000),
    ok: result.status === 0,
  };
}

function hasPythonDeps(candidate, repoRoot) {
  if (!candidate) return false;
  const result = spawnSync(candidate, ["-c", "import fitz, requests"], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
  });
  return result.status === 0;
}

function detectPythonBin(repoRoot) {
  const candidates = [
    process.env.SIMPLIFAE_PYTHON,
    "/usr/local/bin/python3",
    "python3",
    "/usr/bin/python3",
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (hasPythonDeps(candidate, repoRoot)) return candidate;
  }
  return process.env.SIMPLIFAE_PYTHON || "python3";
}

function main() {
  const repoRoot = path.resolve(argValue("--root", process.cwd()));
  const outRoot = path.resolve(argValue("--out-root", "/tmp/simplifae-ingestion/quality-loop"));
  const limit = Number(argValue("--limit", "50"));
  const workers = Number(argValue("--workers", "6"));
  const timeout = Number(argValue("--timeout", "120"));
  const maxIterations = Number(argValue("--max-iterations", "1"));
  const seedFile = argValue("--seed-file", "/tmp/simplifae-ingestion/live-publicada-50.json");
  const providedPremiumRoot = argValue("--premium-root", null);
  const skipTrain = hasFlag("--skip-train");
  const skipPromote = hasFlag("--skip-promote");
  const skipRender = hasFlag("--skip-render");
  const skipUiValidation = hasFlag("--skip-ui-validation");
  const runParityBenchmark = hasFlag("--parity-benchmark") || !skipPromote;
  const runSemanticAudit = hasFlag("--semantic-audit") || !skipPromote;
  const uiUrl = argValue("--url", null);
  const minPremiumReady = argValue("--min-premium-ready", "0");
  const ocrProvider = argValue("--ocr-provider", "none");
  const ocrLang = argValue("--ocr-lang", "spa+cat+eng");
  const ocrTimeout = argValue("--ocr-timeout", "180");
  const ocrForce = hasFlag("--ocr-force");
  const pythonBin = argValue("--python", detectPythonBin(repoRoot));
  const nodeBin = process.execPath;

  ensureDir(outRoot);
  const report = {
    schema: "simplifae.quality.loop.v1",
    started_at: new Date().toISOString(),
    repo_root: repoRoot,
    out_root: outRoot,
    config: {
      limit,
      workers,
      timeout,
      max_iterations: maxIterations,
      seed_file: seedFile,
      provided_premium_root: providedPremiumRoot,
      skip_train: skipTrain,
      skip_promote: skipPromote,
      skip_render: skipRender,
      skip_ui_validation: skipUiValidation,
      parity_benchmark: runParityBenchmark,
      semantic_audit: runSemanticAudit,
      min_premium_ready: Number(minPremiumReady),
      ocr_provider: ocrProvider,
      ocr_lang: ocrLang,
      ocr_timeout: Number(ocrTimeout),
      ocr_force: ocrForce,
    },
    iterations: [],
    final_status: "running",
  };

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const iterationDir = path.join(outRoot, `${String(iteration).padStart(2, "0")}-${timestamp()}`);
    ensureDir(iterationDir);
    let premiumRoot = providedPremiumRoot ? path.resolve(providedPremiumRoot) : path.join(iterationDir, "premium");
    const iterationReport = {
      iteration,
      dir: iterationDir,
      premium_root: premiumRoot,
      steps: [],
      quality_gate_report: path.join(iterationDir, "quality-gate.json"),
      semantic_audit_report: path.join(iterationDir, "semantic-audit.json"),
      parity_benchmark_report: path.join(iterationDir, "golden-parity.json"),
      packet_manifest_report: path.join(iterationDir, "packet-manifest.json"),
      ui_validation_report: path.join(iterationDir, "ui-validation.json"),
      ok: false,
    };

    if (!skipTrain) {
      const trainArgs = [
        "tools/simplifae-ingestion/train_batch.py",
        "--limit", String(limit),
        "--out", premiumRoot,
        "--timeout", String(timeout),
        "--workers", String(workers),
        "--pipeline-mode", "premium",
      ];
      if (seedFile) trainArgs.push("--seed-file", seedFile, "--no-atom");
      if (ocrProvider !== "none") {
        trainArgs.push("--ocr-provider", ocrProvider, "--ocr-lang", ocrLang, "--ocr-timeout", ocrTimeout);
        if (ocrForce) trainArgs.push("--ocr-force");
      }
      const trainStep = runStep("train_premium_batch", pythonBin, trainArgs, { cwd: repoRoot });
      iterationReport.steps.push(trainStep);
      if (!trainStep.ok) {
        report.iterations.push(iterationReport);
        report.final_status = "blocked_train_failed";
        report.finished_at = new Date().toISOString();
        writeJson(path.join(outRoot, "quality-loop-report.json"), report);
        console.log(JSON.stringify({ out: path.join(outRoot, "quality-loop-report.json"), final_status: report.final_status }, null, 2));
        return 1;
      }
    } else if (!providedPremiumRoot) {
      iterationReport.steps.push({
        name: "train_premium_batch",
        ok: false,
        status: 2,
        elapsed_seconds: 0,
        command: "--skip-train without --premium-root",
        stdout_tail: "",
        stderr_tail: "Provide --premium-root when using --skip-train.",
      });
      report.iterations.push(iterationReport);
      report.final_status = "blocked_missing_premium_root";
      report.finished_at = new Date().toISOString();
      writeJson(path.join(outRoot, "quality-loop-report.json"), report);
      return 2;
    }

    const qualityArgs = [
      "tools/simplifae-ingestion/quality_gate.js",
      "--premium-root", premiumRoot,
      "--out", iterationReport.quality_gate_report,
      "--min-premium-ready", minPremiumReady,
    ];
    const qualityStep = runStep("quality_gate", nodeBin, qualityArgs, { cwd: repoRoot });
    iterationReport.steps.push(qualityStep);
    if (!qualityStep.ok) {
      report.iterations.push(iterationReport);
      report.final_status = "blocked_quality_gate_failed";
      report.finished_at = new Date().toISOString();
      writeJson(path.join(outRoot, "quality-loop-report.json"), report);
      console.log(JSON.stringify({ out: path.join(outRoot, "quality-loop-report.json"), final_status: report.final_status, quality_gate_report: iterationReport.quality_gate_report }, null, 2));
      return 1;
    }

    if (runSemanticAudit) {
      const semanticStep = runStep("semantic_quality_audit", nodeBin, [
        "tools/simplifae-ingestion/semantic_quality_audit.js",
        "--premium-root", premiumRoot,
        "--out", iterationReport.semantic_audit_report,
      ], { cwd: repoRoot });
      iterationReport.steps.push(semanticStep);
      if (!semanticStep.ok) {
        report.iterations.push(iterationReport);
        report.final_status = "blocked_semantic_audit_failed";
        report.finished_at = new Date().toISOString();
        writeJson(path.join(outRoot, "quality-loop-report.json"), report);
        return 1;
      }
    }

    if (runParityBenchmark) {
      const parityStep = runStep("golden_parity_benchmark", nodeBin, [
        "tools/simplifae-ingestion/golden_parity_benchmark.js",
        "--premium-root", premiumRoot,
        "--out", iterationReport.parity_benchmark_report,
      ], { cwd: repoRoot });
      iterationReport.steps.push(parityStep);
      if (!parityStep.ok) {
        report.iterations.push(iterationReport);
        report.final_status = "blocked_parity_benchmark_failed";
        report.finished_at = new Date().toISOString();
        writeJson(path.join(outRoot, "quality-loop-report.json"), report);
        return 1;
      }
    }

    const packetManifestStep = runStep("packet_manifest", nodeBin, [
      "tools/simplifae-ingestion/packet_manifest.js",
      "--premium-root", premiumRoot,
      "--quality-report", iterationReport.quality_gate_report,
      "--out", iterationReport.packet_manifest_report,
    ], { cwd: repoRoot });
    iterationReport.steps.push(packetManifestStep);
    if (!packetManifestStep.ok) {
      report.iterations.push(iterationReport);
      report.final_status = "blocked_packet_manifest_failed";
      report.finished_at = new Date().toISOString();
      writeJson(path.join(outRoot, "quality-loop-report.json"), report);
      return 1;
    }

    if (!skipPromote) {
      const promoteStep = runStep("promote_to_prototype", nodeBin, [
        "tools/simplifae-ingestion/promote_live_publicada_premium.js",
        "--premium-root", premiumRoot,
        "--quality-report", iterationReport.quality_gate_report,
        "--semantic-report", iterationReport.semantic_audit_report,
        "--parity-report", iterationReport.parity_benchmark_report,
        "--packet-manifest", iterationReport.packet_manifest_report,
      ], { cwd: repoRoot });
      iterationReport.steps.push(promoteStep);
      if (!promoteStep.ok) {
        report.iterations.push(iterationReport);
        report.final_status = "blocked_promote_failed";
        report.finished_at = new Date().toISOString();
        writeJson(path.join(outRoot, "quality-loop-report.json"), report);
        return 1;
      }
    }

    if (!skipRender) {
      const renderStep = runStep("render_viewer_pages", nodeBin, [
        "tools/simplifae-ingestion/render_live_publicada_evidence_pages.mjs",
        "--scale", "1.35",
        "--all-pages",
      ], { cwd: repoRoot });
      iterationReport.steps.push(renderStep);
      if (!renderStep.ok) {
        report.iterations.push(iterationReport);
        report.final_status = "blocked_render_failed";
        report.finished_at = new Date().toISOString();
        writeJson(path.join(outRoot, "quality-loop-report.json"), report);
        return 1;
      }
    }

    if (!skipUiValidation) {
      const validationArgs = [
        "tools/simplifae-ingestion/validate_tender_processing.js",
        "--limit", String(limit),
        "--runs", "2",
        "--include-imported",
        "--out", iterationReport.ui_validation_report,
      ];
      if (uiUrl) validationArgs.push("--url", uiUrl);
      const validationStep = runStep("ui_validation", nodeBin, validationArgs, { cwd: repoRoot });
      iterationReport.steps.push(validationStep);
      if (!validationStep.ok) {
        report.iterations.push(iterationReport);
        report.final_status = "blocked_ui_validation_failed";
        report.finished_at = new Date().toISOString();
        writeJson(path.join(outRoot, "quality-loop-report.json"), report);
        return 1;
      }
    }

    iterationReport.ok = true;
    report.iterations.push(iterationReport);
    report.final_status = "passed";
    break;
  }

  report.finished_at = new Date().toISOString();
  const reportPath = path.join(outRoot, "quality-loop-report.json");
  writeJson(reportPath, report);
  console.log(JSON.stringify({ out: reportPath, final_status: report.final_status }, null, 2));
  return report.final_status === "passed" ? 0 : 1;
}

process.exitCode = main();
