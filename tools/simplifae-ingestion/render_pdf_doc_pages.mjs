#!/usr/bin/env node
/* Render PDF pages to the document-viewer PNG page contract. */

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const requireFromRuntime = createRequire("/Users/victornavas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/");
const pdfjsLib = await import("file:///Users/victornavas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pdfjs-dist/legacy/build/pdf.mjs");
const { createCanvas } = requireFromRuntime("@napi-rs/canvas");

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

function pageName(pageNumber) {
  return `page-${String(pageNumber).padStart(3, "0")}.png`;
}

async function renderPdf(pdfPath, outDir, options = {}) {
  const scale = Number(options.scale || 1.35);
  const maxPages = Number(options.maxPages || 0);
  const force = Boolean(options.force);
  const explicitPages = String(options.pages || "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);
  ensureDir(outDir);

  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const pdf = await pdfjsLib.getDocument({ data, disableWorker: true }).promise;
  const pageCount = maxPages > 0 ? Math.min(maxPages, pdf.numPages) : pdf.numPages;
  const pages = explicitPages.length
    ? Array.from(new Set(explicitPages.filter((pageNumber) => pageNumber <= pdf.numPages))).sort((a, b) => a - b)
    : Array.from({ length: pageCount }, (_item, index) => index + 1);
  let rendered = 0;
  let skipped = 0;

  for (const pageNumber of pages) {
    const outPath = path.join(outDir, pageName(pageNumber));
    if (!force && fs.existsSync(outPath) && fs.statSync(outPath).size > 0) {
      skipped += 1;
      continue;
    }
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const canvasContext = canvas.getContext("2d");
    await page.render({ canvasContext, viewport }).promise;
    fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
    rendered += 1;
  }

  return { pdfPath, outDir, pageCount: pdf.numPages, pages: pages.length, rendered, skipped };
}

async function main() {
  const pdfPath = argValue("--pdf");
  const outDir = argValue("--out");
  if (!pdfPath || !outDir) {
    console.error("Usage: render_pdf_doc_pages.mjs --pdf file.pdf --out doc-pages/key [--scale 1.35] [--max-pages N] [--force]");
    process.exit(2);
  }
  const result = await renderPdf(path.resolve(pdfPath), path.resolve(outDir), {
    scale: argValue("--scale", "1.35"),
    maxPages: argValue("--max-pages", "0"),
    pages: argValue("--pages", ""),
    force: hasFlag("--force"),
  });
  console.log(JSON.stringify(result));
}

await main();
