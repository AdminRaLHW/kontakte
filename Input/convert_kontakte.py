"""
Skript zur Sicherung und Bereinigung/Konvertierung der Kontakte-CSV-Datei.

Ablauf:
1. SSoT-Ermittlung:
   - Jede CSV-Datei im Ordner dieses Skripts (Input/) gilt als SSoT.
   - Der Dateiname ist egal.
2. UTF-8 mit BOM Konvertierung:
   - Die Input-Datei wird zuerst in UTF-8 mit BOM konvertiert (ohne Ersatz-Mapping).
3. Sicherung:
   - Vor dem Ueberschreiben von data/kontakte.csv wird ein Backup
     unter Backup/kontakte_YYYY-MM-DD_xx.csv erstellt (xx = 01, 02, ... laufende Nummer am Tag).
4. Eigentliche Skriptarbeit:
   - Semikolon-Trennzeichen (;) wird zu Standard-Komma (,).
   - Leere Excel-Geisterzeilen und Rand-Leerzeichen werden bereinigt.
   - data/kontakte.csv wird atomar ausschliesslich mit den SSoT-Datensaetzen im Format UTF-8 mit BOM gespeichert.
"""

import csv
import re
import sys
from datetime import datetime
from pathlib import Path

EXPECTED_HEADERS = [
    "Name",
    "ColorCode",
    "Prio_B",
    "Bereich",
    "Prio_A",
    "Abteilung",
    "Prio_P",
    "Position",
    "Standort",
    "Telefon",
    "Mobiltelefon",
    "Email",
    "Email_alt",
    "Fax",
]


def find_ssot_input_file(script_dir: Path) -> Path:
    """
    Findet die SSoT-CSV-Datei im Skript-Ordner (Input/).
    Der Dateiname spielt keine Rolle.
    Gibt es genau eine CSV, wird diese genommen.
    Gibt es mehrere, wird die zuletzt geaenderte gewaehlt.
    """
    csv_files = [f for f in script_dir.glob("*.csv") if not f.name.endswith(".tmp")]
    if not csv_files:
        raise FileNotFoundError(f"Keine CSV-Datei (SSoT) im Ordner gefunden: {script_dir}")

    if len(csv_files) == 1:
        return csv_files[0]

    chosen = max(csv_files, key=lambda f: f.stat().st_mtime)
    print(f"[SSoT] Mehrere CSV-Dateien im Ordner gefunden. Verwende neueste: {chosen.name}")
    return chosen


def convert_input_to_utf8_bom(input_path: Path) -> str:
    """
    Schritt 1: Konvertiert die Input-Datei zu UTF-8 mit BOM (utf-8-sig).
    Erkennt Quellcodierung (UTF-8, Windows-1252/ANSI, ISO-8859-1)
    und stellt sicher, dass die Datei als UTF-8 mit BOM gespeichert ist.
    Gibt den Textinhalt zur Weiterverarbeitung zurueck.
    """
    raw_bytes = input_path.read_bytes()
    if not raw_bytes:
        raise ValueError(f"Input-Datei ist leer: {input_path}")

    # Pruefen, ob die Datei bereits UTF-8 mit BOM ist
    if raw_bytes.startswith(b"\xef\xbb\xbf"):
        print(f"[ENCODING] {input_path.name} ist bereits UTF-8 mit BOM.")
        return raw_bytes.decode("utf-8-sig")

    # Quellcodierung erkennen
    text = None
    source_encoding = None

    for enc in ["utf-8", "cp1252", "iso-8859-1"]:
        try:
            text = raw_bytes.decode(enc)
            source_encoding = enc
            break
        except UnicodeDecodeError:
            continue

    if text is None:
        text = raw_bytes.decode("utf-8", errors="replace")
        source_encoding = "utf-8 (mit Fallback)"

    # Input-Datei als UTF-8 mit BOM speichern
    input_path.write_text(text, encoding="utf-8-sig", newline="")
    print(f"[KONVERTIERUNG] Input-Datei {input_path.name} von '{source_encoding}' nach UTF-8 mit BOM konvertiert.")

    return text


def create_backup(data_file: Path, backup_dir: Path) -> Path | None:
    """
    Sichert die aktuelle data_file unter Backup/kontakte_YYYY-MM-DD_xx.csv.
    xx ist die fortlaufende 2-stellige Nummer am Tag (01, 02, ...).
    """
    if not data_file.exists():
        print(f"[BACKUP] Keine bestehende Zieldatei vorhanden zum Sichern ({data_file}).")
        return None

    backup_dir.mkdir(parents=True, exist_ok=True)
    today_str = datetime.now().strftime("%Y-%m-%d")

    pattern = re.compile(rf"^kontakte_{re.escape(today_str)}_(\d+)\.csv$", re.IGNORECASE)
    existing_indices = []
    for item in backup_dir.iterdir():
        if item.is_file():
            m = pattern.match(item.name)
            if m:
                existing_indices.append(int(m.group(1)))

    next_idx = max(existing_indices, default=0) + 1
    backup_filename = f"kontakte_{today_str}_{next_idx:02d}.csv"
    backup_path = backup_dir / backup_filename

    content = data_file.read_bytes()
    backup_path.write_bytes(content)

    if not backup_path.exists() or backup_path.stat().st_size != len(content):
        raise IOError(f"Backup-Fehler: {backup_path} konnte nicht geschrieben werden!")

    print(f"[BACKUP ERFOLGREICH] {data_file.name} gesichert als: {backup_path.name} ({len(content):,} Bytes)")
    return backup_path


