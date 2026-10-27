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
for route in ('','architecture','cases','case','audit','safety','red-team','governance','ai-roles','token-economics','integration','upload','safety-origin'):
    path=ROOT/route/'index.html'
    page=Page();page.feed(path.read_text())
    assert not re.search(r'\b(medical|insurance|insurer|policyholder|premium|reinsurance)\b',' '.join(page.text),re.I),route
    for url in page.urls:
        target=ROOT/unquote(urlsplit(url).path).lstrip('/')
        assert target.exists() or (target/'index.html').exists(),(route,url)
manifest=json.loads((ROOT/'.site-release.json').read_text())
assert len(manifest['source_commit'])==40
assert manifest['backend_available'] is False
assert (ROOT/'.nojekyll').exists()
print('Compiled routes, assets, visible vocabulary and truthful release metadata verified.')
