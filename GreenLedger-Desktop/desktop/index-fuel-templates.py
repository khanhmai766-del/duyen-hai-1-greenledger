"""Join the existing Table 1.2 index to IPCC Table 2.2 by fuel name."""
import argparse
import json
import re
from pathlib import Path
from zipfile import ZipFile

import pypdfium2 as pdf


CO2 = r"(\d{1,3}\s\d{3})"
SMALL = r"(\d+(?:\.\s*\d+)?)"
FACTORS = re.compile(r"(?:(?<!\S)[nr]\s*)?" + r"\s+".join([CO2] * 3) +
                     r"\s+(?:[nr]\s+)?" + r"\s+".join([SMALL] * 3) +
                     r"\s+(?:[nr]\s+)?" + r"\s+".join([SMALL] * 3))


def key(value):
    return re.sub(r"[^a-z0-9]+", "", value.casefold())


def build(archive, catalog):
    with ZipFile(archive) as bundle:
        name = next(n for n in bundle.namelist() if n.startswith("IPCC/") and n.endswith("V2_2_Ch2_Stationary_Combustion.pdf"))
        with pdf.PdfDocument(bundle.read(name)) as doc:
            factors = []
            for page in (16, 17):
                text = doc[page - 1].get_textpage().get_text_range()
                assert "TABLE 2.2" in text
                end = 0
                for match in FACTORS.finditer(text):
                    name_text = text[end:match.start()]
                    values = [float(re.sub(r"\s", "", value)) for value in match.groups()]
                    factors.append((key(name_text), values, page))
                    end = match.end()
    ncv = json.loads(catalog.read_text(encoding="utf-8"))["ncv"]
    assert len(factors) == len(ncv) == 53, (len(factors), len(ncv))
    output = []
    for (name, default, low, high, page), (label, values, factor_page) in zip(ncv, factors):
        expected = key(name)
        if expected.startswith("othernonfossilfuels"):
            expected = "municipalwastesbiomassfraction"
        assert expected in label, (name, label)
        assert all(values[i + 1] <= values[i] <= values[i + 2] for i in (0, 3, 6)), (name, values)
        output.append([name, [default, low, high], page, values[:3], values[3:6], values[6:], factor_page])
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("archive")
    parser.add_argument("catalog", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    data = build(args.archive, args.catalog)
    args.output.write_text("'use strict';\nconst ipccFuelRows = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
    print(f"Checked {len(data)} fuel names and their Table 2.2 factor bounds.")
