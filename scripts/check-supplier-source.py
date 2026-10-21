"""Compare published traces with fresh runs of the engineering source.

Usage: python3 scripts/check-supplier-source.py /path/to/generic-agentic-validation
Requires the source repository's Python dependencies, including Pydantic 2.
"""
import argparse
import json
from pathlib import Path
import sys

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('source_root', type=Path)
args = parser.parse_args()
sys.path.insert(0, str(args.source_root.resolve()))
from supplier_review.scenarios import SCENARIOS, export_trace

root = Path(__file__).resolve().parents[1] / 'data' / 'scenarios'
published_slugs = {p.stem for p in root.glob('supplier_*.json')}
assert published_slugs == set(SCENARIOS), 'Source scenarios and published case set differ'
for slug in SCENARIOS:
    actual = export_trace(slug)
    published = json.loads((root / (slug + '.json')).read_text())
    assert actual == published, f'{slug}: source execution and published trace differ'
    print(slug, len(actual['events']), actual['outcome']['terminal_state'])
print(f'All {len(SCENARIOS)} published cases exactly match source execution, outcomes and provenance.')
