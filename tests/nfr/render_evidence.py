from __future__ import annotations

import datetime
import glob
import hashlib
import os
import subprocess
import sys
from urllib.parse import quote

import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))              # repo root
TRACE = os.path.join(HERE, "traceability.yml")
EVIDENCE_DIR = os.path.join(HERE, "evidence")
MD_OUT = os.path.join(HERE, "EVIDENCE.md")
SUMS_OUT = os.path.join(EVIDENCE_DIR, "SHA256SUMS")
PDF_OUT = os.path.join(HERE, "Evidence_Pack.pdf")

PLACEHOLDER_MARKERS = [
    "TODO", "FIXME", "commit the ZAP report", "xxxx",
    "<RUN_URL>", "placeholder", "screenshot of the failing",
]
REQUIRED_FIELDS = ["id", "category", "requirement", "target", "tactic", "tool", "evidence", "status"]
STATUS_ORDER = ["pass", "documented", "partial", "fail"]


WORKFLOW_FILES = {
    "Backend CI": "backend-ci.yml",
    "Web Frontend CI": "web-ci.yml",
    "E2E Tests": "e2e.yml",
    "Lighthouse NFR Audits": "lighthouse.yml",
    "NFR Fitness Functions": "nfr.yml",
    "CD - Deploy to Azure": "cd.yml",
}



# helpers

def rel(path: str) -> str:
    return os.path.relpath(path, ROOT).replace(os.sep, "/")


def resolve(path: str) -> str:
    return os.path.normpath(os.path.join(ROOT, path))


def glob_matches(pattern: str) -> list[str]:
    return sorted(glob.glob(resolve(pattern), recursive=True))


def sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def commit_sha() -> str:
    env = os.environ.get("GITHUB_SHA")
    if env:
        return env
    try:
        out = subprocess.run(
            ["git", "-C", ROOT, "rev-parse", "HEAD"],
            capture_output=True, text=True, timeout=10,
        )
        if out.returncode == 0 and out.stdout.strip():
            return out.stdout.strip()
    except Exception:
        pass
    return "working-tree (uncommitted)"


def link_ctx(data) -> dict:
    """Base URLs for evidence links. Permalinks in CI, repo/main locally."""
    server = os.environ.get("GITHUB_SERVER_URL")
    repo = os.environ.get("GITHUB_REPOSITORY")
    sha = os.environ.get("GITHUB_SHA")
    if server and repo and sha:
        base, ref = f"{server}/{repo}", sha
    else:
        base, ref = (data.get("repo") or "").rstrip("/"), "main"
    return {
        "ok": bool(base),
        "blob": f"{base}/blob/{ref}",
        "tree": f"{base}/tree/{ref}",
        "actions": f"{base}/actions/workflows",
    }


def q(path: str) -> str:
    return quote(path, safe="/")


def evidence_links(req, ctx) -> list[tuple[str, str | None]]:
    """[(label, url-or-None), ...] for a requirement's evidence."""
    ev = req.get("evidence", {}) or {}
    kind = ev.get("kind")
    out: list[tuple[str, str | None]] = []
    if kind == "committed-file":
        for p in ev.get("paths", []):
            if "*" in p:
                d = p.rsplit("/", 1)[0]
                label = f"{d.split('/')[-1]}/ ({len(glob_matches(p))} files)"
                out.append((label, f"{ctx['tree']}/{q(d)}" if ctx["ok"] else None))
            else:
                out.append((os.path.basename(p), f"{ctx['blob']}/{q(p)}" if ctx["ok"] else None))
    elif kind == "external-link":
        out.append((ev.get("workflow") or "link", ev.get("link")))
    elif kind == "ci-run":
        tp = req.get("test_path")
        if tp:
            out.append((f"test: {os.path.basename(tp)}", f"{ctx['blob']}/{q(tp)}" if ctx["ok"] else None))
        for wf in (ev.get("workflow") or "").split(" / "):
            wf = wf.strip()
            wf_file = WORKFLOW_FILES.get(wf)
            if wf_file and ctx["ok"]:
                out.append((f"CI: {wf}", f"{ctx['actions']}/{wf_file}"))
            elif wf:
                out.append((f"CI: {wf}", None))
    return out


