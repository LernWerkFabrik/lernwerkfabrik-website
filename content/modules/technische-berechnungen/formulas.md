# Formeln & Umrechnungen – Technische Berechnungen

> **Merksatz:** In Prüfungen scheitert man selten an der Formel – fast immer an **Einheiten**, **Umrechnung** oder **Umstellen**.  
> Hier ist alles bereits für dich **umgestellt** – und bei den wichtigsten Formeln siehst du die passende Form.

---

## 1) Prüfungs-Algorithmus (immer gleich)

[[shape:exam_algorithm]]

1. **Gesucht / Gegeben** sauber notieren (mit Einheiten)
2. **Einheiten umrechnen** (z.B. mm → m, cm² → m², cm³ → m³)
3. **Formel wählen**
4. **Nach Gesucht umstellen**
5. **Einsetzen** (Zahlen + Einheiten)
6. **Rechnen**
7. **Plausibilität / Einheit prüfen**

---

## 2) Einheiten – Grundlagen (SI)

### Länge

[[shape:unit_length]]


$$
1\,\mathrm{m} = 100\,\mathrm{cm} = 1000\,\mathrm{mm}
$$

$$
1\,\mathrm{mm} = 10^{-3}\,\mathrm{m}
$$

$$
1\,\mathrm{cm} = 10^{-2}\,\mathrm{m}
$$

---

### Fläche

[[shape:unit_area]]


$$
1\,\mathrm{m^2} = 10^4\,\mathrm{cm^2} = 10^6\,\mathrm{mm^2}
$$

$$
1\,\mathrm{cm^2} = 10^{-4}\,\mathrm{m^2}
$$

$$
1\,\mathrm{mm^2} = 10^{-6}\,\mathrm{m^2}
$$

---

### Volumen

[[shape:unit_volume]]


$$
1\,\mathrm{m^3} = 10^6\,\mathrm{cm^3} = 10^9\,\mathrm{mm^3}
$$

$$
1\,\mathrm{cm^3} = 10^{-6}\,\mathrm{m^3}
$$

$$
1\,\mathrm{mm^3} = 10^{-9}\,\mathrm{m^3}
$$

$$
1\,\mathrm{m^3} = 1000\,\mathrm{L}
$$

$$
1\,\mathrm{L} = 10^{-3}\,\mathrm{m^3}
$$

> **Achtung:** Volumen wird **kubisch** umgerechnet.

---

## 3) Geometrie – Flächen & Volumen

### Rechteck – Fläche

$$
A = a \cdot b
$$

$$
a = \frac{A}{b}
$$

$$
b = \frac{A}{a}
$$

[[shape:rectangle]]

---

### Quadrat – Fläche

[[shape:square]]

$$
A = a^2
$$

$$
a = \sqrt{A}
$$

---

### Kreis – Fläche

$$
A = \pi r^2
$$

$$
r = \sqrt{\frac{A}{\pi}}
$$

[[shape:circle]]

#### Radius / Durchmesser

$$
r = \frac{d}{2}
$$

$$
d = 2r
$$

> **Achtung:** Bei gegebenem Durchmesser zuerst **Radius** berechnen.

---

### Dreieck – Fläche

$$
A = \frac{1}{2}\,g\,h
$$

$$
g = \frac{2A}{h}
$$

$$
h = \frac{2A}{g}
$$

[[shape:triangle]]

---

### Zylinder – Volumen

$$
V = A_G \cdot h
$$

$$
A_G = \frac{V}{h}
$$

$$
h = \frac{V}{A_G}
$$

#### Grundfläche

$$
A_G = \pi r^2
$$

$$
r = \sqrt{\frac{A_G}{\pi}}
$$

[[shape:cylinder]]

> **Achtung:** Bei gegebenem Durchmesser gilt $$r=\frac{d}{2}$$ (nicht direkt $$d$$ einsetzen).

---

### Quader – Volumen

$$
V = a \cdot b \cdot h
$$

$$
a = \frac{V}{b \cdot h}
$$

$$
b = \frac{V}{a \cdot h}
$$

$$
h = \frac{V}{a \cdot b}
$$

[[shape:cuboid]]

---

### Kegel – Volumen

$$
V = \frac{1}{3}\pi r^2 h
$$

$$
h = \frac{3V}{\pi r^2}
$$

$$
r = \sqrt{\frac{3V}{\pi h}}
$$

[[shape:cone]]

> **Achtung:** Faktor $$\frac{1}{3}$$ nicht vergessen.  
> **Achtung:** Wenn ein Durchmesser gegeben ist: $$r=\frac{d}{2}$$.

---

### Prismenkörper (allgemein) – Volumen

[[shape:prism_general]]

$$
V = A_G \cdot h
$$

$$
A_G = \frac{V}{h}
$$

$$
h = \frac{V}{A_G}
$$

> **Merksatz:** Immer erst die **Grundfläche**, dann mal Höhe.

---

### Dreiecksprisma – Volumen

$$
V = A_G \cdot L
$$

$$
A_G = \frac{V}{L}
$$

$$
L = \frac{V}{A_G}
$$

#### Grundfläche (Dreieck)

$$
A_G = \frac{1}{2}\,g\,h
$$

