# Beispiel - Fertigungsverfahren auswählen und anwenden

## Aufgabe (prüfungsnah)

Ein Haltewinkel aus S235 soll gefertigt werden.

### Gegeben

- Halbzeug: Blech 8 mm
- Außenkontur: Rechteck 120 x 80 mm
- Danach 90-Grad-Biegung an einer Linie
- Bohrungen:
  - 2x Durchgangsbohrung d = 6,6 mm
  - 1x Passbohrung d = 8H7
- 1x Innengewinde M5
- Schnittgeschwindigkeit:
  - Bohren d = 6,6 mm: vc = 30 m/min
  - Vorbohren für Reiben d = 7,8 mm: vc = 25 m/min

### Gesucht

1. Geeignete Fertigungsverfahren je Merkmal mit Begründung
2. Sinnvolle Arbeitsreihenfolge
3. Drehzahlen für d = 6,6 mm und d = 7,8 mm
4. Reibaufmaß für 8H7
5. Prüfmittel für Endkontrolle

---

## Lösung

### 1) Verfahrensauswahl begründen

- Außenkontur (Einzelteil/Kleinserie): Trennen, z. B. Sägen oder Fräsen.
- 90-Grad-Form: Umformen durch Biegen.
- Durchgangsbohrungen d = 6,6 mm: Spanen durch Bohren.
- Passbohrung 8H7: Vorbohren + Reiben (Feinbearbeitung für Toleranz).
- Innengewinde M5: Kernloch bohren, senken, Gewinde schneiden.

Begründung:
Die Kombination deckt Geometrie, Genauigkeit und Wirtschaftlichkeit ab.

---

### 2) Arbeitsreihenfolge

1. Zeichnung auswerten, Bezüge festlegen
2. Rohteil zuschneiden (Trennen)
3. Bezugskanten/Flächen herstellen
4. Bohrpositionen anreißen und ankernen
5. Durchgangsbohrungen d = 6,6 mm bohren
6. Vorbohren d = 7,8 mm, danach Reiben auf 8H7
7. Kernloch d = 4,2 mm für M5 bohren, senken, Gewinde schneiden
8. Biegen auf 90 Grad (mit geeigneter Vorrichtung)
9. Entgraten, reinigen
10. Endprüfung und Dokumentation

Hinweis:
Abhängig von Vorrichtung und Zeichnungsbezug kann Schritt 8 auch früher liegen. Entscheidend ist die technisch saubere Begründung.

---

### 3) Drehzahlen berechnen

Formel:
\[
n = \frac{1000 \cdot v_c}{\pi \cdot d}
\]

#### 3.1 Bohren d = 6,6 mm bei vc = 30 m/min

\[
n = \frac{1000 \cdot 30}{\pi \cdot 6,6}
= \frac{30000}{20,73}
\approx 1447 \; 1/min
\]

Praxiswert: **1450 1/min**

#### 3.2 Vorbohren d = 7,8 mm bei vc = 25 m/min

\[
n = \frac{1000 \cdot 25}{\pi \cdot 7,8}
= \frac{25000}{24,50}
\approx 1020 \; 1/min
\]

Praxiswert: **1020 1/min**

---

### 4) Reibaufmaß für 8H7

Vorbohrung 7,8 mm, Endmaß 8,0 mm:

\[
Aufmaß = 8,0 - 7,8 = 0,2 \; mm
\]

Das liegt im typischen Bereich für Reibbearbeitung.

---

### 5) Prüfmittel festlegen

- Allgemeine Längen-/Kontrollmaße: Messschieber
- Enge Außenmaße: Bügelmessschraube
- Passbohrung 8H7: Grenzlehrdorn
- M5-Gewinde: Gewindelehre
- Biegewinkel: Winkelmesser/Anschlagwinkel

---

## Ergebnis

Die Aufgabe ist prüfungssicher gelöst, wenn:

- Verfahren passend zur Anforderung gewählt sind,
- Reihenfolge technisch plausibel ist,
- Berechnungen korrekt sind,
- und die Qualitätsprüfung nachvollziehbar dokumentiert ist.
