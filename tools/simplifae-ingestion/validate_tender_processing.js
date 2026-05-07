#!/usr/bin/env node
/* Validate Simplifae tender processing and Tender Detail rendering end to end. */

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

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".js") return "text/javascript; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".svg") return "image/svg+xml";
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
      const { port } = server.address();
      resolve({ server, url: `http://127.0.0.1:${port}/discovery-v2/?screen=discovery` });
    });
  });
}

function classifyDeterminism(runs) {
  const failedRuns = runs.filter((run) => run.failures.length || run.events.length || run.exception);
  if (!failedRuns.length) return "none";
  if (failedRuns.length === runs.length) return "deterministic";
  return "intermittent";
}

async function validateTender(page, id, runIndex) {
  const events = [];
  const consoleHandler = (message) => {
    if (["error", "warning"].includes(message.type())) {
      events.push({ type: message.type(), text: message.text() });
    }
  };
  const pageErrorHandler = (error) => {
    events.push({ type: "pageerror", text: error.message, stack: error.stack });
  };
  page.on("console", consoleHandler);
  page.on("pageerror", pageErrorHandler);

  const result = await page.evaluate(async ({ id, runIndex }) => {
    const openId = /^\d+$/.test(String(id)) ? Number(id) : id;
    const failures = [];
    const sectionText = {};
    let exception = null;

    function text(selector) {
      const el = document.querySelector(selector);
      return el ? (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim() : "";
    }

    function exists(selector) {
      return Boolean(document.querySelector(selector));
    }

    function compactDigits(value) {
      return String(value || "").replace(/\D/g, "");
    }

    function isSourceBacked(source) {
      return source === "structured" || source === "document";
    }

    function hasGenericFastEvidenceText(value) {
      return /auto-drafted|downloaded tender documents|source object retained|source extraction|source opportunity record|based on the downloaded tender documents|bidder admission declarations and participation requirements listed|economic\/financial and technical\/professional solvency evidence|economic offer submitted in the formula-evaluable envelope|contract scope \/ lot structure|formula-evaluable offer envelope/i.test(String(value || ""));
    }

    function hasRawSnippetRequirementText(row) {
      const item = String(row && row.item || "");
      if (/^Objeto\s+del\s+Contrato\b|^Descripci[oó]n\s+del\s+procedimiento\b/i.test(item)) return true;
      if (/servicios\s+tal\s+y\s+como\s+establece\s+el\s+art[ií]culo\s+15\b/i.test(item)) return true;
      if (/\.\.\.$/.test(item.trim())) return true;
      if (item.length > 220) return true;
      return false;
    }

    function failureInputSnippet(value) {
      try {
        return JSON.stringify(value).slice(0, 1200);
      } catch (_error) {
        return String(value || "").slice(0, 1200);
      }
    }

    try {
      if (typeof window.openTender !== "function") {
        throw new Error("window.openTender is not available");
      }
      window.openTender(openId);
    } catch (error) {
      exception = { message: error.message, stack: error.stack };
    }

    await new Promise((resolve) => setTimeout(resolve, 80));

    const staticDetail = typeof TENDER_DATA !== "undefined" ? TENDER_DATA[openId] : null;
    const detail = (window.IMPORTED_TENDER_DATA && window.IMPORTED_TENDER_DATA[id]) ||
      staticDetail ||
      null;
    const isStaticDetail = Boolean(detail && detail === staticDetail);
    const opportunity = (window.SIMPLIFAE_LIVE_PUBLICADA_OPPORTUNITIES || []).find((item) => item.id === id) ||
      (typeof IMPORTED_OPPORTUNITIES !== "undefined" ? IMPORTED_OPPORTUNITIES.find((item) => item.id === id) : null) ||
      null;

    const selectors = {
      title: "#td-title",
      scope: "#td-scope-render",
      requiredDocuments: "#td-doc-review-body",
      tenderDocuments: "#td-sec-pliegos .td-docs-grid",
      authority: "#td-auth-organisation",
    };
    for (const [section, selector] of Object.entries(selectors)) {
      sectionText[section] = text(selector).slice(0, 600);
      if (!exists(selector)) {
        failures.push({
          section,
          component: selector,
          reason: "missing_dom_node",
          details: `Expected Tender Detail section node ${selector}`,
        });
      }
    }

    if (exception) {
      failures.push({
        section: "openTender",
        component: "window.openTender",
        reason: "exception",
        details: exception.message,
      });
    }

    if (!detail) {
      failures.push({
        section: "adapter",
        component: "window.IMPORTED_TENDER_DATA",
        reason: "missing_detail_model",
        details: `No detail model generated for ${id}`,
      });
    } else {
      const provenance = detail.provenance || {};
      const evidenceSections = provenance.evidenceSections || {};
      const commercialFacts = provenance.commercialFacts || {};
      const documents = Array.isArray(detail.documents) ? detail.documents : [];
      const requirements = detail.requirements || null;
      const scope = detail.scope || null;
      const knownDocs = typeof TD_TENDER_DOCS !== "undefined" ? TD_TENDER_DOCS : {};
      const livePremiumOverride = window.SIMPLIFAE_LIVE_PUBLICADA_PREMIUM_DETAILS && window.SIMPLIFAE_LIVE_PUBLICADA_PREMIUM_DETAILS[id];
      const livePromotionStatus = window.SIMPLIFAE_LIVE_PUBLICADA_PROMOTION_STATUS && window.SIMPLIFAE_LIVE_PUBLICADA_PROMOTION_STATUS[id];
      const recoverableSourceDocs = [
        ...(opportunity && Array.isArray(opportunity.documents) ? opportunity.documents : []),
        ...(livePremiumOverride && Array.isArray(livePremiumOverride.documents) ? livePremiumOverride.documents : []),
      ].filter((doc) => doc && (doc.sourceUrl || doc.docKey));
      const expectsViewerBackedDocs = Boolean(
        livePremiumOverride ||
        livePromotionStatus && livePromotionStatus.promoted ||
        opportunity && opportunity.processingStatus === "premium_ready" ||
        isSourceBacked(evidenceSections.tenderDocuments)
      );
      const liveViewerDocKeys = window.SIMPLIFAE_LIVE_PUBLICADA_TENDER_DOC_KEYS || {};
      const viewerTenderKey = typeof tdGetViewerTenderKey === "function"
        ? tdGetViewerTenderKey()
        : String(detail.viewerTenderKey || detail.tenderReference || id || "").replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "");
      const hasLocalViewerDocs = documents.some((doc) => doc && doc.docKey && !doc.externalOnly);

      if (expectsViewerBackedDocs && !documents.length && recoverableSourceDocs.length) {
        failures.push({
          section: "Tender Documents",
          component: "premium promotion",
          reason: "recoverable_documents_not_promoted",
          details: "Tender has recoverable source documents, but Tender Detail still has no local viewer-backed documents",
          input: failureInputSnippet(recoverableSourceDocs.slice(0, 8)),
        });
      }
      if ((livePremiumOverride || livePromotionStatus && livePromotionStatus.promoted) && hasLocalViewerDocs && !liveViewerDocKeys[viewerTenderKey]) {
        failures.push({
          section: "Document viewer",
          component: "tdGetViewerTenderKey",
          reason: "viewer_tender_key_not_registered",
          details: `Tender Detail opens viewer with tender key "${viewerTenderKey}", but live-publicada viewer docs do not register that key`,
          input: failureInputSnippet({
            id,
            viewerTenderKey,
            detailViewerTenderKey: detail.viewerTenderKey,
            tenderReference: detail.tenderReference,
            registeredKeySample: Object.keys(liveViewerDocKeys).slice(0, 20),
          }),
        });
      }
      if (livePromotionStatus && !livePromotionStatus.promoted && opportunity && opportunity.processingStatus === "premium_ready") {
        failures.push({
          section: "Discovery state",
          component: "SIMPLIFAE_LIVE_PUBLICADA_PROMOTION_STATUS",
          reason: "skipped_tender_still_marked_premium_ready",
          details: "A tender rejected by the promotion gate is still exposed as premium_ready in the UI model",
          input: failureInputSnippet({ promotionStatus: livePromotionStatus, opportunityProcessingStatus: opportunity.processingStatus }),
        });
      }
      if (detail.title && sectionText.title && sectionText.title !== detail.title) {
        failures.push({
          section: "hero",
          component: "#td-title",
          reason: "title_mismatch",
          details: `Rendered "${sectionText.title}" but expected "${detail.title}"`,
        });
      }

      if (hasGenericFastEvidenceText(detail.objectSummary || detail.summaryText)) {
        failures.push({
          section: "hero",
          component: "objectSummary",
          reason: "generic_fast_summary",
          details: "Tender summary contains fast-processing boilerplate instead of a user-facing object summary",
          input: failureInputSnippet({ objectSummary: detail.objectSummary, summaryText: detail.summaryText }),
        });
      }

      const refDigits = compactDigits(detail.tenderReference).slice(0, 8);
      const cpvs = [];
      if (Array.isArray(detail.cpvs)) cpvs.push(...detail.cpvs);
      if (Array.isArray(scope && scope.cpvs)) cpvs.push(...scope.cpvs);
      if (Array.isArray(scope && scope.lots)) {
        for (const lot of scope.lots) {
          if (Array.isArray(lot.cpvs)) cpvs.push(...lot.cpvs);
        }
      }
      for (const cpv of cpvs) {
        const cpvDigits = compactDigits(cpv).slice(0, 8);
        if (refDigits && cpvDigits && refDigits === cpvDigits) {
          failures.push({
            section: "scope",
            component: "cpv",
            reason: "reference_used_as_cpv",
            details: `Tender reference ${detail.tenderReference} leaked into CPV list as ${cpv}`,
          });
        }
      }

      if (isSourceBacked(evidenceSections.tenderDocuments) && !documents.length) {
        failures.push({
          section: "Tender Documents",
          component: "tdRenderTenderDocumentsSection",
          reason: "document_provenance_without_documents",
          details: "tenderDocuments is source-backed but detail.documents is empty",
        });
      }

      if (isSourceBacked(evidenceSections.tenderDocuments) && documents.length && documents.every((doc) => doc && doc.externalOnly)) {
        failures.push({
          section: "Tender Documents",
          component: "tdRenderTenderDocumentRows",
          reason: "source_backed_documents_not_viewer_backed",
          details: "Tender Documents is marked source-backed, but every document is external-only and cannot open the prototype viewer",
          input: failureInputSnippet(documents.map((doc) => ({
            docKey: doc && doc.docKey,
            name: doc && doc.name,
            externalOnly: doc && doc.externalOnly,
            sourceUrl: doc && doc.sourceUrl,
          }))),
        });
      }

      for (const doc of documents) {
        const docKey = doc && doc.docKey;
        const externalOnly = Boolean(doc && doc.externalOnly);
        if (docKey && !externalOnly && !knownDocs[docKey]) {
          failures.push({
            section: "Tender Documents",
            component: "tdRenderTenderDocumentRows",
            reason: "unknown_document_key",
            details: `Document row uses unknown docKey "${docKey}"`,
          });
        }
      }

      if (!isStaticDetail && !isSourceBacked(evidenceSections.tenderDocuments) && !documents.length && !/Docs required|Upload tender documents/i.test(sectionText.tenderDocuments)) {
        failures.push({
          section: "Tender Documents",
          component: "#td-sec-pliegos",
          reason: "missing_docs_required_state",
          details: "No documents exist, but the UI did not show the Docs required state",
        });
      }

      if (isSourceBacked(evidenceSections.requiredDocuments)) {
        const groups = Array.isArray(requirements && requirements.groups) ? requirements.groups : [];
        const rows = groups.flatMap((group) => Array.isArray(group.rows) ? group.rows : []);
        if (!groups.length || !rows.length) {
          failures.push({
            section: "Required documents",
            component: "tdRenderRequiredDocsSection",
            reason: "requirements_provenance_without_rows",
            details: "requiredDocuments is source-backed but no requirement rows exist",
          });
        }
        for (const row of rows) {
          if (hasGenericFastEvidenceText(row.item || row.source || row.type || row.weight)) {
            failures.push({
              section: "Required documents",
              component: "requirements.groups.rows",
              reason: "generic_source_backed_requirement",
              details: `Source-backed requirement row is generic boilerplate: "${row.item || row.source || "row"}"`,
              input: failureInputSnippet(row),
            });
          }
          if (hasRawSnippetRequirementText(row)) {
            failures.push({
              section: "Required documents",
              component: "requirements.groups.rows",
              reason: "raw_snippet_requirement",
              details: `Source-backed requirement row appears to be an unnormalised source snippet: "${row.item || "row"}"`,
              input: failureInputSnippet(row),
            });
          }
          if (row.type === "Award criteria" && /price|precio|preu|economic offer|oferta econ/i.test(String(row.item || "")) && (!row.weight || row.weight === "—")) {
            failures.push({
              section: "Required documents",
              component: "requirements.groups.rows",
              reason: "award_price_missing_weight",
              details: `Price award criterion is missing its weight: "${row.item || "row"}"`,
              input: failureInputSnippet(row),
            });
          }
          const refs = Array.isArray(row.sourceRefs) && row.sourceRefs.length
            ? row.sourceRefs
            : [{ docKey: row.sourceKey, label: row.source, externalOnly: false }];
          for (const ref of refs) {
            const docKey = ref && ref.docKey;
            const externalOnly = Boolean(ref && ref.externalOnly);
            if (externalOnly) {
              failures.push({
                section: "Required documents",
                component: "tdRenderSourceRefChips",
                reason: "source_backed_requirement_not_viewer_backed",
                details: `Requirement source is external-only and cannot navigate the prototype viewer for "${row.item || "row"}"`,
                input: failureInputSnippet({ row, ref }),
              });
            }
            if (docKey && !externalOnly && !knownDocs[docKey]) {
              failures.push({
                section: "Required documents",
                component: "tdRenderSourceRefChips",
                reason: "unknown_source_doc_key",
                details: `Requirement source uses unknown docKey "${docKey}" for "${row.item || "row"}"`,
              });
            }
          }
        }
      }

      if (isSourceBacked(evidenceSections.scope)) {
        const hasScope = Boolean(scope && (
          (Array.isArray(scope.items) && scope.items.length) ||
          (Array.isArray(scope.lots) && scope.lots.length) ||
          (Array.isArray(scope.cpvs) && scope.cpvs.length)
        ));
        if (!hasScope) {
          failures.push({
            section: "Review detailed scope",
            component: "tdRenderScopeSection",
            reason: "scope_provenance_without_scope_model",
            details: "scope is source-backed but no scope model exists",
          });
        }
        const scopeItems = [
          ...(Array.isArray(scope && scope.items) ? scope.items : []),
          ...(Array.isArray(scope && scope.lots) ? scope.lots.flatMap((lot) => Array.isArray(lot.items) ? lot.items : []) : []),
        ];
        const renderedScopeBullets = document.querySelectorAll("#td-scope-render .td-scope-bullet-list li").length;
        if (scopeItems.length && renderedScopeBullets < scopeItems.length) {
          failures.push({
            section: "Review detailed scope",
            component: "tdRenderScopeSection",
            reason: "source_backed_scope_not_rendered_as_bullets",
            details: `Detailed Scope should render as concise bullets; expected at least ${scopeItems.length}, found ${renderedScopeBullets}`,
            input: failureInputSnippet({
              format: scope && scope.format,
              presentation: scope && scope.presentation,
              scopeItems: scopeItems.slice(0, 8),
              renderedScopeText: sectionText.scope,
            }),
          });
        }
        for (const item of scopeItems) {
          if (hasGenericFastEvidenceText(item.item || item.quantitySpec || item.unit)) {
            failures.push({
              section: "Review detailed scope",
              component: "scope.items",
              reason: "generic_source_backed_scope",
              details: `Source-backed scope item is generic boilerplate: "${item.item || "scope item"}"`,
              input: failureInputSnippet(item),
            });
          }
        }
        const scopeRefs = Array.isArray(scope && scope.evidence) ? scope.evidence : [];
        for (const ref of scopeRefs) {
          const docKey = ref && typeof ref === "object" ? ref.docKey : null;
          const externalOnly = Boolean(ref && typeof ref === "object" && ref.externalOnly);
          if (externalOnly) {
            failures.push({
              section: "Review detailed scope",
              component: "tdRenderScopeEvidenceChips",
              reason: "source_backed_scope_not_viewer_backed",
              details: "Scope evidence is external-only and cannot navigate the prototype viewer",
              input: failureInputSnippet(ref),
            });
          }
          if (docKey && !externalOnly && !knownDocs[docKey]) {
            failures.push({
              section: "Review detailed scope",
              component: "tdRenderScopeEvidenceChips",
              reason: "unknown_scope_doc_key",
              details: `Scope evidence uses unknown docKey "${docKey}"`,
            });
          }
        }
      }

      for (const field of ["estimatedValue", "duration", "provisional", "guarantee"]) {
        const value = detail[field];
        const source = commercialFacts[field];
        if (isSourceBacked(source) && !String(value || "").trim()) {
          failures.push({
            section: "Commercial header",
            component: field,
            reason: "commercial_provenance_without_value",
            details: `${field} is ${source} but has no value`,
          });
        }
      }

      if (/Port of Barcelona logistics|APB-STEEL|Supply and installation of industrial steel structures/i.test(sectionText.tenderDocuments) && id !== "1") {
        failures.push({
          section: "Tender Documents",
          component: "#td-sec-pliegos",
          reason: "default_document_library_leak",
          details: "Tender Documents section appears to show the static default tender library",
        });
      }
    }

    return {
      id,
      runIndex,
      reference: detail && detail.tenderReference || opportunity && opportunity.tenderReference || null,
      processingStatus: opportunity && opportunity.processingStatus || null,
      confidence: opportunity && opportunity.confidence || null,
      promotionStatus: (window.SIMPLIFAE_LIVE_PUBLICADA_PROMOTION_STATUS && window.SIMPLIFAE_LIVE_PUBLICADA_PROMOTION_STATUS[id]) || null,
      failures,
      exception,
      sectionText,
      input: {
        id,
        reference: opportunity && opportunity.tenderReference || detail && detail.tenderReference || null,
        title: opportunity && opportunity.title || detail && detail.title || null,
        processingStatus: opportunity && opportunity.processingStatus || null,
        promotionStatus: (window.SIMPLIFAE_LIVE_PUBLICADA_PROMOTION_STATUS && window.SIMPLIFAE_LIVE_PUBLICADA_PROMOTION_STATUS[id]) || null,
        provenance: detail && detail.provenance || opportunity && opportunity.provenance || null,
        sourceKind: isStaticDetail ? "static" : "imported",
        documentsCount: detail && Array.isArray(detail.documents) ? detail.documents.length : 0,
        requirementGroups: detail && detail.requirements && Array.isArray(detail.requirements.groups) ? detail.requirements.groups.length : 0,
        scopeItems: detail && detail.scope && Array.isArray(detail.scope.items) ? detail.scope.items.length : 0,
        scopeLots: detail && detail.scope && Array.isArray(detail.scope.lots) ? detail.scope.lots.length : 0,
      },
    };
  }, { id, runIndex });

  const viewerNavigationFailures = await validateViewerNavigation(page, id);
  result.failures.push(...viewerNavigationFailures);

  page.off("console", consoleHandler);
  page.off("pageerror", pageErrorHandler);
  return { ...result, events };
}

