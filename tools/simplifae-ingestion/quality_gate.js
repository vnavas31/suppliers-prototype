#!/usr/bin/env node
/* Validate premium packets against the Simplifae slow-method quality contract. */

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

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2), "utf8");
}

function detectExecutable(name) {
  const result = spawnSync("sh", ["-lc", `command -v ${name}`], { encoding: "utf8" });
  const executable = String(result.stdout || "").trim();
  return executable || null;
}

function detectOcrEnvironment() {
  const requiredForLocalOcr = ["tesseract", "ocrmypdf"];
  const requiredForSidecarOcr = ["tesseract", "pdftoppm"];
  const usefulPdfTools = ["pdftoppm", "pdftotext", "gs", "magick", "convert"];
  const toolNames = Array.from(new Set([...requiredForLocalOcr, ...requiredForSidecarOcr, ...usefulPdfTools]));
  const tools = toolNames.map((name) => ({
    name,
    path: detectExecutable(name),
  }));
  const available = tools.filter((tool) => tool.path).map((tool) => tool.name);
  const missing = tools.filter((tool) => !tool.path).map((tool) => tool.name);
  const localPdfOcrAvailable = requiredForLocalOcr.every((name) => available.includes(name));
  const localSidecarOcrAvailable = requiredForSidecarOcr.every((name) => available.includes(name));
  return {
    local_ocr_available: localPdfOcrAvailable || localSidecarOcrAvailable,
    local_pdf_ocr_available: localPdfOcrAvailable,
    local_sidecar_ocr_available: localSidecarOcrAvailable,
    required_for_local_ocr: requiredForLocalOcr,
    required_for_sidecar_ocr: requiredForSidecarOcr,
    useful_pdf_tools: usefulPdfTools,
    available,
    missing,
    tools,
  };
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

function documentTitleKey(title, role) {
  return `${compact(title).toLowerCase()}::${compact(role).toLowerCase()}`;
}

function snippet(value, max = 1400) {
  try {
    return JSON.stringify(value).slice(0, max);
  } catch (_error) {
    return String(value || "").slice(0, max);
  }
}

function findPremiumPackets(root) {
  const packets = [];
  function walk(dir, depth = 0) {
    if (depth > 4 || !fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isFile() && entry.name === "premium.json") packets.push(full);
      if (entry.isDirectory()) walk(full, depth + 1);
    }
  }
  walk(root);
  return packets.sort();
}

function collectEvidence(value, output = []) {
  if (!value) return output;
  if (Array.isArray(value)) {
    value.forEach((item) => collectEvidence(item, output));
    return output;
  }
  if (typeof value === "object") {
    if (value.doc_title || value.doc_role || value.page || value.label || value.reason) output.push(value);
    Object.values(value).forEach((item) => collectEvidence(item, output));
  }
  return output;
}

function hasDocPageEvidence(value) {
  return collectEvidence(value).some((evidence) => {
    const page = Number(evidence.page);
    return Boolean(compact(evidence.doc_title) && Number.isFinite(page) && page > 0);
  });
}

const preferredEvidenceRoles = new Set(["pcap", "ppt", "justification", "contract_notice", "pliegos_summary"]);

function evidenceProblems(value) {
  return collectEvidence(value)
    .filter((evidence) => evidence.doc_title || evidence.doc_role || evidence.page || evidence.label)
    .filter((evidence) => {
      const page = Number(evidence.page);
      return !compact(evidence.doc_title) || !Number.isFinite(page) || page <= 0;
    })
    .map((evidence) => ({
      doc_title: evidence.doc_title || null,
      page: evidence.page || null,
      label: evidence.label || null,
      reason: evidence.reason || null,
    }));
}

