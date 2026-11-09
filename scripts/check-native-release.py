"""Validate the compiled public release, independent of private source."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json, re
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
    def __init__(self): super().__init__(); self.skip=0; self.text=[]; self.urls=[]
    def handle_starttag(self,tag,attrs):
        if tag in ('script','style'): self.skip+=1
        for key,value in attrs:
            if key in ('src','href') and value and value.startswith('/'): self.urls.append(value)
    def handle_endtag(self,tag):
        if tag in ('script','style'): self.skip=max(0,self.skip-1)
    def handle_data(self,text):
        if not self.skip:self.text.append(text)
for route in ('','architecture','cases','case','audit','safety','red-team','governance','governance-code','ai-roles','token-economics','integration','upload','safety-origin'):
    path=ROOT/route/'index.html'
    page=Page();page.feed(path.read_text())
    assert not re.search(r'\b(medical|insurance|insurer|policyholder|premium|reinsurance)\b',' '.join(page.text),re.I),route
    for url in page.urls:
        target=ROOT/unquote(urlsplit(url).path).lstrip('/')
        assert target.exists() or (target/'index.html').exists(),(route,url)
code_page=(ROOT/'governance-code'/'index.html').read_text()
assert code_page.count('class="gc-control"') == 7 and code_page.count('class="gc-control selected"') == 1, "The published source browser must expose eight controls."
assert 'def resume(self, decision: Decision):' in code_page, "Human-gate implementation missing."
assert 'test_gate_prevents_archive_and_unauthorised_decision' in code_page, "Human-gate test missing."
assert (ROOT/'assets'/'governance-code-nav.js').is_file(), "Public nav link script missing."
manifest=json.loads((ROOT/'.site-release.json').read_text())
assert len(manifest['source_commit'])==40
assert manifest['backend_available'] is False
assert (ROOT/'.nojekyll').exists()
# External AP benchmarks are research reference, not observed manual cohorts.
benchmark=json.loads((ROOT/'data/manual-ap-literature-benchmarks.json').read_text())
assert benchmark['scope']=='published_external_process_benchmarks_not_company_manual_cohort'
names=['Reviewer touch time','Resolution time','First-submission validation pass rate',
       'Cases needing resubmission','Evidence completeness','Cost per invoice']
assert [row['name'] for row in benchmark['entries']]==names
assert [row['value'] for row in benchmark['entries']]==[41,9.15,75,14,61,9.4]
assert all(row['comparable'] is False and row['url'].startswith('https://') for row in benchmark['entries'])
js=(ROOT/'assets/frontend-evidence-20261107.js').read_text()
assert 'addBusinessTable' in js and 'addAiTable' in js
assert 'published_external_process_benchmarks_not_company_manual_cohort' in js
assert (ROOT/'business-impact'/'index.html').exists()
# Every dashboard metric must reproduce from the checked-in supplier fixtures,
# not a manually transcribed event-count aggregate.
from hashlib import sha1
governance=json.loads((ROOT/'data/synthetic-governance-metrics.json').read_text())
cases=json.loads((ROOT/'data/cases.json').read_text())['cases']
assert governance['schema']=='gac.derived_synthetic_governance_metrics.v1'
assert governance['scope']=='recorded_scripted_supplier_fixtures_only'
assert governance['metrics']['recorded_cases']==len(cases)==15
assert len(governance['per_case'])==len(cases)
by_case={c['slug']:c for c in cases}
metrics=governance['metrics']
original=[]
for row in governance['per_case']:
    source=ROOT/'data'/'scenarios'/f"{row['slug']}.json"
    blob=source.read_bytes()
    actual_sha=sha1(f"blob {len(blob)}\\0".encode()+blob).hexdigest()
    assert actual_sha==row['scenario_blob_sha'],row['slug']
    case=by_case[row['slug']]
    events=json.loads(blob)['events']
    checks=case.get('checks',[])+case.get('contract_checks',[])
    assert row['valid_intake']==(case['state']!='Intake_rejected')
    assert row['discrepancy_failures']==sum(e.get('ok') is False for e in checks)
    assert row['contract_checked']==bool(case.get('contract_checks'))
    assert row['history_attached']==any(e['kind']=='history.attached' for e in events)
    assert row['previous_version_recalled']==any(
      e['kind']=='history.attached' and re.search(r'Previous version [1-9][0-9]*',e.get('detail',''))
      for e in events)
    assert row['revised']==(case['attempts']>1)
    assert row['committee']==case['models_invoked']
    assert row['review_gate']==case['reached_gate']
    assert row['trace_present']==bool(events)
    verifies=[e for e in events if e['kind']=='verification.result']
    assert row['cove_claim_decisions']==len(verifies)
    assert row['cove_dropped']==sum(bool(re.search(r'unsupported|removed|dropped',e.get('label',''),re.I)) for e in verifies)
    original.append(row)
def counted(p):return sum(1 for row in original if p(row))
assert metrics['valid_intake_cases']==counted(lambda r:r['valid_intake'])==14
assert metrics['contract_crosscheck_cases']==counted(lambda r:r['contract_checked'])==13
assert metrics['discrepancy_flagged_cases']==counted(lambda r:r['discrepancy_failures']>0)==6
assert metrics['updated_cases']==counted(lambda r:r['revised'])==2
assert metrics['updated_cases_with_recalled_prior_version']==counted(lambda r:r['revised'] and r['previous_version_recalled'])==2
assert metrics['committee_routed_cases']==counted(lambda r:r['committee'])==6
assert metrics['committee_skipped_cases']==counted(lambda r:not r['committee'])==9
assert metrics['reviewer_gated_cases']==counted(lambda r:r['valid_intake'] and r['review_gate'])==14
assert metrics['trace_available_cases']==counted(lambda r:r['trace_present'])==15
assert metrics['cove_claim_decisions']==sum(r['cove_claim_decisions'] for r in original)==4
assert metrics['cove_unsupported_blocked']==sum(r['cove_dropped'] for r in original)==1
source_ui=(ROOT/'assets/frontend-evidence-20261107.js').read_text()
assert 'synthetic-governance-metrics.json' in source_ui
assert 'potential time savings and ROI' in source_ui
assert 'Discrepancy flagging' in source_ui and 'History-aware resubmissions' in source_ui
print('Compiled routes, assets, visible vocabulary and truthful release metadata verified.')
