#!/usr/bin/env node
/* Build a small public package for live-publicada evidence navigation. */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1 || index + 1 >= process.argv.length) return fallback;
  return process.argv[index + 1];
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyAsset(root, outRoot, relativePath) {
  const source = path.resolve(root, relativePath);
  const target = path.resolve(outRoot, relativePath);
  ensureDir(path.dirname(target));
  fs.copyFileSync(source, target);
}

function loadViewerData(file) {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(file, "utf8"), sandbox);
  return sandbox.window;
}

function clampPage(page, pageCount) {
  const max = Math.max(1, Number(pageCount || 1));
  const value = Math.floor(Number(page) || 1);
  return Math.min(Math.max(1, value), max);
}

function pagesForDoc(doc) {
  const max = Math.max(1, Number(doc.pageCount || 1));
  const configured = Array.isArray(doc.availablePages) && doc.availablePages.length
    ? doc.availablePages
    : Array.from({ length: max }, (_, index) => index + 1);
  return Array.from(new Set(configured.map((page) => clampPage(page, max)))).sort((a, b) => a - b);
}

const root = path.resolve(argValue("--root", process.cwd()));
const viewerDataPath = path.resolve(root, argValue("--viewer-data", "discovery-v2/live-publicada-viewer-docs.js"));
const outRoot = argValue("--out-root", null);
const manifestOut = argValue("--manifest-out", null);
const pathspecOut = argValue("--pathspec-out", null);
const data = loadViewerData(viewerDataPath);
const docs = data.SIMPLIFAE_LIVE_PUBLICADA_VIEWER_DOCS || {};
const baseAssets = [
  "discovery-v2/index.html",
  "discovery-v2/document-viewer.html",
  "discovery-v2/live-publicada-20260504.js",
  "discovery-v2/live-publicada-premium-overrides.js",
  "discovery-v2/live-publicada-viewer-docs.js",
];
const pageAssets = [];
const missing = [];

for (const [docKey, doc] of Object.entries(docs)) {
  for (const page of pagesForDoc(doc)) {
    const pagePath = path.posix.join(
      "discovery-v2",
      doc.pageDir,
      `page-${String(page).padStart(3, "0")}.png`
    );
    pageAssets.push(pagePath);
    if (!fs.existsSync(path.resolve(root, pagePath))) {
      missing.push({ docKey, page, path: pagePath });
    }
  }
}

const assets = [...baseAssets, ...pageAssets];
for (const asset of baseAssets) {
  if (!fs.existsSync(path.resolve(root, asset))) {
    missing.push({ path: asset });
  }
}

if (missing.length) {
  console.error(JSON.stringify({ error: "missing_public_package_assets", missing: missing.slice(0, 20), missingCount: missing.length }, null, 2));
  process.exit(1);
}

if (outRoot) {
  const targetRoot = path.resolve(outRoot);
  for (const asset of assets) copyAsset(root, targetRoot, asset);
}

if (pathspecOut) {
  ensureDir(path.dirname(path.resolve(pathspecOut)));
  fs.writeFileSync(path.resolve(pathspecOut), `${assets.join("\n")}\n`, "utf8");
}

const manifest = {
  schema: "simplifae.live-publicada-public-package.v1",
  root,
  viewerDataPath,
  outRoot: outRoot ? path.resolve(outRoot) : null,
  docs: Object.keys(docs).length,
  baseAssets: baseAssets.length,
  pageAssets: pageAssets.length,
  assets: assets.length,
};

if (manifestOut) {
  ensureDir(path.dirname(path.resolve(manifestOut)));
  fs.writeFileSync(path.resolve(manifestOut), JSON.stringify(manifest, null, 2), "utf8");
}

console.log(JSON.stringify(manifest, null, 2));
