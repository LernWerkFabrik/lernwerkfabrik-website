# Beispiel - Elektrische Baugruppen prüfen

Hier trainierst du typische Situationen aus Prüf- und Instandhaltungsaufgaben.  
Ziel ist ein reproduzierbarer Ablauf: von der sicheren Vorbereitung bis zur dokumentierten Bewertung.

> Arbeitsweise:
> 1) Sicherheitszustand prüfen  
> 2) Schaltunterlagen auswerten  
> 3) Messverfahren und Messpunkt festlegen  
> 4) Soll/Ist vergleichen  
> 5) Ergebnis begründen und dokumentieren

---

## Beispiel 1: Prüfbeginn sicher festlegen

### Aufgabe
Du sollst an einer 24-V-Steuerungsbaugruppe eine Fehlersuche starten.  
Welche erste Handlung ist fachlich richtig?

### Lösung
- Auftrag und Schaltunterlagen prüfen
- Zustand der Anlage und des Messmittels sicher bewerten
- erst danach den ersten Messpunkt festlegen

Begründung:
Ein richtiger Messwert ist nur dann wertbar, wenn der Prüfschritt sicher und nachvollziehbar vorbereitet wurde.

---

## Beispiel 2: Signalweg im Plan logisch prüfen

### Aufgabe
Ordne die Ablaufkette:

- Sensor erkennt Werkstück
- Eingang der Steuerung wird aktiv
- Ausgang der Steuerung schaltet
- Relais zieht an
- Aktor fährt aus

### Lösung
1) Sensor erkennt Werkstück  
2) Eingang der Steuerung wird aktiv  
3) Ausgang der Steuerung schaltet  
4) Relais zieht an  
5) Aktor fährt aus

---

## Beispiel 3: Spannungswert mit Toleranz bewerten

### Aufgabe
Sollversorgung: 24,0 V ± 10 %  
Gemessen: 21,8 V  
Bewerte den Messwert.

### Lösung
Toleranzbereich:

\[
24{,}0 \cdot 0{,}90 = 21{,}6\,\text{V}, \qquad
24{,}0 \cdot 1{,}10 = 26{,}4\,\text{V}
\]

21,8 V liegt im zulässigen Bereich.  
Ergebnis: **i. O.**

---

## Beispiel 4: Widerstand aus Spannung und Strom

### Aufgabe
An einer Spule werden 24 V gemessen, der Strom beträgt 0,5 A.  
Berechne den elektrischen Widerstand.

### Lösung
\[
R = \frac{U}{I} = \frac{24}{0{,}5} = 48\,\Omega
\]

Ergebnis: **48 Ω**

---

## Beispiel 5: Durchgangsmessung bewerten

### Aufgabe
Bei einer Verdrahtungsstrecke wird ein Durchgangswert von 0,3 Ω gemessen.  
Wie ist das zu bewerten?

### Lösung
Der Wert ist sehr klein und spricht für einen leitenden, geschlossenen Strompfad.  
Ergebnis: **Durchgang vorhanden** (unter üblichen Prüfbedingungen i. O.).

---

## Beispiel 6: Abweichung systematisch eingrenzen

### Aufgabe
Das Eingangssignal liegt laut Diagnose an, der Aktor schaltet aber nicht.  
Was ist als nächster Prüfschritt sinnvoll?

### Lösung
Die Ausgangsansteuerung und die Spannung am Aktoranschluss prüfen.  
Begründung: Eingang ist bestätigt, daher liegt der Fehler wahrscheinlich im Ausgangspfad, in der Verdrahtung oder am Aktor.

---

## Beispiel 7: Prüfdokumentation vollständig führen

### Aufgabe
Welche Angaben gehören zwingend in dein Prüfprotokoll?

### Lösung
- Baugruppe und Prüfpunkt
- Messmittel
- Sollwert und Istwert mit Einheit
- Bewertung (i. O./n. i. O.)
- bei Abweichung: Ursache, Maßnahme, Wiederholprüfung

---

## Beispiel 8: Musterantwort (kurz, prüfungstauglich)

### Aufgabe
Formuliere in 5 bis 6 Sätzen, wie du eine elektrische Baugruppe prüfungssicher prüfst.

### Musterantwort
Ich starte mit der Auswertung von Schaltplan, Funktionsbeschreibung und Prüfvorgabe.  
Dann stelle ich den sicheren Prüfzustand her und kontrolliere die Einsatzfähigkeit des Messgeräts.  
Anschließend lege ich Messart, Messbereich und Messpunkte in sinnvoller Reihenfolge fest.  
Die gemessenen Werte dokumentiere ich mit Einheit und vergleiche sie mit den Sollwerten.  
Bei einer Abweichung grenze ich den Fehler schrittweise über Signalweg und Versorgung ein.  
Zum Abschluss dokumentiere ich Ursache, Maßnahme und Ergebnis der Wiederholprüfung.
