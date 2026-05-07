#!/usr/bin/env node
/* Build and validate the canonical Simplifae tender packet manifest. */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1 || index + 1 >= process.argv.length) return fallback;
  return process.argv[index + 1];
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2), "utf8");
}

function compact(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeReference(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
}

function snippet(value, max = 1200) {
  try {
    return JSON.stringify(value).slice(0, max);
  } catch (_error) {
    return String(value || "").slice(0, max);
  }
}

function sha1File(file) {
  const hash = crypto.createHash("sha1");
  hash.update(fs.readFileSync(file));
  return hash.digest("hex");
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
  walk(path.resolve(root));
  return packets.sort();
}

function collectEvidence(value, output = []) {
  if (!value) return output;
  if (Array.isArray(value)) {
    value.forEach((item) => collectEvidence(item, output));
    return output;
  }
  if (typeof value === "object") {
    if (value.doc_title || value.doc_role || value.page || value.label || value.reason || value.snippet) output.push(value);
    Object.values(value).forEach((item) => collectEvidence(item, output));
  }
  return output;
}

function loadQualityIndex(file) {
  const byPacketFile = new Map();
  const byReference = new Map();
  if (!file || !fs.existsSync(file)) return { report: null, byPacketFile, byReference };
  const report = readJson(file);
  for (const result of report.results || []) {
    if (result.packet_file) byPacketFile.set(path.resolve(result.packet_file), result);
    if (result.reference) byReference.set(normalizeReference(result.reference), result);
  }
  return { report, byPacketFile, byReference };
}

function issue(severity, reason, section, details, input = null) {
  return {
    severity,
    reason,
    section,
    component: section,
    details,
    deterministic: "deterministic",
    input,
  };
}

function documentTitleKey(title, role) {
  return `${compact(title).toLowerCase()}::${compact(role).toLowerCase()}`;
}

function validatePacket(packetFile, packet, qualityResult) {
  const packetDir = path.dirname(packetFile);
  const tenderId = path.basename(packetDir);
  const level3 = packet.level3 || {};
  const structured = packet.structured_facts || {};
  const source = packet.source || {};
  const coverage = packet.coverage || {};
  const reference = level3.contract_reference || structured.contract_reference || qualityResult && qualityResult.reference || tenderId;
  const status = qualityResult && qualityResult.status || level3.status || "unknown";
  const isPremiumReady = status === "premium_ready";
  const failures = [];
  const warnings = [];
  const target = (severity, reason, section, details, input = null) => {
    (severity === "fail" ? failures : warnings).push(issue(severity, reason, section, details, input));
  };
  const premiumSensitive = (reason, section, details, input = null) => {
    target(isPremiumReady ? "fail" : "warn", reason, section, details, input);
  };

  if (!String(packet.schema || "").startsWith("simplifae.ingestion")) {
    target("fail", "schema_missing", "packet", "premium.json must declare the Simplifae ingestion schema", { schema: packet.schema || null });
  }
  if (!source.kind || !source.mode) {
    target("fail", "source_metadata_missing", "source", "Packet must keep source kind and processing mode", source);
  }
  if (!source.url) {
    target("warn", "source_url_missing", "source", "Packet has no official source URL", source);
  }
  if (!structured.contract_reference && !level3.contract_reference) {
    target("fail", "reference_missing", "structured_facts", "Packet has no contract reference in structured facts or level3 output", {
      structured_reference: structured.contract_reference || null,
      level3_reference: level3.contract_reference || null,
    });
  }
  if (!packet.coverage || typeof packet.coverage !== "object") {
    target("fail", "coverage_missing", "packet", "Packet must expose coverage metrics", packet.coverage || null);
  }
  if (!qualityResult) {
    target("warn", "quality_status_missing", "quality_gate", "Packet has no matching quality_gate result; it cannot be promoted", {
      packet_file: packetFile,
      reference,
    });
  }

  const docs = Array.isArray(packet.documents) ? packet.documents : [];
  const docTitleIndex = new Map();
  const documents = docs.map((doc, index) => {
    const docPath = doc && doc.path ? path.resolve(doc.path) : null;
    const exists = Boolean(docPath && fs.existsSync(docPath));
    const stat = exists ? fs.statSync(docPath) : null;
    const computedSha1 = exists ? sha1File(docPath) : null;
    if (!docPath) {
      premiumSensitive("document_path_missing", "Tender Documents", "Document metadata lacks a local path", { index, doc });
    } else if (!exists) {
      premiumSensitive("document_file_missing", "Tender Documents", "Document metadata points to a missing local file", { index, path: docPath, title: doc.title || null });
    }
    if (exists && doc.sha1 && computedSha1 !== doc.sha1) {
      target("fail", "document_sha1_mismatch", "Tender Documents", "Recovered document hash changed after extraction", {
        title: doc.title || null,
        path: docPath,
        expected: doc.sha1,
        actual: computedSha1,
      });
    }
    if (exists && Number(doc.bytes || 0) > 0 && Number(doc.bytes) !== stat.size) {
      target("fail", "document_size_mismatch", "Tender Documents", "Recovered document byte size changed after extraction", {
        title: doc.title || null,
        path: docPath,
        expected: Number(doc.bytes),
        actual: stat.size,
      });
    }
    if (doc.title) {
      docTitleIndex.set(documentTitleKey(doc.title, doc.role), doc);
      docTitleIndex.set(documentTitleKey(doc.title, ""), doc);
    }
    if (doc.ocr_status && !["not_requested", "not_needed", "applied"].includes(doc.ocr_status)) {
      premiumSensitive("ocr_provider_document_issue", "ocr", "OCR provider could not produce a fully usable text layer for this document", {
        title: doc.title || null,
        role: doc.role || null,
        status: doc.ocr_status,
        error: doc.ocr_error || null,
        text_chars: Number(doc.text_chars || 0),
        ocr_candidate: Boolean(doc.ocr_candidate),
      });
    }
    return {
      role: doc.role || null,
      title: doc.title || null,
      path: docPath,
      exists,
      content_type: doc.content_type || null,
      bytes: Number(doc.bytes || stat && stat.size || 0),
      sha1: doc.sha1 || null,
      sha1_verified: Boolean(exists && doc.sha1 && computedSha1 === doc.sha1),
      page_count: Number(doc.page_count || 0),
      text_chars: Number(doc.text_chars || 0),
      ocr_candidate: Boolean(doc.ocr_candidate),
      ocr_applied: Boolean(doc.ocr_applied),
      ocr_provider: doc.ocr_provider || null,
      ocr_status: doc.ocr_status || null,
      ocr_original_path: doc.ocr_original_path || null,
      ocr_error: doc.ocr_error || null,
      ocr_elapsed_seconds: doc.ocr_elapsed_seconds || null,
    };
  });

  const evidence = collectEvidence(level3);
  const evidenceProblems = [];
  for (const item of evidence) {
    if (!item.doc_title && !item.page) continue;
    const page = Number(item.page);
    const doc = docTitleIndex.get(documentTitleKey(item.doc_title, item.doc_role)) ||
      docTitleIndex.get(documentTitleKey(item.doc_title, ""));
    if (!compact(item.doc_title) || !Number.isFinite(page) || page <= 0) {
      evidenceProblems.push({
        reason: "evidence_missing_doc_or_page",
        evidence: item,
      });
      continue;
    }
    if (!doc) {
      evidenceProblems.push({
        reason: "evidence_document_not_recovered",
        evidence: item,
      });
      continue;
    }
    if (Number(doc.page_count || 0) > 0 && page > Number(doc.page_count)) {
      evidenceProblems.push({
        reason: "evidence_page_out_of_range",
        evidence: item,
        page_count: doc.page_count,
      });
    }
  }
  for (const problem of evidenceProblems) {
    premiumSensitive(problem.reason, "document_evidence", "Document evidence cannot be resolved against recovered local documents", snippet(problem));
  }

  if (isPremiumReady && !docs.length) {
    target("fail", "premium_ready_without_documents", "Tender Documents", "premium_ready packet has no recovered documents", { reference });
  }
  if (isPremiumReady && Number(coverage.ocr_candidates || 0) > 0) {
    target("fail", "premium_ready_with_ocr_candidates", "ocr", "premium_ready packet still has OCR candidates", {
      ocr_candidates: coverage.ocr_candidates,
      ocr_candidate_titles: coverage.ocr_candidate_titles || [],
    });
  }

  return {
    tender_id: tenderId,
    reference,
    packet_dir: packetDir,
    packet_file: packetFile,
    status,
    source: {
      kind: source.kind || null,
      mode: source.mode || null,
      url: source.url || null,
      fetched_at: source.fetched_at || null,
      download_errors: source.download_errors || [],
    },
    structured_facts: {
      has_structured_facts: Boolean(Object.keys(structured).length),
      contract_reference: structured.contract_reference || null,
      buyer: structured.buyer || null,
      procedure: structured.procedure || null,
      contract_type: structured.contract_type || null,
      publication: structured.publication || null,
      submission_deadline: structured.submission_deadline || null,
      cpvs: structured.cpvs || [],
    },
    level3: {
      contract_reference: level3.contract_reference || null,
      status: level3.status || null,
      confidence: Number(level3.confidence && level3.confidence.overall || 0),
      summary_present: Boolean(level3.summary && level3.summary.value),
      scope_evidence_count: collectEvidence(level3.scope && level3.scope.evidence || []).length,
      requirement_groups: level3.requirements && Array.isArray(level3.requirements.groups) ? level3.requirements.groups.length : 0,
      requirement_rows: level3.requirements && Array.isArray(level3.requirements.groups)
        ? level3.requirements.groups.reduce((sum, group) => sum + ((group.rows || []).length), 0)
        : 0,
    },
    coverage: {
      has_structured_facts: Boolean(coverage.has_structured_facts),
      documents_downloaded: Number(coverage.documents_downloaded || documents.length),
      pdfs_processed: Number(coverage.pdfs_processed || 0),
      ocr_candidates: Number(coverage.ocr_candidates || 0),
      ocr_applied: Number(coverage.ocr_applied || 0),
      ocr_failed: Number(coverage.ocr_failed || 0),
      sections_with_candidates: coverage.sections_with_candidates || [],
    },
    documents,
    evidence: {
      count: evidence.length,
      resolvable_count: evidence.length - evidenceProblems.length,
      problems: evidenceProblems.slice(0, 20),
    },
    promotion_eligible: isPremiumReady && failures.length === 0,
    failures,
    warnings,
  };
}

function main() {
  const premiumRootArg = argValue("--premium-root");
  if (!premiumRootArg) {
    console.error("Usage: node tools/simplifae-ingestion/packet_manifest.js --premium-root <dir> [--quality-report report.json] [--out packet-manifest.json]");
    return 2;
  }
  const premiumRoot = path.resolve(premiumRootArg);
  const defaultQualityReport = path.join(path.dirname(premiumRoot), "quality-gate.json");
  const qualityReportArg = argValue("--quality-report", fs.existsSync(defaultQualityReport) ? defaultQualityReport : null);
  const qualityReportFile = qualityReportArg ? path.resolve(qualityReportArg) : null;
  const outFile = path.resolve(argValue("--out", path.join(path.dirname(premiumRoot), "packet-manifest.json")));
  const qualityIndex = loadQualityIndex(qualityReportFile);
  const packetFiles = findPremiumPackets(premiumRoot);
  const packets = [];

  for (const packetFile of packetFiles) {
    let packet;
    let qualityResult = null;
    try {
      packet = readJson(packetFile);
      const reference = packet.level3 && packet.level3.contract_reference || packet.structured_facts && packet.structured_facts.contract_reference;
      qualityResult = qualityIndex.byPacketFile.get(path.resolve(packetFile)) ||
        qualityIndex.byReference.get(normalizeReference(reference)) ||
        null;
      packets.push(validatePacket(path.resolve(packetFile), packet, qualityResult));
    } catch (error) {
      packets.push({
        tender_id: path.basename(path.dirname(packetFile)),
        reference: path.basename(path.dirname(packetFile)),
        packet_dir: path.dirname(packetFile),
        packet_file: packetFile,
        status: "failed",
        promotion_eligible: false,
        failures: [issue("fail", "packet_manifest_parse_error", "packet", error.message, packetFile)],
        warnings: [],
      });
    }
  }

  const failures = packets.flatMap((packet) => (packet.failures || []).map((failure) => ({
    tender_id: packet.tender_id,
    reference: packet.reference,
    status: packet.status,
    ...failure,
  })));
  const warnings = packets.flatMap((packet) => (packet.warnings || []).map((warning) => ({
    tender_id: packet.tender_id,
    reference: packet.reference,
    status: packet.status,
    ...warning,
  })));
  const report = {
    schema: "simplifae.packet-manifest.v1",
    created_at: new Date().toISOString(),
    premium_root: premiumRoot,
    quality_report: qualityIndex.report ? qualityReportFile : null,
    summary: {
      checked: packets.length,
      failed_tenders: packets.filter((packet) => (packet.failures || []).length).length,
      failure_count: failures.length,
      warning_count: warnings.length,
      quality_report_present: Boolean(qualityIndex.report),
      premium_ready: packets.filter((packet) => packet.status === "premium_ready").length,
      promotion_eligible: packets.filter((packet) => packet.promotion_eligible).length,
      needs_review: packets.filter((packet) => packet.status !== "premium_ready").length,
      pass: failures.length === 0,
    },
    packets,
    failures,
    warnings,
  };
  writeJson(outFile, report);
  console.log(JSON.stringify({ out: outFile, ...report.summary }, null, 2));
  return failures.length ? 1 : 0;
}

process.exitCode = main();
