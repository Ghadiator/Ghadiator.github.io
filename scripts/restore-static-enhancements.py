"""Re-add the hand-added /assets/ tags that a source publish drops.

publish-github-pages.sh rebuilds every HTML file from the Next.js export,
so the static enhancement tags (recorded-case evidence, navigation
clarity, Failure Lab position, red-team assets) disappear on each publish.
Run this right after a publish:

    python3 scripts/restore-static-enhancements.py <commit-before-the-publish>

It copies every <script>/<link> tag that points at /assets/ from the given
commit's HTML into the current HTML, when the current file lacks it:
scripts before </body>, stylesheets before </head>. A tag that every
page of the given commit carries is global: it is also added to pages the
commit did not have yet (a new route).
"""
from __future__ import annotations

import pathlib
import re
import subprocess
import sys

TAG = re.compile(r'<(?:script|link)[^>]*/assets/[^>]*>(?:</script>)?')


def main(ref: str) -> int:
    files = subprocess.run(
        ["git", "ls-tree", "-r", "--name-only", ref], capture_output=True, text=True, check=True,
    ).stdout.split()
    old_pages = {
        name: subprocess.run(["git", "show", f"{ref}:{name}"], capture_output=True, text=True).stdout
        for name in files if name.endswith(".html")
    }
    tag_sets = [set(TAG.findall(html)) for html in old_pages.values() if TAG.search(html)]
    global_tags = sorted(set.intersection(*tag_sets)) if tag_sets else []
    current = sorted(str(p) for p in pathlib.Path(".").rglob("*.html") if ".git" not in p.parts)
    changed = 0
    for name in current:
        path = pathlib.Path(name)
        old = old_pages.get(name)
        cur = path.read_text(encoding="utf-8")
        wanted = TAG.findall(old) if old is not None else global_tags
        missing = [t for t in dict.fromkeys(wanted) if t not in cur]
        for tag in missing:
            anchor = "</head>" if tag.startswith("<link") else "</body>"
            cur = cur.replace(anchor, tag + anchor, 1)
        if missing:
            path.write_text(cur, encoding="utf-8")
            changed += 1
    print(f"restored enhancement tags in {changed} file(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "HEAD~1"))
