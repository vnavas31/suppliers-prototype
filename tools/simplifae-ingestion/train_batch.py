#!/usr/bin/env python3
"""Run a Simplifae ingestion training batch from PLACSP public feeds."""

from __future__ import annotations

import argparse
import concurrent.futures
import datetime as dt
import hashlib
import json
import re
import subprocess
import sys
import time
import urllib.parse
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

import requests


ATOM_FEED = "https://contrataciondelestado.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom"
USER_AGENT = "Mozilla/5.0 SimplifaeTenderTraining/0.1"


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1] if "}" in tag else tag


def first_text(element: ET.Element, wanted: str) -> str:
    for child in element.iter():
        if local_name(child.tag) == wanted and child.text:
            return child.text.strip()
    return ""


def entry_deeplink(entry_xml: str) -> str | None:
    match = re.search(r"idEvl=([^&<\"'\s]+)", entry_xml)
    if not match:
        return None
    return "https://contrataciondelestado.es/wps/poc?uri=deeplink:detalle_licitacion&idEvl=" + match.group(1)


def load_seed_records(seed_urls: list[str], seed_file: Path | None) -> list[dict[str, str]]:
    records = [{"url": seed, "source": "seed", "reference": "", "title": "", "buyer": "", "status": ""} for seed in seed_urls]
    if not seed_file:
        return records

    data = json.loads(seed_file.read_text(encoding="utf-8"))
    items = data.get("records", data) if isinstance(data, dict) else data
    if not isinstance(items, list):
        raise ValueError(f"Seed file must contain a JSON list or an object with records: {seed_file}")

    for item in items:
        if isinstance(item, str):
            records.append({"url": item, "source": "seed-file", "reference": "", "title": "", "buyer": "", "status": ""})
            continue
        if isinstance(item, dict) and item.get("url"):
            record = {key: str(value) for key, value in item.items() if value is not None}
            record.setdefault("source", "seed-file")
            record.setdefault("reference", "")
            record.setdefault("title", "")
            record.setdefault("buyer", "")
            record.setdefault("status", "")
            records.append(
                record
            )
    return records


def fetch_public_tenders(limit: int, seed_urls: list[str], seed_file: Path | None, cpv: str | None = None, no_atom: bool = False) -> list[dict[str, str]]:
    seed_records = load_seed_records(seed_urls, seed_file)
    records: list[dict[str, str]] = []
    seen_urls = {record["url"] for record in seed_records}

    records.extend(seed_records)
    if no_atom or len(records) >= limit:
        return records[:limit]

    response = requests.get(ATOM_FEED, timeout=45, headers={"User-Agent": USER_AGENT})
    response.raise_for_status()
    root = ET.fromstring(response.content)
    ns = {"a": "http://www.w3.org/2005/Atom"}

    for entry in root.findall("a:entry", ns):
        status = first_text(entry, "ContractFolderStatusCode")
        if status != "PUB":
            continue
        entry_xml = ET.tostring(entry, encoding="unicode")
        if cpv and cpv not in entry_xml:
            continue
        url = entry_deeplink(entry_xml)
        if not url or url in seen_urls:
            continue
        seen_urls.add(url)
        records.append(
            {
                "url": url,
                "source": "atom",
                "reference": first_text(entry, "ContractFolderID"),
                "title": first_text(entry, "title"),
                "buyer": first_text(entry, "Name"),
                "status": status,
            }
        )
        if len(records) >= limit:
            break
    return records[:limit]


