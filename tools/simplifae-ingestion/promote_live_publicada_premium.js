#!/usr/bin/env node
/* Promote live-publicada premium packets into the Simplifae prototype. */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

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

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function sanitizeKey(value, fallback = "doc") {
  const cleaned = String(value || fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return cleaned || fallback;
}

function sanitizeViewerKey(value) {
  return String(value || "current-tender")
    .trim()
    .replace(/[^\w-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "current-tender";
}

function tenderViewerKeys(ref, item) {
  const keys = [
    ref,
    item && item.tenderReference,
    item && item.id,
    item && item.sourceRecordId,
  ].filter((value) => String(value || "").trim()).map(sanitizeViewerKey);
  return Array.from(new Set(keys));
}

function normalizeTenderReference(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
}

function compactWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function truncate(value, max = 220) {
  const text = compactWhitespace(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3).replace(/\s+\S*$/, "")}...`;
}

function humanBytes(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return "Unknown size";
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(value >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
  return `${Math.max(1, Math.round(value / 1024))} KB`;
}

function roleLabel(role) {
  const value = String(role || "").toLowerCase();
  if (value.includes("pcap")) return "PCAP";
  if (value.includes("ppt")) return "PPT";
  if (value.includes("justification")) return "MJ";
  if (value.includes("contract_notice")) return "Contract Notice";
  if (value.includes("pliegos")) return "Tender Documents Summary";
  return "Tender PDF";
}

function iconType(role) {
  const value = String(role || "").toLowerCase();
  if (value.includes("pcap")) return "pcap";
  if (value.includes("ppt")) return "ppt";
  return "other";
}

function docSub(role) {
  const label = roleLabel(role);
  if (label === "PCAP") return "Administrative clauses, admission requirements and award criteria.";
  if (label === "PPT") return "Technical specifications and service or works scope.";
  if (label === "MJ") return "Justification report with need, value, scope and procurement rationale.";
  if (label === "Contract Notice") return "Official notice with structured tender facts and publication details.";
  return "Source document recovered from the tender publication.";
}

function collectEvidence(value, output = []) {
  if (!value) return output;
  if (Array.isArray(value)) {
    value.forEach((item) => collectEvidence(item, output));
    return output;
  }
  if (typeof value === "object") {
    if (value.doc_title || value.doc_role || value.page || value.label) output.push(value);
    Object.values(value).forEach((item) => collectEvidence(item, output));
  }
  return output;
}

function loadLiveItems(liveFile) {
  const code = fs.readFileSync(liveFile, "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox);
  return sandbox.window.SIMPLIFAE_LIVE_PUBLICADA_OPPORTUNITIES || [];
}

function defaultGateFile(premiumRoot, fileName) {
  return path.join(path.dirname(premiumRoot), fileName);
}

function requireFile(file, label) {
  if (!file || !fs.existsSync(file)) {
    throw new Error(`${label} is required before promotion. Missing file: ${file || "(not provided)"}`);
  }
  return file;
}

function assertReport(reportFile, expectedSchema, label, premiumRoot) {
  const report = readJson(requireFile(reportFile, label));
  if (report.schema !== expectedSchema) {
    throw new Error(`${label} has unexpected schema: ${report.schema || "(missing)"}`);
  }
  if (!report.summary || report.summary.pass !== true) {
    throw new Error(`${label} did not pass; promotion is blocked. Summary: ${JSON.stringify(report.summary || {})}`);
  }
  if (report.premium_root && path.resolve(report.premium_root) !== path.resolve(premiumRoot)) {
    throw new Error(`${label} was produced for a different premium root: ${report.premium_root}`);
  }
  return report;
}

function loadPromotionGates(premiumRoot) {
  if (hasFlag("--allow-unsafe-promotion")) {
    console.warn("WARNING: --allow-unsafe-promotion bypasses Simplifae promotion gates. Use only for throwaway local experiments.");
    return {
      unsafe: true,
      quality: null,
      semantic: null,
      parity: null,
      manifest: null,
      eligiblePacketFiles: null,
      qualityByPacketFile: new Map(),
      qualityByReference: new Map(),
    };
  }

  const qualityReportFile = path.resolve(argValue("--quality-report", defaultGateFile(premiumRoot, "quality-gate.json")));
  const semanticReportFile = path.resolve(argValue("--semantic-report", defaultGateFile(premiumRoot, "semantic-audit.json")));
  const parityReportFile = path.resolve(argValue("--parity-report", defaultGateFile(premiumRoot, "golden-parity.json")));
  const packetManifestFile = path.resolve(argValue("--packet-manifest", defaultGateFile(premiumRoot, "packet-manifest.json")));

  const quality = assertReport(qualityReportFile, "simplifae.quality.gate.v1", "quality_gate report", premiumRoot);
  const semantic = assertReport(semanticReportFile, "simplifae.quality.semantic-audit.v1", "semantic audit report", premiumRoot);
  const parity = assertReport(parityReportFile, "simplifae.quality.golden-parity.v1", "golden parity report", premiumRoot);
  const manifest = assertReport(packetManifestFile, "simplifae.packet-manifest.v1", "canonical packet manifest", premiumRoot);

  const qualityByPacketFile = new Map();
  const qualityByReference = new Map();
  for (const result of quality.results || []) {
    if (result.packet_file) qualityByPacketFile.set(path.resolve(result.packet_file), result);
    if (result.reference) qualityByReference.set(normalizeTenderReference(result.reference), result);
  }
  const eligiblePacketFiles = new Set(
    (manifest.packets || [])
      .filter((packet) => packet.promotion_eligible && packet.status === "premium_ready")
      .map((packet) => path.resolve(packet.packet_file))
  );

  return {
    unsafe: false,
    files: {
      qualityReportFile,
      semanticReportFile,
      parityReportFile,
      packetManifestFile,
    },
    quality,
    semantic,
    parity,
    manifest,
    eligiblePacketFiles,
    qualityByPacketFile,
    qualityByReference,
  };
}

function findPremiumPackets(premiumRoot) {
  return fs.readdirSync(premiumRoot)
    .map((name) => path.join(premiumRoot, name, "premium.json"))
    .filter((file) => fs.existsSync(file));
}

function byTitlePdfDocs(packet) {
  const map = new Map();
  for (const doc of packet.documents || []) {
    const docPath = String(doc.path || "");
    const isPdf = String(doc.content_type || "").includes("pdf") || docPath.toLowerCase().endsWith(".pdf");
    if (!isPdf || !fs.existsSync(docPath)) continue;
    const title = String(doc.title || path.basename(docPath, path.extname(docPath)));
    if (!map.has(title)) map.set(title, []);
    map.get(title).push(doc);
  }
  return map;
}

function pickDocs(packet) {
  const titleMap = byTitlePdfDocs(packet);
  const evidenceTitles = new Set(
    collectEvidence(packet.level3 || {})
      .map((item) => String(item.doc_title || "").trim())
      .filter(Boolean)
  );
  const selected = [];
  const seenPaths = new Set();
  for (const title of evidenceTitles) {
    const docs = titleMap.get(title) || [];
    for (const doc of docs) {
      if (!seenPaths.has(doc.path)) {
        selected.push(doc);
        seenPaths.add(doc.path);
      }
    }
  }

  const priority = { contract_notice: 1, pliegos_summary: 2, pcap: 3, ppt: 4, justification: 5 };
  const pdfs = Array.from(titleMap.values()).flat()
    .sort((a, b) => (priority[a.role] || 20) - (priority[b.role] || 20));
  for (const doc of pdfs) {
    if (selected.length >= 8) break;
    if (!seenPaths.has(doc.path)) {
      selected.push(doc);
      seenPaths.add(doc.path);
    }
  }
  return selected;
}

function mapDocKeyFactory(item, docs) {
  const assigned = new Map();
  const used = new Set();
  docs.forEach((doc, index) => {
    const base = `${item.id}-${roleLabel(doc.role)}-${doc.title || index}`;
    let key = sanitizeKey(base, `${item.id}-doc-${index + 1}`);
    let suffix = 2;
    while (used.has(key)) {
      key = `${sanitizeKey(base)}-${suffix}`;
      suffix += 1;
    }
    used.add(key);
    assigned.set(doc.path, key);
  });
  return {
    getByPath: (docPath) => assigned.get(docPath),
    getByTitle: (title, role) => {
      const docsForTitle = docs.filter((doc) => String(doc.title || "") === String(title || ""));
      const roleMatch = docsForTitle.find((doc) => !role || String(doc.role || "") === String(role || ""));
      const doc = roleMatch || docsForTitle[0];
      return doc ? assigned.get(doc.path) : null;
    },
  };
}

function evidenceToRef(evidence, keyForTitle) {
  const label = compactWhitespace(evidence.label || evidence.source || evidence.reason || "Source evidence");
  const docKey = keyForTitle(String(evidence.doc_title || ""), String(evidence.doc_role || ""));
  return {
    docKey,
    page: Number(evidence.page) || 1,
    label,
  };
}

function usableRefs(evidence, keyForTitle) {
  return (Array.isArray(evidence) ? evidence : [])
    .map((item) => evidenceToRef(item, keyForTitle))
    .filter((item) => item.docKey);
}

function viewerRefsFromEvidence(evidence, keyForTitle, type, label) {
  return usableRefs(evidence, keyForTitle).map((ref) => ({
    docKey: ref.docKey,
    type,
    label: truncate(label || ref.label || type, 140),
    page: ref.page,
    source: ref.label || "Source evidence",
  }));
}

function addAvailablePage(pages, page, pageCount) {
  const value = Number(page);
  const max = Number(pageCount || 1);
  if (!Number.isFinite(value) || value < 1) return;
  if (Number.isFinite(max) && max > 0 && value > max) return;
  pages.add(Math.floor(value));
}

function evidencePageWindow(page, pageCount) {
  const current = Number(page) || 1;
  return [current - 1, current, current + 1].filter((candidate) => {
    const max = Number(pageCount || 1);
    return candidate >= 1 && (!Number.isFinite(max) || max < 1 || candidate <= max);
  });
}

function assignAvailablePages(viewerDocs, docKeys, evidenceRefs) {
  const pageSets = new Map();
  for (const docKey of docKeys) {
    const doc = viewerDocs[docKey];
    if (!doc) continue;
    const pages = new Set();
    addAvailablePage(pages, 1, doc.pageCount);
    addAvailablePage(pages, doc.defaultPage || 1, doc.pageCount);
    pageSets.set(docKey, pages);
  }

  for (const ref of evidenceRefs || []) {
    const doc = viewerDocs[ref.docKey];
    const pages = pageSets.get(ref.docKey);
    if (!doc || !pages) continue;
    for (const page of evidencePageWindow(ref.page, doc.pageCount)) {
      addAvailablePage(pages, page, doc.pageCount);
    }
  }

  let packagedPages = 0;
  for (const [docKey, pages] of pageSets.entries()) {
    const doc = viewerDocs[docKey];
    const availablePages = Array.from(pages).sort((a, b) => a - b);
    doc.availablePages = availablePages;
    doc.partialPagePackage = true;
    packagedPages += availablePages.length;
  }
  return packagedPages;
}

function isMixedEvidenceReason(value) {
  return /award\/admission|admission\/award|structured\s+award/i.test(String(value || ""));
}

function isRequiredDocumentEvidence(value) {
  return /envelope|sobre|archivo|submission|preparaci[oó]n|preparation|guarantee|garant/i.test(String(value || ""));
}

function buildViewerEvidenceRefs(level3, keyForTitle) {
  const refs = [];
  const scope = level3.scope || {};
  const summary = level3.summary || {};
  const requirements = level3.requirements || {};
  const commercial = level3.commercial_facts || {};

  refs.push(...viewerRefsFromEvidence(
    scope.evidence || summary.evidence || [],
    keyForTitle,
    "Detailed Scope",
    "Contract object, lot structure and execution context"
  ));

  for (const evidenceItem of requirements.evidence || []) {
    const reason = evidenceItem && (evidenceItem.reason || evidenceItem.label || "");
    if (isMixedEvidenceReason(reason) || !isRequiredDocumentEvidence(reason)) continue;
    refs.push(...viewerRefsFromEvidence([evidenceItem], keyForTitle, "Required Documents", reason || "Envelope / submission structure"));
  }

  for (const [field, label] of [
    ["provisional_guarantee", "Provisional guarantee requirement"],
    ["definitive_guarantee", "Definitive guarantee requirement"],
  ]) {
    const fact = commercial[field] || {};
    if (/needs\s+source\s+verification/i.test(String(fact.value || "")) || Number(fact.confidence || 0) < 0.5) continue;
    refs.push(...viewerRefsFromEvidence(fact.evidence || [], keyForTitle, "Required Documents", label));
  }

  for (const group of requirements.groups || []) {
    for (const row of group.rows || []) {
      const rowType = String(row.type || "").toLowerCase();
      const type = rowType.includes("award") ? "Award Criteria" : "Admission Criteria";
      const suffix = type === "Award Criteria" && row.weight ? ` (${row.weight})` : "";
      refs.push(...viewerRefsFromEvidence(row.evidence || [], keyForTitle, type, `${rewriteRequirementItem(row)}${suffix}`));
    }
  }

  const seen = new Set();
  return refs.filter((ref) => {
    if (!ref.docKey || isMixedEvidenceReason(ref.type) || isMixedEvidenceReason(ref.label)) return false;
    const key = `${ref.type}::${ref.label}::${ref.docKey}::${ref.page}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function evidenceLabel(evidence) {
  const ev = Array.isArray(evidence) && evidence.length ? evidence[0] : null;
  if (!ev) return "Document-backed source";
  return compactWhitespace(ev.label || ev.reason || "Document-backed source");
}

function rewriteRequirementItem(row) {
  const item = compactWhitespace(row.item);
  if (/bidder admission declarations and participation requirements listed/i.test(item)) {
    return "Participation declarations and admission documents required by the notice or PCAP.";
  }
  if (/economic\/financial and technical\/professional solvency evidence/i.test(item)) {
    return "Economic/financial and technical/professional solvency accreditation required by the PCAP.";
  }
  if (/economic\/financial and technical\/professional solvency requirements referenced/i.test(item)) {
    return "Economic/financial and technical/professional solvency requirements referenced by the tender notice.";
  }
  if (/economic offer submitted in the formula-evaluable envelope/i.test(item)) {
    return "Economic offer/proposition submitted under the PCAP formula-evaluable rules.";
  }
  return item || "Requirement extracted from source documents.";
}

function buildRequirements(level3, keyForTitle) {
  const source = level3.requirements || {};
  const groups = (source.groups || []).map((group) => {
    const rows = (group.rows || []).map((row) => {
      const refs = usableRefs(row.evidence || [], keyForTitle);
      return {
        item: rewriteRequirementItem(row),
        type: row.type || "Requirement",
        weight: row.weight || "—",
        source: evidenceLabel(row.evidence || []),
        sourceKey: refs[0] && refs[0].docKey,
        sourceRefs: refs,
      };
    }).filter((row) => row.sourceRefs.length);
    return {
      title: group.title || "Envelope",
      description: group.description || "",
      rows,
    };
  }).filter((group) => group.rows.length);
  if (!groups.length) return null;
  const rowCount = groups.reduce((sum, group) => sum + group.rows.length, 0);
  return {
    preview: `${groups.length} evidence group${groups.length === 1 ? "" : "s"} · ${rowCount} bid item${rowCount === 1 ? "" : "s"}`,
    previewSub: "Source-backed from recovered tender documents",
    groups,
  };
}

function buildScope(item, level3, keyForTitle) {
  const source = level3.scope || {};
  const cpvs = Array.isArray(level3.cpvs) ? level3.cpvs : [];
  const evidence = usableRefs(source.evidence || level3.summary && level3.summary.evidence || [], keyForTitle);
  const lots = (source.lots || []).map((lot, index) => ({
    title: lot.title || `Lot ${index + 1}`,
    cpvs: Array.isArray(lot.cpvs) ? lot.cpvs : cpvs,
    format: "bullets",
    items: (lot.items && lot.items.length ? lot.items : [{
      item: truncate(lot.description || lot.title || level3.summary && level3.summary.value || item.originalDescription || item.title, 180),
      quantitySpec: lot.budget || lot.value || "Document-backed scope",
      unit: item.contractType || "Scope",
    }]).map((scopeItem) => ({
      item: truncate(scopeItem.item || scopeItem.description || lot.description || lot.title, 180),
      quantitySpec: scopeItem.quantitySpec || scopeItem.quantity || lot.budget || "Document-backed scope",
      unit: scopeItem.unit || item.contractType || "Scope",
    })),
  }));
  if (lots.length) {
    return { format: "lots", presentation: "bullets", cpvs, lots, evidence };
  }
  const sourceItems = Array.isArray(source.items) ? source.items.map((scopeItem) => ({
    item: truncate(scopeItem.item || scopeItem.description || "", 220),
    quantitySpec: scopeItem.quantitySpec || scopeItem.quantity || "Document-backed scope",
    unit: scopeItem.unit || item.contractType || "Scope",
  })).filter((scopeItem) => scopeItem.item) : [];
  if (sourceItems.length) {
    return {
      format: "bullets",
      cpvs,
      items: sourceItems,
      evidence,
    };
  }
  const scopeText = source.no_lots_reason || level3.summary && level3.summary.value || item.originalDescription || item.title;
  return {
    format: "bullets",
    cpvs,
    items: [{
      item: truncate(scopeText, 220),
      quantitySpec: source.count ? `${source.count} lot${source.count === 1 ? "" : "s"}` : "Document-backed scope",
      unit: item.contractType || "Scope",
    }],
    evidence,
  };
}

function firstValue(obj, names) {
  for (const name of names) {
    const value = obj && obj[name] && obj[name].value;
    if (value) return value;
  }
  return null;
}

function firstSource(obj, names) {
  for (const name of names) {
    const source = obj && obj[name] && obj[name].provenance;
    if (source === "structured" || source === "document") return source;
  }
  return undefined;
}

function buildOverride(item, packet, docs, keyForTitle, viewerTenderKey) {
  const level3 = packet.level3 || {};
  const commercial = level3.commercial_facts || {};
  const documents = docs.map((doc) => ({
    docKey: keyForTitle(doc.title, doc.role),
    iconType: iconType(doc.role),
    name: `${roleLabel(doc.role)} — ${doc.title || path.basename(doc.path)}`,
    meta: [humanBytes(doc.bytes), roleLabel(doc.role), "PDF", doc.page_count ? `${doc.page_count} pages` : "Source document"],
    sourceUrl: doc.source_url || "",
  }));
  const scope = buildScope(item, level3, keyForTitle);
  const requirements = buildRequirements(level3, keyForTitle);
  return {
    id: item.id,
    reference: item.tenderReference,
    viewerTenderKey,
    objectSummary: level3.summary && level3.summary.value || item.originalDescription || item.objectSummary,
    estimatedValue: firstValue(commercial, ["estimated_contract_value"]) || item.estimatedValue,
    duration: firstValue(commercial, ["duration"]) || item.duration,
    provisional: firstValue(commercial, ["provisional_guarantee"]) || item.provisional,
    guarantee: firstValue(commercial, ["definitive_guarantee"]) || item.guarantee,
    documentsPreview: `${documents.length} docs · source-backed`,
    documents,
    scope,
    requirements,
    provenance: {
      commercialFacts: {
        estimatedValue: firstSource(commercial, ["estimated_contract_value"]) || "structured",
        duration: firstSource(commercial, ["duration"]) || "document",
        provisional: firstSource(commercial, ["provisional_guarantee"]) || "document",
        guarantee: firstSource(commercial, ["definitive_guarantee"]) || "document",
      },
      evidenceSections: {
        scope: scope && scope.evidence && scope.evidence.length ? "document" : undefined,
        requiredDocuments: requirements ? "document" : undefined,
        tenderDocuments: documents.length ? "document" : undefined,
        contractingAuthority: "structured",
      },
    },
  };
}

function jsAssign(name, value) {
  return `window.${name} = ${JSON.stringify(value, null, 2)};\n`;
}

function skippedProcessingStatus(status) {
  const value = String(status || "").trim();
  if (value && value !== "premium_ready") return value;
  return "discovery_ready_needs_review";
}

function buildPromotionStatus(entry) {
  const qualityStatus = entry.quality && entry.quality.status || entry.packet && entry.packet.status || null;
  const promoted = Boolean(entry.promotionEligible);
  const processingStatus = promoted ? "premium_ready" : skippedProcessingStatus(qualityStatus);
  return {
    id: entry.item.id,
    reference: entry.item.tenderReference,
    packetReference: entry.ref || entry.packet && entry.packet.structured_facts && entry.packet.structured_facts.contract_reference || null,
    promoted,
    promotionEligible: promoted,
    processingStatus,
    qualityStatus: qualityStatus || processingStatus,
    confidence: entry.quality && entry.quality.confidence || entry.packet && entry.packet.level3 && entry.packet.level3.confidence || null,
    reason: promoted ? "promoted" : "not_promotion_eligible",
  };
}

function main() {
  const root = path.resolve(argValue("--root", process.cwd()));
  const liveFile = path.resolve(root, argValue("--live-file", "discovery-v2/live-publicada-20260504.js"));
  const premiumRoot = path.resolve(argValue("--premium-root", "/tmp/simplifae-ingestion/training-live-publicada-50-workers6-v10-status"));
  const docsOut = path.resolve(root, argValue("--docs-out", "discovery-v2/docs/live-publicada"));
  const detailOut = path.resolve(root, argValue("--detail-out", "discovery-v2/live-publicada-premium-overrides.js"));
  const viewerOut = path.resolve(root, argValue("--viewer-out", "discovery-v2/live-publicada-viewer-docs.js"));
  const reportOut = argValue("--out-report", null);
  let gates;
  try {
    gates = loadPromotionGates(premiumRoot);
  } catch (error) {
    console.error(`Promotion gate failed: ${error.message}`);
    return 1;
  }

  ensureDir(docsOut);
  const liveItems = loadLiveItems(liveFile);
  const liveByRef = new Map(liveItems.map((item) => [String(item.tenderReference || ""), item]));
  const liveByNormalizedRef = new Map(liveItems.map((item) => [normalizeTenderReference(item.tenderReference), item]));
  const liveByUrl = new Map(liveItems.map((item) => [String(item.sourceUrl || ""), item]));
  const packets = findPremiumPackets(premiumRoot)
    .map((file) => ({ file, packet: JSON.parse(fs.readFileSync(file, "utf8")) }))
    .map(({ file, packet }) => ({
      file,
      packet,
      ref: packet.level3 && packet.level3.contract_reference || packet.structured_facts && packet.structured_facts.contract_reference,
    }))
    .map((entry) => ({
      ...entry,
      item: liveByRef.get(String(entry.ref || "")) ||
        liveByNormalizedRef.get(normalizeTenderReference(entry.ref)) ||
        liveByUrl.get(String(entry.packet.source && entry.packet.source.url || "")),
    }))
    .map((entry) => ({
      ...entry,
      quality: gates.qualityByPacketFile.get(path.resolve(entry.file)) ||
        gates.qualityByReference.get(normalizeTenderReference(entry.ref)) ||
        null,
      promotionEligible: gates.unsafe || gates.eligiblePacketFiles.has(path.resolve(entry.file)),
    }))
    .filter((entry) => entry.item);

  const promotionStatusById = {};
  for (const entry of packets) {
    promotionStatusById[entry.item.id] = buildPromotionStatus(entry);
  }

  const skipped = packets
    .filter((entry) => !entry.promotionEligible)
    .map((entry) => ({
      reference: entry.ref || entry.packet && entry.packet.structured_facts && entry.packet.structured_facts.contract_reference || path.basename(path.dirname(entry.file)),
      packet: entry.file,
      status: promotionStatusById[entry.item.id] && promotionStatusById[entry.item.id].processingStatus || "not_premium_ready",
      reason: "not_promotion_eligible",
    }));
  const eligiblePackets = packets.filter((entry) => entry.promotionEligible);
  if (!eligiblePackets.length && !hasFlag("--allow-empty-promotion")) {
    console.error(JSON.stringify({
      error: "No premium-ready packets are eligible for promotion.",
      skipped: skipped.slice(0, 20),
      quality_summary: gates.quality && gates.quality.summary || null,
      manifest_summary: gates.manifest && gates.manifest.summary || null,
    }, null, 2));
    return 1;
  }

  const detailOverrides = {};
  const indexDocs = {};
  const viewerDocs = {};
  const tenderDocKeys = {};
  const evidenceRefsByTender = {};
  const contextByTender = {};
  const report = [];

  for (const { packet, ref, item } of eligiblePackets) {
    const docs = pickDocs(packet);
    const keyMap = mapDocKeyFactory(item, docs);
    const keyForTitle = (title, role) => keyMap.getByTitle(title, role);
    const copiedDocs = [];

    for (const doc of docs) {
      const docKey = keyMap.getByPath(doc.path);
      const outName = `${docKey}${path.extname(doc.path).toLowerCase() || ".pdf"}`;
      const outPath = path.join(docsOut, outName);
      fs.copyFileSync(doc.path, outPath);
      copiedDocs.push(docKey);
      const viewerDoc = {
        title: `${roleLabel(doc.role)} — ${doc.title || path.basename(doc.path)}`,
        short: roleLabel(doc.role),
        meta: [humanBytes(doc.bytes), roleLabel(doc.role), "PDF", doc.page_count ? `${doc.page_count} pages` : "Source document"],
        file: `docs/live-publicada/${outName}`,
        pageDir: `doc-pages/live-publicada/${docKey}`,
        pageCount: Number(doc.page_count) || 1,
        defaultPage: 1,
        refs: [],
      };
      viewerDocs[docKey] = viewerDoc;
      indexDocs[docKey] = {
        title: viewerDoc.title,
        sub: docSub(doc.role),
        shortLabel: viewerDoc.short,
        sourceUrlLabel: `${viewerDoc.short} source`,
        defaultPage: 1,
      };
    }

    const viewerKeys = tenderViewerKeys(ref, item);
    const primaryViewerKey = viewerKeys[0] || sanitizeViewerKey(item.tenderReference || item.id || ref);
    const override = buildOverride(item, packet, docs, keyForTitle, primaryViewerKey);
    const evidenceRefs = buildViewerEvidenceRefs(packet.level3 || {}, keyForTitle);
    const packagedPages = assignAvailablePages(viewerDocs, copiedDocs, evidenceRefs);
    const viewerContext = {
      match: `${item.match || 0}%`,
      reference: item.tenderReference,
      title: item.title,
    };
    detailOverrides[item.id] = override;
    viewerKeys.forEach((viewerKey) => {
      tenderDocKeys[viewerKey] = copiedDocs;
      evidenceRefsByTender[viewerKey] = evidenceRefs;
      contextByTender[viewerKey] = viewerContext;
    });
    report.push({
      id: item.id,
      reference: ref,
      viewerKeys,
      copiedDocs: copiedDocs.length,
      packagedPages,
      requirements: override.requirements ? override.requirements.groups.reduce((n, g) => n + g.rows.length, 0) : 0,
      scopeEvidence: override.scope && override.scope.evidence ? override.scope.evidence.length : 0,
    });
  }

  fs.writeFileSync(detailOut, [
    jsAssign("SIMPLIFAE_LIVE_PUBLICADA_PREMIUM_DETAILS", detailOverrides),
    jsAssign("SIMPLIFAE_LIVE_PUBLICADA_PROMOTION_STATUS", promotionStatusById),
  ].join("\n"), "utf8");
  fs.writeFileSync(viewerOut, [
    jsAssign("SIMPLIFAE_LIVE_PUBLICADA_INDEX_DOCS", indexDocs),
    jsAssign("SIMPLIFAE_LIVE_PUBLICADA_VIEWER_DOCS", viewerDocs),
    jsAssign("SIMPLIFAE_LIVE_PUBLICADA_TENDER_DOC_KEYS", tenderDocKeys),
    jsAssign("SIMPLIFAE_LIVE_PUBLICADA_EVIDENCE_REFS_BY_TENDER", evidenceRefsByTender),
    jsAssign("SIMPLIFAE_LIVE_PUBLICADA_CONTEXT_BY_TENDER", contextByTender),
  ].join("\n"), "utf8");

  const outputReport = {
    promoted: report.length,
    skipped: skipped.length,
    gate: gates.unsafe ? { unsafe: true } : {
      quality_report: gates.files.qualityReportFile,
      semantic_report: gates.files.semanticReportFile,
      parity_report: gates.files.parityReportFile,
      packet_manifest: gates.files.packetManifestFile,
      premium_ready: gates.quality.summary && gates.quality.summary.premium_ready,
      promotion_eligible: gates.manifest.summary && gates.manifest.summary.promotion_eligible,
    },
    docsCopied: report.reduce((sum, item) => sum + item.copiedDocs, 0),
    packagedPages: report.reduce((sum, item) => sum + item.packagedPages, 0),
    detailOut,
    viewerOut,
    report,
    skippedReport: skipped,
    promotionStatusOut: detailOut,
  };
  if (reportOut) {
    fs.mkdirSync(path.dirname(path.resolve(reportOut)), { recursive: true });
    fs.writeFileSync(path.resolve(reportOut), JSON.stringify(outputReport, null, 2), "utf8");
  }
  console.log(JSON.stringify(outputReport, null, 2));
  return 0;
}

process.exitCode = main();
