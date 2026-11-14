"""Build the offline table catalog from the IPCC reference archive."""
import argparse
import json
import re
import unicodedata
from contextlib import closing
from pathlib import Path
from zipfile import ZipFile

import pypdfium2 as pdfium


CAPTION = re.compile(r"^TABLE\s+((?:[A-Z]\.?)?\d+(?:\s*[.–-]\s*[A-Z0-9]+)+[a-z]?)\b[ .:–-]*(.*)$", re.I)
NUMBER = r"(?:[0-9]+(?:\.[0-9]+)?|NA)"
NCV_LINE = re.compile(rf"^(.+?)\s+({NUMBER})\s+({NUMBER})\s+({NUMBER})$")
NCV_FILE = "V2_1_Ch1_Introduction.pdf"


def clean(value):
    text = unicodedata.normalize("NFKC", value).replace("\u0002", "-").replace("\ufffe", "-")
    return " ".join(text.split())


def captions(lines):
    for i, line in enumerate(lines):
        match = CAPTION.match(line)
        if not match:
            continue
        code, title = match.groups()
        if (re.search(r"\.{3,}|\s[0-9]+\.[0-9]+$", title)
                or (i + 1 < len(lines) and re.search(r"\.{3,}", lines[i + 1]))):
            continue  # Dotted table-of-contents entry.
        while re.match(r"^\((?:updated|new|continued)[^)]*\)", title, re.I):
            title = title.split(")", 1)[1].strip()
        if re.match(r"^(?:gives?|lists?|shows?|presents?|provides?|contains?|summari[sz]es?|illustrates?|is|are|was|can|should|may|for more)\b", title, re.I):
            continue  # Reference in body text rather than a caption.
        if not title and i + 1 < len(lines):
            title = lines[i + 1]
            if (i + 2 < len(lines) and title.isupper() and lines[i + 2].isupper()
                    and len(lines[i + 2]) > 16 and not CAPTION.match(lines[i + 2])):
                title += " " + lines[i + 2]
        if title and len(title) > 4 and not CAPTION.match(title):
            yield code, title[:200]


def ncv_rows(lines, page):
    pending = ""
    for line in lines[1:]:
        if line.startswith("Notes:"):
            break
        if line.startswith(("DEFAULT NET CALORIFIC", "Fuel type", "value (TJ/Gg)")):
            continue
        if re.fullmatch(rf"{NUMBER}\s+{NUMBER}\s+{NUMBER}", line):
            line = pending + " " + line
        match = NCV_LINE.match(line)
        if match:
            name, *values = match.groups()
            name = re.sub(r"(?<=\D)\s*\d{1,2}$", "", name)
            name = name.replace(" Liquid", "", 1) if name == "Biodiesels 14 Liquid" else name
            name = name.replace(" 14", "") if name.startswith("Biodiesels") else name
            name = name.removeprefix("Biofuels ").removeprefix("Other non-fossil fuels ")
            yield [name, *[None if v == "NA" else float(v) for v in values], page]
            pending = ""
        else:
            pending = re.sub(r"\s+\d{1,2}$", "", line)


def build(archive):
    result = {"documents": [], "tables": [], "ncv": [], "ncvDocument": None}
    with ZipFile(archive) as bundle:
        paths = sorted(p for p in bundle.namelist() if p.startswith("IPCC/") and p.lower().endswith(".pdf"))
        for path in paths:
            name = path.rsplit("/", 1)[1]
            edition = "2019" if "/2019rf_" in path else "2006" if "/2006gls_" in path else "GWP"
            id = len(result["documents"])
            tables = {}
            with pdfium.PdfDocument(bundle.read(path)) as doc:
                result["documents"].append([path, name, edition, len(doc)])
                for i in range(len(doc)):
                    with closing(doc[i]) as page, closing(page.get_textpage()) as text:
                        lines = [clean(line) for line in text.get_text_range().splitlines() if line.strip()]
                    for code, title in captions(lines):
                        entry = tables.setdefault(code.casefold(), [id, code, title, []])
                        if i + 1 not in entry[3]:
                            entry[3].append(i + 1)
                    if name == NCV_FILE and i in (17, 18):
                        result["ncvDocument"] = id
                        start = next(j for j, line in enumerate(lines) if line.startswith("TABLE 1.2"))
                        result["ncv"].extend(ncv_rows(lines[start:], i + 1))
            result["tables"].extend(tables.values())
    for entry in result["tables"]:
        if entry[:2] == [result["ncvDocument"], "1.2"]:
            entry[2:] = ["Default net calorific values (NCVs) and lower and upper 95% confidence limits", [18, 19]]
    assert len(result["ncv"]) == 53, len(result["ncv"])
    assert ["Gas/Diesel Oil", 43.0, 41.4, 43.3, 18] in result["ncv"]
    assert ["Industrial Wastes", None, None, None, 18] in result["ncv"]
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("archive")
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    index = build(args.archive)
    args.output.write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(index['documents'])} PDFs, {len(index['tables'])} table entries, {len(index['ncv'])} NCV rows")
