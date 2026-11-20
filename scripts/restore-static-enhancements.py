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
    html = [name for name in files if name.endswith(".html")]
    old_tags = {
        name: dict.fromkeys(TAG.findall(subprocess.run(
            ["git", "show", f"{ref}:{name}"], capture_output=True, text=True).stdout))
        for name in html
    }
    # Tags most pages of the reference carried (the global ones): a page that
    # is new in this publish (no reference copy) gets these, so a new route
    # is not the one page without the global enhancements.
    counts: dict[str, int] = {}
    for tags in old_tags.values():
        for tag in tags:
            counts[tag] = counts.get(tag, 0) + 1
    global_tags = [t for t, n in counts.items() if n >= 0.8 * len(old_tags)]
    targets = sorted(set(html) | {str(p) for p in pathlib.Path(".").rglob("*.html")
                                  if not str(p).startswith((".git", "node_modules"))})
    for name in targets:
        path = pathlib.Path(name)
        if not path.exists():
            continue
        cur = path.read_text(encoding="utf-8")
        old = "".join(old_tags.get(name, dict.fromkeys(global_tags)))
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
