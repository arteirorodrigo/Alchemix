"""Gera riohosting-site.html: um arquivo único (fotos embutidas) a partir de riohosting.html."""
import base64, pathlib, re
d = pathlib.Path(__file__).parent
src = (d / "riohosting.html").read_text()
def inline(m):
    f = d / m.group(1)
    mime = "image/png" if f.suffix == ".png" else "image/jpeg"
    return "data:%s;base64,%s" % (mime, base64.b64encode(f.read_bytes()).decode())
src = re.sub(r"(img/[A-Za-z0-9_.-]+\.(?:jpg|png))", inline, src)
head, body = src.split("</style>", 1)
html = ('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        + head + "</style>\n</head>\n<body>" + body + "</body>\n</html>\n")
(d / "riohosting-site.html").write_text(html)
print("ok", len(html))
