# Beispiel – Störungen systematisch eingrenzen

Hier trainierst du typische Situationen aus Instandhaltung und Steuerungstechnik.  
Ziel ist ein reproduzierbarer Ablauf: vom Symptom bis zum Wirksamkeitsnachweis.

> Arbeitsweise:
> 1) Symptom konkret erfassen  
> 2) Startbedingungen und Grundstellung prüfen  
> 3) Teilsysteme/Schnittstellen eingrenzen  
> 4) Ursache mit Prüfschritten absichern  
> 5) Maßnahme prüfen und dokumentiert übergeben

---

## Beispiel 1: Startbedingung korrekt bewerten

### Aufgabe
Eine Förderanlage soll starten.  
Werkstück liegt an der Sperre an (BG7 aktiv), die Rollbahn ist frei (BG9 aktiv), Grundstellung ist vorhanden.

Welche fachliche Bewertung ist richtig?

### Lösung
Die Startbedingungen sind erfüllt.  
Der Prozesszyklus darf ausgelöst werden.

Merke:  
Fehlereingrenzung beginnt immer mit dem Abgleich von Sollbedingung und Istzustand.

---

## Beispiel 2: Prozessfolge bei Pneumatikzylindern

### Aufgabe
Ordne den Ablauf:

- Sperrzylinder fährt zurück
- Werkstück löst BG8 aus
- Sperrzylinder fährt wieder in Sperrstellung
- Hubzylinder hebt an
- Verschiebezylinder schiebt auf Rollbahn
- Nach BG9 fahren Hub- und Verschiebezylinder in Grundstellung

### Lösung
1) Sperrzylinder zurück  
2) BG8 wird ausgelöst  
3) Sperrzylinder in Sperrstellung  
4) Hubzylinder hebt an  
5) Verschiebezylinder schiebt auf Rollbahn  
6) Nach BG9 Rückfahrt in Grundstellung

---

## Beispiel 3: Schnittstellenfehler erkennen

### Aufgabe
Das Ventil erhält laut I/O-Status ein Schaltsignal, der Zylinder bewegt sich jedoch nicht.

Welcher Prüfpunkt ist als Nächstes am sinnvollsten?

### Lösung
Druckversorgung und Ventilausgang prüfen.  
Die elektrische Ansteuerung ist bereits bestätigt, deshalb liegt der Verdacht an der Schnittstelle zur Pneumatik.

---

## Beispiel 4: Grenzwertüberschreitung berechnen

### Aufgabe
Zulässige Schwinggeschwindigkeit: 2,0 mm/s  
Gemessen: 2,9 mm/s  
Um wie viel ist der Grenzwert überschritten?

### Lösung
\[
2{,}9 - 2{,}0 = 0{,}9 \,\text{mm/s}
\]

Ergebnis: **0,9 mm/s überschritten -> n. i. O.**

---

## Beispiel 5: MTTR aus Störungsdaten

### Aufgabe
Bei 9 Störungen wurden insgesamt 225 min Reparaturzeit dokumentiert.  
Wie groß ist die mittlere Reparaturzeit je Störung (MTTR)?

### Lösung
\[
MTTR = \frac{225}{9} = 25 \,\text{min}
\]

Ergebnis: **25 min je Störung**

---

## Beispiel 6: Ölverschüttung bei der Demontage

### Aufgabe
Beim Ausbau einer Welle wird Getriebeöl verschüttet.  
Beschreibe den Sofortablauf.

### Lösung
1) Gefahrenstelle absichern und kennzeichnen  
2) Öl mit Bindemittel aufnehmen  
3) kontaminiertes Material getrennt sammeln  
4) fachgerecht entsorgen  
5) Vorfall dokumentieren

So verbindest du Arbeitssicherheit, Umweltschutz und Prüfbarkeit.

---

## Beispiel 7: Schwachstellenanalyse mit Häufigkeiten

### Aufgabe
In einem Monat wurden 24 Störungen erfasst, davon 10 am Sensor BG8.  
Wie hoch ist die Fehlerhäufigkeit dieser Ursache?

### Lösung
\[
\frac{10}{24} \cdot 100 = 41{,}7 \,\%
\]

Ergebnis: **41,7 %**

Bewertung:
Die Ursache ist dominant und muss vorrangig bearbeitet werden.

---

## Beispiel 8: Musterantwort (kurz, prüfungstauglich)

### Aufgabe
Formuliere eine kurze Fachantwort zur systematischen Fehlereingrenzung bei wiederkehrender Störung.

### Musterantwort
Nach dem erneuten Auftreten der Störung wurde die Anlage in einen sicheren Zustand versetzt und das Symptom unter Betriebsbedingungen erneut aufgenommen.  
Anschließend wurde der Sollablauf mit der Ist-Reihenfolge verglichen, um den fehlerhaften Prozessschritt eindeutig einzugrenzen.  
Die Signale der relevanten Sensoren und die Ansteuerung der Aktoren wurden im Ablaufprotokoll geprüft.  
Zusätzlich wurden Druckversorgung, Ventilschaltzustände und mechanische Leichtgängigkeit kontrolliert.  
Die ermittelte Hauptursache wurde durch Messwerte abgesichert und nicht nur vermutet.  
Nach der Korrekturmaßnahme erfolgte ein dokumentierter Probelauf mit Soll/Ist-Vergleich.  
Erst nach i. O.-Nachweis wurde die Anlage mit Übergabevermerk freigegeben.
