#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "../../..");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "simplifae-quality-gate-ocr-"));
const packetDir = path.join(tempRoot, "001-ocr-fixture");
const ancillaryPacketDir = path.join(tempRoot, "002-ancillary-ocr-fixture");
fs.mkdirSync(packetDir, { recursive: true });
fs.mkdirSync(ancillaryPacketDir, { recursive: true });

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

const evidence = [{
  doc_role: "pcap",
  doc_title: "Readable PCAP",
  page: 1,
  label: "PCAP · p. 1",
  reason: "Source-backed fixture evidence",
}];
const ancillaryPacket = {
  schema: "simplifae.ingestion.premium.v1",
  source: { mode: "premium", url: "https://example.invalid/ancillary" },
  structured_facts: {
    contract_reference: "OCR-FIXTURE-2",
  },
  coverage: {
    documents_downloaded: 2,
    pdfs_processed: 2,
    ocr_candidates: 1,
    ocr_candidate_titles: ["Ancillary scan"],
    sections_with_candidates: ["scope", "admission", "award_criteria"],
  },
  documents: [
    {
      role: "pcap",
      title: "Readable PCAP",
      path: path.join(ancillaryPacketDir, "Readable PCAP.pdf"),
      content_type: "application/pdf",
      page_count: 5,
      pages_extracted: 5,
      text_chars: 4000,
      ocr_candidate: false,
    },
    {
      role: "pdf",
      title: "Ancillary scan",
      path: path.join(ancillaryPacketDir, "Ancillary scan.pdf"),
      content_type: "application/pdf",
      page_count: 1,
      pages_extracted: 1,
      text_chars: 100,
      ocr_candidate: true,
    },
  ],
  level3: {
    contract_reference: "OCR-FIXTURE-2",
    confidence: { overall: 0.91 },
    timeline: {
      submission_deadline: { value: "2026-05-20 12:00" },
    },
    summary: {
      value: "Ancillary OCR should not downgrade a fully evidenced tender.",
      evidence,
    },
    scope: {
      count: 1,
      lots: [],
      evidence,
    },
    requirements: {
      evidence,
      groups: [{
        title: "Envelope A",
        rows: [{
          item: "ESPD / DEUC declaration.",
          type: "Admission",
          evidence,
        }, {
          item: "Price criterion.",
          type: "Award criteria",
          weight: "100",
          evidence,
        }],
      }],
    },
    commercial_facts: {
      estimated_contract_value: { value: "€1.000,00", evidence },
      duration: { value: "12 months", evidence },
      provisional_guarantee: { value: "Not required", evidence },
      definitive_guarantee: { value: "5%", evidence },
    },
  },
};
fs.writeFileSync(path.join(ancillaryPacketDir, "premium.json"), JSON.stringify(ancillaryPacket, null, 2));
for (const doc of ancillaryPacket.documents) fs.writeFileSync(doc.path, "%PDF-1.4\n");

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
assert.strictEqual(report.summary.checked, 2);
assert.strictEqual(report.summary.ocr_blocked, 1);
assert.strictEqual(report.summary.ocr_review_candidates, 2);
assert.strictEqual(report.summary.hard_ocr_blocked, 1);
assert.strictEqual(report.summary.local_ocr_available, report.ocr_environment.local_ocr_available);
assert.ok(Array.isArray(report.ocr_environment.tools));
assert.ok(report.ocr_environment.tools.some((tool) => tool.name === "tesseract"));
assert.ok(report.ocr_environment.required_for_sidecar_ocr.includes("pdftoppm"));
assert.strictEqual(
  report.ocr_environment.local_ocr_available,
  report.ocr_environment.local_pdf_ocr_available || report.ocr_environment.local_sidecar_ocr_available,
);
assert.strictEqual(report.ocr_blockers.length, 1);
assert.strictEqual(report.ocr_blockers[0].reference, "OCR-FIXTURE-1");
assert.strictEqual(report.ocr_blockers[0].hard_ocr_blockers, 1);
assert.strictEqual(report.ocr_blockers[0].documents[0].severity, "hard_ocr_blocker");
assert.strictEqual(report.ocr_blockers[0].documents[0].text_chars, 0);
const ancillaryResult = report.results.find((item) => item.reference === "OCR-FIXTURE-2");
assert.strictEqual(ancillaryResult.status, "premium_ready");
assert.strictEqual(ancillaryResult.ocr_candidates, 0);
assert.strictEqual(ancillaryResult.ocr_review_candidates, 1);

console.log("quality_gate OCR environment regression test passed");
