# Formeln & Merkkarte – Technische Zeichnungen lesen und nutzen

> **Merksatz:** In Zeichnungsaufgaben verlierst du Punkte fast nie wegen „schwerer Mathematik“, sondern weil du **ein Symbol falsch deutest** (Ø/R, Toleranz, Fase) oder **Min/Max vertauschst**.  
> Hier sind die wichtigsten Beziehungen **so umgestellt**, dass du sie direkt einsetzen kannst.

---

## 1) Prüfungs-Algorithmus (Zeichnung → Ergebnis)

[[shape:tz_exam_algorithm]]

1. **Was ist gegeben?** (Zeichnungsangabe + Einheit)
2. **Was ist gesucht?** (Radius? Durchmesser? Grenzmaß? Echtmaß?)
3. **Symbol checken** (Ø / R / ± / +…/… / 1:2 / 2×45°)
4. **Formel wählen**
5. **Einsetzen** (sauber, mit Einheit)
6. **Rechnen**
7. **Plausibilität**: Max > Nenn > Min? Ø = 2R? Skala richtig herum?

---

## 2) Zeichnungssymbole – das muss sitzen

[[shape:tz_symbols]]

### Ø und R

- **Durchmesser aus Radius**
$$
\varnothing = 2R
$$

- **Radius aus Durchmesser**
$$
R = \frac{\varnothing}{2}
$$

> **Check:** Wenn in der Zeichnung „Ø“ steht, ist es **nie** der Radius.

---

## 3) Toleranzen → Grenzmaße (Min / Max)

[[shape:tz_tolerances]]

### 3.1 Symmetrische Toleranz (±)

Gegeben: $x_{\text{nenn}} \pm t$

$$
x_{\text{max}} = x_{\text{nenn}} + t
\qquad
x_{\text{min}} = x_{\text{nenn}} - t
$$

### 3.2 Einseitige Toleranz (+ / − separat)

Gegeben:
$$
\underset{-t_{-}}{\overset{+t_{+}}{x_{\text{nenn}}}}
$$

$$
x_{\text{max}} = x_{\text{nenn}} + t_{+}
\qquad
x_{\text{min}} = x_{\text{nenn}} - t_{-}
$$

> **Check:** $x_{\text{max}}$ ist immer der größere Wert, $x_{\text{min}}$ der kleinere.

---

## 4) Skalen rechnen (nur wenn gefragt!)

[[shape:tz_scales]]

Skala wird als **Zeichnung : Echt** verstanden.

### 4.1 Skala 1:n

$$
L_{\text{echt}} = L_{\text{zeichnung}} \cdot n
\qquad
L_{\text{zeichnung}} = \frac{L_{\text{echt}}}{n}
$$

Beispiel 1:2 → $L_{\text{echt}} = 2 \cdot L_{\text{zeichnung}}$

### 4.2 Skala n:1

$$
L_{\text{echt}} = \frac{L_{\text{zeichnung}}}{n}
\qquad
L_{\text{zeichnung}} = L_{\text{echt}} \cdot n
$$

Beispiel 2:1 → $L_{\text{echt}} = \frac{1}{2} \cdot L_{\text{zeichnung}}$

> **Check:** 1:2 macht das Teil in echt **größer**, 2:1 macht es in echt **kleiner**.

---

## 5) Fase a×45° – die Schräge

[[shape:tz_chamfer]]

Bei **a×45°** sind die **Schenkellängen** jeweils $a$.

Schräge (Fasenlänge):
$$
l = \sqrt{a^2 + a^2} = a\sqrt{2}
$$

Umgestellt:
$$
a = \frac{l}{\sqrt{2}}
$$

> **Check:** In „2×45°“ ist die **2 mm nicht die Schräge**, sondern die Schenkellänge.

---

## 6) Kettenmaße (Bohrungsreihen / Abstände)

[[shape:tz_chain_dims]]

Wenn eine erste Position $x_0$ von einer Kante gegeben ist und ein Abstand $p$ wiederholt wird:

- **Position der k-ten Bohrung (1. Bohrung ist k=1)**
$$
x_k = x_0 + (k - 1) \cdot p
$$

Beispiele:
- 3. Bohrung: $x_3 = x_0 + 2p$
- 4. Bohrung: $x_4 = x_0 + 3p$

---

## 7) Oberflächenangaben (Ra) – Kurzregel

[[shape:tz_surface]]

Ra ist ein Rauheitskennwert (µm).

- **kleineres Ra → feinere Oberfläche → meist mehr Aufwand**
- **größeres Ra → gröbere Oberfläche**

> **Prüfungs-Miniregel:** „Ra runter = feiner“.

---

## 8) Schnell-Checks (Prüfungssicherheit)

[[shape:tz_quick_checks]]

- Ø ↔ R: **Ø = 2R** (immer kontrollieren)
- Toleranz: **Max > Nenn > Min**
- Skala: **1:2 → echt größer**, **2:1 → echt kleiner**
- Fase: **a×45° → Schräge = a√2**
- Ergebnis immer mit **Einheit (mm)**, Grenzmaße als **Min/Max**