async function validateViewerNavigation(page, id) {
  const shouldValidateViewer = await page.evaluate(({ id }) => {
    const openId = /^\d+$/.test(String(id)) ? Number(id) : id;
    const isSourceBacked = (source) => source === "structured" || source === "document";
    const detail = (window.IMPORTED_TENDER_DATA && window.IMPORTED_TENDER_DATA[id]) ||
      (typeof TENDER_DATA !== "undefined" ? TENDER_DATA[openId] : null) ||
      null;
    const sections = detail && detail.provenance && detail.provenance.evidenceSections || {};
    return Boolean(
      isSourceBacked(sections.tenderDocuments) ||
      isSourceBacked(sections.requiredDocuments) ||
      isSourceBacked(sections.scope)
    );
  }, { id });

  if (!shouldValidateViewer) return [];

  await page.evaluate(() => {
    ["#td-sec-scope", "#td-sec-docs", "#td-sec-pliegos"].forEach((selector) => {
      const section = document.querySelector(selector);
      if (section) section.classList.add("open");
    });
  });

  const failures = [];
  const sourceChip = page.locator("button.td-doc-review-source-chip:visible, button.td-scope-source-chip:visible").first();
  const sourceChipCount = await sourceChip.count();
  const documentViewButton = page.getByRole("button", { name: /^View$/ }).first();
  const viewButtonCount = await documentViewButton.count();
  const target = sourceChipCount ? sourceChip : documentViewButton;

  if (!sourceChipCount && !viewButtonCount) {
    return [{
      section: "Document viewer",
      component: "viewer navigation",
      reason: "missing_viewer_navigation_control",
      details: "Source-backed tender detail has no local viewer button or source chip to open document-viewer.html",
      input: { id },
    }];
  }

  const popupPromise = page.waitForEvent("popup", { timeout: 3000 }).catch(() => null);
  try {
    await target.click({ timeout: 3000 });
  } catch (error) {
    failures.push({
      section: "Document viewer",
      component: "viewer navigation",
      reason: "viewer_control_click_failed",
      details: error.message,
      input: { id },
    });
    return failures;
  }

  const popup = await popupPromise;
  if (!popup) {
    failures.push({
      section: "Document viewer",
      component: "window.open",
      reason: "viewer_popup_not_opened",
      details: "Clicking a source-backed evidence control did not open a viewer popup",
      input: { id },
    });
    return failures;
  }

  try {
    await popup.waitForLoadState("domcontentloaded", { timeout: 5000 });
    const viewerUrl = popup.url();
    const title = await popup.locator("#doc-title").first().innerText({ timeout: 5000 }).catch(() => "");
    const nativeFrameCount = await popup.locator("iframe.pdf-native-frame, iframe[src$='.pdf'], iframe[src*='.pdf#']").count().catch(() => 0);
    const renderedPage = popup.locator(".pdf-page img").first();
    await renderedPage.waitFor({ state: "attached", timeout: 5000 }).catch(() => {});
    const renderedImageCount = await popup.locator(".pdf-page img").count().catch(() => 0);
    const errorPageCount = await popup.locator(".pdf-page.error").count().catch(() => 0);
    if (!/document-viewer\.html/i.test(viewerUrl) || !title.trim()) {
      failures.push({
        section: "Document viewer",
        component: "document-viewer.html",
        reason: "viewer_navigation_invalid_target",
        details: `Viewer opened invalid target "${viewerUrl}" with title "${title}"`,
        input: { id, viewerUrl, title },
      });
    }
    if (nativeFrameCount > 0) {
      failures.push({
        section: "Document viewer",
        component: "loadDocumentPages",
        reason: "native_pdf_viewer_regression",
        details: "Viewer opened a native PDF iframe instead of Simplifae page-image navigation",
        input: { id, viewerUrl, nativeFrameCount },
      });
    }
    if (!renderedImageCount || errorPageCount > 0) {
      failures.push({
        section: "Document viewer",
        component: "loadDocumentPages",
        reason: "page_image_navigation_missing",
        details: `Expected Simplifae page images; renderedImageCount=${renderedImageCount}, errorPageCount=${errorPageCount}`,
        input: { id, viewerUrl, renderedImageCount, errorPageCount },
      });
    }

    const semanticPanelState = await popup.evaluate(() => {
      const groups = [...document.querySelectorAll("#ref-list .ref-group")].map((group) => {
        const kicker = group.querySelector(".ref-kicker span:first-child");
        const label = group.querySelector(".ref-label");
        return {
          category: kicker ? kicker.textContent.trim() : "",
          label: label ? label.textContent.trim() : "",
          sources: group.querySelectorAll(".ref-source-chip").length,
        };
      });
      const dividers = [...document.querySelectorAll("#ref-list .ref-section-divider")].map((divider) => divider.textContent.trim());
      return { groups, dividers };
    }).catch((error) => ({ error: error.message, groups: [], dividers: [] }));

    const allowedCategories = new Set(["Detailed Scope", "Required Documents", "Admission Criteria", "Award Criteria"]);
    const categories = [...new Set((semanticPanelState.groups || []).map((group) => group.category).filter(Boolean))];
    const invalidGroups = (semanticPanelState.groups || []).filter((group) => {
      const text = `${group.category} ${group.label}`;
      return !allowedCategories.has(group.category) ||
        /award\/admission|admission\/award|structured\s+award|criteria\s+evidence/i.test(text);
    });
    if (semanticPanelState.groups && semanticPanelState.groups.length && !categories.includes("Detailed Scope")) {
      failures.push({
        section: "Document viewer",
        component: "references panel semantics",
        reason: "viewer_missing_detailed_scope_category",
        details: "References panel does not expose a clear Detailed Scope category",
        input: { id, viewerUrl, semanticPanelState },
      });
    }
    if (invalidGroups.length) {
      failures.push({
        section: "Document viewer",
        component: "references panel semantics",
        reason: "viewer_mixed_or_unknown_reference_category",
        details: "References panel contains mixed/unknown semantic categories instead of the Simplifae evidence model",
        input: { id, viewerUrl, invalidGroups, categories },
      });
    }
    if (semanticPanelState.groups && semanticPanelState.groups.length && (!semanticPanelState.dividers || !semanticPanelState.dividers.includes("Detailed Scope"))) {
      failures.push({
        section: "Document viewer",
        component: "references panel semantics",
        reason: "viewer_missing_semantic_section_dividers",
        details: "References panel does not render explicit semantic section dividers",
        input: { id, viewerUrl, dividers: semanticPanelState.dividers },
      });
    }

    const crossDocTarget = await popup.evaluate(() => {
      const activeDoc = new URL(window.location.href).searchParams.get("doc");
      const target = [...document.querySelectorAll("#ref-list .ref-source-chip[data-doc]")]
        .find((chip) => chip.dataset.doc && chip.dataset.doc !== activeDoc);
      if (!target) return null;
      return {
        docKey: target.dataset.doc,
        page: Number(target.dataset.page) || 1,
        label: target.textContent.trim(),
      };
    }).catch(() => null);

    if (crossDocTarget && crossDocTarget.docKey) {
      const crossDocChip = popup.locator(`#ref-list .ref-source-chip[data-doc="${crossDocTarget.docKey}"][data-page="${crossDocTarget.page}"]`).first();
      await crossDocChip.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
      await crossDocChip.click({ timeout: 3000 }).catch((error) => {
        failures.push({
          section: "Document viewer",
          component: "evidence rail navigation",
          reason: "viewer_cross_document_click_failed",
          details: error.message,
          input: { id, viewerUrl, crossDocTarget },
        });
      });

      if (!failures.some((failure) => failure.reason === "viewer_cross_document_click_failed")) {
        await popup.waitForFunction((target) => {
          const urlDoc = new URL(window.location.href).searchParams.get("doc");
          return urlDoc === target.docKey || window.activeDocKey === target.docKey;
        }, crossDocTarget, { timeout: 5000 }).catch(() => {});

        const crossDocState = await popup.evaluate(() => ({
          docKey: new URL(window.location.href).searchParams.get("doc"),
          title: document.querySelector("#doc-title") ? document.querySelector("#doc-title").textContent.trim() : "",
          location: document.querySelector("#pdf-location") ? document.querySelector("#pdf-location").textContent.trim() : "",
          imageCount: document.querySelectorAll(".pdf-page img").length,
          errorPageCount: document.querySelectorAll(".pdf-page.error").length,
        })).catch((error) => ({ error: error.message }));

        if (crossDocState.docKey !== crossDocTarget.docKey || !crossDocState.imageCount || crossDocState.errorPageCount > 0) {
          failures.push({
            section: "Document viewer",
            component: "evidence rail navigation",
            reason: "viewer_cross_document_navigation_failed",
            details: "Clicking a cross-document evidence chip did not switch the viewer to the target document/page with rendered page images",
            input: { id, viewerUrl, crossDocTarget, crossDocState },
          });
        }
      }
    }
  } finally {
    await popup.close().catch(() => {});
  }

  return failures;
}

