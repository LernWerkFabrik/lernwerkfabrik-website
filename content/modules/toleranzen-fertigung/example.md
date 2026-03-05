# Beispiel – Toleranzen in der Fertigung berücksichtigen

## Aufgabe (prüfungsnah)

Ein Hebel soll neu gefertigt und geprüft werden.

### Gegeben

- Funktionsmaß: `25,00 ±0,05 mm`
- Passbohrung: `Ø8H7`
- Gewinde: `M5`
- Allgemeintoleranz: `ISO 2768-m`
- Vorbohrung für Passbohrung: `7,80 mm`
- Schnittgeschwindigkeit für Bohrung `d = 5 mm`: `vc = 30 m/min`
- Messwerte am Funktionsmaß: `24,97 mm`, `25,06 mm`

### Gesucht

1. Oberes und unteres Grenzmaß
2. Reibaufmaß für die Bohrung `8H7`
3. Bohrdrehzahl für `d = 5 mm`
4. Prüfurteil zu beiden Messwerten
5. Passende Prüfmittel für Maß, Bohrung und Gewinde

---

## Lösung

### 1) Grenzmaße berechnen

Nennmaß `25,00 mm ±0,05 mm`

- Oberes Grenzmaß: `25,00 + 0,05 = 25,05 mm`
- Unteres Grenzmaß: `25,00 - 0,05 = 24,95 mm`

Zulässiger Bereich: `24,95 mm bis 25,05 mm`

### 2) Reibaufmaß bestimmen

- Vorbohrung: `7,80 mm`
- Endmaß: `8,00 mm`

Reibaufmaß:

`8,00 - 7,80 = 0,20 mm`

Das ist ein typischer Bereich für eine nachfolgende Reibbearbeitung.

### 3) Drehzahl berechnen

Formel:

`n = (1000 · vc) / (π · d)`

Einsetzen:

`n = (1000 · 30) / (π · 5) = 1909,9 1/min`

Gerundet:

`n ≈ 1910 1/min`

### 4) Messwerte beurteilen

Grenzbereich: `24,95 mm bis 25,05 mm`

- Messwert `24,97 mm` -> **i. O.**
- Messwert `25,06 mm` -> **n. i. O. (zu groß)**

### 5) Prüfmittel festlegen

- Funktionsmaß `25,00 ±0,05 mm`: Messschieber (allgemein) oder Bügelmessschraube (enger)
- Bohrung `Ø8H7`: Grenzlehrdorn
- Gewinde `M5`: Gewindelehre

---

## Ergebnis

Die Aufgabe ist fachlich sauber gelöst, wenn:

- Grenzmaße korrekt berechnet sind,
- die Fertigungsfolge `Bohren -> Reiben` eingehalten wird,
- das Prüfurteil über Grenzmaßvergleich erfolgt,
- und die Prüfmittel zur geforderten Toleranz passen.
