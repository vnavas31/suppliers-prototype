#!/usr/bin/env node
/* Collect live PLACSP "Bids" search results for State=Publicada. */

const fs = require("fs");
const { chromium } = require("playwright");

const SEARCH_URL = "https://contrataciondelestado.es/wps/portal/plataforma/buscadores/busqueda";
const STATE_SELECT =
  'select[name="viewns_Z7_AVEQAI930OBRD02JPMTPG21004_:form1:estadoLici"]';

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1 || index + 1 >= process.argv.length) {
    return fallback;
  }
  return process.argv[index + 1];
}

function normalizeDeeplink(href) {
  try {
    const url = new URL(href);
    const idEvl = url.searchParams.get("idEvl");
    if (!idEvl) {
      return null;
    }
    return `https://contrataciondelestado.es/wps/poc?uri=deeplink:detalle_licitacion&idEvl=${encodeURIComponent(idEvl)}`;
  } catch {
    return null;
  }
}

async function waitForResults(page) {
  await page.waitForFunction(
    () =>
      Array.from(document.links).some((link) =>
        link.href.includes("deeplink:detalle_licitacion")
      ),
    null,
    { timeout: 30000 }
  );
}

async function collectCurrentPage(page, pageNumber) {
  const rows = await page.locator("a").evaluateAll((anchors, pageNo) => {
    const results = [];
    for (let index = 0; index < anchors.length; index += 1) {
      const anchor = anchors[index];
      const href = anchor.href || "";
      if (!href.includes("deeplink:detalle_licitacion")) {
        continue;
      }

      const tableRow = anchor.closest("tr");
      const cells = tableRow ? Array.from(tableRow.cells).map((cell) =>
        (cell.innerText || cell.textContent || "").replace(/\s+/g, " ").trim()
      ) : [];
      const referenceNode = tableRow
        ? tableRow.querySelector('span[id*="textoEnlace"], a[id*="enlaceExpediente"]')
        : null;
      let reference = (referenceNode && referenceNode.textContent || "").replace(/\s+/g, " ").trim();
      if (!reference) {
        for (let previous = index - 1; previous >= 0 && previous >= index - 4; previous -= 1) {
          const text = (anchors[previous].textContent || "").replace(/\s+/g, " ").trim();
          if (text) {
            reference = text;
            break;
          }
        }
      }
      const firstCell = cells[0] || "";
      const title = reference && firstCell.startsWith(reference)
        ? firstCell.slice(reference.length).trim()
        : firstCell;
      const typeCell = cells[1] || "";
      const typeMatch = typeCell.match(/^(Obras|Servicios|Suministros|Concesi[oó]n de Servicios|Concesi[oó]n de Obras|Administrativo especial|Patrimonial|Otros)\b/i);
      const contractType = typeMatch ? typeMatch[1] : typeCell;
      const contractSubtype = typeMatch ? typeCell.slice(typeMatch[0].length).trim() : "";

      results.push({
        source: "live-bids-search",
        page: pageNo,
        reference,
        title,
        contract_type: contractType,
        contract_subtype: contractSubtype,
        status: cells[2] || "",
        amount: cells[3] || "",
        deadline: cells[4] || "",
        buyer: cells[5] || "",
        url: href,
      });
    }
    return results;
  }, pageNumber);

  return rows
    .map((row) => ({ ...row, url: normalizeDeeplink(row.url) }))
    .filter((row) => row.url);
}

async function clickNext(page) {
  const next = page.locator('input[value="Next >>"]').first();
  if ((await next.count()) === 0) {
    return false;
  }
  const disabled = await next.getAttribute("disabled").catch(() => null);
  if (disabled !== null) {
    return false;
  }

  const previousFirstUrl = await page
    .locator('a[href*="deeplink:detalle_licitacion"]')
    .first()
    .getAttribute("href")
    .catch(() => "");

  await next.click({ timeout: 10000 });
  await page
    .waitForFunction(
      (oldUrl) => {
        const first = Array.from(document.links).find((link) =>
          link.href.includes("deeplink:detalle_licitacion")
        );
        return first && first.href !== oldUrl;
      },
      previousFirstUrl,
      { timeout: 30000 }
    )
    .catch(async () => {
      await page.waitForTimeout(2500);
    });
  return true;
}

async function main() {
  const limit = Number(argValue("--limit", "50"));
  const outPath = argValue("--out");
  const cpv = argValue("--cpv");
  const headed = process.argv.includes("--headed");
  const timeout = Number(argValue("--timeout", "45000"));

  const browser = await chromium.launch({ headless: !headed });
  const page = await browser.newPage();
  page.setDefaultTimeout(timeout);

  const records = [];
  const seen = new Set();
  const started = Date.now();

  try {
    await page.goto(SEARCH_URL, { waitUntil: "domcontentloaded", timeout });
    await page.locator("text=Bids").first().click();
    await page.waitForSelector("text=Search form bids", { timeout });
    await page.selectOption(STATE_SELECT, "PUB");
    if (cpv) {
      await page.locator('input[type="text"]').nth(2).fill(cpv);
      await page.locator('input[value="Add"]').first().click();
      await page.waitForTimeout(1000);
    }
    await page.locator('input[value="Search"]').first().click();
    await waitForResults(page);

    let pageNumber = 1;
    while (records.length < limit) {
      const current = await collectCurrentPage(page, pageNumber);
      for (const record of current) {
        if (seen.has(record.url)) {
          continue;
        }
        seen.add(record.url);
        records.push(record);
        if (records.length >= limit) {
          break;
        }
      }
      if (records.length >= limit) {
        break;
      }
      const advanced = await clickNext(page);
      if (!advanced) {
        break;
      }
      pageNumber += 1;
    }
  } finally {
    await browser.close();
  }

  const payload = {
    schema: "simplifae.placsp.live-bids.v0",
    search_url: SEARCH_URL,
    state: "PUB",
    cpv: cpv || null,
    created_at: new Date().toISOString(),
    elapsed_seconds: Number(((Date.now() - started) / 1000).toFixed(3)),
    count: records.length,
    records,
  };

  const json = JSON.stringify(payload, null, 2);
  if (outPath) {
    fs.writeFileSync(outPath, `${json}\n`, "utf8");
  } else {
    process.stdout.write(`${json}\n`);
  }
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