async function main() {
  const root = path.resolve(argValue("--root", process.cwd()));
  const limit = Number(argValue("--limit", "50"));
  const runs = Number(argValue("--runs", "2"));
  const outPath = argValue("--out", null);
  const explicitUrl = argValue("--url", null);
  let server = null;
  let url = explicitUrl;

  if (!url) {
    const started = await startStaticServer(root);
    server = started.server;
    url = started.url;
  }

  const browser = await chromium.launch({ headless: !hasFlag("--headed") });
  const page = await browser.newPage();
  const initialEvents = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      initialEvents.push({ type: message.type(), text: message.text() });
    }
  });
  page.on("pageerror", (error) => {
    initialEvents.push({ type: "pageerror", text: error.message, stack: error.stack });
  });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(500);

  const includeImported = hasFlag("--include-imported");
  const includeStatic = !hasFlag("--no-static");
  const includeRegressionIds = hasFlag("--include-regression-ids") || includeImported || includeStatic;
  const ids = await page.evaluate(({ limit, includeImported, includeStatic, includeRegressionIds }) => {
    const liveIds = (window.SIMPLIFAE_LIVE_PUBLICADA_OPPORTUNITIES || []).map((item) => item.id);
    const importedIds = includeImported && typeof IMPORTED_OPPORTUNITIES !== "undefined"
      ? IMPORTED_OPPORTUNITIES.map((item) => item.id)
      : [];
    const staticIds = includeStatic && typeof TENDER_DATA !== "undefined"
      ? Object.keys(TENDER_DATA)
      : [];
    const regressionIds = includeRegressionIds ? [
      "imported-003",
      "imported-006",
      "imported-007",
      "imported-009",
      "imported-010",
      "imported-101",
      "imported-102",
    ] : [];
    const all = [...liveIds.slice(0, limit), ...regressionIds, ...staticIds, ...importedIds];
    return Array.from(new Set(all.filter(Boolean)));
  }, { limit, includeImported, includeStatic, includeRegressionIds });

  const startedAt = new Date().toISOString();
  const tenderRuns = new Map();
  for (let runIndex = 1; runIndex <= runs; runIndex += 1) {
    for (const id of ids) {
      const result = await validateTender(page, id, runIndex);
      if (!tenderRuns.has(id)) tenderRuns.set(id, []);
      tenderRuns.get(id).push(result);
    }
  }

  const tenders = Array.from(tenderRuns.entries()).map(([id, runResults]) => ({
    id,
    reference: runResults.find((run) => run.reference)?.reference || null,
    processingStatus: runResults.find((run) => run.processingStatus)?.processingStatus || null,
    determinism: classifyDeterminism(runResults),
    runs: runResults,
  }));

  const failing = tenders.filter((tender) => tender.determinism !== "none");
  const report = {
    schema: "simplifae.tender-processing-validation.v1",
    startedAt,
    url,
    root,
    limit,
    runs,
    includeImported,
    includeStatic,
    includeRegressionIds,
    checked: tenders.length,
    failed: failing.length,
    initialEvents,
    tenders,
  };

  if (outPath) {
    fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  }

  console.log(JSON.stringify({
    checked: report.checked,
    failed: report.failed,
    failures: failing.map((tender) => ({
      id: tender.id,
      reference: tender.reference,
      processingStatus: tender.processingStatus,
      determinism: tender.determinism,
      reasons: Array.from(new Set(tender.runs.flatMap((run) => run.failures.map((failure) => `${failure.section}:${failure.reason}`)))),
      events: tender.runs.flatMap((run) => run.events.map((event) => event.text)).slice(0, 3),
    })),
    report: outPath || null,
  }, null, 2));

  await browser.close();
  if (server) server.close();
  if (failing.length || initialEvents.some((event) => event.type === "pageerror")) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
