# Grenzmaße und Toleranzen

Warum?

In Prüfungen sind Toleranzaufgaben fast immer mit Grenzmaßen, Passung und Abmaß verknüpft.
Wenn du diese Beziehungen sicher beherrschst, kannst du Messwerte schnell als i. O. oder n. i. O. bewerten.

## 1) Formelzusammenhang

Gegeben:

- Nennmaß `N`
- oberes Abmaß `ES`
- unteres Abmaß `EI`

Gesucht:

- oberes Grenzmaß `G_o`
- unteres Grenzmaß `G_u`
- Toleranzbreite `T`

$$
G_o = N + ES
$$

$$
G_u = N + EI
$$

$$
T = G_o - G_u
$$

Bei symmetrischer Toleranz `\pm t` gilt zusätzlich:

$$
G_o = N + t
$$

$$
G_u = N - t
$$

$$
T = 2t
$$

## 2) Darstellung in Zeichnungen

Typische Schreibweisen:

- Symmetrisch: `25,00 ±0,05`
- Einseitig positiv: `25,00 +0,10 / 0,00`
- Einseitig negativ: `25,00 0,00 / -0,08`
- Passung über Toleranzfelder: z. B. `Ø8H7`, `Ø6h6`

Wichtig:

- Allgemeintoleranz (z. B. ISO 2768-m) gilt nur, wenn keine Einzeltoleranz am Maß steht.
- Für Passungen immer Bohrung und Welle gemeinsam betrachten.

## 3) Rechenbeispiel: Symmetrische Toleranz

Gegeben: `N = 40,00 mm`, `±0,05 mm`

$$
G_o = 40,00 + 0,05 = 40,05 \; \text{mm}
$$

$$
G_u = 40,00 - 0,05 = 39,95 \; \text{mm}
$$

$$
T = 40,05 - 39,95 = 0,10 \; \text{mm}
$$

Messurteil:

- Messwert `40,03 mm` -> i. O.
- Messwert `39,92 mm` -> n. i. O. (zu klein)

## 4) Rechenbeispiel: Einseitige Toleranz

Gegeben: `N = 20,00 mm`, `+0,10 / 0,00`

$$
G_o = 20,00 + 0,10 = 20,10 \; \text{mm}
$$

$$
G_u = 20,00 + 0,00 = 20,00 \; \text{mm}
$$

$$
T = 20,10 - 20,00 = 0,10 \; \text{mm}
$$

Messurteil:

- Messwert `19,98 mm` -> n. i. O. (zu klein)
- Messwert `20,06 mm` -> i. O.

## 5) Passung, Spiel und Übermaß

Für die Bewertung von Passungen:

$$
\text{minimales Spiel} = G_{u,\text{Bohrung}} - G_{o,\text{Welle}}
$$

$$
\text{maximales Spiel} = G_{o,\text{Bohrung}} - G_{u,\text{Welle}}
$$

Interpretation:

- beide Werte positiv -> Spielpassung
- ein Wert negativ, ein Wert positiv -> Übergangspassung
- beide Werte negativ -> Übermaßpassung

## 6) Typische Fehler und Prüfungsroutine

Typische Fehler:

- Vorzeichen verwechselt (`+`/`-`)
- Toleranzbreite mit Abmaß verwechselt
- Messwert mit Nennmaß statt Grenzmaßen verglichen
- Bohrung und Welle bei Passungen getrennt statt gemeinsam beurteilt

Prüfungsroutine (kurz):

1. Nennmaß und Abmaße lesen
2. Grenzmaße berechnen
3. Messwert oder Gegenmaß vergleichen
4. i. O./n. i. O. begründen