def load_packet(path: Path) -> dict[str, Any] | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def summarize_packet(packet: dict[str, Any] | None) -> dict[str, Any]:
    if not packet:
        return {
            "ok": False,
            "reference": None,
            "confidence": 0.0,
            "documents": 0,
            "pdfs": 0,
            "sections": [],
            "missing_evidence_blocks": ["packet"],
        }
    level3 = packet.get("level3", {})
    missing_evidence = []
    checks: list[tuple[str, list[dict[str, Any]]]] = []
    if isinstance(level3.get("summary"), dict):
        checks.append(("summary", level3["summary"].get("evidence", [])))
    if isinstance(level3.get("scope"), dict):
        checks.append(("scope", level3["scope"].get("evidence", [])))
    for name, value in level3.get("commercial_facts", {}).items():
        checks.append((f"commercial.{name}", value.get("evidence", [])))
    requirements = level3.get("requirements", {})
    checks.append(("requirements", requirements.get("evidence", [])))
    for group in requirements.get("groups", []):
        for row in group.get("rows", []):
            checks.append((f"{group.get('title')} / {row.get('item', '')[:40]}", row.get("evidence", [])))

    for name, evidences in checks:
        if not evidences:
            missing_evidence.append(name)
            continue
        if any(not ev.get("doc_title") or not ev.get("page") for ev in evidences):
            missing_evidence.append(name)

    return {
        "ok": True,
        "reference": level3.get("contract_reference") or packet.get("structured_facts", {}).get("contract_reference"),
        "confidence": level3.get("confidence", {}).get("overall", 0.0),
        "documents": packet.get("coverage", {}).get("documents_downloaded", 0),
        "pdfs": packet.get("coverage", {}).get("pdfs_processed", 0),
        "ocr_candidates": packet.get("coverage", {}).get("ocr_candidates", 0),
        "ocr_candidate_titles": packet.get("coverage", {}).get("ocr_candidate_titles", []),
        "sections": packet.get("coverage", {}).get("sections_with_candidates", []),
        "pipeline_mode": packet.get("source", {}).get("mode", "premium"),
        "missing_evidence_blocks": missing_evidence,
        "summary": level3.get("summary", {}).get("value"),
        "buyer": level3.get("buyer"),
        "deadline": level3.get("timeline", {}).get("submission_deadline", {}).get("value"),
    }


def operational_status(item: dict[str, Any]) -> str:
    if not item.get("ok"):
        return "failed"
    if item.get("pipeline_mode") == "discovery" and item.get("summary") and item.get("deadline"):
        return "discovery_ready_structured"
    if item.get("documents", 0) == 0:
        return "needs_documents"
    if item.get("ocr_candidates", 0) > 0:
        if item.get("summary") and item.get("deadline"):
            return "discovery_ready_needs_ocr"
        return "needs_ocr"
    if float(item.get("confidence") or 0) >= 0.75 and not item.get("missing_evidence_blocks"):
        return "premium_ready"
    if item.get("summary") and item.get("deadline"):
        missing = set(item.get("missing_evidence_blocks") or [])
        if missing:
            return "discovery_ready_needs_legal_review"
        return "discovery_ready_needs_confidence_review"
    return "needs_source_data"


def readiness_summary(results: list[dict[str, Any]]) -> dict[str, int]:
    legal_blocks = {"commercial.provisional_guarantee", "commercial.definitive_guarantee", "requirements"}
    ready_for_discovery = 0
    premium_ready = 0
    needs_ocr = 0
    discovery_ready_needs_ocr = 0
    needs_documents = 0
    legal_refinement_only = 0
    needs_legal_review = 0
    needs_confidence_review = 0
    needs_source_data = 0
    discovery_ready_structured = 0
    failed = 0
    for item in results:
        missing = set(item.get("missing_evidence_blocks") or [])
        status = item.get("operational_status") or operational_status(item)
        if status == "failed":
            failed += 1
        if item.get("documents", 0) == 0 and status != "discovery_ready_structured":
            needs_documents += 1
        if status == "needs_ocr":
            needs_ocr += 1
        if status == "discovery_ready_needs_ocr":
            discovery_ready_needs_ocr += 1
        if status == "discovery_ready_needs_legal_review":
            needs_legal_review += 1
        if status == "discovery_ready_needs_confidence_review":
            needs_confidence_review += 1
        if status == "needs_source_data":
            needs_source_data += 1
        if status == "discovery_ready_structured":
            discovery_ready_structured += 1
        if item.get("ok") and item.get("summary") and item.get("deadline"):
            ready_for_discovery += 1
        if status == "premium_ready":
            premium_ready += 1
        if missing and missing.issubset(legal_blocks):
            legal_refinement_only += 1
    return {
        "ready_for_discovery": ready_for_discovery,
        "premium_ready": premium_ready,
        "needs_ocr": needs_ocr,
        "discovery_ready_needs_ocr": discovery_ready_needs_ocr,
        "needs_documents": needs_documents,
        "needs_legal_review": needs_legal_review,
        "needs_confidence_review": needs_confidence_review,
        "needs_source_data": needs_source_data,
        "discovery_ready_structured": discovery_ready_structured,
        "failed": failed,
        "legal_refinement_only": legal_refinement_only,
    }


