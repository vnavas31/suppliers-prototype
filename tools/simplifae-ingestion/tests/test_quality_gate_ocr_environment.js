#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "../../..");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "simplifae-quality-gate-ocr-"));
const packetDir = path.join(tempRoot, "001-ocr-fixture");
fs.mkdirSync(packetDir, { recursive: true });

const packet = {
  schema: "simplifae.ingestion.premium.v1",
  source: { mode: "premium", url: "https://example.invalid/tender" },
  structured_facts: {
    contract_reference: "OCR-FIXTURE-1",
  },
  coverage: {
    documents_downloaded: 1,
    pdfs_processed: 1,
    ocr_candidates: 1,
    ocr_candidate_titles: ["Scanned PCAP"],
    sections_with_candidates: ["scope"],
  },
  documents: [
    {
      role: "pcap",
      title: "Scanned PCAP",
      path: path.join(packetDir, "Scanned PCAP.pdf"),
      content_type: "application/pdf",
      page_count: 3,
      pages_extracted: 3,
      text_chars: 0,
      ocr_candidate: true,
    },
  ],
  level3: {
    contract_reference: "OCR-FIXTURE-1",
    confidence: { overall: 0.42 },
    timeline: {
      submission_deadline: { value: "2026-05-20 12:00" },
    },
    summary: {
      value: "Scanned tender fixture for OCR observability.",
      evidence: [],
    },
    scope: {
      count: 0,
      lots: [],
      evidence: [],
    },
    requirements: {
      groups: [],
      evidence: [],
    },
    commercial_facts: {},
  },
};

fs.writeFileSync(path.join(packetDir, "premium.json"), JSON.stringify(packet, null, 2));
fs.writeFileSync(packet.documents[0].path, "");

const outFile = path.join(tempRoot, "quality-gate.json");
const result = spawnSync(process.execPath, [
  "tools/simplifae-ingestion/quality_gate.js",
  "--premium-root",
  tempRoot,
  "--out",
  outFile,
], {
  cwd: repoRoot,
  encoding: "utf8",
});

assert.strictEqual(result.status, 0, result.stderr || result.stdout);
const report = JSON.parse(fs.readFileSync(outFile, "utf8"));
assert.strictEqual(report.summary.checked, 1);
assert.strictEqual(report.summary.ocr_blocked, 1);
assert.strictEqual(report.summary.hard_ocr_blocked, 1);
assert.strictEqual(report.summary.local_ocr_available, report.ocr_environment.local_ocr_available);
assert.ok(Array.isArray(report.ocr_environment.tools));
assert.ok(report.ocr_environment.tools.some((tool) => tool.name === "tesseract"));
assert.strictEqual(report.ocr_blockers.length, 1);
assert.strictEqual(report.ocr_blockers[0].reference, "OCR-FIXTURE-1");
assert.strictEqual(report.ocr_blockers[0].hard_ocr_blockers, 1);
assert.strictEqual(report.ocr_blockers[0].documents[0].severity, "hard_ocr_blocker");
assert.strictEqual(report.ocr_blockers[0].documents[0].text_chars, 0);

console.log("quality_gate OCR environment regression test passed");
