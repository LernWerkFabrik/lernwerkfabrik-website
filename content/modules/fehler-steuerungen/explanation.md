# Fehler in Steuerungen systematisch suchen

In AP2-nahen Steuerungsaufgaben zählt nicht, ob du den Fehler sofort errätst.  
Entscheidend ist, ob du die Störung systematisch eingrenzt, die Ursache fachlich absicherst und dein Vorgehen sauber dokumentierst.

Dieses Modul trainiert genau diesen Ablauf.

---

## Lernziel

Nach diesem Modul kannst du:

- Steuerungsabläufe aus Schalt- und Funktionsunterlagen sicher nachvollziehen
- Störungen über Signal-, Energie- und Wirkzusammenhänge eingrenzen
- Prüfschritte logisch planen und begründen
- Ursachen mit Mess- und Funktionsnachweisen absichern
- Maßnahmen technisch, sicher und wirtschaftlich bewerten
- Ergebnisse prüfungstauglich dokumentieren und übergeben

---

## Prüfungs-Algorithmus (immer gleich)

1) Anlage sichern und Betriebsart/Zustand festhalten  
2) Störungsbild konkret beschreiben (was, wo, wann, unter welchen Bedingungen)  
3) Grundstellung und Startbedingungen prüfen  
4) Signal- und Funktionskette bis zum Aktor verfolgen  
5) Teilsysteme und Schnittstellen eingrenzen  
6) Ursache mit gezielten Prüfungen absichern  
7) Maßnahme durchführen, Wirksamkeit nachweisen, dokumentiert übergeben

> Merksatz:  
> **Symptom ist nicht Ursache. Ohne Nachweis bleibt jede Ursache eine Vermutung.**

---

## 1) Was in Steuerungsaufgaben bewertet wird

Typisch wird geprüft, ob du:

- den Sollablauf kennst (Grundstellung, Startbedingungen, Prozessfolge)
- Abweichungen vom Sollzustand eindeutig erkennst
- nicht wahllos prüfst, sondern systematisch eingrenzt
- Messungen und Beobachtungen logisch verknüpfst
- Ursache, Maßnahme und Wirksamkeit nachvollziehbar belegst

---

## 2) Störungsbild konkret erfassen

Eine gute Störungsbeschreibung ist beobachtbar und prüfbar:

- welches Symptom tritt auf?
- wo im Ablauf tritt es auf?
- wann und wie oft tritt es auf?
- in welcher Betriebsart tritt es auf?

Schwach:
- "Die Anlage läuft nicht richtig."

Stark:
- "Grundstellung ist vorhanden, Start wird ausgelöst, MM1 fährt zurück, BG8 wird nicht erkannt; Zyklus stoppt vor MM2."

---

## 3) Grundstellung und Startbedingungen

Vor jeder tieferen Diagnose gilt:

- stimmt die Grundstellung aller relevanten Aktoren?
- sind die Startfreigaben vollständig vorhanden?
- liegt eine Blockade durch Sicherheits- oder Verriegelungsbedingungen vor?

Viele Fehler werden hier bereits eingegrenzt, ohne dass Bauteile getauscht werden müssen.

---

## 4) Signal-, Energie- und Informationsfluss prüfen

Gehe in dieser Reihenfolge vor:

1) Bedien- oder Startsignal vorhanden?  
2) Eingangssignal in der Steuerung plausibel?  
3) Verknüpfung/Freigabe erfüllt?  
4) Ausgangssignal aktiv?  
5) Aktor versorgt (z. B. Druck/Spannung)?  
6) Bewegung/Funktion vorhanden?  
7) Rückmeldung durch Sensor korrekt?

So trennst du klar zwischen Steuerungsproblem, Versorgungsproblem und mechanischem Problem.

---

## 5) Teilsysteme und Schnittstellen

Typische Teilsysteme:

- Sensorik
- Logik/Steuerung
- Aktorik
- Versorgung
- Mechanik

Schnittstellen sind häufige Fehlerorte, z. B.:

- Ausgang aktiv, aber Ventil schaltet nicht
- Ventil schaltet, aber am Zylinder fehlt Druck
- Bewegung vorhanden, aber Sensor meldet nicht zurück

---

## 6) Ursache absichern statt raten

Eine Ursache gilt erst als abgesichert, wenn:

- der Befund fachlich zur Ursache passt,
- Alternativen geprüft oder begründet ausgeschlossen wurden,
- ein Nachweis vorliegt (Messwert, I/O-Status, Funktionsprobe, Protokoll),
- die Maßnahme die Abweichung tatsächlich behebt.

---

## 7) Wirksamkeitsnachweis und Übergabe

Nach der Maßnahme immer:

- Probelauf unter realen Bedingungen
- Soll/Ist-Vergleich mit klaren Kriterien
- i. O./n. i. O.-Bewertung
- dokumentierte Übergabe

Ohne diesen Nachweis ist die Fehlersuche fachlich nicht abgeschlossen.

---

## 8) Schwachstellenanalyse bei wiederkehrenden Fehlern

Bei wiederkehrenden Störungen reichen Einzelfixes nicht aus.  
Dann brauchst du:

- Fehlerhäufigkeit und Ausfallzeiten
- Trend- und Musteranalyse
- Bewertung von Belastung, Verschleiß und Umgebungsbedingungen
- Priorisierung der Ursachen (z. B. nach Häufigkeit/Auswirkung)

Ziel: von reaktiver Reparatur zu nachhaltiger Verbesserung.

---

## Typische Prüfungsfallen

- direkt Bauteile tauschen statt Ursache eingrenzen
- Grundstellung und Startbedingungen überspringen
- nur die Elektrik prüfen, aber Pneumatik/Mechanik ignorieren
- Ursache ohne Mess- oder Funktionsnachweis behaupten
- Wirksamkeit nicht nachweisen
- unvollständige Dokumentation

---

## 20-Sekunden-Check vor Abgabe

- Ist das Störungsbild konkret beschrieben?
- Sind Grundstellung und Startbedingungen geprüft?
- Ist die Signal- und Funktionskette logisch abgearbeitet?
- Ist die Ursache nachweisbar abgesichert?
- Ist die Wirksamkeit dokumentiert?

---

## Mini-Merkkarte

- erst sichern, dann prüfen  
- erst eingrenzen, dann beheben  
- Soll/Ist schlägt Vermutung  
- Übergabe nur mit Nachweis und Protokoll  