def process_record(
    index: int,
    total: int,
    record: dict[str, str],
    pipeline: Path,
    out_dir: Path,
    timeout: int,
    pipeline_mode: str,
    ocr_provider: str,
    ocr_lang: str,
    ocr_timeout: int,
    ocr_force: bool,
) -> dict[str, Any]:
    url = record["url"]
    slug = hashlib.sha1(url.encode()).hexdigest()[:10]
    tender_out = out_dir / f"{index:03d}-{slug}"
    item_started = time.perf_counter()
    print(f"[{index:02d}/{total:02d}] {record.get('reference') or slug} ...", flush=True)
    try:
        command = [sys.executable, str(pipeline), url, "--out", str(tender_out), "--mode", pipeline_mode]
        if pipeline_mode == "premium" and ocr_provider != "none":
            command.extend(["--ocr-provider", ocr_provider, "--ocr-lang", ocr_lang, "--ocr-timeout", str(ocr_timeout)])
            if ocr_force:
                command.append("--ocr-force")
        completed = subprocess.run(
            command,
            cwd=Path(__file__).parents[2],
            text=True,
            capture_output=True,
            timeout=timeout,
            check=False,
        )
        packet = load_packet(tender_out / "premium.json")
        summary = summarize_packet(packet)
        result = {
            **record,
            **summary,
            "out": str(tender_out),
            "elapsed_seconds": round(time.perf_counter() - item_started, 3),
            "returncode": completed.returncode,
            "stdout": completed.stdout[-1200:],
            "stderr": completed.stderr[-1200:],
        }
        result["operational_status"] = operational_status(result)
        return result
    except subprocess.TimeoutExpired as exc:
        result = {
            **record,
            "ok": False,
            "reference": record.get("reference"),
            "confidence": 0.0,
            "documents": 0,
            "pdfs": 0,
            "ocr_candidates": 0,
            "ocr_candidate_titles": [],
            "sections": [],
            "missing_evidence_blocks": ["timeout"],
            "out": str(tender_out),
            "elapsed_seconds": round(time.perf_counter() - item_started, 3),
            "returncode": None,
            "stdout": (exc.stdout or "")[-1200:] if isinstance(exc.stdout, str) else "",
            "stderr": "timeout",
        }
        result["operational_status"] = operational_status(result)
        return result