def walk_json(obj, path: list):
    cur = obj
    for key in path:
        if isinstance(cur, dict) and key in cur:
            cur = cur[key]
        else:
            return None
    return cur


def metric_value(req) -> list[tuple[str, str]]:
    out = []
    for m in req.get("metrics_shown", []) or []:
        src = resolve(m["source"])
        val = None
        if os.path.isfile(src):
            try:
                import json
                with open(src, encoding="utf-8") as fh:
                    val = walk_json(json.load(fh), m["path"])
            except Exception:
                val = None
        label = m.get("label", "metric")
        if val is None:
            out.append((label, "n/a"))
        elif "rate" in label.lower():
            out.append((label, f"{float(val) * 100:.2f}%"))
        else:
            unit = m.get("unit", "")
            out.append((label, f"{float(val):.1f}{(' ' + unit) if unit else ''}"))
    return out


def iter_strings(obj):
    if isinstance(obj, str):
        yield obj
    elif isinstance(obj, dict):
        for v in obj.values():
            yield from iter_strings(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from iter_strings(v)



# validation

def validate(reqs) -> tuple[list[str], list[str]]:
    errors, warnings = [], []
    seen_ids = set()
    for req in reqs:
        rid = req.get("id", "<no-id>")
        if rid in seen_ids:
            errors.append(f"{rid}: duplicate id")
        seen_ids.add(rid)

        for field in REQUIRED_FIELDS:
            if field not in req or req[field] in (None, ""):
                errors.append(f"{rid}: missing required field '{field}'")

        for s in iter_strings(req):
            for marker in PLACEHOLDER_MARKERS:
                if marker.lower() in s.lower():
                    errors.append(f"{rid}: placeholder text still present -> '{s.strip()[:70]}'")

        tp = req.get("test_path")
        if tp and not os.path.isfile(resolve(tp)):
            errors.append(f"{rid}: test_path file not found -> {tp}")

        ev = req.get("evidence", {}) or {}
        kind = ev.get("kind")
        if kind == "committed-file":
            paths = ev.get("paths") or []
            if not paths:
                errors.append(f"{rid}: committed-file evidence has no paths")
            for p in paths:
                if not glob_matches(p):
                    errors.append(f"{rid}: evidence file not found -> {p}")
        elif kind == "external-link":
            if not (ev.get("link", "") or "").startswith("http"):
                errors.append(f"{rid}: external-link evidence missing a valid URL")
        elif kind == "ci-run":
            if not ev.get("workflow"):
                warnings.append(f"{rid}: ci-run evidence has no 'workflow'")
            if not req.get("test"):
                warnings.append(f"{rid}: ci-run evidence has no 'test' reference")
        else:
            errors.append(f"{rid}: unknown evidence.kind '{kind}'")

        if req.get("status") not in STATUS_ORDER:
            warnings.append(f"{rid}: unexpected status '{req.get('status')}'")

        for m in req.get("metrics_shown", []) or []:
            if not os.path.isfile(resolve(m.get("source", ""))):
                warnings.append(f"{rid}: metric source missing -> {m.get('source')}")
    return errors, warnings



# SHA256SUMS

def build_sums() -> list[str]:
    lines = []
    for dirpath, _dirs, files in os.walk(EVIDENCE_DIR):
        for name in files:
            if name in ("SHA256SUMS", ".gitkeep"):
                continue
            full = os.path.join(dirpath, name)
            lines.append((rel(full), sha256(full)))
    lines.sort()
    return [f"{h}  {p}" for p, h in lines]



# markdown

def evidence_cell_md(req, ctx) -> str:
    parts = []
    for label, url in evidence_links(req, ctx):
        parts.append(f"[{label}]({url})" if url else f"`{label}`")
    return "<br>".join(parts)


def render_markdown(data, reqs, sha, generated, errors, ctx) -> str:
    cats = {}
    for r in reqs:
        cats.setdefault(r["category"], []).append(r)
    counts = {}
    for r in reqs:
        counts[r["status"]] = counts.get(r["status"], 0) + 1

    L = []
    L.append("# UniTrade - NFR Evidence Report")
    L.append("")
    L.append("> Generated by `tests/nfr/render_evidence.py` from `tests/nfr/traceability.yml`. Do not edit by hand.")
    L.append("")
    L.append(f"- **Project:** {data.get('project')}")
    L.append(f"- **Commit:** `{sha}`")
    L.append(f"- **Generated (UTC):** {generated}")
    L.append(f"- **Requirements:** {len(reqs)} across {data.get('srs_quality_requirements')} SRS quality attributes")
    L.append("- **Status:** " + ", ".join(f"{k}: {counts[k]}" for k in STATUS_ORDER if k in counts))
    L.append(f"- **Validation:** {'PASS - all evidence references resolve' if not errors else 'FAIL - ' + str(len(errors)) + ' problem(s)'}")
    L.append("")
    for cat in sorted(cats):
        L.append(f"## {cat}")
        L.append("")
        L.append("| ID | Requirement | Target | Tool | Status | Evidence |")
        L.append("|----|-------------|--------|------|--------|----------|")
        for r in cats[cat]:
            L.append(
                f"| {r['id']} | {r['requirement']} | {r['target']} | {r['tool']} "
                f"| {r['status']} | {evidence_cell_md(r, ctx)} |"
            )
        L.append("")
        for r in cats[cat]:
            metrics = metric_value(r)
            if metrics or r.get("note"):
                L.append(f"**{r['id']}** - {r['tactic']}  ")
                if metrics:
                    L.append("  measured: " + "; ".join(f"{lbl} = {val}" for lbl, val in metrics) + "  ")
                if r.get("note"):
                    L.append(f"  note: {r['note']}  ")
                L.append("")
    L.append("---")
    L.append("Integrity hashes for every committed evidence file: `tests/nfr/evidence/SHA256SUMS`.")
    L.append("")
    return "\n".join(L)



# pdf

def _xml(t: str) -> str:
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def render_pdf(data, reqs, sha, generated, errors, ctx):
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable,
    )

    styles = getSampleStyleSheet()
    cell = ParagraphStyle("cell", parent=styles["BodyText"], fontSize=7.5, leading=9)
    cellb = ParagraphStyle("cellb", parent=cell, fontName="Helvetica-Bold")
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], fontSize=12, spaceBefore=10, spaceAfter=4)
    small = ParagraphStyle("small", parent=styles["BodyText"], fontSize=8, leading=11)

    status_hex = {"pass": "#1b7f37", "documented": "#8a6d00", "partial": "#8a6d00", "fail": "#b00020"}

    def st_para(s):
        return Paragraph(f'<font color="{status_hex.get(s, "#333")}"><b>{s}</b></font>', cell)

    def ev_para(r):
        bits = []
        for label, url in evidence_links(r, ctx):
            if url:
                bits.append(f'<a href="{_xml(url)}"><font color="#1A5C8F">{_xml(label)}</font></a>')
            else:
                bits.append(_xml(label))
        return Paragraph("<br/>".join(bits), cell)

    story = []
    story.append(Paragraph("UniTrade - NFR Evidence Pack", styles["Title"]))
    counts = {}
    for r in reqs:
        counts[r["status"]] = counts.get(r["status"], 0) + 1
    meta = (
        f"Project: {data.get('project')} &nbsp;|&nbsp; Commit: {sha[:12]} "
        f"&nbsp;|&nbsp; Generated (UTC): {generated}<br/>"
        f"{len(reqs)} requirements across {data.get('srs_quality_requirements')} SRS quality attributes "
        f"&nbsp;|&nbsp; " + ", ".join(f"{k}: {counts[k]}" for k in STATUS_ORDER if k in counts) + "<br/>"
        f"Validation: " + ("PASS - all evidence references resolve"
                           if not errors else f"FAIL - {len(errors)} problem(s)") +
        "<br/>Evidence labels are clickable (committed files link to the commit permalink; "
        "CI items link to the test file and the workflow)."
    )
    story.append(Spacer(1, 4))
    story.append(Paragraph(meta, small))
    story.append(HRFlowable(width="100%", thickness=0.6, color=colors.grey, spaceBefore=6, spaceAfter=2))

    cats = {}
    for r in reqs:
        cats.setdefault(r["category"], []).append(r)

    col_w = [16 * mm, 44 * mm, 42 * mm, 22 * mm, 16 * mm, 40 * mm]
    for cat in sorted(cats):
        story.append(Paragraph(cat, h2))
        rows = [[Paragraph(x, cellb) for x in ["ID", "Requirement", "Target", "Tool", "Status", "Evidence"]]]
        for r in cats[cat]:
            rows.append([
                Paragraph(r["id"], cell),
                Paragraph(_xml(r["requirement"]), cell),
                Paragraph(_xml(r["target"]), cell),
                Paragraph(_xml(str(r["tool"])), cell),
                st_para(r["status"]),
                ev_para(r),
            ])
        t = Table(rows, colWidths=col_w, repeatRows=1)
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1A5C8F")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#b8c4d0")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f2f6fa")]),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ]))
        story.append(t)

    meas = []
    for r in reqs:
        for lbl, val in metric_value(r):
            meas.append([Paragraph(r["id"], cell), Paragraph(lbl, cell),
                         Paragraph(val, cellb), Paragraph(_xml(r["target"]), cell)])
    if meas:
        story.append(Paragraph("Key measurements", h2))
        mt = Table([[Paragraph(x, cellb) for x in ["ID", "Metric", "Measured", "Target"]]] + meas,
                   colWidths=[16 * mm, 44 * mm, 30 * mm, 90 * mm])
        mt.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1A5C8F")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#b8c4d0")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(mt)

    up = glob_matches("tests/nfr/evidence/uptime/*.png")
    if up:
        story.append(Paragraph("Availability evidence (QR-04d)", h2))
        try:
            from reportlab.lib.utils import ImageReader
            iw, ih = ImageReader(up[0]).getSize()
            w = 170 * mm
            story.append(Image(up[0], width=w, height=w * ih / iw))
        except Exception as exc:  # pragma: no cover
            story.append(Paragraph(f"(uptime screenshot at {rel(up[0])}; not embedded: {exc})", small))

    story.append(HRFlowable(width="100%", thickness=0.6, color=colors.grey, spaceBefore=10, spaceAfter=2))
    story.append(Paragraph(
        "Integrity hashes for every committed evidence file are in "
        "tests/nfr/evidence/SHA256SUMS (verify with <font face='Courier'>sha256sum -c</font>).", small))

    SimpleDocTemplate(
        PDF_OUT, pagesize=A4,
        leftMargin=12 * mm, rightMargin=12 * mm, topMargin=14 * mm, bottomMargin=14 * mm,
        title="UniTrade NFR Evidence Pack",
    ).build(story)



