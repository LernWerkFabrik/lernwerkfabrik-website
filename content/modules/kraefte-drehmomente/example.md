# Beispiele – Kräfte und Drehmomente in Bauteilen beurteilen

> **Arbeitsweise (immer gleich, prüfungssicher):**
> 1) Skizze (gedanklich) + Bezugspunkt festlegen  
> 2) Gegeben / Gesucht (mit Einheit)  
> 3) Einheiten prüfen/umrechnen  
> 4) Formel wählen (ggf. Gleichgewichte)  
> 5) ggf. umstellen  
> 6) einsetzen  
> 7) rechnen  
> 8) Ergebnis + Einheit  
> 9) Plausibilität prüfen

---

## Beispiel 1: Drehmoment – Grundformel (klassischer Einstieg)

### Aufgabe
Ein Schraubenschlüssel hat den Hebelarm  
$$
r = 0{,}25\,\mathrm{m}
$$
Du drückst senkrecht mit  
$$
F = 180\,\mathrm{N}
$$
Berechne das Drehmoment $M$.

### Lösung

**1) Gegeben / Gesucht**
- Gegeben:
  $$
  F = 180\,\mathrm{N},\quad r = 0{,}25\,\mathrm{m}
  $$
- Gesucht:
  $$
  M \;[\mathrm{N\cdot m}]
  $$

**2) Einheiten prüfen**
- $F$ in $\mathrm{N}$ ✅
- $r$ in $\mathrm{m}$ ✅

**3) Formel**
$$
M = F\cdot r
$$

**4) Einsetzen**
$$
M = 180 \cdot 0{,}25
$$

**5) Rechnen**
$$
M = 45\,\mathrm{N\cdot m}
$$

✅ **Ergebnis:**
$$
M = 45\,\mathrm{N\cdot m}
$$

**Plausibilität:**  
Hebelarm 0,25 m (25 cm) und 180 N → 45 N·m ist realistisch.

---

## Beispiel 2: Drehmoment – mm in m umrechnen (Prüfungsfalle Nr. 1)

### Aufgabe
Eine Kraft wirkt senkrecht an einem Hebelarm:
$$
F = 250\,\mathrm{N},\quad r = 120\,\mathrm{mm}
$$
Berechne $M$ in $\mathrm{N\cdot m}$.

### Lösung

**1) Gegeben / Gesucht**
- Gegeben:
  $$
  F = 250\,\mathrm{N},\quad r = 120\,\mathrm{mm}
  $$
- Gesucht:
  $$
  M \;[\mathrm{N\cdot m}]
  $$

**2) Umrechnen (entscheidend!)**
$$
120\,\mathrm{mm} = 120\cdot 10^{-3}\,\mathrm{m} = 0{,}120\,\mathrm{m}
$$

**3) Formel**
$$
M = F\cdot r
$$

**4) Einsetzen**
$$
M = 250\cdot 0{,}120
$$

**5) Rechnen**
$$
M = 30\,\mathrm{N\cdot m}
$$

✅ **Ergebnis:**
$$
M = 30\,\mathrm{N\cdot m}
$$

> **Prüfungsfalle:** Wenn man $120$ statt $0,120$ einsetzt, ist das Ergebnis um Faktor 1000 falsch.

---

## Beispiel 3: Hebelgesetz – Kraft am anderen Hebelarm

### Aufgabe
Ein Hebel ist im Gleichgewicht.  
Links wirkt eine Kraft
$$
F_1 = 400\,\mathrm{N}
$$
mit Hebelarm
$$
r_1 = 0{,}20\,\mathrm{m}
$$
Rechts beträgt der Hebelarm
$$
r_2 = 0{,}50\,\mathrm{m}
$$
Berechne die Kraft $F_2$.

### Lösung

**1) Gegeben / Gesucht**
- Gegeben:
  $$
  F_1=400\,\mathrm{N},\quad r_1=0{,}20\,\mathrm{m},\quad r_2=0{,}50\,\mathrm{m}
  $$
- Gesucht:
  $$
  F_2\;[\mathrm{N}]
  $$

**2) Formel (Hebelgesetz)**
$$
F_1\cdot r_1 = F_2\cdot r_2
$$

**3) Umstellen nach $F_2$**
$$
F_2 = \frac{F_1\cdot r_1}{r_2}
$$

**4) Einsetzen**
$$
F_2 = \frac{400\cdot 0{,}20}{0{,}50}
$$

**5) Rechnen**
$$
F_2 = \frac{80}{0{,}50} = 160\,\mathrm{N}
$$

✅ **Ergebnis:**
$$
F_2 = 160\,\mathrm{N}
$$

