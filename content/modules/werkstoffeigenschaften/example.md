# Beispiele - Werkstoffeigenschaften vergleichen

> Arbeitsweise (prüfungssicher):
> 1) Beanspruchung erkennen
> 2) passende Eigenschaft festlegen
> 3) Kennwert/Prüfverfahren zuordnen
> 4) ggf. rechnen
> 5) technisch begründen

---

## Beispiel 1: Festigkeit im Bauteil bewerten (Spannung + Sicherheitsfaktor)

### Aufgabe
Gegeben:

- Kraft F = 24 kN
- tragender Querschnitt A = 120 mm2
- Werkstoff S235JR mit Re = 235 N/mm2

Gesucht:

1) Spannung sigma in N/mm2
2) Sicherheitsfaktor n gegen Fließen

### Lösung

1) Spannung:

$$
\sigma = \frac{F}{A} = \frac{24000}{120} = 200\,N/mm^2
$$

2) Sicherheitsfaktor:

$$
n = \frac{Re}{\sigma} = \frac{235}{200} = 1.175 \approx 1.18
$$

Ergebnis:

$$
\sigma = 200\,N/mm^2,\quad n \approx 1.18
$$

Interpretation: Bauteil liegt unter Re, die Reserve ist aber relativ klein.

---

## Beispiel 2: Streckgrenze über Erzeugnisdicke vergleichen

### Aufgabe
Tabellenwerte für S235JR:

- Re bei kleiner Dicke: 235 N/mm2
- Re bei größerer Dicke: 215 N/mm2

Gesucht: prozentuale Abnahme der Streckgrenze.

### Lösung

$$
\Delta Re = 235 - 215 = 20\,N/mm^2
$$

$$
\text{Abnahme in \%} = \frac{20}{235} \cdot 100 = 8.51\,\%
$$

Ergebnis:

$$
Re\text{-Abnahme} \approx 8.5\,\%
$$

Interpretation: Mit wachsender Erzeugnisdicke sinkt der Mindestwert für Re.

---

## Beispiel 3: AP2-typisch - 690 HV an einer Welle

### Aufgabe
Eine Welle soll lokal auf 690 HV gehärtet werden.

Gesucht:

1) geeignetes Härteverfahren
2) geeignetes Härteprüfverfahren

### Lösung

- Für eine lokal harte Randzone bei zähem Kern ist ein Randschichthärten (z. B. Induktionshärten) sinnvoll.
- Bei vorgegebener HV-Härte ist Vickers das passende Prüfverfahren.

Kurzbegründung:

- hohe Verschleißfestigkeit an der Oberfläche
- tragfähiger, weniger spröder Kern
- HV-Wert passt direkt zum Vickers-System

---

## Beispiel 4: Werkstoffbezeichnung deuten - CuSn12-C

### Aufgabe
Erkläre die Bezeichnung CuSn12-C fachlich korrekt.

### Lösung

- Cu = Kupferbasis
- Sn = Zinn als Hauptlegierungselement
- 12 = ca. 12 % Zinnanteil
- -C = Gusswerkstoff (cast)

Technische Einordnung:

- typischer Werkstoff für gleitbeanspruchte Komponenten wie Schneckenrad/Schneckenpaarung
- günstige Kombination aus Verschleißverhalten und Notlaufeigenschaften

---

## Beispiel 5: Härte vs. Zähigkeit vergleichen

### Aufgabe
Material A und B stehen zur Auswahl für eine stoßbelastete Nabe:

- A: 620 HV, KV = 12 J
- B: 320 HV, KV = 48 J

Gesucht: welches Material ist für Stoßbelastung geeigneter?

### Lösung

Berechnung Vergleich KV:

$$
\frac{KV_B}{KV_A} = \frac{48}{12} = 4
$$

B nimmt viermal so viel Schlagenergie auf.

Ergebnis: Für stoßartige Belastung ist Material B die sicherere Wahl, obwohl es weicher ist.

---

## Beispiel 6: Ausnutzung schnell prüfen

### Aufgabe
Gegeben:

- Arbeitsbeanspruchung sigma = 150 N/mm2
- Re = 225 N/mm2

Gesucht: Ausnutzung in %.

### Lösung

$$
\text{Ausnutzung} = \frac{\sigma}{Re} \cdot 100 = \frac{150}{225} \cdot 100 = 66.67\,\%
$$

Ergebnis:

$$
\text{Ausnutzung} \approx 66.7\,\%
$$

Interpretation: Belastung liegt bei rund zwei Dritteln der Streckgrenze.

---

## Kurz-Check für die Prüfung

- Eigenschaft korrekt gewählt (Härte, Festigkeit oder Zähigkeit)?
- Kennwerte sauber zugeordnet (Re, Rm, KV, HV)?
- Rechenweg mit Einheit nachvollziehbar?
- Entscheidung technisch begründet?
