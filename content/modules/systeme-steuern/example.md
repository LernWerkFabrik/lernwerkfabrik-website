# Beispiel - Technische Systeme steuern und überwachen

Die Beispiele zeigen ein prüfungsnahes Vorgehen von der Startbedingung bis zum Wirksamkeitsnachweis.

---

## Beispiel 1: Steuern und Regeln unterscheiden

### Aufgabe
Wann liegt Regeln vor?

### Lösung
Regeln liegt vor, wenn Soll- und Istwert fortlaufend verglichen und Abweichungen über Rückführung korrigiert werden.

---

## Beispiel 2: Startbedingung prüfen

### Aufgabe
Grundstellung ist vorhanden, BG7 meldet Werkstück, BG9 meldet „belegt“.

### Lösung
Kein Start möglich, weil die Bedingung „Rollbahn frei“ fehlt.  
Erste Prüfung: Zustand der Rollbahn und Signalweg von BG9.

---

## Beispiel 3: Prozessfolge ordnen

### Aufgabe
Bringe die Schritte in die richtige Reihenfolge:

- MM1 fährt zurück
- BG8 wird ausgelöst
- MM1 fährt in Sperrstellung
- MM2 hebt den Werkstückträger an
- MM3 schiebt auf die Rollbahn
- Nach BG9 fahren MM2 und MM3 zurück

### Lösung
1. MM1 zurück  
2. BG8 ausgelöst  
3. MM1 in Sperrstellung  
4. MM2 hebt an  
5. MM3 schiebt  
6. Nach BG9 Rückfahrt MM2/MM3

---

## Beispiel 4: Startimpuls mit Zeitbedingung

### Aufgabe
Ein Start ist nur zulässig, wenn der Zylinder mindestens 1 s in Grundstellung war.

### Lösung
Der Startimpuls ist nur gültig, wenn die Grundstellung zeitlich stabil anliegt.  
Kurze Signalspitzen ohne erfüllte Zeitbedingung sind unzulässig.

---

## Beispiel 5: Zykluszeitabweichung

### Aufgabe
Soll-Zykluszeit: 6,5 s, gemessen: 7,9 s.

### Lösung
\[
7{,}9 - 6{,}5 = 1{,}4\,\text{s}
\]
Ergebnis: **1,4 s über Soll**.

---

## Beispiel 6: Regelabweichung

### Aufgabe
Sollhub: 50 mm, Isthub: 47 mm.

### Lösung
\[
50 - 47 = 3\,\text{mm}
\]
Ergebnis: **3 mm Regelabweichung**.

---

## Beispiel 7: Ausgang aktiv, keine Bewegung

### Aufgabe
Das Ventilausgangssignal ist aktiv, der Zylinder bewegt sich nicht.

### Lösung
Schnittstellenprüfung: Druckversorgung, Ventilschaltzustand, Leitungsweg, mechanische Blockade, Endlagensensorik.  
So trennst du Logikfehler von Aktorik-/Versorgungsfehlern.

---

## Beispiel 8: Wirksamkeitsnachweis

### Aufgabe
Nach einer Korrektur läuft die Anlage einmal korrekt.

### Lösung
Ein einzelner Lauf reicht nicht.  
Erforderlich sind Probelauf unter Last, Soll-/Ist-Vergleich über mehrere Zyklen und dokumentierte i. O.-Bewertung.