**Plausibilität:**  
Rechts ist der Hebelarm größer → benötigte Kraft ist kleiner ✅

---

## Beispiel 4: Hebelgesetz – Hebelarm gesucht

### Aufgabe
Ein Handhebel soll ein Drehmoment erzeugen:
$$
M = 36\,\mathrm{N\cdot m}
$$
Du kannst eine Kraft aufbringen von:
$$
F = 120\,\mathrm{N}
$$
Welcher Hebelarm $r$ ist nötig?

### Lösung

**1) Gegeben / Gesucht**
- Gegeben:
  $$
  M=36\,\mathrm{N\cdot m},\quad F=120\,\mathrm{N}
  $$
- Gesucht:
  $$
  r\;[\mathrm{m}]
  $$

**2) Formel**
$$
M = F\cdot r
$$

**3) Umstellen**
$$
r = \frac{M}{F}
$$

**4) Einsetzen**
$$
r = \frac{36}{120}
$$

**5) Rechnen**
$$
r = 0{,}30\,\mathrm{m}
$$

✅ **Ergebnis:**
$$
r = 0{,}30\,\mathrm{m}
$$

**Interpretation:**  
30 cm Hebelarm sind nötig, damit 120 N ein Moment von 36 N·m erzeugen.

---

## Beispiel 5: Momentengleichgewicht – mehrere Kräfte am Bauteil

### Aufgabe
An einem Hebel wirken zwei Kräfte (beide senkrecht nach unten):

- $F_1 = 300\,\mathrm{N}$ bei $r_1 = 0{,}40\,\mathrm{m}$
- $F_2 = 150\,\mathrm{N}$ bei $r_2 = 0{,}80\,\mathrm{m}$

Berechne die Momente $M_1$ und $M_2$ und beurteile, ob Gleichgewicht vorliegt.

### Lösung

**1) Gegeben**
$$
F_1=300\,\mathrm{N},\; r_1=0{,}40\,\mathrm{m}
$$
$$
F_2=150\,\mathrm{N},\; r_2=0{,}80\,\mathrm{m}
$$

**2) Formel**
$$
M = F\cdot r
$$

**3) Momente berechnen**
$$
M_1 = 300\cdot 0{,}40 = 120\,\mathrm{N\cdot m}
$$
$$
M_2 = 150\cdot 0{,}80 = 120\,\mathrm{N\cdot m}
$$

✅ **Ergebnis:**
$$
M_1 = 120\,\mathrm{N\cdot m},\quad M_2 = 120\,\mathrm{N\cdot m}
$$

**Beurteilung (Gleichgewicht):**  
Wenn $M_1$ und $M_2$ entgegengesetzt drehen (z. B. links/rechts), dann gilt:
$$
\sum M = 0
$$
→ **Gleichgewicht liegt vor**.

> **Prüfungshinweis:** Ohne Angabe des Drehsinns musst du ihn in der Skizze festlegen.

---

## Beispiel 6: Lagerkräfte – mittige Einzelkraft (Standardfall)

### Aufgabe
Ein Balken ist links und rechts gelagert.  
In der Mitte wirkt eine Kraft:
$$
F = 800\,\mathrm{N}
$$
Bestimme die Lagerkräfte $R_A$ und $R_B$.

### Lösung

**1) Idee / Skizzenlogik**
- Mittige Belastung → Symmetrie → beide Lager tragen gleich viel.

**2) Kräftegleichgewicht**
$$
R_A + R_B = F
$$

**3) Symmetrie**
$$
R_A = R_B
$$

**4) Einsetzen**
$$
2R_A = 800
$$

**5) Rechnen**
$$
R_A = 400\,\mathrm{N}
$$
Damit:
$$
R_B = 400\,\mathrm{N}
$$

✅ **Ergebnis:**
$$
R_A = R_B = 400\,\mathrm{N}
$$

---

## Beispiel 7: Lagerkräfte – Einzelkraft nicht mittig (sehr prüfungsnah)

### Aufgabe
Ein Balken der Länge
$$
L = 2{,}0\,\mathrm{m}
$$
ist links (A) und rechts (B) gelagert.  
Eine Kraft
$$
F = 900\,\mathrm{N}
$$
wirkt in Abstand
$$
a = 0{,}60\,\mathrm{m}
$$
vom linken Lager A.

Berechne $R_A$ und $R_B$.

### Lösung

**1) Gegeben / Gesucht**
- Gegeben:
  $$
  L=2{,}0\,\mathrm{m},\quad F=900\,\mathrm{N},\quad a=0{,}60\,\mathrm{m}
  $$
