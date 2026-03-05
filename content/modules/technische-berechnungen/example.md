# Beispiele – Technische Berechnungen (Grundlagen)

Hier siehst du **prüfungsnahe Beispiele** (AP1/Prüfung), die direkt aus **Erklärung** und **Formeln** folgen.

> **Arbeitsweise (immer gleich):**
> 1) Gegeben/Gesucht (mit Einheit)  
> 2) Einheiten prüfen/umrechnen  
> 3) Formel wählen  
> 4) ggf. umstellen  
> 5) einsetzen  
> 6) rechnen  
> 7) Ergebnis + Einheit  
> 8) Plausibilität

---

## Beispiel 1: Drehmoment (Grundformel)

### Aufgabe
Ein Schraubenschlüssel hat den Hebelarm **r = 0,25 m**.  
Du drückst mit **F = 120 N**.  
Berechne das **Drehmoment M**.

### Lösung

**1) Gegeben / Gesucht**
- Gegeben:
  - $F = 120\,\mathrm{N}$
  - $r = 0{,}25\,\mathrm{m}$
- Gesucht:
  - $M$ in $\mathrm{N\cdot m}$

**2) Einheiten prüfen**
- $F$ in N ✅
- $r$ in m ✅

**3) Formel**
$$
M = F\cdot r
$$

**4) Einsetzen**
$$
M = 120 \cdot 0{,}25
$$

**5) Rechnen**
$$
M = 30\,\mathrm{N\cdot m}
$$

✅ **Ergebnis:** $M = 30\,\mathrm{N\cdot m}$

> **Plausibilität:** 120 N bei 0,25 m → 30 N·m ist realistisch.

---

## Beispiel 2: Druck (Kraft auf Fläche) + Umrechnen

### Aufgabe
Eine Kraft **F = 18 kN** wirkt auf eine Fläche **A = 30 cm²**.  
Berechne den **Druck p in bar**.

### Lösung

**1) Gegeben / Gesucht**
- Gegeben:
  - $F = 18\,\mathrm{kN}$
  - $A = 30\,\mathrm{cm^2}$
- Gesucht:
  - $p$ in **bar**

**2) Einheiten umrechnen (kritisch!)**
- Kraft:
$$
18\,\mathrm{kN} = 18\,000\,\mathrm{N}
$$

- Fläche:
$$
1\,\mathrm{cm^2} = 10^{-4}\,\mathrm{m^2}
$$
$$
A = 30\cdot 10^{-4}\,\mathrm{m^2} = 0{,}0030\,\mathrm{m^2}
$$

**3) Formel**
$$
p = \frac{F}{A}
$$

**4) Einsetzen**
$$
p = \frac{18\,000}{0{,}0030}
$$

**5) Rechnen (Pa)**
$$
p = 6\,000\,000\,\mathrm{Pa}
$$

**6) Umrechnen (Pa → bar)**
$$
1\,\mathrm{bar} = 100\,000\,\mathrm{Pa}
$$
$$
p = \frac{6\,000\,000}{100\,000} = 60\,\mathrm{bar}
$$

✅ **Ergebnis:** $p = 60\,\mathrm{bar}$

> **Prüfungsfalle:** Wenn $30\,\mathrm{cm^2}$ nicht zu $0{,}0030\,\mathrm{m^2}$ wird, ist alles falsch.

---

## Beispiel 3: Druck umgestellt (gesucht: Kraft)

### Aufgabe
In einer Hydraulik gilt **p = 50 bar** auf **A = 8 cm²**.  
Berechne die **Kraft F in kN**.

### Lösung

**1) Gegeben / Gesucht**
- Gegeben:
  - $p = 50\,\mathrm{bar}$
  - $A = 8\,\mathrm{cm^2}$
- Gesucht:
  - $F$ in kN

**2) Umrechnen**
- Druck:
$$
50\,\mathrm{bar} = 50\cdot 100\,000\,\mathrm{Pa} = 5\,000\,000\,\mathrm{Pa}
$$
- Fläche:
$$
A = 8\cdot 10^{-4}\,\mathrm{m^2} = 0{,}0008\,\mathrm{m^2}
$$

**3) Formel umstellen**
Aus
$$
p=\frac{F}{A}
$$
wird
$$
F = p\cdot A
$$

**4) Einsetzen**
$$
F = 5\,000\,000 \cdot 0{,}0008
$$

**5) Rechnen**
$$
F = 4\,000\,\mathrm{N} = 4\,\mathrm{kN}
$$

✅ **Ergebnis:** $F = 4\,\mathrm{kN}$

---

## Beispiel 4: Gewichtskraft

### Aufgabe
Masse **m = 7,5 kg**, $g=9{,}81\,\mathrm{m/s^2}$.  
Berechne die Gewichtskraft $F_G$.

### Lösung