function hasRawRequirementText(row) {
  const item = compact(row && row.item);
  if (!item) return true;
  if (/^Objeto\s+del\s+Contrato\b|^Descripci[oó]n\s+del\s+procedimiento\b/i.test(item)) return true;
  if (/servicios\s+tal\s+y\s+como\s+establece\s+el\s+art[ií]culo\s+15\b/i.test(item)) return true;
  if (/\.\.\.$/.test(item)) return true;
  if (item.length > 220) return true;
  return false;
}

function isMixedLabel(value) {
  return /award\s*\/\s*admission|admission\s*\/\s*award|award.*admission|admission.*award/i.test(String(value || ""));
}

function rowLooksAdmission(value) {
  return /deuc|espd|solvenc|capacity|capacidad|eligib|admission|admisi[oó]n|garant[ií]a|guarantee|ute|insurance|seguro|classification|clasificaci[oó]n/i.test(String(value || ""));
}

function rowLooksAward(value) {
  return /price|precio|award|adjudicaci[oó]n|scor|puntuaci[oó]n|formula|f[oó]rmula|criterion|criterio|weight|ponderaci[oó]n|quality|calidad/i.test(String(value || ""));
}

function summarizePacket(packet) {
  const level3 = packet.level3 || {};
  const requirements = level3.requirements || {};
  const commercialFacts = level3.commercial_facts || {};
  const checks = [];

  if (level3.summary) checks.push(["summary", level3.summary.evidence || []]);
  if (level3.scope) checks.push(["scope", level3.scope.evidence || []]);
  for (const [name, fact] of Object.entries(commercialFacts)) {
    checks.push([`commercial.${name}`, fact && fact.evidence || []]);
  }
  checks.push(["requirements", requirements.evidence || []]);
  for (const group of requirements.groups || []) {
    for (const row of group.rows || []) {
      checks.push([`${group.title || "requirements"} / ${compact(row.item).slice(0, 48)}`, row.evidence || []]);
    }
  }

  const missingEvidenceBlocks = checks
    .filter(([, evidence]) => !Array.isArray(evidence) || !evidence.length || !hasDocPageEvidence(evidence))
    .map(([name]) => name);
  const blockers = ocrBlockers(packet);
  const criticalBlockers = blockers.filter((doc) => doc.critical);

  return {
    ok: true,
    reference: level3.contract_reference || packet.structured_facts && packet.structured_facts.contract_reference || null,
    confidence: Number(level3.confidence && level3.confidence.overall || 0),
    documents: Number(packet.coverage && packet.coverage.documents_downloaded || 0),
    pdfs: Number(packet.coverage && packet.coverage.pdfs_processed || 0),
    ocr_candidates: criticalBlockers.length,
    ocr_review_candidates: blockers.length,
    sections: packet.coverage && packet.coverage.sections_with_candidates || [],
    pipeline_mode: packet.source && packet.source.mode || "premium",
    summary: level3.summary && level3.summary.value || null,
    deadline: level3.timeline && level3.timeline.submission_deadline && level3.timeline.submission_deadline.value || null,
    missing_evidence_blocks: missingEvidenceBlocks,
  };
}

function ocrBlockers(packet) {
  const docs = Array.isArray(packet.documents) ? packet.documents : [];
  const evidenceKeys = new Set(
    collectEvidence(packet.level3 || {})
      .filter((item) => compact(item.doc_title))
      .flatMap((item) => [
        documentTitleKey(item.doc_title, item.doc_role || ""),
        documentTitleKey(item.doc_title, ""),
      ]),
  );
  const hasPreferredReadableDoc = docs.some((doc) =>
    preferredEvidenceRoles.has(String(doc.role || "")) &&
    !doc.ocr_candidate &&
    Number(doc.text_chars || 0) >= 500
  );
  return docs
    .filter((doc) => doc && doc.ocr_candidate)
    .map((doc) => {
      const role = String(doc.role || "");
      const textChars = Number(doc.text_chars || 0);
      const cited = evidenceKeys.has(documentTitleKey(doc.title || "", role)) || evidenceKeys.has(documentTitleKey(doc.title || "", ""));
      const preferred = preferredEvidenceRoles.has(role);
      const hardWithoutPreferredEvidence = textChars === 0 && !hasPreferredReadableDoc;
      const critical = Boolean(preferred || cited || hardWithoutPreferredEvidence);
      return {
        title: doc.title || null,
        role: role || null,
        pages_extracted: doc.pages_extracted || doc.page_count || null,
        text_chars: textChars,
        path: doc.path || null,
        severity: textChars === 0 ? "hard_ocr_blocker" : "partial_text_review",
        critical,
        critical_reason: critical
          ? (preferred ? "preferred_evidence_doc" : (cited ? "cited_by_evidence" : "hard_blocker_without_preferred_docs"))
          : "ancillary_document_has_preferred_evidence_available",
      };
    });
}