- Gesucht:
  $$
  R_A,\; R_B
  $$

**2) Kräftegleichgewicht**
$$
R_A + R_B = F
$$

**3) Momentengleichgewicht um A**
Momente um A wählen ist schlau, weil $R_A$ dort keinen Hebelarm hat.

$$
\sum M_A = 0
$$

Gegenuhrzeigersinn positiv:
- $R_B$ erzeugt positives Moment:
$$
+R_B\cdot L
$$
- $F$ erzeugt negatives Moment:
$$
-F\cdot a
$$

Gleichung:
$$
R_B\cdot L - F\cdot a = 0
$$

**4) Nach $R_B$ umstellen**
$$
R_B = \frac{F\cdot a}{L}
$$

**5) Einsetzen**
$$
R_B = \frac{900\cdot 0{,}60}{2{,}0}
$$

**6) Rechnen**
$$
R_B = \frac{540}{2{,}0} = 270\,\mathrm{N}
$$

**7) $R_A$ berechnen**
$$
R_A = F - R_B = 900 - 270 = 630\,\mathrm{N}
$$

✅ **Ergebnis:**
$$
R_A = 630\,\mathrm{N},\quad R_B = 270\,\mathrm{N}
$$

**Plausibilität:**  
Kraft wirkt näher an A → $R_A$ muss größer sein ✅

---

## Beispiel 8: Streckenlast → Resultierende (Grundprinzip)

### Aufgabe
Ein Balken wird gleichmäßig belastet mit
$$
q = 600\,\mathrm{N/m}
$$
über eine Länge von
$$
L = 1{,}5\,\mathrm{m}
$$

1) Berechne die resultierende Kraft $F_{\mathrm{res}}$  
2) Wo greift sie an?

### Lösung

**1) Formel**
$$
F_{\mathrm{res}} = q\cdot L
$$

**2) Einsetzen**
$$
F_{\mathrm{res}} = 600 \cdot 1{,}5
$$

**3) Rechnen**
$$
F_{\mathrm{res}} = 900\,\mathrm{N}
$$

✅ **Resultierende Kraft:**
$$
F_{\mathrm{res}} = 900\,\mathrm{N}
$$

**Angriffspunkt:**  
Bei gleichmäßig verteilter Last greift die Resultierende in der Mitte an:
$$
x = \frac{L}{2} = \frac{1{,}5}{2} = 0{,}75\,\mathrm{m}
$$

✅ **Angriffspunkt:**
$$
x = 0{,}75\,\mathrm{m}
$$

---

## Beispiel 9: Drehmoment an Welle → Umfangskraft

### Aufgabe
Ein Motor liefert ein Drehmoment:
$$
M = 24\,\mathrm{N\cdot m}
$$
Es wirkt über eine Riemenscheibe mit Radius:
$$
r = 60\,\mathrm{mm}
$$
Berechne die Umfangskraft $F_u$.

### Lösung

**1) Umrechnen**
$$
60\,\mathrm{mm} = 0{,}060\,\mathrm{m}
$$

**2) Formel**
$$
M = F_u\cdot r
$$

**3) Umstellen**
$$
F_u = \frac{M}{r}
$$

**4) Einsetzen**
$$
F_u = \frac{24}{0{,}060}
$$

**5) Rechnen**
$$
F_u = 400\,\mathrm{N}
$$

✅ **Ergebnis:**
$$
F_u = 400\,\mathrm{N}
$$

**Plausibilität:**  
Kleiner Radius → größere Umfangskraft nötig ✅

---

## Beispiel 10: Kurz-Check (Prüfungsroutine)

### Aufgabe
Eine Kraft von $F=12\,\mathrm{kN}$ wirkt im Abstand $r=0{,}15\,\mathrm{m}$.  
Berechne das Moment.

### Lösung (kompakt, aber korrekt)

Umrechnen:
$$
12\,\mathrm{kN}=12\,000\,\mathrm{N}
$$

Moment:
$$
M=F\cdot r = 12\,000\cdot 0{,}15 = 1800\,\mathrm{N\cdot m}
$$

✅ Ergebnis:
$$
M = 1800\,\mathrm{N\cdot m}
$$

---

## Sidebar: typische Fehler (merken)

- Hebelarm $r$ immer in $\mathrm{m}$  
- Momente nur mit **senkrechtem Abstand**  
- Immer einen Bezugspunkt wählen  
- Lagerkräfte: erst $\sum M = 0$, dann $\sum F = 0$  
- Ergebnis immer mit Einheit  
- Plausibilität: Last näher am Lager → Lagerkraft dort größer  

---
