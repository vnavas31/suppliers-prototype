#!/usr/bin/env node
/* Deep semantic audit for Simplifae premium packets.
 *
 * quality_gate checks structural safety. This audit tries to catch the
 * uncomfortable product failures: generic rows, weak evidence pages, CPV
 * pollution, and "looks valid but is not useful enough" premium output.
 */

const fs = require("fs");
const path = require("path");

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1 || index + 1 >= process.argv.length) return fallback;
  return process.argv[index + 1];
}

function compact(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
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

function snippet(value, max = 1800) {
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

function isPreferredEvidenceRole(role) {
  return ["pcap", "ppt", "justification"].includes(String(role || "").toLowerCase());
}

function hasPreferredEvidenceDocs(packet) {
  return (Array.isArray(packet.documents) ? packet.documents : []).some((doc) => {
    const isPdf = String(doc && doc.path || "").toLowerCase().endsWith(".pdf") || String(doc && doc.content_type || "").includes("pdf");
    return isPdf && isPreferredEvidenceRole(doc && doc.role);
  });
}

function hasDocPageEvidence(value) {
  return collectEvidence(value).some((evidence) => compact(evidence.doc_title) && Number(evidence.page) > 0);
}

function summarizePacket(packet) {
  const level3 = packet.level3 || {};
  const requirements = level3.requirements || {};
  const commercialFacts = level3.commercial_facts || {};
  const checks = [];
  if (level3.summary) checks.push(["summary", level3.summary.evidence || []]);
  if (level3.scope) checks.push(["scope", level3.scope.evidence || []]);
  for (const [name, fact] of Object.entries(commercialFacts)) checks.push([`commercial.${name}`, fact && fact.evidence || []]);
  checks.push(["requirements", requirements.evidence || []]);
  for (const group of requirements.groups || []) {
    for (const row of group.rows || []) checks.push([`${group.title || "requirements"} / ${compact(row.item).slice(0, 48)}`, row.evidence || []]);
  }
  return {
    reference: level3.contract_reference || packet.structured_facts && packet.structured_facts.contract_reference || null,
    confidence: Number(level3.confidence && level3.confidence.overall || 0),
    documents: Number(packet.coverage && packet.coverage.documents_downloaded || 0),
    pdfs: Number(packet.coverage && packet.coverage.pdfs_processed || 0),
    ocrCandidates: Number(packet.coverage && packet.coverage.ocr_candidates || 0),
    sections: packet.coverage && packet.coverage.sections_with_candidates || [],
    pipelineMode: packet.source && packet.source.mode || "premium",
    summary: level3.summary && level3.summary.value || null,
    deadline: level3.timeline && level3.timeline.submission_deadline && level3.timeline.submission_deadline.value || null,
    missingEvidenceBlocks: checks
      .filter(([, evidence]) => !Array.isArray(evidence) || !evidence.length || !hasDocPageEvidence(evidence))
      .map(([name]) => name),
  };
}

function operationalStatus(summary) {
  if (summary.pipelineMode === "discovery" && summary.summary && summary.deadline) return "discovery_ready_structured";
  if (summary.documents === 0) return "needs_documents";
  if (summary.ocrCandidates > 0) return summary.summary && summary.deadline ? "discovery_ready_needs_ocr" : "needs_ocr";
  if (summary.confidence >= 0.75 && !summary.missingEvidenceBlocks.length) return "premium_ready";
  if (summary.summary && summary.deadline) return summary.missingEvidenceBlocks.length ? "discovery_ready_needs_legal_review" : "discovery_ready_needs_confidence_review";
  return "needs_source_data";
}

function loadTrainingIndex(root) {
  const file = path.join(root, "training-report.json");
  const byOut = new Map();
  const byReference = new Map();
  if (!fs.existsSync(file)) return { byOut, byReference };
  const report = readJson(file);
  for (const item of report.results || []) {
    if (item.out) byOut.set(path.resolve(item.out), item);
    if (item.reference) byReference.set(normalizeReference(item.reference), item);
  }
  return { byOut, byReference };
}

function addIssue(bucket, severity, reason, section, details, input = null) {
  bucket.push({
    severity,
    reason,
    section,
    component: section,
    details,
    deterministic: "deterministic",
    input,
  });
}

function looksLikeIndex(text) {
  const value = compact(text).slice(0, 900);
  const hasSubstantiveCriteria = /criteri[oa]s?\s+d[’'e]\s*adjudicaci[oó]|criterios?\s+de\s+adjudicaci[oó]n|ponderaci[oó]|puntuaci[oó]|relaci[oó]\s+qualitat-preu|precio|preu/i.test(value);
  if (hasSubstantiveCriteria && !/\b(índex|indice|índice|index|sumario|contents)\b/i.test(value)) return false;
  return /\b(índex|indice|índice|index|sumario|contents)\b/i.test(value) || /\.{5,}/.test(value);
}

function looksLikeBoilerplate(text) {
  return /ley\s+9\/2017|directiva\s+2014\/24|reglamento\s+general|disposici[oó]n\s+adicional|LCSP|RGLCAP/i.test(text) &&
    !/objeto|objecte|alcance|abast|solv|deuc|criter|precio|preu|ponderaci/i.test(text);
}

function looksLikeSignatureBoilerplate(text) {
  return /c[oó]digo\s+de\s+verificaci[oó]n|verficaci[oó]n\s+de\s+la\s+integridad|firma\s+electr[oó]nica|documento\s+firmado\s+por|fecha\/hora|validaciondoc/i.test(text);
}

function looksLikeWeakScopeText(text) {
  const value = compact(text);
  if (!value) return true;
  const hasOperationalNoun = /(?:servicio|suministro|obra|gesti[oó]n|explotaci[oó]n|instalaci[oó]n|puesta\s+en\s+marcha|mantenimiento|recogida|transporte|equipamiento|residuos|saneamiento|drenaje|fundici[oó]n|telecomunicaciones|atenci[oó]n\s+telef[oó]nica)/i.test(value);
  if (value.length < 24) return true;
  if (value.length < 48 && !hasOperationalNoun) return true;
  if (/^(?:ayuntamiento|ajuntament|administraci[oó]n|administració|entidad|òrgan|órgano)\b.{0,90}\bcaso,\s*se\s+exigir[aá]/i.test(value)) return true;
  if (/^caso,\s*se\s+exigir[aá]\s+al\s+adjudicatario/i.test(value)) return true;
  if (/^(?:ayuntamiento|ajuntament|administraci[oó]n|administració|entidad|òrgan|órgano)\b/i.test(value) && !/(?:suministro|servicio|obra|gesti[oó]n|explotaci[oó]n|instalaci[oó]n|puesta\s+en\s+marcha|mantenimiento|recogida|transporte|equipamiento|residuos)/i.test(value.slice(0, 160))) {
    return true;
  }
  return false;
}

function genericRequirementItem(item) {
  return /described in the tender documents|required by the tender documents|when required by the technical specifications|stated in the tender documents|referenced by the tender notice|bidder admission declarations and participation requirements|economic\/financial and technical\/professional solvency accreditation required by the tender documents/i.test(item);
}

function expectedAwardCriteriaFromText(text) {
  const value = compact(text);
  const expected = new Map();
  const add = (kind, label, weight) => {
    const numeric = Number(weight);
    if (!Number.isFinite(numeric) || numeric <= 0 || numeric > 100) return;
    const normalizedKind = kind || compact(label).toLowerCase().slice(0, 80);
    if (/total|puntuaci[oó]n\s+m[aá]xima/i.test(label || "")) return;
    expected.set(normalizedKind, {
      kind: normalizedKind,
      label: compact(label),
      weight: String(numeric),
    });
  };
  for (const match of value.matchAll(/(oferta\s+econ[oó]mica|oferta\s+econ[oò]mica|precio|preu)\s*:?\s*(?:precio\s*)?(?:hasta\s+)?(\d{1,3})\s*(?:puntos?|punts?|pts?)\b/gi)) {
    add("price", match[1], match[2]);
  }
  for (const match of value.matchAll(/(mejora(?:\s*[:\-]\s*|\s+)[^.;]{0,140}?)(?:subtipo\s+criterio\s*:?\s*|hasta\s+)(\d{1,3})\s*(?:puntos?|punts?|pts?)?\b/gi)) {
    add(compact(match[1]).toLowerCase(), match[1], match[2]);
  }
  return Array.from(expected.values());
}

function expectedAwardCriteriaFromPacket(packet, rows) {
  const snippets = [];
  const candidates = packet.premium_evidence_candidates && packet.premium_evidence_candidates.award_criteria || [];
  for (const item of candidates) snippets.push(item && item.snippet || "");
  for (const { row } of rows) {
    for (const evidence of collectEvidence(row.evidence || [])) snippets.push(evidence.snippet || "");
  }
  const byKey = new Map();
  for (const found of expectedAwardCriteriaFromText(snippets.join(" "))) {
    byKey.set(`${found.kind}:${found.weight}`, found);
  }
  return Array.from(byKey.values());
}

function rowSemanticTerms(row) {
  const text = `${row.item || ""} ${row.type || ""} ${row.weight || ""}`.toLowerCase();
  if (row.type === "Award criteria") return [/precio|price|preu|oferta\s+econ|criter|adjudic|ponderaci|puntuaci|formula|f[oó]rmula/i, "award/price/scoring terms"];
  if (/deuc|espd/i.test(text)) return [/\bdeuc\b|documento\s+europeo|document\s+europeu|espd/i, "DEUC/ESPD terms"];
  if (/solv/i.test(text)) return [/solv[eèé]nc|clasificaci|classificaci|sailkapen/i, "solvency/classification terms"];
  if (/capacity|eligibility|prohibition|capacidad|aptitud|absence/i.test(text)) {
    return [/capacidad|capacitat|aptitud|prohibici|habilitaci|contractar|gaitasun|debekurik|debeku|eratuta|eraketa/i, "capacity/eligibility terms"];
  }
  if (/guarantee|garant/i.test(text)) return [/garant[ií]a|garantia|guarantee|aval/i, "guarantee terms"];
  return [null, ""];
}

function suspiciousCpvList(cpvs) {
  const list = Array.isArray(cpvs) ? cpvs.map(String) : [];
  const suspicious = list.filter((cpv) => /^0{4,}/.test(cpv) || /^77777777/.test(cpv));
  return {
    count: list.length,
    suspicious,
    polluted: list.length > 12 || suspicious.length > 0,
  };
}

function validatePacket(packetFile, packet, statusItem) {
  const level3 = packet.level3 || {};
  const requirements = level3.requirements || {};
  const groups = Array.isArray(requirements.groups) ? requirements.groups : [];
  const rows = groups.flatMap((group) => (group.rows || []).map((row) => ({ group, row })));
  const computed = summarizePacket(packet);
  const status = statusItem && statusItem.operational_status || operationalStatus(computed);
  const isPremium = status === "premium_ready";
  const failures = [];
  const warnings = [];
  const target = (severity, reason, section, details, input = null) => addIssue(severity === "fail" ? failures : warnings, severity, reason, section, details, input);
  const strict = (reason, section, details, input = null) => target(isPremium ? "fail" : "warn", reason, section, details, input);
  const preferredEvidenceDocsAvailable = hasPreferredEvidenceDocs(packet);

  const cpvAudit = suspiciousCpvList(level3.cpvs || packet.structured_facts && packet.structured_facts.cpvs || []);
  if (cpvAudit.polluted) {
    strict("cpv_pollution", "Discovery/Header CPV", "CPV list looks polluted by non-CPV numeric tokens or too many codes.", cpvAudit);
  }

  const summary = compact(level3.summary && level3.summary.value);
  if (/auto-drafted|downloaded tender documents|source object retained|source extraction/i.test(summary)) {
    strict("generic_summary", "Tender summary", "Summary contains processing boilerplate instead of a factual contract-object summary.", { summary });
  }
  if (summary && summary.length > 160 && !/[.!?)]$/.test(summary)) {
    target("warn", "truncated_summary", "Tender summary", "Summary appears truncated rather than deliberately summarized.", { summary });
  }

  const scopeEvidence = collectEvidence(level3.scope && level3.scope.evidence || []);
  const scopeTexts = [
    level3.scope && level3.scope.no_lots_reason,
    ...((level3.scope && level3.scope.items || []).map((item) => item && item.item)),
    ...((level3.scope && level3.scope.lots || []).flatMap((lot) => [
      lot && lot.title,
      lot && lot.description,
      ...((lot && lot.items || []).map((item) => item && item.item)),
    ])),
  ].map(compact).filter(Boolean);
  const sourceScopeCorpus = compact([
    packet.structured_facts && packet.structured_facts.title,
    packet.structured_facts && packet.structured_facts.description,
    ...scopeEvidence.map((item) => item && item.snippet),
  ].join(" "));
  for (const text of scopeTexts) {
    if (looksLikeSignatureBoilerplate(text)) {
      strict("scope_contains_signature_boilerplate", "Detailed Scope", "Detailed Scope text contains signature/CSV boilerplate instead of operational scope.", { scopeText: text });
    }
    if (looksLikeWeakScopeText(text)) {
      strict("scope_text_not_operational", "Detailed Scope", "Detailed Scope text is too weak or starts mid-boilerplate instead of describing the contract object.", { scopeText: text });
    }
    if (/\b(?:btk|phytosanitary|pine\s+processionary|procesionaria|fitosanitarios?)\b/i.test(text) && !/\b(?:btk|phytosanitary|pine\s+processionary|procesionaria|fitosanitarios?)\b/i.test(sourceScopeCorpus)) {
      strict("scope_cross_tender_contamination", "Detailed Scope", "Detailed Scope appears to contain domain language from an unrelated hardcoded case.", { scopeText: text, sourceScopeCorpus: sourceScopeCorpus.slice(0, 500) });
    }
  }
  if (preferredEvidenceDocsAvailable) {
    const nonPreferredScopeEvidence = scopeEvidence.filter((item) => item.doc_role && !isPreferredEvidenceRole(item.doc_role));
    if (nonPreferredScopeEvidence.length) {
      strict("scope_evidence_not_from_pcap_ppt_mj", "Detailed Scope", "Detailed Scope evidence must prefer PCAP/PPT/Memoria when those documents were recovered.", nonPreferredScopeEvidence.slice(0, 4));
    }
  }
  for (const evidence of scopeEvidence) {
    const text = compact(evidence.snippet);
    if (looksLikeIndex(text)) {
      strict("scope_evidence_points_to_index", "Detailed Scope", "Scope evidence points to an index/table-of-contents page instead of substantive scope text.", evidence);
    }
    if (looksLikeBoilerplate(text)) {
      strict("scope_evidence_legal_boilerplate", "Detailed Scope", "Scope evidence looks like legal boilerplate rather than contract object/scope.", evidence);
    }
    if (looksLikeSignatureBoilerplate(text) && !/objeto|objecte|prestaci[oó]n|gesti[oó]n|explotaci[oó]n|servicio|residuos|obras|suministro/i.test(text)) {
      strict("scope_evidence_signature_boilerplate", "Detailed Scope", "Scope evidence snippet is dominated by signature/CSV boilerplate.", evidence);
    }
  }

  if (preferredEvidenceDocsAvailable) {
    const requirementEvidence = [
      ...collectEvidence(requirements.evidence || []),
      ...rows.flatMap(({ row }) => collectEvidence(row.evidence || [])),
    ];
    const nonPreferredRequirementEvidence = requirementEvidence.filter((item) => item.doc_role && !isPreferredEvidenceRole(item.doc_role));
    if (nonPreferredRequirementEvidence.length) {
      strict("required_documents_evidence_not_from_pcap_ppt_mj", "Required Documents", "Required Documents evidence must prefer PCAP/PPT/Memoria when those documents were recovered.", nonPreferredRequirementEvidence.slice(0, 6));
    }
  }

  for (const { group, row } of rows) {
    const item = compact(row.item);
    const input = { group: group.title, description: group.description, row };
    if (genericRequirementItem(item)) {
      strict("generic_requirement_row", "Required Documents", "Requirement row is too generic for slow-method quality.", input);
    }
    for (const evidence of collectEvidence(row.evidence || [])) {
      const text = compact(evidence.snippet);
      if (looksLikeIndex(text)) {
        strict("requirement_evidence_points_to_index", "Required Documents", "Requirement evidence points to an index/table-of-contents page.", { row, evidence });
      }
      const [pattern, expected] = rowSemanticTerms(row);
      if (pattern && text && !pattern.test(text)) {
        strict("requirement_evidence_semantic_mismatch", "Required Documents", `Evidence snippet does not contain expected ${expected}.`, { row, evidence });
      }
    }
  }

  const awardRows = rows.filter(({ row }) => row.type === "Award criteria");
  const expectedAwardCriteria = expectedAwardCriteriaFromPacket(packet, rows);
  if (expectedAwardCriteria.length >= 2) {
    const rowWeights = new Set(awardRows.map(({ row }) => compact(row.weight).replace(/\s*(pts?|points?|punts?)$/i, "")));
    const missingWeights = expectedAwardCriteria.filter((criterion) => !rowWeights.has(criterion.weight));
    if (awardRows.length < expectedAwardCriteria.length || missingWeights.length) {
      strict("award_criteria_split_missing", "Award Criteria", "Source evidence contains multiple explicit scoring criteria, but the extracted rows do not preserve that split.", {
        expected: expectedAwardCriteria,
        rows: awardRows.map(({ group, row }) => ({ group: group.title, row })),
      });
    }
  }
  for (const { row, group } of awardRows) {
    const text = `${row.item || ""} ${row.weight || ""}`;
    const weight = compact(row.weight);
    if (!compact(row.weight) || row.weight === "—") {
      strict("award_weight_missing", "Award Criteria", "Award criteria row lacks scoring weight.", { group: group.title, row });
    }
    if (/price|precio|preu|oferta/i.test(text) && !/^([1-9]\d?|100)(\s*(pts?|points?|punts?))?$/i.test(weight)) {
      target("warn", "price_weight_not_numeric", "Award Criteria", "Price row does not expose a numeric weight.", { group: group.title, row });
    }
  }

  if (isPremium && computed.sections.includes("admission") && !rows.some(({ row }) => row.type === "Admission")) {
    target("fail", "premium_missing_admission_rows", "Admission Criteria", "Premium tender has admission candidates but no Admission rows.", snippet(requirements));
  }
  if (isPremium && computed.sections.includes("award_criteria") && !awardRows.length) {
    target("fail", "premium_missing_award_rows", "Award Criteria", "Premium tender has award candidates but no Award criteria rows.", snippet(requirements));
  }

  return {
    reference: computed.reference || path.basename(path.dirname(packetFile)),
    tender_id: path.basename(path.dirname(packetFile)),
    packet_file: packetFile,
    status,
    confidence: computed.confidence,
    documents: computed.documents,
    pdfs: computed.pdfs,
    ocr_candidates: computed.ocrCandidates,
    sections: computed.sections,
    failures,
    warnings,
  };
}

function main() {
  const premiumRoot = argValue("--premium-root");
  if (!premiumRoot) {
    console.error("Usage: node tools/simplifae-ingestion/semantic_quality_audit.js --premium-root <dir> --out <report.json>");
    return 2;
  }
  const outFile = path.resolve(argValue("--out", path.join("reports", `simplifae-semantic-audit-${Date.now()}.json`)));
  const root = path.resolve(premiumRoot);
  const training = loadTrainingIndex(root);
  const results = [];
  for (const packetFile of findPremiumPackets(root)) {
    let packet;
    try {
      packet = readJson(packetFile);
    } catch (error) {
      results.push({
        reference: path.basename(path.dirname(packetFile)),
        tender_id: path.basename(path.dirname(packetFile)),
        packet_file: packetFile,
        status: "failed",
        confidence: 0,
        documents: 0,
        pdfs: 0,
        ocr_candidates: 0,
        sections: [],
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
    const computed = summarizePacket(packet);
    const statusItem = training.byOut.get(path.resolve(path.dirname(packetFile))) ||
      training.byReference.get(normalizeReference(computed.reference)) ||
      null;
    results.push(validatePacket(packetFile, packet, statusItem));
  }
  const failures = results.flatMap((item) => item.failures.map((failure) => ({
    reference: item.reference,
    tender_id: item.tender_id,
    status: item.status,
    ...failure,
  })));
  const warnings = results.flatMap((item) => item.warnings.map((warning) => ({
    reference: item.reference,
    tender_id: item.tender_id,
    status: item.status,
    ...warning,
  })));
  const byReason = {};
  failures.forEach((failure) => {
    byReason[failure.reason] = (byReason[failure.reason] || 0) + 1;
  });
  const warningsByReason = {};
  warnings.forEach((warning) => {
    warningsByReason[warning.reason] = (warningsByReason[warning.reason] || 0) + 1;
  });
  const report = {
    schema: "simplifae.quality.semantic-audit.v1",
    created_at: new Date().toISOString(),
    premium_root: root,
    summary: {
      checked: results.length,
      failed_tenders: results.filter((item) => item.failures.length).length,
      failure_count: failures.length,
      warning_count: warnings.length,
      failures_by_reason: byReason,
      warnings_by_reason: warningsByReason,
      pass: failures.length === 0,
    },
    results,
    failures,
    warnings,
  };
  writeJson(outFile, report);
  console.log(JSON.stringify({ out: outFile, ...report.summary }, null, 2));
  return failures.length ? 1 : 0;
}

process.exitCode = main();