**1) Gegeben / Gesucht**
- $m = 7{,}5\,\mathrm{kg}$
- $g = 9{,}81\,\mathrm{m/s^2}$
- gesucht: $F_G$ in N

**2) Formel**
$$
F_G = m\cdot g
$$

**3) Einsetzen**
$$
F_G = 7{,}5\cdot 9{,}81
$$

**4) Rechnen**
$$
F_G = 73{,}575\,\mathrm{N}\approx 73{,}6\,\mathrm{N}
$$

✅ **Ergebnis:** $F_G \approx 73{,}6\,\mathrm{N}$

---

## Beispiel 5: Drehmoment mit mm → m (klassische Falle)

### Aufgabe
$F=250\,\mathrm{N}$, Hebelarm $r=120\,\mathrm{mm}$.  
Berechne $M$ in $\mathrm{N\cdot m}$.

### Lösung

**1) Umrechnen**
$$
120\,\mathrm{mm} = 0{,}120\,\mathrm{m}
$$

**2) Formel**
$$
M = F\cdot r
$$

**3) Einsetzen**
$$
M = 250\cdot 0{,}12 = 30\,\mathrm{N\cdot m}
$$

✅ **Ergebnis:** $M = 30\,\mathrm{N\cdot m}$

---

## Beispiel 6: Zylinder-Volumen (mm³ → cm³)

### Aufgabe
Zylinder: $d=30\,\mathrm{mm}$, $h=80\,\mathrm{mm}$, $\pi=3{,}1416$.  
Berechne $V$ in $\mathrm{cm^3}$.

### Lösung

**1) Radius**
$$
r=\frac{d}{2}=\frac{30}{2}=15\,\mathrm{mm}
$$

**2) Formel**
$$
V=\pi r^2 h
$$

**3) Einsetzen & Rechnen (mm³)**
$$
V=3{,}1416\cdot 15^2\cdot 80
=3{,}1416\cdot 225\cdot 80
=56\,548{,}8\,\mathrm{mm^3}
$$

**4) Umrechnen**
$$
1\,\mathrm{cm^3} = 1000\,\mathrm{mm^3}
\quad\Rightarrow\quad
V=\frac{56\,548{,}8}{1000}=56{,}5488\,\mathrm{cm^3}\approx 56{,}55\,\mathrm{cm^3}
$$

✅ **Ergebnis:** $V\approx 56{,}55\,\mathrm{cm^3}$

---

## Beispiel 7: Leistung aus Arbeit und Zeit

### Aufgabe
$W=2400\,\mathrm{J}$ in $t=30\,\mathrm{s}$.  
Berechne $P$ in W.

### Lösung
$$
P=\frac{W}{t}=\frac{2400}{30}=80\,\mathrm{W}
$$

✅ **Ergebnis:** $P=80\,\mathrm{W}$

---

## Beispiel 8: Rotierende Leistung (Welle)

### Aufgabe
$n=900\,\mathrm{min^{-1}}$, $M=24\,\mathrm{N\cdot m}$, $\pi=3{,}1416$.  
Berechne $P$ in W.

$$
P=\frac{2\pi\cdot n\cdot M}{60}
$$

### Lösung
$$
P=\frac{2\cdot 3{,}1416\cdot 900\cdot 24}{60}
=2\cdot 3{,}1416\cdot 15\cdot 24
=2261{,}95\,\mathrm{W}\approx 2262\,\mathrm{W}
$$

✅ **Ergebnis:** $P\approx 2262\,\mathrm{W}$

---

## Beispiel 9: Dichte in g/cm³

### Aufgabe
$m=1{,}56\,\mathrm{kg}$, $V=200\,\mathrm{cm^3}$.  
Berechne $\rho$ in $\mathrm{g/cm^3}$.

### Lösung

**1) Masse umrechnen**
$$
1{,}56\,\mathrm{kg}=1560\,\mathrm{g}
$$

**2) Formel**
$$
\rho=\frac{m}{V}
$$

**3) Einsetzen**
$$
\rho=\frac{1560}{200}=7{,}8\,\mathrm{g/cm^3}
$$

✅ **Ergebnis:** $\rho=7{,}8\,\mathrm{g/cm^3}$

---

## Sidebar-Content (für rechts, kompakt)

### Quick-Checks (Prüfung)
- **Druck**: Fläche immer in $\mathrm{m^2}$
- **Drehmoment**: Hebelarm immer in **m**
- **Zylinder**: erst $r=\frac{d}{2}$, dann rechnen
- **Pa ↔ bar**: $1\,\mathrm{bar}=100\,000\,\mathrm{Pa}$
- **kN ↔ N**: $1\,\mathrm{kN}=1000\,\mathrm{N}$

### Mini-Merkkarte
- $M=F\cdot r$
- $p=\frac{F}{A}$
- $F_G=m\cdot g$
- $P=\frac{W}{t}$
- $V=\pi r^2 h$