function operationalStatus(summary) {
  if (!summary.ok) return "failed";
  if (summary.pipeline_mode === "discovery" && summary.summary && summary.deadline) return "discovery_ready_structured";
  if (summary.documents === 0) return "needs_documents";
  if (summary.ocr_candidates > 0) {
    return summary.summary && summary.deadline ? "discovery_ready_needs_ocr" : "needs_ocr";
  }
  if (summary.confidence >= 0.75 && !summary.missing_evidence_blocks.length) return "premium_ready";
  if (summary.summary && summary.deadline) {
    return summary.missing_evidence_blocks.length ? "discovery_ready_needs_legal_review" : "discovery_ready_needs_confidence_review";
  }
  return "needs_source_data";
}

function loadTrainingIndex(root) {
  const file = path.join(root, "training-report.json");
  const byOut = new Map();
  const byReference = new Map();
  if (!fs.existsSync(file)) return { byOut, byReference, report: null };
  const report = readJson(file);
  for (const item of report.results || []) {
    if (item.out) byOut.set(path.resolve(item.out), item);
    if (item.reference) byReference.set(normalizeReference(item.reference), item);
  }
  return { byOut, byReference, report };
}

function addIssue(issues, severity, reason, section, details, input = null) {
  issues.push({
    severity,
    reason,
    section,
    component: section,
    details,
    deterministic: "deterministic",
    input,
  });
}

