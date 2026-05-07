#!/usr/bin/env node
/* Compare fast/premium packets against slow-method prototype references and the permanent field contract. */

const fs = require("fs");
const http = require("http");
const path = require("path");
const { chromium } = require("playwright");

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1 || index + 1 >= process.argv.length) return fallback;
  return process.argv[index + 1];
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2), "utf8");
}

function normalizeReference(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
}

function compact(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".js") return "text/javascript; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".pdf") return "application/pdf";
  return "application/octet-stream";
}

function startStaticServer(rootDir) {
  const root = path.resolve(rootDir);
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    let filePath = path.normalize(path.join(root, decodeURIComponent(url.pathname)));
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      res.writeHead(200, { "Content-Type": contentType(filePath) });
      res.end(data);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve({ server, url: `http://127.0.0.1:${server.address().port}/discovery-v2/?screen=discovery` });
    });
  });
}

function findPremiumPackets(root) {
  if (!root || !fs.existsSync(root)) return [];
  const packets = [];
  function walk(dir, depth = 0) {
    if (depth > 4) return;
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
    if (value.doc_title || value.page || value.label || value.reason) output.push(value);
    Object.values(value).forEach((item) => collectEvidence(item, output));
  }
  return output;
}

function hasDocPageEvidence(value) {
  return collectEvidence(value).some((evidence) => compact(evidence.doc_title) && Number(evidence.page) > 0);
}

function packetSnapshot(packetFile) {
  const packet = readJson(packetFile);
  const level3 = packet.level3 || {};
  const requirements = level3.requirements || {};
  const groups = Array.isArray(requirements.groups) ? requirements.groups : [];
  const rows = groups.flatMap((group) => (group.rows || []).map((row) => ({ group, row })));
  const commercial = level3.commercial_facts || {};
  const docs = Array.isArray(packet.documents) ? packet.documents : [];
  const reference = level3.contract_reference || packet.structured_facts && packet.structured_facts.contract_reference || path.basename(path.dirname(packetFile));
  const evidenceProblems = collectEvidence(level3).filter((evidence) => {
    if (!evidence.doc_title && !evidence.page && !evidence.label && !evidence.reason) return false;
    return !compact(evidence.doc_title) || !(Number(evidence.page) > 0);
  });
  return {
    reference,
    normalizedReference: normalizeReference(reference),
    packetFile,
    sourceUrl: packet.source && packet.source.url || null,
    confidence: Number(level3.confidence && level3.confidence.overall || 0),
    ocrCandidates: Number(packet.coverage && packet.coverage.ocr_candidates || 0),
    sections: packet.coverage && packet.coverage.sections_with_candidates || [],
    commercial: {
      estimatedValue: Boolean(commercial.estimated_contract_value && commercial.estimated_contract_value.value),
      duration: Boolean(commercial.duration && commercial.duration.value),
      provisional: Boolean(commercial.provisional_guarantee && commercial.provisional_guarantee.value),
      guarantee: Boolean(commercial.definitive_guarantee && commercial.definitive_guarantee.value),
      evidenceBacked: ["estimated_contract_value", "duration", "provisional_guarantee", "definitive_guarantee"].filter((key) => hasDocPageEvidence(commercial[key] && commercial[key].evidence || [])),
    },
    scope: {
      hasEvidence: hasDocPageEvidence(level3.scope && level3.scope.evidence || []),
      lots: Number(level3.scope && level3.scope.count || 0),
      items: Array.isArray(level3.scope && level3.scope.lots) ? level3.scope.lots.reduce((sum, lot) => sum + ((lot.items || []).length || 0), 0) : 0,
    },
    requirements: {
      groups: groups.length,
      rows: rows.length,
      admission: rows.filter(({ row }) => row.type === "Admission").length,
      award: rows.filter(({ row }) => row.type === "Award criteria").length,
      rowsWithEvidence: rows.filter(({ row }) => hasDocPageEvidence(row.evidence || [])).length,
      rawSnippetRows: rows.filter(({ row }) => {
        const item = compact(row.item);
        return item.length > 220 || /\.\.\.$/.test(item) || /^Objeto\s+del\s+Contrato\b/i.test(item);
      }).length,
      mixedRows: rows.filter(({ row }) => /award\s*\/\s*admission|admission\s*\/\s*award/i.test(`${row.item || ""} ${row.type || ""}`)).length,
    },
    documents: {
      count: docs.length,
      pdfs: docs.filter((doc) => String(doc.path || "").toLowerCase().endsWith(".pdf") || String(doc.content_type || "").includes("pdf")).length,
      localExisting: docs.filter((doc) => doc.path && fs.existsSync(doc.path)).length,
    },
    evidenceProblems: evidenceProblems.length,
  };
}

