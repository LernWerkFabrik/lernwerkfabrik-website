# Technische Berechnungen

In Prüfungen scheitern viele Aufgaben nicht an der Formel – sondern daran, dass man **Begriffe nicht sauber versteht**, **Einheiten vermischt**, Formeln **falsch umstellt** oder beim Rechnen **unsauber** arbeitet.

Dieses Modul ist deshalb **kein „Formelblatt“**, sondern ein Grundlagen-Training: Du lernst, **was die Größen bedeuten**, **wann welche Denkweise passt** und **wo die typischen Fallen liegen**.

**Ziel dieses Moduls:**  
Du kannst Aufgaben **systematisch lösen**, Einheiten **sicher umrechnen** und Ergebnisse **immer mit Einheit** angeben.

---

## So arbeitest du in jeder Aufgabe (Prüfungs-Algorithmus)

**1) Gegeben / Gesucht notieren (mit Einheit)**  
**2) Einheiten prüfen und vereinheitlichen** (mm → m, cm² → m², bar → Pa, 1/min → 1/s …)  
**3) Formel auswählen und hinschreiben**  
**4) Formel ggf. umstellen**  
**5) Werte einsetzen**  
**6) Rechnen + erst am Ende runden**  
**7) Plausibilität prüfen** (Größenordnung realistisch?)  
**8) Ergebnis mit Einheit ausgeben**

> **Merksatz:**  
> **Einheiten zuerst.** Wenn die Einheit falsch ist, ist das Ergebnis fast immer falsch – auch mit „richtiger“ Formel.

---

## 1) Einheiten & Umrechnungen (Must-know)

Einheiten sind nicht „Deko“. Sie sind Teil der Rechnung.  
Wenn in der Aufgabe **mm** steht, die Formel aber **m** erwartet, musst du umrechnen – sonst passt die Physik nicht.

---

### 1.1 Längen (mm, cm, m)

Längen sind meist noch einfach, weil du „nur“ den Faktor umrechnest.

| Umrechnung | Bedeutung |
|---|---|
| 1 m = 1000 mm | Meter ist größer |
| 1 mm = 0,001 m | drei Stellen nach links |
| 1 cm = 0,01 m | zwei Stellen nach links |

**Mini-Check:**  
- 250 mm = **0,250 m**  
- 2,5 m = **2500 mm**

---

### 1.2 Flächen (mm², cm², m²) - hier passieren die meisten Fehler

Bei Flächen wird **quadratisch** umgerechnet.  
Das bedeutet: Bei Flächen wird der Umrechnungsfaktor **zum Quadrat** genommen.

| Umrechnung | Ergebnis |
|---|---:|
| 1 m = 1000 mm ⇒ 1 m² = (1000 mm)² | 1 m² = **1 000 000 mm²** |
| 1 cm = 10 mm ⇒ 1 cm² = (10 mm)² | 1 cm² = **100 mm²** |

> **Merksatz:**  
> **Fläche = (Längenfaktor)²**

**Mini-Check:**  
- 1 m² = 1 000 000 mm²  
  ⇒ 500 mm² = 500 / 1 000 000 m²  
  = **0,0005 m²**  
- 20 cm² = 20 × 100 = **2000 mm²**

> **Achtung (AP1):** Beim Wechsel von cm² zu m² nicht nur durch 100 teilen, sondern durch **10 000**.

---
### 1.3 Volumen (mm³, cm³, m³)

Bei Volumen wird **kubisch** umgerechnet → Faktor **³**.

| Umrechnung | Ergebnis |
|---|---:|
| 1 m³ = (1000 mm)³ | 1 m³ = **1 000 000 000 mm³** |
| 1 cm³ = (10 mm)³ | 1 cm³ = **1000 mm³** |

> **Merksatz:**  
> **Bei Volumen: Faktor³** (1000³ = 1 000 000 000)

---

### 1.4 Kräfte / Masse / Gewichtskraft (was ist was?)

Viele verwechseln „Masse“ und „Kraft“.