function validatePacket(packetFile, packet, statusItem, inventory) {
  const level3 = packet.level3 || {};
  const requirements = level3.requirements || {};
  const groups = Array.isArray(requirements.groups) ? requirements.groups : [];
  const rows = groups.flatMap((group) => (group.rows || []).map((row) => ({ group, row })));
  const reference = level3.contract_reference || packet.structured_facts && packet.structured_facts.contract_reference || statusItem && statusItem.reference || path.basename(path.dirname(packetFile));
  const computed = summarizePacket(packet);
  const reportedStatus = statusItem && statusItem.operational_status || null;
  const status = operationalStatus(computed);
  const isPremiumReady = status === "premium_ready";
  const failures = [];
  const warnings = [];
  const target = (severity, reason, section, details, input = null) => {
    addIssue(severity === "fail" ? failures : warnings, severity, reason, section, details, input);
  };
  const failIfPremium = (reason, section, details, input = null) => {
    target(isPremiumReady ? "fail" : "warn", reason, section, details, input);
  };

  if (!packet.schema || !String(packet.schema).startsWith("simplifae.ingestion")) {
    target("fail", "schema_missing", "packet", "premium.json does not expose the expected Simplifae ingestion schema", snippet({ schema: packet.schema }));
  }

  const docs = Array.isArray(packet.documents) ? packet.documents : [];
  const pdfDocs = docs.filter((doc) => String(doc.path || "").toLowerCase().endsWith(".pdf") || String(doc.content_type || "").includes("pdf"));
  if (!docs.length && packet.source && packet.source.mode !== "discovery") {
    failIfPremium("documents_missing", "Tender Documents", "Premium packet has no recovered tender documents", snippet({ source: packet.source }));
  }
  if (computed.documents > 0 && !pdfDocs.length && packet.source && packet.source.mode !== "discovery") {
    failIfPremium("pdf_documents_missing", "Tender Documents", "Documents were downloaded, but no PDF-like document is available for viewer evidence", snippet(docs.slice(0, 8)));
  }

  const sectionSet = new Set(computed.sections || []);
  const hasScopeEvidence = hasDocPageEvidence(level3.scope && level3.scope.evidence || []);
  const hasRequirementsEvidence = hasDocPageEvidence(requirements.evidence || []) || rows.some(({ row }) => hasDocPageEvidence(row.evidence || []));
  const admissionRows = rows.filter(({ row }) => row.type === "Admission");
  const awardRows = rows.filter(({ row }) => row.type === "Award criteria");
  const viewerCategories = [];
  if (hasScopeEvidence) viewerCategories.push("Detailed Scope");
  if (hasRequirementsEvidence) viewerCategories.push("Required Documents");
  if (admissionRows.length) viewerCategories.push("Admission Criteria");
  if (awardRows.length) viewerCategories.push("Award Criteria");

  if (!hasScopeEvidence) {
    failIfPremium("scope_evidence_missing", "Detailed Scope", "No exact document-page evidence is available for detailed scope", snippet(level3.scope || null));
  }
  if (sectionSet.has("admission") && !admissionRows.length) {
    failIfPremium("admission_rows_missing", "Admission Criteria", "Admission evidence candidates exist, but no Admission rows were produced", snippet(requirements));
  }
  if (sectionSet.has("award_criteria") && !awardRows.length) {
    failIfPremium("award_rows_missing", "Award Criteria", "Award criteria candidates exist, but no Award criteria rows were produced", snippet(requirements));
  }
  if (isPremiumReady && !viewerCategories.includes("Detailed Scope")) {
    target("fail", "premium_viewer_scope_category_missing", "document_viewer_evidence", "Premium-ready tender would not produce a Detailed Scope reference category");
  }
  if (isPremiumReady && rows.length && !viewerCategories.includes("Required Documents")) {
    target("fail", "premium_viewer_required_docs_category_missing", "document_viewer_evidence", "Premium-ready tender has requirement rows but no Required Documents reference category");
  }

  for (const issue of evidenceProblems(level3)) {
    failIfPremium("evidence_missing_doc_or_page", "document_evidence", "Evidence item is missing doc_title or positive page number", snippet(issue));
  }

  for (const group of groups) {
    const groupLabel = `${group.title || ""} ${group.description || ""}`;
    if (isMixedLabel(groupLabel)) {
      target("fail", "mixed_group_label", "required_documents", "Group label mixes admission and award concepts", snippet(group));
    }
  }

  for (const { group, row } of rows) {
    const rowInput = { group: group.title, description: group.description, row };
    const rowText = `${row.item || ""} ${row.type || ""} ${collectEvidence(row.evidence || []).map((e) => e.reason || "").join(" ")}`;
    if (!["Admission", "Award criteria"].includes(row.type)) {
      target("fail", "invalid_requirement_type", "required_documents", "Requirement row must use the Simplifae user-facing types Admission or Award criteria", snippet(rowInput));
    }
    if (hasRawRequirementText(row)) {
      target("fail", "raw_snippet_requirement", "required_documents", "Requirement row looks like a raw source snippet instead of a bid checklist item", snippet(rowInput));
    }
    if (isMixedLabel(rowText)) {
      target("fail", "mixed_award_admission_row", "required_documents", "Requirement row mixes award and admission concepts", snippet(rowInput));
    }
    if (!hasDocPageEvidence(row.evidence || [])) {
      failIfPremium("requirement_row_evidence_missing", "required_documents", "Requirement row lacks exact document-page evidence", snippet(rowInput));
    }
    if (row.type === "Admission" && rowLooksAward(rowText) && !rowLooksAdmission(rowText)) {
      target("warn", "admission_row_looks_award", "Admission Criteria", "Admission row may actually describe award evaluation", snippet(rowInput));
    }
    if (row.type === "Award criteria" && rowLooksAdmission(rowText) && !rowLooksAward(rowText)) {
      target("warn", "award_row_looks_admission", "Award Criteria", "Award row may actually describe admission requirements", snippet(rowInput));
    }
    if (row.type === "Award criteria" && /price|precio/i.test(rowText) && !compact(row.weight)) {
      target("warn", "price_criterion_weight_missing", "Award Criteria", "Price criterion has no visible weight; keep as review item unless the source omits it", snippet(rowInput));
    }
  }

  if (computed.ocr_candidates > 0 && isPremiumReady) {
    target("fail", "ocr_blocked_marked_premium_ready", "ocr", "OCR candidate tender must be downgraded until text extraction is complete", snippet({
      ocr_candidates: computed.ocr_candidates,
      ocr_candidate_titles: packet.coverage && packet.coverage.ocr_candidate_titles || [],
    }));
  }

  const mixedEvidence = collectEvidence(level3).filter((item) => isMixedLabel(item.reason || item.label || ""));
  if (mixedEvidence.length || /award\s*\/\s*admission|structured award\/admission/i.test(snippet(level3, 6000))) {
    target("fail", "forbidden_mixed_label_present", "semantic_classification", "Packet still contains a mixed award/admission label", snippet(level3, 1800));
  }

  const expectedViewerCategories = inventory.conceptual_categories
    .find((category) => category.id === "document_viewer_evidence")
    .allowed_categories;
  const unknownViewerCategories = viewerCategories.filter((category) => !expectedViewerCategories.includes(category));
  if (unknownViewerCategories.length) {
    target("fail", "unknown_viewer_category", "document_viewer_evidence", "Derived viewer category is outside the slow-method conceptual model", snippet({ viewerCategories, unknownViewerCategories }));
  }

  return {
    reference,
    id: path.basename(path.dirname(packetFile)),
    packet_file: packetFile,
    status,
    reported_status: reportedStatus,
    confidence: computed.confidence,
    documents: computed.documents,
    pdfs: computed.pdfs,
    ocr_candidates: computed.ocr_candidates,
    ocr_review_candidates: computed.ocr_review_candidates,
    ocr_blockers: ocrBlockers(packet),
    sections: computed.sections,
    viewer_categories: viewerCategories,
    failures,
    warnings,
  };
}