function indexPackets(root) {
  const byReference = new Map();
  for (const file of findPremiumPackets(root)) {
    const snapshot = packetSnapshot(file);
    byReference.set(snapshot.normalizedReference, snapshot);
  }
  return byReference;
}

function issue(severity, reason, fieldGroup, details, input = null) {
  return { severity, reason, fieldGroup, details, deterministic: "deterministic", input };
}

function evaluateContract(packet) {
  const failures = [];
  const warnings = [];
  const infos = [];
  if (!packet) return { failures, warnings, infos };
  const target = (severity, reason, fieldGroup, details, input = null) => {
    if (severity === "fail") failures.push(issue(severity, reason, fieldGroup, details, input));
    else if (severity === "info") infos.push(issue(severity, reason, fieldGroup, details, input));
    else warnings.push(issue(severity, reason, fieldGroup, details, input));
  };

  if (packet.ocrCandidates > 0) {
    target("info", "ocr_candidates_downgraded", "tender_documents", "Packet has OCR candidates and is tracked as non-premium until OCR/document evidence is resolved.", { ocrCandidates: packet.ocrCandidates });
  }
  if (!packet.commercial.estimatedValue || !packet.commercial.duration || !packet.commercial.provisional || !packet.commercial.guarantee) {
    target("warn", "commercial_header_incomplete", "commercial_header", "One or more commercial header fields are missing.", packet.commercial);
  }
  if (!packet.scope.hasEvidence) {
    target("warn", "scope_evidence_missing", "detailed_scope", "Detailed scope has no exact document-page evidence.");
  }
  if (packet.sections.includes("admission") && packet.requirements.admission === 0) {
    target("fail", "admission_missing_despite_candidates", "admission_criteria", "Admission candidates exist but no Admission requirement rows were produced.", packet.requirements);
  }
  if (packet.sections.includes("award_criteria") && packet.requirements.award === 0) {
    target("fail", "award_missing_despite_candidates", "award_criteria", "Award candidates exist but no Award criteria rows were produced.", packet.requirements);
  }
  if (packet.requirements.rows && packet.requirements.rowsWithEvidence < packet.requirements.rows) {
    target("fail", "requirement_rows_missing_evidence", "required_documents", "Some requirement rows lack exact document-page evidence.", packet.requirements);
  }
  if (packet.requirements.rawSnippetRows) {
    target("fail", "raw_snippet_requirement_rows", "required_documents", "Requirement rows contain raw/truncated source snippets.", packet.requirements);
  }
  if (packet.requirements.mixedRows) {
    target("fail", "mixed_requirement_rows", "required_documents", "Requirement rows mix admission and award concepts.", packet.requirements);
  }
  if (packet.evidenceProblems) {
    target("warn", "document_evidence_needs_review", "provenance", "Some non-blocking evidence entries are missing doc_title or page; quality_gate remains responsible for blocking premium-ready packets.", { evidenceProblems: packet.evidenceProblems });
  }
  if (packet.documents.count > 0 && packet.documents.localExisting === 0) {
    target("fail", "documents_not_local", "tender_documents", "Recovered documents are not locally available for viewer-backed navigation.", packet.documents);
  }
  return { failures, warnings, infos };
}

function compareWithSlowReference(reference, slow, fast, options = {}) {
  const failures = [];
  const warnings = [];
  const infos = [];
  const target = (severity, reason, fieldGroup, details, input = null) => {
    if (severity === "fail") failures.push(issue(severity, reason, fieldGroup, details, input));
    else if (severity === "info") infos.push(issue(severity, reason, fieldGroup, details, input));
    else warnings.push(issue(severity, reason, fieldGroup, details, input));
  };
  if (!slow) {
    target(options.requireSlowReference ? "warn" : "info", "slow_reference_snapshot_unavailable", "golden_reference", "Golden reference is listed, but this run has no matching prototype/browser snapshot to compare against.", { reference });
    return { failures, warnings, infos };
  }
  if (!fast) {
    target("warn", "fast_packet_missing_for_golden_reference", "golden_reference", "No fast/premium packet was supplied for this slow-method reference; contract-only checks still apply to mass tenders.", { reference });
    return { failures, warnings, infos };
  }

  if (slow.hasSourceBackedScope && !fast.scope.hasEvidence) {
    target("fail", "fast_scope_below_slow", "detailed_scope", "Slow reference has source-backed scope but fast packet lacks scope evidence.", { slow: slow.scope, fast: fast.scope });
  }
  if (slow.requirements.rows > 0 && fast.requirements.rows === 0) {
    target("fail", "fast_requirements_below_slow", "required_documents", "Slow reference has required-document rows but fast packet produced none.", { slow: slow.requirements, fast: fast.requirements });
  }
  if (slow.requirements.admission > 0 && fast.requirements.admission === 0) {
    target("fail", "fast_admission_below_slow", "admission_criteria", "Slow reference has Admission rows but fast packet produced none.", { slow: slow.requirements, fast: fast.requirements });
  }
  if (slow.requirements.award > 0 && fast.requirements.award === 0) {
    target("fail", "fast_award_below_slow", "award_criteria", "Slow reference has Award criteria rows but fast packet produced none.", { slow: slow.requirements, fast: fast.requirements });
  }
  if (slow.documents.count > 0 && fast.documents.pdfs === 0) {
    target("fail", "fast_documents_below_slow", "tender_documents", "Slow reference has viewer documents but fast packet has no PDFs.", { slow: slow.documents, fast: fast.documents });
  }
  for (const field of ["estimatedValue", "duration", "provisional", "guarantee"]) {
    if (slow.commercial[field] && !fast.commercial[field]) {
      target("fail", `fast_commercial_${field}_below_slow`, "commercial_header", `Slow reference has ${field} but fast packet does not.`, { slow: slow.commercial, fast: fast.commercial });
    }
  }
  return { failures, warnings, infos };
}