- **Masse (m)** ist „wie viel Stoff“ – Einheit **kg**
- **Gewichtskraft (F)** ist „wie stark die Erde zieht“ – Einheit **N**

Gewichtskraft rechnest du mit:

**F = m · g**  
- g ≈ **9,81 m/s²** (manchmal 10, je nach Aufgabe)

| Umrechnung | Ergebnis |
|---|---:|
| 1 kN = 1000 N | kN ist größer |

**Mini-Check:**  
m = 10 kg → F = 10 · 9,81 = **98,1 N**

> **Typischer Fehler:**  
> Gramm statt kg (500 g = 0,5 kg).

---

### 1.5 Druck (Pa, bar) – „Kraft auf Fläche“

Druck beschreibt, **wie stark eine Kraft auf eine Fläche wirkt**.

- gleiche Kraft auf **großer Fläche** → Druck kleiner  
- gleiche Kraft auf **kleiner Fläche** → Druck größer

**Warum ist das prüfungsrelevant?**  
Weil in Aufgaben die Fläche oft in **cm²** oder **mm²** gegeben ist, die Formel aber **m²** erwartet. Wenn du das nicht umrechnest, ist das Ergebnis falsch.

**Formelidee:**  
Druck = Kraft / Fläche

- p in **Pa** (= N/m²)  
- A muss in **m²** sein

| Umrechnung | Ergebnis |
|---|---:|
| 1 bar = 100 000 Pa | sehr häufig |

**Mini-Check:**  
2 bar = **200 000 Pa**

> **Merksatz:**  
> Wenn Druck „komisch groß“ ist → zuerst Fläche (m²!) prüfen.

---

### 1.6 Zeit & Drehzahl (s, min, 1/s, 1/min)

In technischen Formeln ist Drehzahl oft in **1/min** gegeben. Manche Formeln erwarten aber **1/s**.  
Darum muss man häufig umrechnen.

| Umrechnung | Ergebnis |
|---|---:|
| 1 min = 60 s | Standard |
| 1/min → 1/s | **durch 60 teilen** |
| 1/s → 1/min | **mal 60** |

**Mini-Check:**  
n = 300 1/min → 300 / 60 = **5 1/s**

> **Merksatz:**  
> Drehzahl in Formeln **genau so einsetzen**, wie die Formel es verlangt.

---

## 2) Hauptbegriffe verstehen (nicht nur Formeln)

In Prüfungen bringt es dir viel, wenn du weißt, **was eine Größe bedeutet**. Dann erkennst du schneller, ob dein Ergebnis plausibel ist und welche Einheit passt.

---

### 2.1 Druck – was bedeutet das wirklich?

Druck ist „Kraft pro Fläche“.  
Du kannst dir das so vorstellen: Eine Kraft verteilt sich über eine Fläche. Je kleiner diese Fläche ist, desto stärker wirkt die Kraft an jedem Punkt.

- Beispiel aus dem Alltag: Ein spitzer Gegenstand wirkt „stärker“ als ein stumpfer, obwohl du vielleicht gleich stark drückst.
- Technisch: Kleine Kontaktflächen können hohe Flächenpressungen erzeugen.

**Wichtig in Prüfungsaufgaben:**  
- Fläche muss in **m²** angegeben werden  
- Druck kann in **Pa** oder **bar** verlangt werden

> **Merksatz:**  
> Kleine Fläche → großer Druck.

---

### 2.2 Drehmoment – warum ist das „Kraft mal Hebelarm“?

Drehmoment beschreibt, wie stark eine Kraft **drehen** will.

Zwei Dinge bestimmen das Drehmoment:
1) **Kraft F** (wie stark du drückst/ziehst)  
2) **Hebelarm r** (wie weit vom Drehpunkt entfernt)

Wenn du weiter außen am Schlüssel anfasst, brauchst du weniger Kraft, um die gleiche Schraube zu lösen – weil der Hebelarm größer ist.

**Prüfungsfalle:**  
Der Hebelarm muss in **m** eingesetzt werden.  
Wenn er in **mm** gegeben ist, muss man umrechnen.

