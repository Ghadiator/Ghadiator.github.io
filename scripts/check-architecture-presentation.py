"""Protect architecture behaviour, evidence and geometry during visual changes."""
from pathlib import Path
import hashlib
import re


def git_blob(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()

BASELINES = {
    'app.js': '59091001dc7fe4f7a25c41125cc5b9c11f0ebd78',
    'assets/architecture-execution.js': 'd3370d3d6edb77fc1637bbbac812d1a8d19d3af1',
    'assets/architecture-module-inspector.js': '1aa298ca20aec040e8ec6114d4da85c083bb1344',
    'assets/architecture-explained.js': 'bcc29b5824c0e01513fa55509d990c416df805aa',
    '_next/static/chunks/app/architecture/page-2d56a5bff821821b.js': '5caa4722a597ef2ace16415e5aae8b1596faa19d',
    '_next/static/chunks/app/layout-00714e284e207e0e.js': '1e182c9d8081413b88611163515e350ed3ac48ee',
    'data/scenarios/index.json': 'f384fc608e6c38bc0df9257cd4af7842f7ca7476',
    'data/scenarios/supplier_adapter_failure.json': '35281ccd9855db73fee5f2aba7d3502c5018610d',
    'data/scenarios/supplier_clean.json': '6898f0fcd7d234577b06b7c02f9c96c4e98e39e1',
    'data/scenarios/supplier_currency_mismatch.json': '67756a646e3cbe76f75a2dafc08268554ebc1306',
    'data/scenarios/supplier_duplicate.json': 'cd67de9db948938fb169fb0305371cd985a587e4',
    'data/scenarios/supplier_injection.json': '142c871266dc6671448b297068f64ddbf14ca9c4',
    'data/scenarios/supplier_invalid.json': 'bd667672471b19a2c81f7618db00edbca5fb93a7',
    'data/scenarios/supplier_invented_narrative.json': '911ae9693d830a096bbacc80af534886f4edaace',
    'data/scenarios/supplier_missing_document.json': '231eab04f35ec1d3c3a111450400801dc6a3426b',
    'data/scenarios/supplier_over_limit.json': '955aa7e5a3f8acfb72e735f97686e82d3726d853',
    'data/scenarios/supplier_pending.json': '7f68938869948e9e2ca11445de1db1b4c1174cb1',
    'data/scenarios/supplier_proposal_budget.json': 'dfd075084e3e62a20f6321206f07f27cb502ba17',
    'data/scenarios/supplier_rate_correction.json': '851de7ec963172c5095d2c4d75b30a16db83bed8',
    'data/scenarios/supplier_total_mismatch.json': 'cb78b09830a46b5a22e9bc87643813f1d6a28485',
    'data/scenarios/supplier_unsupported_claim.json': 'b4d3771dd96b1fa40d02e358572a2474d320770b',
    'data/scenarios/supplier_variance_review.json': 'a8453e2181da74e5cad94809f7e89d815a8b41fa',
}
for path, expected in BASELINES.items():
    assert git_blob(Path(path).read_bytes()) == expected, f"Technical implementation changed: {path}"

# The only permitted HTML difference is the presentation stylesheet link.
link = b'<link rel="stylesheet" href="/assets/architecture-design.css?v=20261020-architecture-66"/>'
page = Path("architecture/index.html").read_bytes()
assert page.count(link) == 1
assert git_blob(page.replace(link, b"")) == "8b3ed74786fa32b9c8af18a75fc86c6a6041eb55", "Architecture DOM, paths, labels or geometry changed"

css = Path("assets/architecture-design.css").read_text()
css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
# Keep CSS from changing graph geometry, hit targets, reachability or routing.
for selector, declarations in re.findall(r"([^{}]+)\{([^{}]+)\}", css):
    if not any(token in selector for token in ("data-node", "data-route", "data-edge")):
        continue
    properties = {piece.split(":", 1)[0].strip() for piece in declarations.split(";") if ":" in piece}
    forbidden = {"left", "right", "top", "bottom", "width", "height", "min-width", "max-width", "min-height", "max-height", "position", "display", "visibility", "transform", "translate", "scale", "rotate", "pointer-events", "touch-action", "order", "d", "offset-path", "content", "padding", "margin", "opacity"}
    assert not properties & forbidden, f"Graph geometry or interaction override: {selector}: {properties & forbidden}"
assert "prefers-reduced-motion:reduce" in css
print(f"Architecture presentation: original DOM and geometry, {len(BASELINES)} code/evidence files, interaction ownership and motion preferences verified.")
