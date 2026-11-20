"""Re-add the hand-added /assets/ tags that a source publish drops.

publish-github-pages.sh rebuilds every HTML file from the Next.js export,
so the static enhancement tags (recorded-case evidence, navigation
clarity, Failure Lab position, red-team assets) disappear on each publish.
Run this right after a publish:

    python3 scripts/restore-static-enhancements.py <commit-before-the-publish>

It copies every <script>/<link> tag that points at /assets/ from the given
commit's HTML into the current HTML, when the current file lacks it:
scripts before </body>, stylesheets before </head>.
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
    changed = 0
    for name in files:
        path = pathlib.Path(name)
        if not name.endswith(".html") or not path.exists():
            continue
        old = subprocess.run(["git", "show", f"{ref}:{name}"], capture_output=True, text=True).stdout
        cur = path.read_text(encoding="utf-8")
        missing = [t for t in dict.fromkeys(TAG.findall(old)) if t not in cur]
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
