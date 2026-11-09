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
print('Compiled routes, assets, visible vocabulary and truthful release metadata verified.')
