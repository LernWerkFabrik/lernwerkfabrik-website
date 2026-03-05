# Beispiel – Fehler in Steuerungen systematisch suchen

Hier trainierst du typische Steuerungsstörungen aus der Instandhaltung.  
Ziel ist ein reproduzierbarer Ablauf: vom Symptom bis zum dokumentierten Wirksamkeitsnachweis.

> Arbeitsweise:
> 1) Störungsbild konkret erfassen  
> 2) Grundstellung und Startbedingungen prüfen  
> 3) Signalfluss und Schnittstellen eingrenzen  
> 4) Ursache durch Befund/Messung absichern  
> 5) Maßnahme, Probelauf und Übergabe dokumentieren

---

## Beispiel 1: Startfreigabe fachlich bewerten

### Aufgabe
Eine Förderanlage steht in Grundstellung.  
BG7 meldet Werkstück anliegend. BG9 meldet "belegt".

Was ist die richtige Erstbewertung?

### Lösung
Die Startbedingung ist nicht vollständig erfüllt, weil BG9 "frei" melden muss.  
Erster Prüfschritt: Sensorik/Signallage an BG9 sowie den Bereich Rollbahn prüfen.

---

## Beispiel 2: Prozessfolge richtig einordnen

### Aufgabe
Ordne den Ablauf:

- MM1 fährt zurück
- BG8 wird ausgelöst
- MM1 fährt in Sperrstellung
- MM2 hebt an
- MM3 schiebt auf die Rollbahn
- Nach BG9 fahren MM2/MM3 in Grundstellung

### Lösung
1) MM1 zurück  
2) BG8 wird ausgelöst  
3) MM1 in Sperrstellung  
4) MM2 hebt an  
5) MM3 schiebt  
6) Nach BG9 Rückfahrt MM2/MM3

---

## Beispiel 3: Schnittstellenfehler erkennen

### Aufgabe
Im I/O-Status ist der Ausgang zum Ventil aktiv, aber der Zylinder bewegt sich nicht.

Was prüfst du als Nächstes?

### Lösung
Versorgung und Ventilausgang prüfen (Druck, Schaltzustand, Durchfluss).  
Die elektrische Freigabe ist bereits bestätigt, daher liegt der Verdacht an der Schnittstelle zur Aktorik.

---

## Beispiel 4: Zeitabweichung berechnen

### Aufgabe
Soll-Zykluszeit: 6,0 s  
Gemessene Zykluszeit: 7,4 s  
Um wie viel ist der Sollwert überschritten?

### Lösung
\[
7{,}4 - 6{,}0 = 1{,}4 \,\text{s}
\]

Ergebnis: **1,4 s Überschreitung**

---

## Beispiel 5: MTTR aus Störungsdaten

### Aufgabe
Bei 7 Störungen wurden insgesamt 168 min Instandsetzungszeit erfasst.  
Wie groß ist die mittlere Instandsetzungszeit (MTTR)?

### Lösung
\[
MTTR = \frac{168}{7} = 24 \,\text{min}
\]

Ergebnis: **24 min je Störung**

---

## Beispiel 6: Fehlerhäufigkeit bewerten

### Aufgabe
In einem Monat traten 30 Steuerungsstörungen auf, davon 9 durch Sensorfehler.

Wie hoch ist die Fehlerhäufigkeit dieser Ursache?

### Lösung
\[
\frac{9}{30} \cdot 100 = 30 \,\%
\]

Ergebnis: **30 %**

Bewertung:
Diese Ursache ist relevant und sollte priorisiert untersucht werden.

---

## Beispiel 7: Wirksamkeitsnachweis formulieren

### Aufgabe
Nach dem Tausch eines Sensors läuft die Anlage im Leerlauf. Reicht das als Nachweis?

### Lösung
Nein. Ein vollständiger Wirksamkeitsnachweis braucht:

1) Probelauf unter realen Betriebsbedingungen  
2) Soll/Ist-Vergleich mit klaren Kriterien  
3) dokumentierte i. O./n. i. O.-Bewertung

---

## Beispiel 8: Musterantwort (kurz, prüfungstauglich)

### Aufgabe
Formuliere eine kurze Fachantwort zur systematischen Fehlersuche in einer elektropneumatischen Steuerung.

### Musterantwort
Zuerst sichere ich die Anlage und dokumentiere das Störungsbild mit Betriebsart, Zeitpunkt und Symptom.  
Danach prüfe ich Grundstellung und Startbedingungen anhand des Funktionsablaufs.  
Anschließend verfolge ich die Signal- und Funktionskette von Sensor über Steuerung bis Aktor.  
Dabei grenze ich Teilsysteme ein und prüfe gezielt Schnittstellen zwischen Elektrik, Pneumatik und Mechanik.  
Die vermutete Hauptursache sichere ich mit Messwerten und Funktionsnachweis ab.  
Nach der Maßnahme führe ich einen Probelauf durch, vergleiche Soll und Ist und dokumentiere die Bewertung.  
Erst danach übergebe ich die Anlage mit eindeutigem Abnahmevermerk.
