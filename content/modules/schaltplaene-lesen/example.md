# Beispiel - Schalt- und Funktionspläne lesen

Hier trainierst du typische AP2-Situationen rund um Schalt- und Funktionslogik.  
Ziel ist ein klarer Ablauf: vom Plansymbol über den Signalfluss bis zur fachlichen Bewertung.

> Arbeitsweise:
> 1) Planart und Bezeichnungen klären  
> 2) Grundstellung und Startbedingungen prüfen  
> 3) Signalfluss vollständig verfolgen  
> 4) Freigaben/Verriegelungen begründen  
> 5) Ergebnis mit Planbezug formulieren

---

## Beispiel 1: Ziel beim Planlesen

### Aufgabe
Was wird in Prüfungsaufgaben zum Schalt- und Funktionsplan hauptsächlich bewertet?

### Lösung
Nicht das reine Auswendiglernen einzelner Symbole, sondern das sichere Verstehen von:

- Signalfluss
- logischer Verknüpfung
- Funktionszusammenhang der gesamten Steuerung

---

## Beispiel 2: UND-Bedingung korrekt deuten

### Aufgabe
Ein Zyklus startet nur, wenn Grundstellung vorhanden ist, BG7 Werkstück meldet und BG9 "frei" meldet.  
Wie heißt diese Verknüpfung?

### Lösung
Das ist eine **UND-Verknüpfung**.  
Alle drei Bedingungen müssen gleichzeitig erfüllt sein.

---

## Beispiel 3: Prozessfolge aus dem Funktionsplan

### Aufgabe
Ordne den Ablauf:

- MM1 fährt zurück
- BG8 wird ausgelöst
- MM1 fährt in Sperrstellung
- MM2 hebt an
- MM3 schiebt auf die Rollbahn
- Nach BG9 fahren MM2 und MM3 in Grundstellung

### Lösung
1) MM1 zurück  
2) BG8 ausgelöst  
3) MM1 in Sperrstellung  
4) MM2 hebt an  
5) MM3 schiebt  
6) Nach BG9 Rückfahrt MM2/MM3

---

## Beispiel 4: Grenzwert aus Spannungsangabe

### Aufgabe
Sollversorgung: 24,0 V ± 5 %  
Gesucht: unterer Grenzwert.

### Lösung
\[
U_\text{min} = 24{,}0 \cdot 0{,}95 = 22{,}8 \,\text{V}
\]

Ergebnis: **22,8 V**

---

## Beispiel 5: Start blockiert trotz Werkstück

### Aufgabe
Grundstellung liegt vor, BG7 meldet Werkstück, BG9 meldet "belegt".  
Der Zyklus startet nicht. Was ist die fachlich richtige Erstbewertung?

### Lösung
Die Startbedingung ist nicht vollständig erfüllt.  
BG9 muss "frei" melden.  
Sinnvoller nächster Schritt: Rollbahnzustand und BG9-Signalweg prüfen.

---

## Beispiel 6: Schließer richtig erklären

### Aufgabe
Wie verhält sich ein Schließer im Ruhezustand und bei Betätigung?

### Lösung
- Ruhezustand: offen  
- Bei Betätigung: geschlossen

Diese Definition ist wichtig, um Freigabeketten korrekt zu lesen.

---

## Beispiel 7: Abweichung im Signalfluss eingrenzen

### Aufgabe
MM1 fährt zurück, aber BG8 wird nicht erkannt.  
Wie gehst du planbasiert vor?

### Lösung
1) Planstelle von BG8 und zugehörige Bedingung identifizieren  
2) Werkstücklauf bis zur Hubplattform beobachten  
3) Sensorposition, Schaltabstand und Signalstatus prüfen  
4) Befund mit Sollzustand aus dem Funktionsplan vergleichen

---

## Beispiel 8: Musterantwort (kurz, prüfungstauglich)

### Aufgabe
Formuliere eine kurze Fachantwort, wie du einen Schalt- und Funktionsplan systematisch auswertest.

### Musterantwort
Ich beginne mit der Aufgabenstellung und prüfe, welche Planart vorliegt.  
Danach ordne ich die Bezeichnungen von Sensoren, Aktoren und Bedienelementen zu.  
Im nächsten Schritt kontrolliere ich die Grundstellung und alle Startbedingungen.  
Anschließend verfolge ich den Signalfluss vom auslösenden Signal über die logische Verknüpfung bis zum Ausgang.  
Ich prüfe, ob Verriegelungen oder fehlende Freigaben den Ablauf blockieren.  
Bei Abweichungen vergleiche ich Soll- und Istzustand an der betroffenen Planstelle.  
Zum Abschluss dokumentiere ich Ursache, Bewertung und nächsten Prüfschritt nachvollziehbar.