# main

def main() -> int:
    with open(TRACE, encoding="utf-8") as fh:
        data = yaml.safe_load(fh)
    reqs = data.get("requirements", [])
    reqs.sort(key=lambda r: r.get("id", ""))
    ctx = link_ctx(data)

    errors, warnings = validate(reqs)
    sha = commit_sha()
    generated = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    for w in warnings:
        print(f"::warning:: {w}" if os.environ.get("GITHUB_ACTIONS") else f"WARN  {w}")
    for e in errors:
        print(f"::error:: {e}" if os.environ.get("GITHUB_ACTIONS") else f"ERROR {e}")

    with open(MD_OUT, "w", encoding="utf-8") as fh:
        fh.write(render_markdown(data, reqs, sha, generated, errors, ctx))
    with open(SUMS_OUT, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(build_sums()) + "\n")
    try:
        render_pdf(data, reqs, sha, generated, errors, ctx)
        pdf_note = rel(PDF_OUT)
    except Exception as exc:
        pdf_note = f"PDF skipped ({exc})"

    print(f"\nWrote {rel(MD_OUT)}, {rel(SUMS_OUT)}, {pdf_note}")
    print(f"Requirements: {len(reqs)} | errors: {len(errors)} | warnings: {len(warnings)} | links: {'on' if ctx['ok'] else 'off (no repo)'}")
    if errors:
        print("VALIDATION FAILED")
        return 1
    print("VALIDATION PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