def parse_and_clean_csv(text: str) -> tuple[list[str], list[list[str]]]:
    """
    Verarbeitet den CSV-Text:
    - Ermittelt das Trennzeichen (; oder ,)
    - Bereinigt Leerzeichen und filtert leere Geisterzeilen
    """
    lines = [line for line in text.splitlines() if line.strip()]
    if not lines:
        raise ValueError("Keine gueltigen Zeilen im CSV-Text gefunden!")

    header_line = lines[0]
    delimiter = ";" if header_line.count(";") >= header_line.count(",") else ","

    reader = csv.reader(lines, delimiter=delimiter)
    all_rows = list(reader)

    if not all_rows:
        raise ValueError("Keine Datensaetze in der CSV gefunden!")

    header = [col.strip().lstrip("\ufeff") for col in all_rows[0]]

    if header != EXPECTED_HEADERS:
        print(f"[HINWEIS] Header weicht vom Standard ab:")
        print(f"   Gefunden: {header}")
        print(f"   Erwartet: {EXPECTED_HEADERS}")

    cleaned_rows = []
    for row in all_rows[1:]:
        if not any(cell.strip() for cell in row):
            continue

        cells = [cell.strip() for cell in row]
        if len(cells) < len(header):
            cells.extend([""] * (len(header) - len(cells)))
        elif len(cells) > len(header):
            cells = cells[:len(header)]

        cleaned_rows.append(cells)

    if len(cleaned_rows) == 0:
        raise ValueError("Sicherheitsabbruch: 0 Datenzeilen nach Bereinigung gefunden!")

    return header, cleaned_rows


def write_clean_csv(output_path: Path, header: list[str], rows: list[list[str]]) -> None:
    """
    Schreibt die Zieldatei mit UTF-8-BOM (utf-8-sig), Kommatrennung,
    CRLF-Zeilenumbruechen und atomarem Rename zur Vermeidung von Datenverlust.
    """
    tmp_path = output_path.with_suffix(".tmp")

    with open(tmp_path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f, delimiter=",", quoting=csv.QUOTE_MINIMAL, lineterminator="\r\n")
        writer.writerow(header)
        writer.writerows(rows)

    with open(tmp_path, "r", encoding="utf-8-sig", newline="") as f:
        test_reader = list(csv.reader(f, delimiter=","))
        test_rows_count = len(test_reader)

    expected_count = len(rows) + 1
    if test_rows_count != expected_count:
        if tmp_path.exists():
            tmp_path.unlink()
        raise IOError(
            f"Validierungsfehler: Zeilenzahl ({test_rows_count}) "
            f"stimmt nicht mit den erwarteten Zeilen ({expected_count}) ueberein!"
        )

    tmp_path.replace(output_path)
    print(f"[GESPEICHERT] {output_path.name} erfolgreich mit {len(rows)} SSoT-Datensaetzen aktualisiert.")


def main():
    script_dir = Path(__file__).resolve().parent
    base_dir = script_dir.parent  # .../kontakte/
    data_file = base_dir / "data" / "kontakte.csv"
    backup_dir = base_dir / "Backup"

    print("=" * 70)
    print(" LHW-KONTAKTE DATENIMPORT (SSoT-SYNCHRONISATION)")
    print("=" * 70)

    # 1. SSoT-Input-Datei ermitteln (Dateiname ist egal!)
    if len(sys.argv) > 1:
        input_file = Path(sys.argv[1])
        if not input_file.is_absolute():
            input_file = script_dir / input_file
    else:
        input_file = find_ssot_input_file(script_dir)

    print(f"SSoT-Quelle:   {input_file.name}")
    print(f"Ziel-Datei:    {data_file}")
    print(f"Backup-Ordner: {backup_dir}")
    print("-" * 70)

    # 2. Zuerst Input-Datei als UTF-8 mit BOM konvertieren
    text = convert_input_to_utf8_bom(input_file)

    # 3. Bestehende data/kontakte.csv sichern
    create_backup(data_file, backup_dir)

    # 4. Eigentliche Skriptarbeit: CSV verarbeiten und neutralisieren
    header, rows = parse_and_clean_csv(text)
    print(f"[DATEN] {len(rows)} Datensaetze erfolgreich eingelesen.")

    # 5. data/kontakte.csv ausschliesslich mit den SSoT-Daten ueberschreiben
    write_clean_csv(data_file, header, rows)

    print("-" * 70)
    print("[FERTIG] Synchronisation erfolgreich abgeschlossen.")
    print("=" * 70)


if __name__ == "__main__":
    main()
