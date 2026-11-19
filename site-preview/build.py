"""Gera arquivos HTML únicos (imagens embutidas):
riohosting.html -> riohosting-site.html e comparar.html -> antes-e-depois.html."""
import base64, pathlib, re

d = pathlib.Path(__file__).parent


def inline(m):
    f = d / m.group(1)
    mime = "image/png" if f.suffix == ".png" else "image/jpeg"
    return "data:%s;base64,%s" % (mime, base64.b64encode(f.read_bytes()).decode())


def build(nome, saida):
    src = (d / nome).read_text()
    src = re.sub(r"((?:img|comparar)/[A-Za-z0-9_.-]+\.(?:jpg|png))", inline, src)
    head, body = src.split("</style>", 1)
    html = ('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + head + "</style>\n</head>\n<body>" + body + "</body>\n</html>\n")
    (d / saida).write_text(html)
    print("ok", saida, len(html))


build("riohosting.html", "riohosting-site.html")
build("comparar.html", "antes-e-depois.html")