function main() {
  const root = argValue("--premium-root");
  if (!root) {
    console.error("Usage: node tools/simplifae-ingestion/quality_gate.js --premium-root <dir> [--out report.json]");
    return 2;
  }
  const inventoryFile = path.resolve(argValue("--inventory", path.join(__dirname, "simplifae_slow_method_inventory.json")));
  const outputFile = path.resolve(argValue("--out", path.join("reports", `simplifae-quality-gate-${Date.now()}.json`)));
  const minPremiumReady = Number(argValue("--min-premium-ready", "0"));
  const allowWarnings = hasFlag("--allow-warnings");
  const premiumRoot = path.resolve(root);
  const inventory = readJson(inventoryFile);
  const trainingIndex = loadTrainingIndex(premiumRoot);
  const packetFiles = findPremiumPackets(premiumRoot);
  const startedAt = new Date().toISOString();
  const results = [];

  for (const packetFile of packetFiles) {
    let packet;
    try {
      packet = readJson(packetFile);
    } catch (error) {
      results.push({
        reference: path.basename(path.dirname(packetFile)),
        id: path.basename(path.dirname(packetFile)),
        packet_file: packetFile,
        status: "failed",
        confidence: 0,
        documents: 0,
        pdfs: 0,
        ocr_candidates: 0,
        ocr_blockers: [],
        sections: [],
        viewer_categories: [],
        failures: [{
          severity: "fail",
          reason: "packet_json_parse_error",
          section: "packet",
          component: "premium.json",
          details: error.message,
          deterministic: "deterministic",
          input: packetFile,
        }],
        warnings: [],
      });
      continue;
    }
    const summary = summarizePacket(packet);
    const packetDir = path.resolve(path.dirname(packetFile));
    const statusItem = trainingIndex.byOut.get(packetDir) ||
      trainingIndex.byReference.get(normalizeReference(summary.reference)) ||
      null;
    results.push(validatePacket(packetFile, packet, statusItem, inventory));
  }

  const failures = results.flatMap((item) => item.failures.map((failure) => ({
    tender_id: item.id,
    reference: item.reference,
    status: item.status,
    ...failure,
  })));
  const warnings = results.flatMap((item) => item.warnings.map((warning) => ({
    tender_id: item.id,
    reference: item.reference,
    status: item.status,
    ...warning,
  })));
  const byReason = {};
  for (const failure of failures) byReason[failure.reason] = (byReason[failure.reason] || 0) + 1;
  const warningByReason = {};
  for (const warning of warnings) warningByReason[warning.reason] = (warningByReason[warning.reason] || 0) + 1;
  const premiumReady = results.filter((item) => item.status === "premium_ready").length;
  const ocrEnvironment = detectOcrEnvironment();
  const ocrBlockers = results
    .filter((item) => item.ocr_candidates > 0)
    .map((item) => {
      const criticalDocuments = item.ocr_blockers.filter((doc) => doc.critical);
      return {
        tender_id: item.id,
        reference: item.reference,
        status: item.status,
        confidence: item.confidence,
        ocr_candidates: item.ocr_candidates,
        hard_ocr_blockers: criticalDocuments.filter((doc) => doc.severity === "hard_ocr_blocker").length,
        partial_text_review: criticalDocuments.filter((doc) => doc.severity === "partial_text_review").length,
        documents: criticalDocuments,
      };
    });
  if (premiumReady < minPremiumReady) {
    failures.push({
      tender_id: "batch",
      reference: "batch",
      status: "batch",
      severity: "fail",
      reason: "premium_ready_below_minimum",
      section: "batch",
      component: "quality_gate",
      details: `Expected at least ${minPremiumReady} premium-ready tenders, got ${premiumReady}`,
      deterministic: "deterministic",
      input: { minPremiumReady, premiumReady },
    });
  }

  const report = {
    schema: "simplifae.quality.gate.v1",
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    premium_root: premiumRoot,
    inventory: inventoryFile,
    summary: {
      checked: results.length,
      failed_tenders: results.filter((item) => item.failures.length).length,
      failure_count: failures.length,
      warning_count: warnings.length,
      premium_ready: premiumReady,
      needs_review: results.filter((item) => item.status !== "premium_ready").length,
      ocr_blocked: results.filter((item) => item.ocr_candidates > 0).length,
      ocr_review_candidates: results.reduce((sum, item) => sum + Number(item.ocr_review_candidates || 0), 0),
      hard_ocr_blocked: ocrBlockers.filter((item) => item.hard_ocr_blockers > 0).length,
      partial_ocr_review: ocrBlockers.filter((item) => item.partial_text_review > 0).length,
      local_ocr_available: ocrEnvironment.local_ocr_available,
      failures_by_reason: byReason,
      warnings_by_reason: warningByReason,
      pass: failures.length === 0 && (allowWarnings || true),
    },
    results,
    failures,
    warnings,
    ocr_environment: ocrEnvironment,
    ocr_blockers: ocrBlockers,
  };
  report.summary.pass = failures.length === 0;
  writeJson(outputFile, report);
  console.log(JSON.stringify({ out: outputFile, ...report.summary }, null, 2));
  return failures.length ? 1 : 0;
}

process.exitCode = main();
