# Beispiel - Bauteile nach Zeichnung fertigen

## Aufgabe (prüfungsnah)

Ein Halteblech soll nach Zeichnung gefertigt werden.

### Gegeben

- Werkstoff: S235
- Rohteil: 92 x 52 x 12 mm
- Fertigmass:
  - Länge \(L = 90,00 \pm 0,10\) mm
  - Breite \(B = 50,00 \pm 0,10\) mm
  - Dicke \(s = 10,00 \pm 0,05\) mm
- Bohrungen:
  - 2x Durchgangsbohrung \(\varnothing 6,6\) bei x = 20 mm und x = 70 mm, jeweils auf Mittellinie
  - 1x Passbohrung \(\varnothing 8H7\) bei x = 45 mm
- Gewinde:
  - 1x M5, Gewindetiefe 10 mm
- Kanten:
  - 1 x 45 Grad entgraten
- Vorgegebene Schnittgeschwindigkeiten:
  - Bohren \(\varnothing 6,6\): \(v_c = 30\) m/min
  - Vorbohren für Reibung \(\varnothing 7,8\): \(v_c = 25\) m/min

### Gesucht

1. Sinnvolle Arbeitsfolge mit Prüfpunkten
2. Notwendige Kern- und Vorbohrmasse
3. Drehzahlen für die beiden Bohrungen
4. Grenzmasse für das Breitenmass

---

## Lösung

## 1) Zeichnung auswerten

Kritische Merkmale markieren:

- Funktionsmasse: 90 / 50 / 10
- enge Merkmale: 8H7, M5
- Bezug: linke Kante + Unterseite
- Qualitätsmerkmale: Kantenzustand, Bohrungslage, Toleranzen

---

## 2) Arbeitsfolge festlegen

1. Rohteil kontrollieren (Material + ?bermass)
2. Bezugsfläche plan herstellen
3. Länge/Breite auf NäherungsmaÃŸ fräsen oder feilen
4. Dicke auf Endmass bringen (10,00 +/- 0,05)
5. Bohrbild anreissen/positionieren und ankernen
6. 2x Bohrung \(\varnothing 6,6\) bohren
7. Vorbohren \(\varnothing 7,8\), danach Reiben auf \(\varnothing 8H7\)
8. Kernloch für M5 bohren (\(\varnothing 4,2\)), ansenken, Gewinde schneiden
9. Kanten 1 x 45 Grad, entgraten, reinigen
10. Endkontrolle + Prüfprotokoll

Prozessbegleitende Prüfpunkte:

- nach Schritt 3: L/B auf Vorbearbeitungsmass
- nach Schritt 4: Dicke auf Toleranz
- nach Schritt 7: Passbohrung prüfen
- nach Schritt 8: Gewinde prüfen
- nach Schritt 10: Endkontrolle komplett

---

## 3) Bohr- und Gewindedaten

### 3.1 Kernloch für M5

\[
d_{Kern} = 4,2 \text{ mm}
\]

### 3.2 Reibaufmass für 8H7

Vorbohrung 7,8 mm auf Endmass 8,0 mm:

\[
Aufmass = 8,0 - 7,8 = 0,2 \text{ mm}
\]

Das liegt im typischen Bereich für Reibbearbeitung.

---

## 4) Drehzahlen berechnen

Formel:

\[
n = \frac{1000 \cdot v_c}{\pi \cdot d}
\]

### 4.1 Bohrung \(\varnothing 6,6\), \(v_c = 30\) m/min

\[
n = \frac{1000 \cdot 30}{\pi \cdot 6,6}
  = \frac{30000}{20,73}
  \approx 1447 \text{ 1/min}
\]

Einstellwert praxisnah: **1450 1/min**

### 4.2 Vorbohrung \(\varnothing 7,8\), \(v_c = 25\) m/min

\[
n = \frac{1000 \cdot 25}{\pi \cdot 7,8}
  = \frac{25000}{24,50}
  \approx 1020 \text{ 1/min}
\]

Einstellwert praxisnah: **1020 1/min**

---

## 5) Grenzmasse für B = 50,00 +/- 0,10 mm

\[
B_{max} = 50,00 + 0,10 = 50,10 \text{ mm}
\]

\[
B_{min} = 50,00 - 0,10 = 49,90 \text{ mm}
\]

Bewertung:

- i. O. wenn \(49,90 \le B \le 50,10\)

---

## 6) Kurzbeispiel für ein Prüfprotokoll

- Mass B gemessen: 50,04 mm -> i. O.
- Dicke s gemessen: 9,98 mm -> i. O.
- Passbohrung 8H7 mit Lehrdorn: Gutseite geht, Ausschussseite geht nicht -> i. O.
- M5-Gewinde mit Gewindelehre: i. O.

---

## Ergebnis

Das Bauteil ist funktionsgerecht gefertigt, wenn:

- Reihenfolge technisch sauber ist (Bezug -> Bearbeitung -> Prüfung),
- kritische Merkmale prozessbegleitend kontrolliert wurden,
- alle Endmasse innerhalb der Toleranz liegen,
- und die Ergebnisse nachvollziehbar dokumentiert sind.
