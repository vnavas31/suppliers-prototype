#!/usr/bin/env node
/* Render live-publicada viewer pages needed by evidence navigation. */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import vm from "node:vm";

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

function loadViewerData(file) {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(file, "utf8"), sandbox);
  return sandbox.window;
}

const root = path.resolve(argValue("--root", process.cwd()));
const viewerDataPath = path.resolve(root, argValue("--viewer-data", "discovery-v2/live-publicada-viewer-docs.js"));
const renderScript = path.resolve(root, "tools/simplifae-ingestion/render_pdf_doc_pages.mjs");
const scale = argValue("--scale", "1.35");
const fullPageLimit = Number(argValue("--full-page-limit", "0"));
const renderAllPages = hasFlag("--all-pages");
const nodeBin = process.execPath;
const data = loadViewerData(viewerDataPath);
const docs = data.SIMPLIFAE_LIVE_PUBLICADA_VIEWER_DOCS || {};
const refsByTender = data.SIMPLIFAE_LIVE_PUBLICADA_EVIDENCE_REFS_BY_TENDER || {};
const pagesByDoc = new Map();

for (const [docKey, doc] of Object.entries(docs)) {
  const pages = new Set([1, Number(doc.defaultPage) || 1]);
  if (Array.isArray(doc.availablePages)) {
    doc.availablePages.forEach((page) => pages.add(Number(page) || 1));
  } else if (renderAllPages || Number(doc.pageCount || 0) <= fullPageLimit) {
    for (let page = 1; page <= Number(doc.pageCount || 0); page += 1) pages.add(page);
  }
  pagesByDoc.set(docKey, pages);
}

for (const refs of Object.values(refsByTender)) {
  for (const ref of refs || []) {
    if (!ref || !ref.docKey || !pagesByDoc.has(ref.docKey)) continue;
    pagesByDoc.get(ref.docKey).add(Number(ref.page) || 1);
  }
}

let renderedDocs = 0;
let failedDocs = 0;
let requestedPages = 0;
const failures = [];

for (const [docKey, pages] of pagesByDoc.entries()) {
  const doc = docs[docKey];
  const pdfPath = path.resolve(root, "discovery-v2", doc.file);
  const outDir = path.resolve(root, "discovery-v2", doc.pageDir);
  ensureDir(outDir);
  const pageList = Array.from(pages)
    .filter((page) => Number.isFinite(page) && page > 0 && page <= Number(doc.pageCount || 1))
    .sort((a, b) => a - b);
  requestedPages += pageList.length;
  const result = spawnSync(nodeBin, [
    renderScript,
    "--pdf", pdfPath,
    "--out", outDir,
    "--scale", scale,
    "--pages", pageList.join(","),
  ], { encoding: "utf8" });
  if (result.status !== 0) {
    failedDocs += 1;
    failures.push({ docKey, pdfPath, stderr: result.stderr, stdout: result.stdout });
    continue;
  }
  renderedDocs += 1;
}

console.log(JSON.stringify({
  docs: Object.keys(docs).length,
  mode: renderAllPages ? "all-pages" : "evidence-pages",
  renderedDocs,
  failedDocs,
  requestedPages,
  failures,
}, null, 2));

if (failedDocs) process.exitCode = 1;