> **Merksatz:**  
> Größerer Hebelarm = leichter drehen.

---

### 2.3 Leistung – „wie schnell Arbeit verrichtet wird“

Leistung sagt nicht nur „wie viel“, sondern „wie schnell“.

- Hohe Leistung bedeutet: In kurzer Zeit wird viel „Kraft-Weg-Arbeit“ umgesetzt.
- In rotierenden Systemen hängt Leistung stark von Drehzahl und Drehmoment ab.

**Prüfungsfalle:**  
In manchen Formeln muss Drehzahl korrekt als **1/min** oder **1/s** eingesetzt werden (siehe Umrechnung).

---

### 2.4 Dichte – „wie schwer pro Volumen“

Dichte ist eine Materialeigenschaft:  
Sie beschreibt, wie viel Masse in einem bestimmten Volumen steckt.

- hohe Dichte → Material ist „schwer“ für seine Größe (z. B. Stahl)  
- niedrige Dichte → Material ist „leicht“ (z. B. Holz)

Prüfungsfalle: Einheitensysteme:
- g/cm³ ↔ kg/m³ (Faktor 1000)

---

## 3) Standardformeln (Prüfungsfavoriten)

Hier sind die wichtigsten Formeln, die in diesem Modul häufig vorkommen.  
(Der komplette „Formel-Überblick“ kann später in einem eigenen Reiter kommen.)

---

### Gewichtskraft
**F = m · g** (F in N, m in kg, g ≈ 9,81 m/s²)

---

### Druck
**p = F / A**
- p in Pa (= N/m²) oder bar
- A in m²

---

### Drehmoment
**M = F · r**
- M in N·m
- r in m

---

### Leistung
**Linear:** **P = F · v**  
**Rotierend:** **P = 2 · π · n · M / 60**
- n in 1/min, M in N·m, P in W

> **Merksatz:**  
> Das **/60** ist dabei, weil n häufig in **1/min** gegeben ist.

---

### Dichte
**ρ = m / V**
- ρ in kg/m³ oder g/cm³
- 1 g/cm³ = 1000 kg/m³

---

### Volumen
**Quader:** **V = l · b · h**  
**Zylinder:** **V = π · r² · h**

**Achtung:** r ist Radius, nicht Durchmesser (d = 2r).

---

## 4) Umstellen von Formeln (sicher & sauber)

Grundregel: Du darfst auf beiden Seiten **das gleiche** machen.

**Beispiel: p = F / A**  
Gesucht: F  
1) p = F / A  
2) ·A auf beiden Seiten  
→ **F = p · A**

**Beispiel: M = F · r**  
Gesucht: r  
1) M = F · r  
2) /F  
→ **r = M / F**

> **Merksatz:**  
> Beim Umstellen: **erst isolieren, dann einsetzen.**

---

## 5) Typische Prüfungsfallen (bitte merken)

✅ Fläche/Volumen falsch umgerechnet (² / ³ vergessen)  
✅ mm statt m bei r, A oder l  
✅ bar und Pa verwechselt  
✅ Drehzahl falsch eingesetzt  
✅ Ergebnis ohne Einheit  
✅ Rundung zu früh (erst am Ende runden)

---

## 6) Plausibilität: 20 Sekunden, die Punkte retten

Frag dich kurz:
- Ist das Ergebnis in einer realistischen Größenordnung?
- Wurde aus mm² plötzlich ein riesiger Wert in m²? (Warnsignal!)
- Druck extrem klein oder extrem groß? → meist Fläche falsch
- Drehmoment extrem klein trotz großer Kraft? → r vermutlich in mm statt m

---

## Merkkarte (Kurzfassung zum Wiederholen)

- **Länge:** mm → m: /1000  
- **Fläche:** mm² → m²: /1 000 000  
- **Volumen:** mm³ → m³: /1 000 000 000  
- **1 bar = 100 000 Pa**  
- **1 kN = 1000 N**  
- **1/min → 1/s:** /60  
- **F = m·g**, **p = F/A**, **M = F·r**