def run_training(
    limit: int,
    out_dir: Path,
    timeout: int,
    seed_urls: list[str],
    seed_file: Path | None,
    cpv: str | None,
    no_atom: bool,
    workers: int,
    pipeline_mode: str,
    ocr_provider: str = "none",
    ocr_lang: str = "spa+cat+eng",
    ocr_timeout: int = 180,
    ocr_force: bool = False,
) -> dict[str, Any]:
    out_dir.mkdir(parents=True, exist_ok=True)
    records = fetch_public_tenders(limit, seed_urls, seed_file, cpv, no_atom)
    pipeline = Path(__file__).with_name("placsp_pipeline.py")
    started = time.perf_counter()
    workers = max(1, workers)
    indexed_records = list(enumerate(records, start=1))
    if workers == 1:
        results = [
            process_record(index, len(records), record, pipeline, out_dir, timeout, pipeline_mode, ocr_provider, ocr_lang, ocr_timeout, ocr_force)
            for index, record in indexed_records
        ]
    else:
        results_by_index: dict[int, dict[str, Any]] = {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
            future_by_index = {
                executor.submit(process_record, index, len(records), record, pipeline, out_dir, timeout, pipeline_mode, ocr_provider, ocr_lang, ocr_timeout, ocr_force): index
                for index, record in indexed_records
            }
            for future in concurrent.futures.as_completed(future_by_index):
                index = future_by_index[future]
                try:
                    results_by_index[index] = future.result()
                except Exception as exc:
                    record = records[index - 1]
                    results_by_index[index] = {
                        **record,
                        "ok": False,
                        "reference": record.get("reference"),
                        "confidence": 0.0,
                        "documents": 0,
                        "pdfs": 0,
                        "ocr_candidates": 0,
                        "ocr_candidate_titles": [],
                        "sections": [],
                        "missing_evidence_blocks": ["worker_exception"],
                        "out": "",
                        "elapsed_seconds": 0,
                        "returncode": None,
                        "stdout": "",
                        "stderr": str(exc),
                        "operational_status": "failed",
                    }
        results = [results_by_index[index] for index, _ in indexed_records]

    ok_results = [item for item in results if item.get("ok")]
    confidences = [float(item.get("confidence") or 0) for item in ok_results]
    report = {
        "schema": "simplifae.ingestion.training.v0",
        "atom_feed": ATOM_FEED,
        "used_atom": any(record.get("source") == "atom" for record in records),
        "seed_file": str(seed_file) if seed_file else None,
        "workers": workers,
        "pipeline_mode": pipeline_mode,
        "ocr_provider": ocr_provider,
        "ocr_lang": ocr_lang,
        "ocr_timeout": ocr_timeout,
        "ocr_force": ocr_force,
        "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "cpv_filter": cpv,
        "limit": limit,
        "elapsed_seconds": round(time.perf_counter() - started, 3),
        "summary": {
            "attempted": len(results),
            "ok": len(ok_results),
            "failed": len(results) - len(ok_results),
            "avg_confidence": round(sum(confidences) / len(confidences), 3) if confidences else 0,
            "high_confidence": sum(1 for value in confidences if value >= 0.75),
            "with_documents": sum(1 for item in results if item.get("documents", 0) > 0),
            "with_pdfs": sum(1 for item in results if item.get("pdfs", 0) > 0),
            **readiness_summary(results),
        },
        "results": results,
    }
    (out_dir / "training-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    (out_dir / "training-report.ndjson").write_text(
        "\n".join(json.dumps(item, ensure_ascii=False) for item in results) + "\n",
        encoding="utf-8",
    )
    return report


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Train Simplifae ingestion against active PLACSP tenders.")
    parser.add_argument("--limit", type=int, default=50)
    parser.add_argument("--out", default=None)
    parser.add_argument("--timeout", type=int, default=120)
    parser.add_argument("--seed-url", action="append", default=[])
    parser.add_argument("--seed-file", default=None, help="JSON list or live_bids_search.js output to process before Atom records.")
    parser.add_argument("--no-atom", action="store_true", help="Do not backfill from Atom when live/seed records are fewer than --limit.")
    parser.add_argument("--workers", type=int, default=1, help="Parallel tender processors. Use cautiously against live sources.")
    parser.add_argument("--cpv", default=None, help="Optional CPV substring filter, e.g. 48000000.")
    parser.add_argument("--pipeline-mode", choices=["discovery", "premium"], default="premium", help="discovery = structured fast path; premium = document evidence extraction")
    parser.add_argument("--ocr-provider", choices=["none", "local"], default="none", help="Optional OCR provider for premium OCR candidates.")
    parser.add_argument("--ocr-lang", default="spa+cat+eng", help="Tesseract language list for local OCR, e.g. spa+cat+eng.")
    parser.add_argument("--ocr-timeout", type=int, default=180, help="Per-document OCR timeout in seconds.")
    parser.add_argument("--ocr-force", action="store_true", help="Force OCR even on pages with an existing text layer.")
    args = parser.parse_args(argv)

    out_dir = Path(args.out) if args.out else Path("/tmp/simplifae-ingestion") / ("training-" + dt.datetime.now().strftime("%Y%m%d-%H%M%S"))
    seed_file = Path(args.seed_file) if args.seed_file else None
    report = run_training(
        args.limit,
        out_dir,
        args.timeout,
        args.seed_url,
        seed_file,
        args.cpv,
        args.no_atom,
        args.workers,
        args.pipeline_mode,
        args.ocr_provider,
        args.ocr_lang,
        args.ocr_timeout,
        args.ocr_force,
    )
    print(json.dumps({"out": str(out_dir), **report["summary"]}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
