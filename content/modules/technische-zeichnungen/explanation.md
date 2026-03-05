# Technische Zeichnungen lesen und nutzen

Technische Zeichnungen sind **die gemeinsame Sprache** zwischen Konstruktion und Fertigung.  
Du musst nicht „künstlerisch“ zeichnen können – du musst **Informationen sicher lesen** und daraus **Fertigungsmaße** ableiten.

Dieses Modul trainiert genau das: **Ansichten**, **Bemaßung**, **Symbole**, **Toleranzen** und typische Prüfungsfallen.

---

## 1) Grundregel: Du misst nicht – du liest Maße

In normgerechten Zeichnungen gilt:
- **Maße sind echte Fertigmaße** (auch wenn eine Skala angegeben ist).
- Eine Skala wird in Prüfungsaufgaben trotzdem oft abgefragt – dann rechnest du gezielt.

> **Merksatz:** In der Werkstatt: **Maßangabe schlägt Lineal**.  
> In der Prüfung: **Wenn nach Skala gefragt wird → rechnen.**

---

## 2) Ansichten verstehen (woher kommt welches Maß?)

Typisch sind:
- **Vorderansicht**
- **Draufsicht**
- **Seitenansicht**

Ein Maß gehört immer zu der Ansicht, in der du die betreffende Geometrie **wirklich** siehst:
- **Bohrabstand in der Fläche** → meist Draufsicht
- **Materialstärke / Tiefe** → oft Seitenansicht
- **Höhen / Stufen** → Vorder- oder Seitenansicht

> **Prüfungsfalle:** Ein Maß „sehen“ ist nicht gleich „richtig lesen“ – du brauchst die Ansicht, in der die Kante/Fläche eindeutig ist.

---

## 3) Wichtige Zeichnungssymbole (AP1-relevant)

### 3.1 Ø (Durchmesser) vs. R (Radius)

- **Ø 20** bedeutet: Durchmesser 20 mm → Radius wäre 10 mm
- **R 10** bedeutet: Radius 10 mm → Durchmesser wäre 20 mm

> **Merksatz:**  
> Ø = „runder Durchmesser“ – R = „Rundung / Radius“.

---

### 3.2 Senkung und Bohrung (Grundidee)

In Aufgaben tauchen häufig auf:
- **Durchgangsbohrung**: z. B. Ø 6,6
- **Senkung**: z. B. Ø 12 × 90° (Kegelsenkung)
- **Zylindersenkung**: z. B. Ø 12 × 5 (Durchmesser × Tiefe)

Hier im Modul nutzen wir vor allem **Zylindersenkung** als Rechenbasis:
- **Ø D × t** → Senkung hat Durchmesser D und Tiefe t

---

### 3.3 Fase (z. B. 2×45°)

**2×45°** bedeutet:
- 2 mm entlang der einen Kante
- 2 mm entlang der anderen Kante
- Winkel 45°

Die schräge Fasenlänge ist:
\[
l = 2\cdot \sqrt{2} \approx 2{,}83\,\text{mm}
\]

> **Prüfungsfalle:** 2 mm sind nicht die Schräge, sondern die Schenkellängen.

---

## 4) Toleranzen in Grenzmaße umrechnen (Punktegarant)

Beispiel: **25,00 ± 0,10 mm**

- **Max** = 25,00 + 0,10 = 25,10 mm  
- **Min** = 25,00 − 0,10 = 24,90 mm

Allgemein:
\[
x_\text{max}=x_\text{nenn}+T_+
\qquad
x_\text{min}=x_\text{nenn}-T_-
\]

### Einseitige Toleranz (z. B. +0,20 / 0,00)

Beispiel: **10,00 +0,20 / 0,00**
- Max = 10,20 mm
- Min = 10,00 mm

> **Prüfungsfalle:** Bei einseitig: „0,00“ ist nicht „egal“, sondern ist ein Grenzwert.

---

## 5) Skalen rechnen (wenn es gefragt ist)

**Skala 1:2** bedeutet:
- Zeichnung ist **halb so groß** wie das echte Teil  
- **Echtmaß = Zeichnungsmaß × 2**

**Skala 2:1** bedeutet:
- Zeichnung ist **doppelt so groß** wie das echte Teil  
- **Echtmaß = Zeichnungsmaß ÷ 2**

> **Mini-Merkkarte:**  
> 1:2 → echt größer (×2)  
> 2:1 → echt kleiner (÷2)

---

## 6) Oberflächenangaben (Ra)

Ra ist ein Rauheitskennwert (in µm). Typisch:
- Ra 6,3 µm: normal bearbeitet (z. B. Drehen/Fräsen, abhängig vom Prozess)
- Ra 3,2 µm: feiner
- Ra 1,6 µm: sehr fein

Im AP1-Kontext reicht: **größeres Ra = gröbere Oberfläche**.

> **Merksatz:** Ra runter → Oberfläche feiner (meist mehr Aufwand).

---

## 7) Typische Prüfungsfallen (bitte wirklich merken)

✅ Ø/R verwechselt  
✅ falsche Ansicht genutzt  
✅ Max/Min vertauscht  
✅ Fase 2×45° falsch als „2 mm Schräge“ gerechnet  
✅ Skala 1:2 und 2:1 vertauscht  
✅ Ergebnis ohne Einheit / ohne „Grenzmaße“

---

## Kurze Merkkarte (zum Wiederholen)

- Ø = Durchmesser, R = Radius  
- 25 ± 0,10 → Min 24,90 / Max 25,10  
- 1:2 → Echt = Zeichnung × 2  
- 2:1 → Echt = Zeichnung ÷ 2  
- 2×45° → Schenkellängen 2 mm, Schräge ≈ 2,83 mm
