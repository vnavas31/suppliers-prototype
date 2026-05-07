#!/usr/bin/env node
/* Regression tests for canonical packet manifests and guarded prototype promotion. */

const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const vm = require("vm");

const repoRoot = path.resolve(__dirname, "../../..");
const nodeBin = process.execPath;

function run(args, options = {}) {
  return spawnSync(nodeBin, args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20,
    ...options,
  });
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2), "utf8");
}

function sha1File(file) {
  const hash = crypto.createHash("sha1");
  hash.update(fs.readFileSync(file));
  return hash.digest("hex");
}

function packet(reference, itemId, docPath, sourceUrl, options = {}) {
  const stat = fs.statSync(docPath);
  const evidence = [{
    doc_role: "pcap",
    doc_title: "PCAP",
    page: 1,
    label: "PCAP · p. 1",
    reason: "Contract-object summary",
    snippet: "Objeto del contrato y criterios de adjudicación con precio ponderado.",
  }];
  return {
    schema: "simplifae.ingestion.premium.v0",
    source: {
      kind: "PLACSP",
      url: sourceUrl,
      mode: "premium",
      fetched_at: "2026-05-06T00:00:00Z",
      download_errors: [],
    },
    structured_facts: {
      contract_reference: reference,
      buyer: "Test buyer",
      procedure: "Abierto",
      contract_type: "Servicios",
      publication: "06/05/2026",
      submission_deadline: "20/05/2026 14:00",
      cpvs: ["72000000"],
      title: `Tender ${reference}`,
      estimated_value: 1000,
    },
    documents: [{
      role: "pcap",
      title: "PCAP",
      path: docPath,
      source_url: sourceUrl,
      content_type: "application/pdf",
      bytes: stat.size,
      sha1: sha1File(docPath),
      page_count: 3,
      pages_extracted: 3,
      text_chars: 1200,
      ocr_candidate: Boolean(options.ocrCandidate),
    }],
    level3: {
      contract_reference: reference,
      status: "auto_draft",
      confidence: { overall: 0.9 },
      summary: { value: `Tender ${reference} summary.`, evidence },
      scope: {
        count: 1,
        lots: [],
        no_lots_reason: "Single-lot scope.",
        confidence: 0.9,
        evidence,
      },
      requirements: {
        evidence,
        groups: [{
          title: "Envelope A",
          description: "Administrative documentation",
          rows: [{
            item: "ESPD / DEUC declaration.",
            type: "Admission",
            weight: null,
            evidence,
          }, {
            item: "Price criterion.",
            type: "Award criteria",
            weight: "100 points",
            evidence,
          }],
        }],
      },
      commercial_facts: {
        estimated_contract_value: { value: "€1.000,00", provenance: "structured", confidence: 0.95, evidence },
        duration: { value: "12 months", provenance: "structured", confidence: 0.95, evidence },
        provisional_guarantee: { value: "Not required", provenance: "document", confidence: 0.9, evidence },
        definitive_guarantee: { value: "5% of award amount", provenance: "document", confidence: 0.9, evidence },
      },
      timeline: { submission_deadline: { value: "20/05/2026 14:00" } },
      cpvs: ["72000000"],
      buyer: "Test buyer",
      procedure: "Abierto",
      contract_type: "Servicios",
    },
    coverage: {
      has_structured_facts: true,
      documents_downloaded: 1,
      pdfs_processed: 1,
      ocr_candidates: options.ocrCandidate ? 1 : 0,
      ocr_candidate_titles: options.ocrCandidate ? ["PCAP"] : [],
      sections_with_candidates: ["scope", "submission", "admission", "award_criteria", "values", "duration", "guarantees"],
    },
    _test_item_id: itemId,
  };
}

function writeGateReports(tmp, premiumRoot, packetFiles) {
  const quality = {
    schema: "simplifae.quality.gate.v1",
    premium_root: premiumRoot,
    summary: {
      checked: 2,
      failed_tenders: 0,
      failure_count: 0,
      warning_count: 0,
      premium_ready: 1,
      needs_review: 1,
      pass: true,
    },
    results: [{
      reference: "REF-1",
      id: "001-premium",
      packet_file: packetFiles[0],
      status: "premium_ready",
      failures: [],
      warnings: [],
    }, {
      reference: "REF-2",
      id: "002-review",
      packet_file: packetFiles[1],
      status: "discovery_ready_needs_ocr",
      failures: [],
      warnings: [],
    }],
  };
  const semantic = {
    schema: "simplifae.quality.semantic-audit.v1",
    premium_root: premiumRoot,
    summary: { checked: 2, failure_count: 0, warning_count: 0, pass: true },
  };
  const parity = {
    schema: "simplifae.quality.golden-parity.v1",
    premium_root: premiumRoot,
    summary: { packets_checked: 2, failure_count: 0, warning_count: 0, pass: true },
  };
  writeJson(path.join(tmp, "quality-gate.json"), quality);
  writeJson(path.join(tmp, "semantic-audit.json"), semantic);
  writeJson(path.join(tmp, "golden-parity.json"), parity);
}

