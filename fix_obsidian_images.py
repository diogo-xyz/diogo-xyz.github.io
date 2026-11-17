import re, pathlib, unicodedata, sys

def clean(name):
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    stem, dot, ext = name.rpartition(".")
    stem = re.sub(r"[^a-z0-9]+", "-", stem.lower()).strip("-")
    return f"{stem}.{ext.lower()}"

root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "_writeups")
for md in root.rglob("index.md"):
    folder = md.parent
    mapping = {}
    for f in folder.iterdir():
        if f.is_file() and f.name != "index.md":
            new = clean(f.name)
            if new != f.name:
                f.rename(folder / new)
            mapping[f.name] = new

    text = md.read_text(encoding="utf-8")

    def repl(m):
        name, width = m.group(1).strip(), m.group(2)
        out = f"![]({mapping.get(name, clean(name))})"
        return out + (f'{{: width="{width}"}}' if width else "")

    new_text = re.sub(r"!\[\[([^\]|]+?)(?:\|(\d+))?\]\]", repl, text)
    md.write_text(new_text, encoding="utf-8")
    print(f"ok  {md}")