async function loadPrototypeSnapshots(root, references) {
  const { server, url } = await startStaticServer(root);
  let browser = null;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "load" });
    await page.waitForTimeout(100);
    return await page.evaluate((wantedReferences) => {
      function norm(value) {
        return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "");
      }
      function sourceRefsCount(row) {
        return Array.isArray(row && row.sourceRefs) ? row.sourceRefs.length : (row && row.source ? 1 : 0);
      }
      function snapshot(id, detail) {
        const requirements = detail && detail.requirements || {};
        const groups = Array.isArray(requirements.groups) ? requirements.groups : [];
        const rows = groups.flatMap((group) => (group.rows || []).map((row) => ({ group, row })));
        const docs = Array.isArray(detail && detail.documents) ? detail.documents : [];
        const scope = detail && detail.scope || {};
        const evidence = Array.isArray(scope.evidence) ? scope.evidence : [];
        return {
          id,
          reference: detail && (detail.tenderReference || detail.reference),
          normalizedReference: norm(detail && (detail.tenderReference || detail.reference)),
          title: detail && detail.title || "",
          objectSummary: detail && (detail.objectSummary || detail.summaryText || ""),
          buyer: detail && detail.buyer || "",
          commercial: {
            estimatedValue: Boolean(detail && detail.estimatedValue),
            duration: Boolean(detail && detail.duration),
            provisional: Boolean(detail && detail.provisional),
            guarantee: Boolean(detail && detail.guarantee)
          },
          provenance: detail && detail.provenance || {},
          hasSourceBackedScope: Boolean(detail && detail.provenance && detail.provenance.evidenceSections && detail.provenance.evidenceSections.scope === "document"),
          scope: {
            evidence: evidence.length,
            items: Array.isArray(scope.items) ? scope.items.length : 0,
            lots: Array.isArray(scope.lots) ? scope.lots.length : 0,
            cpvs: Array.isArray(scope.cpvs) ? scope.cpvs.length : 0
          },
          requirements: {
            groups: groups.length,
            rows: rows.length,
            admission: rows.filter(({ row }) => row.type === "Admission").length,
            award: rows.filter(({ row }) => row.type === "Award criteria").length,
            sourceRefs: rows.reduce((sum, { row }) => sum + sourceRefsCount(row), 0)
          },
          documents: {
            count: docs.length,
            local: docs.filter((doc) => doc && !doc.externalOnly).length,
            externalOnly: docs.filter((doc) => doc && doc.externalOnly).length
          }
        };
      }
      const wanted = new Set(wantedReferences.map(norm));
      const all = [];
      const staticData = typeof TENDER_DATA !== "undefined" ? TENDER_DATA : {};
      for (const [id, detail] of Object.entries(staticData || {})) all.push(snapshot(id, detail));
      for (const [id, detail] of Object.entries(window.IMPORTED_TENDER_DATA || {})) all.push(snapshot(id, detail));
      for (const [id, detail] of Object.entries(window.SIMPLIFAE_LIVE_PUBLICADA_PREMIUM_DETAILS || {})) all.push(snapshot(id, detail));
      return all.filter((item) => wanted.has(item.normalizedReference));
    }, references);
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

