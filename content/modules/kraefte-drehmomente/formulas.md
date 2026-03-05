# Formeln & Umrechnungen – Kräfte und Drehmomente in Bauteilen beurteilen

> **Merksatz:**  
> In Statik-Aufgaben verliert man Punkte nicht an der Formel –  
> sondern an falschen Hebelarmen, fehlenden Vorzeichen oder $\mathrm{mm}$ statt $\mathrm{m}$.

---

# 1) Grundgrößen & Einheiten

## Kraft

shape:kd_force_units

$$
F \quad [\mathrm{N}]
$$

$$
1\,\mathrm{kN} = 1000\,\mathrm{N}
$$

$$
1\,\mathrm{N} = 1\,\mathrm{kg}\cdot \frac{\mathrm{m}}{\mathrm{s^2}}
$$

---

## Länge

shape:unit_length

$$
1\,\mathrm{m} = 1000\,\mathrm{mm}
$$

$$
1\,\mathrm{mm} = 10^{-3}\,\mathrm{m}
$$

---

## Drehmoment

shape:lever

$$
M \quad [\mathrm{N\cdot m}]
$$

$$
1\,\mathrm{N\cdot m} = 1000\,\mathrm{N\cdot mm}
$$

$$
1\,\mathrm{kN\cdot m} = 1000\,\mathrm{N\cdot m}
$$

> **Achtung:** Hebelarm $r$ immer in $\mathrm{m}$ einsetzen.

---

# 2) Drehmoment (Moment)

## Grundformel

shape:lever

$$
M = F \cdot r
$$

- $F$ in $\mathrm{N}$
- $r$ in $\mathrm{m}$
- $M$ in $\mathrm{N\cdot m}$

---

## Umstellungen

shape:lever

$$
F = \frac{M}{r}
$$

$$
r = \frac{M}{F}
$$

---

## Allgemein mit Winkel

shape:kd_moment_angle

$$
M = F \cdot r \cdot \sin(\alpha)
$$

- $\alpha$ = Winkel zwischen Kraft und Hebelarm  
- Wenn $\alpha = 90^\circ$ → $\sin(90^\circ) = 1$

---

## Momentengleichgewicht

shape:kd_equilibrium

$$
\sum M = 0
$$

Summe aller Momente um einen Bezugspunkt ist Null.

---

# 3) Hebelgesetz

## Grundformel

shape:lever

$$
F_1 \cdot r_1 = F_2 \cdot r_2
$$

---

## Umstellungen

shape:lever

$$
F_2 = \frac{F_1 \cdot r_1}{r_2}
$$

$$
F_1 = \frac{F_2 \cdot r_2}{r_1}
$$

$$
r_2 = \frac{F_1 \cdot r_1}{F_2}
$$

$$
r_1 = \frac{F_2 \cdot r_2}{F_1}
$$

---

# 4) Gleichgewichtsbedingungen (Statik)

## Kräftegleichgewicht

shape:kd_equilibrium

$$
\sum F = 0
$$

In 2D:

$$
\sum F_x = 0
$$

$$
\sum F_y = 0
$$

---

## Momentengleichgewicht

shape:kd_equilibrium

$$
\sum M = 0
$$

---

# 5) Lagerreaktionen (Balken)

## Einzelkraft $F$ auf Balken der Länge $L$

shape:kd_beam_reactions

Abstand der Kraft vom linken Lager: $a$

---

### Kräftegleichgewicht

$$
R_A + R_B = F
$$

---

### Momentengleichgewicht um den linken Lagerpunkt

$$
R_B \cdot L - F \cdot a = 0
$$

$$
R_B = \frac{F \cdot a}{L}
$$

$$
R_A = F - R_B
$$

---

## Spezialfall: Kraft in der Mitte

shape:kd_beam_reactions

$$
a = \frac{L}{2}
$$

$$
R_A = R_B = \frac{F}{2}
$$

---

# 6) Streckenlast (gleichmäßig verteilt)

## Linienlast

shape:kd_distributed_load

$$
q \quad [\mathrm{N/m}]
$$

---

## Zusammenhang

shape:kd_distributed_load

$$
F = q \cdot L
$$

$$
q = \frac{F}{L}
$$

---

## Resultierende einer gleichmäßigen Streckenlast

shape:kd_distributed_load

$$
F_{\mathrm{res}} = q \cdot L
$$

Angriffspunkt:

in der Mitte der Belastung.

---

# 7) Biegemoment (Grundidee)

## Grundformel

shape:kd_beam_reactions

Moment an einer Stelle mit Abstand $l$:

$$
M_B = F \cdot l
$$

---

## Maximales Biegemoment bei mittiger Einzelkraft

shape:kd_beam_reactions

$$
M_{\max} = \frac{F \cdot L}{4}
$$

---

# 8) Gewichtskraft

## Grundformeln

shape:weight_force

$$
F_G = m \cdot g
$$

$$
m = \frac{F_G}{g}
$$

$$
g \approx 9{,}81\,\mathrm{\frac{m}{s^2}}
$$

---

# 9) Drehmoment an Wellen

## Grundformeln

shape:shaft_power

$$
M = F \cdot r
$$

$$
F = \frac{M}{r}
$$

---

## Umfangskraft

shape:shaft_power

$$
F_u = \frac{M}{r}
$$

---

# 10) Zusammenhang Moment – Leistung

## Winkelgeschwindigkeit

shape:rotation_speed

$$
\omega = 2\pi n
$$

---

## Leistung

shape:shaft_power

$$
P = M \cdot \omega
$$

Wenn $n$ in $\mathrm{min^{-1}}$ gegeben ist:

$$
P = \frac{2\pi \cdot n \cdot M}{60}
$$

---

# 11) Drehzahl-Umrechnung

## Umrechnung

shape:time

$$
1\,\mathrm{min} = 60\,\mathrm{s}
$$

$$
n_{\mathrm{s^{-1}}} = \frac{n_{\mathrm{min^{-1}}}}{60}
$$

---

# 12) Vorzeichenkonvention

## Drehsinn

shape:kd_signs

- Gegenuhrzeigersinn: positiv $(+)$  
- Uhrzeigersinn: negativ $(-)$

(oder umgekehrt – aber konsequent!)

---

# 13) Typische Prüfungsfallen

## Checkliste

shape:exam_traps

- $r$ in $\mathrm{mm}$ statt $\mathrm{m}$  
- $N\cdot mm$ mit $N\cdot m$ verwechselt  
- Moment um falschen Bezugspunkt  
- Streckenlast nicht zu Resultierender umgewandelt  
- $\sum F = 0$ vergessen  
- Vorzeichen ignoriert  

---

# 14) Schnellübersicht (Merkkarte)

## Merkkarte

shape:conversion_quickref

$$
M = F \cdot r
$$

$$
F_1 \cdot r_1 = F_2 \cdot r_2
$$

$$
\sum F = 0
$$

$$
\sum M = 0
$$

$$
R_B = \frac{F \cdot a}{L}
$$

$$
F_G = m \cdot g
$$

$$
F = q \cdot L
$$

$$
P = \frac{2\pi \cdot n \cdot M}{60}
$$
