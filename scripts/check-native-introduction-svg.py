"""Verify the current native SVGs, retaining original manual-task semantics."""
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

mode = sys.argv[1]
assert mode in ("manual", "human")
manual = (
    "Receive & triage", "Read & enter data", "Match documents",
    "Question exceptions", "Prepare findings", "Human decision",
    "Update & archive", "Email overload", "Manual re-entry",
    "Scattered sources", "Slow follow-ups", "Repetitive reporting",
    "Approval bottleneck", "Weak traceability", "Intake coordinator",
    "AP administrator", "Contract analyst", "Quality checker",
    "Case preparer", "Decision owner", "Records / audit clerk",
)
human = (
    "Augmented", "HUMAN-LED", "HUMAN-SUPERVISED", "Proponent",
    "Opponent", "CoVe", "Judge", "Analytics", "Integrator",
    "Reporter", "Audit", "Attacker", "FAST PATH", "SKIP STEP 5",
    "HUMAN SIGN-OFF", "Not in case flow.", "Both require human decision",
)
assets = (
    ["visuals/manual-supplier-invoice-workflow-20261118.svg",
     "visuals/manual-supplier-invoice-workflow-mobile-20261118.svg"]
    if mode == "manual" else
    ["visuals/human-agent-horizontal-fastpath-20261119.svg"]
)
for name in assets:
    data = Path(name).read_text(encoding="utf-8")
    root = ET.fromstring(data)
    assert root.tag.endswith("svg"), name
    # Match the original security restrictions and reject executable SVG.
    for bad in ("<script", "<foreignObject", "javascript:", "<image", "xlink:href"):
        assert bad.lower() not in data.lower(), (name, bad)
    for node in root.iter():
        assert not any(key.lower().split("}")[-1].startswith("on")
                       for key in node.attrib), (name, "event handler")
    text = " ".join(" ".join(root.itertext()).split())
    for term in (manual if mode == "manual" else human):
        assert term in text, (name, term)
    if mode == "manual":
        assert "AUTOMATED WORKFLOW" not in text and "AI-ASSISTED WORKFLOW" not in text
    print("PASS native SVG contract:", name)