async function main() {
  const root = path.resolve(argValue("--root", process.cwd()));
  const premiumRoot = argValue("--premium-root", null);
  const inventoryFile = path.resolve(argValue("--inventory", path.join(__dirname, "simplifae_slow_method_inventory.json")));
  const contractFile = path.resolve(argValue("--field-contract", path.join(__dirname, "simplifae_field_contract.json")));
  const outFile = path.resolve(argValue("--out", path.join("reports", `simplifae-golden-parity-${Date.now()}.json`)));
  const requireGoldenPackets = hasFlag("--require-golden-packets");
  const useBrowserSnapshots = hasFlag("--browser-snapshots");
  const requireBrowserSnapshots = hasFlag("--require-browser-snapshots");
  const inventory = readJson(inventoryFile);
  const fieldContract = readJson(contractFile);
  const references = (inventory.golden_reference_tenders || []).map((item) => item.reference);
  let slowSnapshots = [];
  const snapshotWarnings = [];
  const snapshotFailures = [];
  if (useBrowserSnapshots || requireBrowserSnapshots) {
    try {
      slowSnapshots = await loadPrototypeSnapshots(root, references);
    } catch (error) {
      const payload = {
        message: error && error.message ? error.message : String(error),
        root,
        references,
      };
      const entry = issue(
        requireBrowserSnapshots ? "fail" : "warn",
        "prototype_snapshot_unavailable",
        "golden_reference",
        "Prototype browser snapshot could not be loaded; falling back to packet/field-contract parity only.",
        payload,
      );
      (requireBrowserSnapshots ? snapshotFailures : snapshotWarnings).push({ reference: "prototype", ...entry });
    }
  }
  const slowByReference = new Map(slowSnapshots.map((item) => [item.normalizedReference, item]));
  const packetsByReference = indexPackets(premiumRoot);
  const packetResults = [];
  const goldenResults = [];

  for (const packet of packetsByReference.values()) {
    const contract = evaluateContract(packet);
    packetResults.push({ ...packet, failures: contract.failures, warnings: contract.warnings, infos: contract.infos });
  }

  for (const reference of references) {
    const normalized = normalizeReference(reference);
    const slow = slowByReference.get(normalized) || null;
    const fast = packetsByReference.get(normalized) || null;
    const comparison = compareWithSlowReference(reference, slow, fast, { requireSlowReference: useBrowserSnapshots || requireBrowserSnapshots });
    if (requireGoldenPackets && !fast) {
      comparison.failures.push(issue("fail", "required_golden_fast_packet_missing", "golden_reference", "Golden parity run requires a fast packet for this reference.", { reference }));
    }
    goldenResults.push({
      reference,
      slow,
      fast,
      failures: comparison.failures,
      warnings: comparison.warnings,
      infos: comparison.infos,
    });
  }

  const failures = [
    ...snapshotFailures,
    ...packetResults.flatMap((item) => item.failures.map((failure) => ({ reference: item.reference, packetFile: item.packetFile, ...failure }))),
    ...goldenResults.flatMap((item) => item.failures.map((failure) => ({ reference: item.reference, ...failure }))),
  ];
  const warnings = [
    ...snapshotWarnings,
    ...packetResults.flatMap((item) => item.warnings.map((warning) => ({ reference: item.reference, packetFile: item.packetFile, ...warning }))),
    ...goldenResults.flatMap((item) => item.warnings.map((warning) => ({ reference: item.reference, ...warning }))),
  ];
  const infos = [
    ...packetResults.flatMap((item) => item.infos.map((info) => ({ reference: item.reference, packetFile: item.packetFile, ...info }))),
    ...goldenResults.flatMap((item) => item.infos.map((info) => ({ reference: item.reference, ...info }))),
  ];
  const failuresByReason = {};
  failures.forEach((failure) => {
    failuresByReason[failure.reason] = (failuresByReason[failure.reason] || 0) + 1;
  });
  const warningsByReason = {};
  warnings.forEach((warning) => {
    warningsByReason[warning.reason] = (warningsByReason[warning.reason] || 0) + 1;
  });
  const infosByReason = {};
  infos.forEach((info) => {
    infosByReason[info.reason] = (infosByReason[info.reason] || 0) + 1;
  });

  const report = {
    schema: "simplifae.quality.golden-parity.v1",
    created_at: new Date().toISOString(),
    root,
    premium_root: premiumRoot ? path.resolve(premiumRoot) : null,
    inventory: inventoryFile,
    field_contract: contractFile,
    summary: {
      golden_references: references.length,
      golden_references_found_in_prototype: slowSnapshots.length,
      packets_checked: packetResults.length,
      golden_comparisons: goldenResults.length,
      failure_count: failures.length,
      warning_count: warnings.length,
      info_count: infos.length,
      failures_by_reason: failuresByReason,
      warnings_by_reason: warningsByReason,
      infos_by_reason: infosByReason,
      pass: failures.length === 0,
    },
    field_contract: fieldContract,
    packet_results: packetResults,
    golden_results: goldenResults,
    failures,
    warnings,
    infos,
  };
  writeJson(outFile, report);
  console.log(JSON.stringify({ out: outFile, ...report.summary }, null, 2));
  return failures.length ? 1 : 0;
}

main().then((code) => {
  process.exitCode = code;
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