function main() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "simplifae-packet-gate-test-"));
  const premiumRoot = path.join(tmp, "premium");
  const docPath = path.join(tmp, "source.pdf");
  fs.writeFileSync(docPath, "%PDF-1.4\n% fake PDF for promotion gate tests\n", "utf8");

  const packet1Dir = path.join(premiumRoot, "001-premium");
  const packet2Dir = path.join(premiumRoot, "002-review");
  const packet1File = path.join(packet1Dir, "premium.json");
  const packet2File = path.join(packet2Dir, "premium.json");
  writeJson(packet1File, packet("REF-1", "tender-premium", docPath, "https://example.test/ref-1"));
  writeJson(packet2File, packet("REF-2", "tender-review", docPath, "https://example.test/ref-2", { ocrCandidate: true }));
  writeGateReports(tmp, premiumRoot, [packet1File, packet2File]);

  const manifest = run([
    "tools/simplifae-ingestion/packet_manifest.js",
    "--premium-root", premiumRoot,
    "--quality-report", path.join(tmp, "quality-gate.json"),
    "--out", path.join(tmp, "packet-manifest.json"),
  ]);
  assert.strictEqual(manifest.status, 0, manifest.stderr || manifest.stdout);
  const manifestReport = JSON.parse(fs.readFileSync(path.join(tmp, "packet-manifest.json"), "utf8"));
  assert.strictEqual(manifestReport.summary.pass, true);
  assert.strictEqual(manifestReport.summary.promotion_eligible, 1);

  const blockedRoot = path.join(tmp, "blocked", "premium");
  writeJson(path.join(blockedRoot, "001", "premium.json"), packet("BLOCKED", "blocked", docPath, "https://example.test/blocked"));
  const blocked = run([
    "tools/simplifae-ingestion/promote_live_publicada_premium.js",
    "--premium-root", blockedRoot,
    "--live-file", path.join(tmp, "missing-live.js"),
  ]);
  assert.notStrictEqual(blocked.status, 0, "Promotion must fail when gate reports are missing.");
  assert.match(blocked.stderr, /Promotion gate failed: quality_gate report is required/);

  const liveFile = path.join(tmp, "live.js");
  fs.writeFileSync(liveFile, `window.SIMPLIFAE_LIVE_PUBLICADA_OPPORTUNITIES = ${JSON.stringify([
    {
      id: "tender-premium",
      tenderReference: "REF-1",
      sourceUrl: "https://example.test/ref-1",
      title: "Tender REF-1",
      originalDescription: "Original description.",
      objectSummary: "Object summary.",
      contractType: "Services",
      estimatedValue: "€1.000,00",
      duration: "12 months",
      provisional: "Not required",
      guarantee: "5% of award amount",
      match: 82,
    },
    {
      id: "tender-review",
      tenderReference: "REF-2",
      sourceUrl: "https://example.test/ref-2",
      title: "Tender REF-2",
      originalDescription: "Original description.",
      objectSummary: "Object summary.",
      contractType: "Services",
      estimatedValue: "€1.000,00",
      duration: "12 months",
      provisional: "Not required",
      guarantee: "5% of award amount",
      match: 81,
    },
  ])};\n`, "utf8");

  const detailOut = path.join(tmp, "details.js");
  const viewerOut = path.join(tmp, "viewer.js");
  const promote = run([
    "tools/simplifae-ingestion/promote_live_publicada_premium.js",
    "--premium-root", premiumRoot,
    "--live-file", liveFile,
    "--docs-out", path.join(tmp, "docs-out"),
    "--detail-out", detailOut,
    "--viewer-out", viewerOut,
    "--quality-report", path.join(tmp, "quality-gate.json"),
    "--semantic-report", path.join(tmp, "semantic-audit.json"),
    "--parity-report", path.join(tmp, "golden-parity.json"),
    "--packet-manifest", path.join(tmp, "packet-manifest.json"),
  ]);
  assert.strictEqual(promote.status, 0, promote.stderr || promote.stdout);
  const output = JSON.parse(promote.stdout);
  assert.strictEqual(output.promoted, 1);
  assert.strictEqual(output.skipped, 1);
  const details = fs.readFileSync(detailOut, "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(details, sandbox);
  const promotedDetail = sandbox.window.SIMPLIFAE_LIVE_PUBLICADA_PREMIUM_DETAILS["tender-premium"];
  assert.ok(promotedDetail);
  assert.strictEqual(promotedDetail.scope.format, "bullets");
  assert.strictEqual(promotedDetail.viewerTenderKey, "REF-1");
  assert.strictEqual(sandbox.window.SIMPLIFAE_LIVE_PUBLICADA_PREMIUM_DETAILS["tender-review"], undefined);
  assert.strictEqual(sandbox.window.SIMPLIFAE_LIVE_PUBLICADA_PROMOTION_STATUS["tender-premium"].processingStatus, "premium_ready");
  assert.strictEqual(sandbox.window.SIMPLIFAE_LIVE_PUBLICADA_PROMOTION_STATUS["tender-premium"].promoted, true);
  assert.strictEqual(sandbox.window.SIMPLIFAE_LIVE_PUBLICADA_PROMOTION_STATUS["tender-review"].processingStatus, "discovery_ready_needs_ocr");
  assert.strictEqual(sandbox.window.SIMPLIFAE_LIVE_PUBLICADA_PROMOTION_STATUS["tender-review"].promoted, false);
  const viewerSandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(viewerOut, "utf8"), viewerSandbox);
  assert.ok(viewerSandbox.window.SIMPLIFAE_LIVE_PUBLICADA_TENDER_DOC_KEYS["REF-1"]);
  assert.ok(viewerSandbox.window.SIMPLIFAE_LIVE_PUBLICADA_TENDER_DOC_KEYS["tender-premium"]);
  const viewerDocs = viewerSandbox.window.SIMPLIFAE_LIVE_PUBLICADA_VIEWER_DOCS;
  const promotedDoc = Object.values(viewerDocs)[0];
  assert.deepStrictEqual(Array.from(promotedDoc.availablePages), [1, 2]);
  assert.strictEqual(promotedDoc.partialPagePackage, true);
  assert.strictEqual(output.packagedPages, 2);

  console.log("packet manifest and promotion gate regression test passed");
}

main();
