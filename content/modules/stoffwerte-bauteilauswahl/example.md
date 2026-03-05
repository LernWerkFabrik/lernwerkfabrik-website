# Beispiele - Stoffwerte zur Bauteilauswahl nutzen

> Arbeitsweise (prüfungssicher):
> 1) Gegeben/Gesucht
> 2) Stoffwert aus Tabelle
> 3) Einheiten angleichen
> 4) rechnen
> 5) Ergebnis bewerten

---

## Beispiel 1: AP1 - Masse einer Trägerplatte

### Aufgabe
Gegeben:

- l = 160 mm
- b = 100 mm
- h = 10 mm
- rho(Stahl) = 7.85 g/cm3

Gesucht: Masse m in kg.

### Lösung

1) Volumen in mm3:

$$
V = 160 * 100 * 10 = 160000\,mm^3
$$

2) In cm3 umrechnen:

$$
V = 160000 / 1000 = 160\,cm^3
$$

3) Masse in g:

$$
m = rho * V = 7.85 * 160 = 1256\,g
$$

4) In kg:

$$
1256\,g = 1.256\,kg
$$

Ergebnis:

$$
m = 1.256\,kg
$$

---

## Beispiel 2: AP1 - Werkstoffwechsel bei gleicher Geometrie

### Aufgabe
Ein Gehäuse aus EN-GJL hat m_alt = 2.27 kg.
Für denselben Bauteilraum soll eine Aluminiumlegierung verwendet werden.

- rho_alt (tabellarisch EN-GJL) = 7.3 kg/dm3
- rho_Al = 2.7 kg/dm3

Gesucht: neue Masse m_neu.

### Lösung
Bei gleicher Geometrie bleibt das Volumen gleich:

$$
m_{neu} = m_{alt} * \frac{rho_{Al}}{rho_{alt}}
$$

$$
m_{neu} = 2.27 * \frac{2.7}{7.3} = 0.84\,kg\,(gerundet)
$$

Ergebnis:

$$
m_{neu} \approx 0.84\,kg
$$

Interpretation: Deutlich geringere Masse durch geringere Dichte.

---

## Beispiel 3: AP2 - CuSn12-C Rohling (Volumen + Masse)

### Aufgabe
Schneckenrad-Rohling (Zylinder):

- D = 200 mm
- B = 40 mm
- rho(CuSn12-C) = 8.7 kg/dm3

Gesucht:

1) Volumen V in cm3
2) Masse m in kg

### Lösung
1) Geometrie umrechnen:

- r = 100 mm = 10 cm
- h = 40 mm = 4 cm

2) Volumen:

$$
V = \pi * r^2 * h = \pi * 10^2 * 4 = 1256.64\,cm^3
$$

3) In dm3:

$$
V = 1.25664\,dm^3
$$

4) Masse:

$$
m = rho * V = 8.7 * 1.25664 = 10.93\,kg\,(gerundet)
$$

Ergebnis:

$$
V = 1256.64\,cm^3,\quad m \approx 10.93\,kg
$$

---

## Beispiel 4: AP2 - Bohrungsvolumen und Zerspanungsanteil

### Aufgabe
Im Rohling aus Beispiel 3 wird eine Bohrung mit d = 40 mm über die volle Breite B = 40 mm eingebracht.
Gesucht:

- Bohrungsvolumen V_B in cm3
- prozentualer Anteil V_B bezogen auf V_Roh

### Lösung
1) Umrechnen:

- d = 40 mm -> r = 20 mm = 2 cm
- h = 40 mm = 4 cm

2) Bohrungsvolumen:

$$
V_B = \pi * 2^2 * 4 = 50.27\,cm^3
$$

3) Anteil:

$$
\frac{V_B}{V_{Roh}} * 100 = \frac{50.27}{1256.64} * 100 = 4.0\,\%
$$

Ergebnis:

$$
V_B = 50.27\,cm^3,\quad Zerspanungsanteil = 4.0\,\%
$$

---

## Beispiel 5: Werkstoffentscheidung über Maximalmasse

### Aufgabe
Ein Bauteil hat V = 300 cm3. Zulässige Maximalmasse: 1.8 kg.
Welche maximale Dichte darf der Werkstoff haben?

### Lösung
1) m_max in g:

$$
1.8\,kg = 1800\,g
$$

2) Grenzdichte:

$$
rho_{max} = m/V = 1800/300 = 6.0\,g/cm^3
$$

Ergebnis:

Werkstoffe mit rho <= 6.0 g/cm3 sind bezüglich Masse geeignet.

---

## Beispiel 6: Plausibilitätsvergleich Stahl vs. Aluminium

### Aufgabe
Gleiches Bauteilvolumen V = 500 cm3.
Vergleiche die Massen:

- Stahl: rho = 7.85 g/cm3
- Aluminium: rho = 2.70 g/cm3

### Lösung

$$
m_{Stahl} = 7.85 * 500 = 3925\,g = 3.925\,kg
$$

$$
m_{Al} = 2.70 * 500 = 1350\,g = 1.35\,kg
$$

Differenz:

$$
\Delta m = 3.925 - 1.35 = 2.575\,kg
$$

Interpretation: Bei gleichem Volumen ist Stahl deutlich schwerer.

---

## Kurz-Check für die Prüfung

- Einheit der Dichte und des Volumens kompatibel?
- Masse am Ende in geforderter Einheit?
- Vergleich logisch begründet?
