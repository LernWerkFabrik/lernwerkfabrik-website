# Signalfluss

## Warum?

Steuerungsfehler werden fast immer über Signal- und Ablaufdenken analysiert:

- Eingang -> Verarbeitung -> Ausgang
- Sensor -> Logik -> Aktor
- Wo bricht die Kette?

"Signalfluss" ist:

- technisch präzise
- steuerungstypisch
- klar vom allgemeinen "Vorgehen" getrennt
- AP2-nah

---

## 1) Die Grundkette

Bei jeder Diagnose gehst du dieselbe Kette entlang:

1) Start-/Eingangssignal vorhanden?  
2) Signal kommt in der Steuerung an?  
3) Freigaben/Logikbedingungen erfüllt?  
4) Ausgang wird gesetzt?  
5) Aktor erhält Energie (Druck/Spannung)?  
6) Bewegung/Funktion findet statt?  
7) Rückmeldung kommt wieder korrekt an?

---

## 2) Praktische Leitfrage

Frage an jedem Schritt:

**"Ist das Signal hier vorhanden und plausibel?"**

Wenn **ja** -> nächster Schritt.  
Wenn **nein** -> Fehlerzone ist zwischen letztem "ja" und erstem "nein".

So grenzt du nicht "nach Gefühl", sondern reproduzierbar ein.

---

## 3) Beispielkette (Förderanlage)

Typischer Ablauf:

- BG7 meldet Werkstück anliegend
- BG9 meldet Rollbahn frei
- MM1 fährt zurück
- BG8 meldet Werkstück auf Hubplattform
- MM2 hebt an
- MM3 schiebt auf Rollbahn
- BG9 meldet belegt/frei je nach Schritt

Diagnoseprinzip:

- Kommt BG7/BG9 korrekt?  
- Wird MM1 angesteuert und fährt wirklich?  
- Kommt BG8 danach sicher?  
- Wird MM2 erst nach gültiger Rückmeldung freigegeben?

---

## 4) Wo die Kette oft bricht

Häufige Bruchstellen:

- Sensor schaltet mechanisch nicht sicher
- Signal liegt an, aber wird logisch blockiert
- Ausgang aktiv, aber Ventil/Aktor ohne Versorgung
- Bewegung erfolgt, aber Rückmeldung fehlt

Wichtig:
Symptome (z. B. "MM2 fährt nicht") sind nur Startpunkte.  
Die Ursache liegt oft eine Stufe davor im Signalfluss.

---

## 5) Mini-Algorithmus für die Prüfung

1) Störung konkret benennen  
2) Letztes sicheres Signal bestimmen  
3) Erstes fehlendes Signal bestimmen  
4) Dazwischen gezielt prüfen (Signal, Freigabe, Energie, Mechanik)  
5) Ursache nachweisen und dokumentieren

---

## Typische Fallen

- direkt Aktor tauschen ohne Signalprüfung
- Eingang und Rückmeldung verwechseln
- Energieversorgung nicht mitprüfen
- Ausgang aktiv = Fehler behoben (falsch)
- fehlender Soll/Ist-Nachweis im Protokoll

---

## 20-Sekunden-Check

- Habe ich die Signalkette vollständig verfolgt?
- Kenne ich das letzte "ja" und das erste "nein"?
- Ist die Ursache mess- oder funktionsseitig abgesichert?
- Ist der Wirksamkeitsnachweis dokumentiert?
