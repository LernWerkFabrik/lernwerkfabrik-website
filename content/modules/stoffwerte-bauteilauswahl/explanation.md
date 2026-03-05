# Stoffwerte zur Bauteilauswahl nutzen

In AP1 und AP2 kommen Stoffwerte nicht als "isolierte Formelaufgabe" vor, sondern als Entscheidungsgrundlage.
Typische Aufgaben aus den bereitgestellten Prüfungsunterlagen sind:

- AP1: Masse einer Trägerplatte berechnen
- AP1: Gleiches Bauteil mit anderem Werkstoff (z. B. Aluminium statt Guss) bewerten
- AP2: Volumen, Masse und Zerspanungsanteil eines CuSn12-C-Rohlings berechnen

Dieses Modul trainiert genau diese Kombination aus Rechnen, Einheitenkontrolle und technischer Bewertung.

---

## Lernziel

Nach diesem Modul kannst du:

- Stoffwerte (vor allem Dichte) aus Tabellen sicher entnehmen
- Masse, Volumen und Dichte korrekt umrechnen und berechnen
- Werkstoffe für gleiche Bauteilgeometrie vergleichen
- Materialentscheidungen technisch begründen (Gewicht, Funktion, Einsatz)
- typische AP1/AP2-Fallen vermeiden

---

## Prüfungs-Algorithmus (immer gleich)

1) Gegeben und Gesucht mit Einheit notieren
2) Stoffwert aus Tabelle wählen (inkl. Einheit)
3) Einheiten vereinheitlichen
4) Volumen sauber bestimmen (z. B. Quader, Zylinder)
5) Mit Stoffwertbeziehung rechnen
6) Ergebnis technisch bewerten (plausibel oder nicht?)

> Merksatz:
> Erst Einheit + Stoffwert klären, dann rechnen.

---

## 1) Was bedeutet "Stoffwert" im Modul?

Hier geht es vor allem um tabellierte Materialwerte für die Bauteilauswahl, z. B.:

- Dichte
- ggf. zusätzliche Kenndaten für die Entscheidung (Verschleiß, Korrosion, Kosten, Fertigbarkeit)

Im Prüfungsalltag ist die Dichte der zentrale Einstieg, weil daraus direkt Masseunterschiede bei gleicher Geometrie folgen.

---

## 2) Stoffwert-Tabelle (Dichte, typische Prüfungswerte)

Die exakten Werte können je nach Tabellenbuch/Legierung leicht variieren.
Für AP-Aufgaben werden oft diese Größenordnungen genutzt:

| Werkstoff | Dichte in g/cm3 | Dichte in kg/dm3 | Hinweis |
|---|---:|---:|---|
| Stahl (unlegiert) | 7.85 | 7.85 | AP1-Aufgaben mit Trägerplatte |
| Gusseisen (EN-GJL, tabellenabhängig) | ca. 7.2-7.3 | ca. 7.2-7.3 | AP1-Materialvergleich |
| Aluminiumlegierung | 2.70 | 2.70 | deutlich leichter bei gleicher Geometrie |
| CuSn12-C (Bronze) | 8.70 | 8.70 | AP2-Aufgabe Schneckenrad |
| Messing (typ.) | ca. 8.4 | ca. 8.4 | oft zwischen Stahl und Bronze |

Wichtig: Immer den Wert aus der in der Aufgabe genannten Quelle verwenden.

---

## 3) Einheiten, die sicher sitzen müssen

### 3.1 Volumen

- 1 cm3 = 1000 mm3
- 1 dm3 = 1000 cm3
- 1 m3 = 1 000 000 cm3

### 3.2 Dichte

- 1 kg/dm3 = 1 g/cm3
- 1 g/cm3 = 1000 kg/m3

> Prüfungsfalle:
> Volumen in mm3, Dichte in g/cm3 und Masse in kg ohne Umrechnung mischen.

---

## 4) Kernbeziehungen (als Arbeitswerkzeug)

- m = rho * V
- rho = m / V
- V = m / rho

mit konsistenten Einheiten, z. B.:

- rho in g/cm3 und V in cm3 -> m in g
- rho in kg/dm3 und V in dm3 -> m in kg

---

## 5) Prüfungsbezug aus den PDF-Unterlagen

### AP Teil 1 (2023)

- Masse einer Trägerplatte berechnen (Abmessungen + Dichte)
- Gleiches Gehäuse bei Werkstoffwechsel (EN-GJL -> Aluminium) vergleichen

### AP Teil 2 (2024)

- CuSn12-C-Rohling: Volumen und Masse bestimmen
- Bohrungsvolumen und prozentualen Zerspanungsanteil berechnen

### Rahmenplan / Gliederung

- Werkstoffeigenschaften beurteilen
- Werkstoffe nach Verwendung auswählen
- Materialeinsatz wirtschaftlich und umweltschonend planen

Damit ist klar: Rechnen allein reicht nicht, die Materialentscheidung muss fachlich begründet sein.

---

## 6) So triffst du eine Materialentscheidung

Nutze in offenen Aufgaben eine kurze, klare Struktur:

1) Funktion des Bauteils
2) relevante Stoffwerte (mindestens Dichte, oft zusätzlich Festigkeit/Verschleiß)
3) Vergleich der Alternativen bei gleicher Geometrie
4) Entscheidung + Begründung

Beispielhafte Begründung:
"Aluminium reduziert die Masse deutlich, wenn die Festigkeitsanforderung weiterhin erfüllt bleibt."

---

## 7) Typische Prüfungsfallen

- falsche Volumeneinheit (mm3 statt cm3)
- Dichtewert aus falscher Zeile/Legierung
- Masse in g berechnet, aber als kg notiert
- Werkstoffvergleich ohne Bezug zur Aufgabe
- rechnerisch richtig, aber technisch unplausibel übernommen

---

## 8) 20-Sekunden-Check vor Abgabe

- Sind Einheiten konsistent?
- Passt die Größenordnung der Masse?
- Ist die Richtung beim Vergleich logisch (Alu leichter, Bronze eher schwer)?
- Ist die Werkstoffentscheidung begründet und nicht nur "aus dem Bauch"?

---

## Mini-Merkkarte

- Stoffwert zuerst, dann Formel
- 1 kg/dm3 = 1 g/cm3
- m = rho * V
- gleiche Geometrie: Masse skaliert mit Dichte
- Ergebnis immer technisch einordnen