$$
g = \frac{2A_G}{h}
$$

$$
h = \frac{2A_G}{g}
$$

[[shape:prism]]

> **Achtung:** Erst $$A_G$$ berechnen (Dreieck), dann mit $$L$$ multiplizieren.

---

## 4) Masse, Kraft, Druck

### Gewichtskraft

[[shape:weight_force]]

$$
F_G = m \cdot g
$$

$$
m = \frac{F_G}{g}
$$

> **Hinweis:** $$g \approx 9{,}81\,\mathrm{\frac{m}{s^2}}$$ (oft gerundet: $$10\,\mathrm{\frac{m}{s^2}}$$)

---

### Druck

$$
p = \frac{F}{A}
$$

$$
F = p \cdot A
$$

$$
A = \frac{F}{p}
$$

#### Einheiten

$$
1\,\mathrm{Pa} = 1\,\frac{\mathrm{N}}{\mathrm{m^2}}
$$

$$
1\,\mathrm{bar} = 10^5\,\mathrm{Pa}
$$

[[shape:pressure]]

> **Achtung:** Fläche bei Druck immer in **m²** einsetzen.  
> **Achtung:** $$1\,\mathrm{cm^2}=10^{-4}\,\mathrm{m^2}$$ und $$1\,\mathrm{mm^2}=10^{-6}\,\mathrm{m^2}$$.

---

## 5) Zeit, Weg, Geschwindigkeit

### Zeit

[[shape:time]]

$$
1\,\mathrm{min} = 60\,\mathrm{s}
$$

$$
1\,\mathrm{h} = 3600\,\mathrm{s}
$$

---

### Geschwindigkeit

[[shape:speed]]

$$
v = \frac{s}{t}
$$

$$
s = v \cdot t
$$

$$
t = \frac{s}{v}
$$

#### Umrechnung

$$
1\,\mathrm{\frac{m}{s}} = 3{,}6\,\mathrm{\frac{km}{h}}
$$

$$
1\,\mathrm{\frac{km}{h}} = \frac{1}{3{,}6}\,\mathrm{\frac{m}{s}}
$$

---

## 6) Drehzahl & Winkelgeschwindigkeit

[[shape:rotation_speed]]

$$
n = \frac{1}{T}
$$

$$
T = \frac{1}{n}
$$

$$
\omega = 2\pi n
$$

$$
n = \frac{\omega}{2\pi}
$$

---

## 7) Drehmoment

$$
M = F \cdot r
$$

$$
F = \frac{M}{r}
$$

$$
r = \frac{M}{F}
$$

[[shape:lever]]

> **Achtung:** Hebelarm $$r$$ immer in **m** einsetzen (mm → m!).  
> **Hinweis:** Wirksam ist nur der **senkrechte** Hebelarm.

---

## 8) Arbeit & Leistung

### Arbeit

[[shape:work]]


$$
W = F \cdot s
$$

$$
F = \frac{W}{s}
$$

$$
s = \frac{W}{F}
$$

---

### Leistung (zeitabhängig)

[[shape:power_time]]


$$
P = \frac{W}{t}
$$

$$
W = P \cdot t
$$

$$
t = \frac{W}{P}
$$

---

### Leistung an der Welle

[[shape:shaft_power]]


$$
P = M \cdot \omega
$$

$$
M = \frac{P}{\omega}
$$

$$
\omega = \frac{P}{M}
$$

---

## 9) Dichte

[[shape:density]]

$$
\rho = \frac{m}{V}
$$

$$
m = \rho \cdot V
$$

$$
V = \frac{m}{\rho}
$$

---

## 10) Toleranzen

### Maßabweichung

[[shape:deviation]]

$$
\Delta = x_\text{ist} - x_\text{soll}
$$

---

### Toleranz

[[shape:tolerance]]

$$
T = x_\text{max} - x_\text{min}
$$

---

## 11) Typische Prüfungsfallen

[[shape:exam_traps]]

- **mm² → m²** (Faktor $$10^{-6}$$)
- **mm³ → m³** (Faktor $$10^{-9}$$)
- **Druck**: Fläche immer in **m²**
- **Drehmoment**: Hebelarm in **m**
- **Geschwindigkeit**: $$\mathrm{m/s} \leftrightarrow \mathrm{km/h}$$
- **Kegel**: Faktor $$\frac{1}{3}$$ vergessen
- **Durchmesser vs. Radius**: $$r=\frac{d}{2}$$

---

## 12) Schnellübersicht – Umrechnungen

[[shape:conversion_quickref]]

$$
1\,\mathrm{mm} = 10^{-3}\,\mathrm{m}
$$

$$
1\,\mathrm{cm} = 10^{-2}\,\mathrm{m}
$$

$$
1\,\mathrm{mm^2} = 10^{-6}\,\mathrm{m^2}
$$

$$
1\,\mathrm{mm^3} = 10^{-9}\,\mathrm{m^3}
$$

$$
1\,\mathrm{m^3} = 1000\,\mathrm{L}
$$

$$
1\,\mathrm{L} = 10^{-3}\,\mathrm{m^3}
$$

$$
1\,\mathrm{\frac{m}{s}} = 3{,}6\,\mathrm{\frac{km}{h}}
$$
