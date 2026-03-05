# Elektrische Baugruppen prüfen

In AP2-nahen Aufgaben zählt nicht nur das richtige Messergebnis.  
Entscheidend ist, ob du sicher arbeitest, Schaltunterlagen logisch nutzt und deine Prüfschritte fachlich begründest.

Dieses Modul trainiert genau diesen Ablauf: von der Vorbereitung über die Messung bis zur dokumentierten Bewertung.

---

## Lernziel

Nach diesem Modul kannst du:

- Schalt- und Funktionspläne für elektrische Baugruppen sicher auswerten
- Sicherheitsregeln beim Prüfen elektrischer Betriebsmittel konsequent anwenden
- passende Prüfverfahren und Messmittel auswählen
- Spannung, Strom, Widerstand und Durchgang fachgerecht prüfen
- Messwerte mit Sollwerten und Toleranzen vergleichen
- Abweichungen systematisch eingrenzen und nachvollziehbar dokumentieren

---

## Prüfungs-Algorithmus (immer gleich)

1) Auftrag und Unterlagen klären (Schaltplan, Funktionsbeschreibung, Prüfplan)  
2) Sicherheitszustand herstellen und prüfen  
3) Prüfverfahren und Messmittel festlegen  
4) Messung in sinnvoller Reihenfolge durchführen  
5) Soll/Ist vergleichen und bewerten  
6) bei Abweichung Ursache eingrenzen  
7) Ergebnis und Maßnahmen dokumentieren

> Merksatz:  
> **Erst sicher prüfen, dann richtig messen, dann fachlich bewerten.**

---

## 1) Sicherheit vor jeder Messung

Vor jedem Prüfschritt musst du den Zustand der Baugruppe und des Arbeitsplatzes beurteilen.

Wichtige Grundsätze:

- nur freigegebene, einsatzfähige Messmittel verwenden
- Messleitungen, Prüfspitzen und Isolierungen auf sichtbare Schäden prüfen
- bei Arbeiten im spannungsfreien Zustand gegen Wiedereinschalten sichern
- nur Messverfahren anwenden, die zum Zustand der Baugruppe passen

Prüfungsfalle:
Direkt messen, ohne Sicherheits- und Zustandsprüfung. Das kostet auch bei rechnerisch richtigen Werten Punkte.

---

## 2) Schalt- und Funktionspläne richtig nutzen

Der Plan ist deine zentrale Informationsquelle. Du brauchst:

- Versorgungsebene (z. B. 24 V DC) und Bezugspunkt
- Signalweg vom Eingang (Sensor) bis zum Ausgang (Aktor)
- logische Bedingungen für das Schalten
- relevante Klemmen, Kontakte und Prüfpunkte

Typische Fehler:

- nur Symbole benennen, aber Signalfluss nicht verfolgen
- falschen Messpunkt wählen
- Sensor und Aktor im Ablauf verwechseln

---

## 3) Prüfverfahren und Prüfmittel auswählen

Die Auswahl folgt dem Prüfziel:

- **Spannungsprüfung:** Versorgung liegt am Messpunkt an?
- **Durchgangsprüfung:** Leitung oder Kontakt elektrisch geschlossen?
- **Widerstandsprüfung:** Bauteilwert plausibel?
- **Funktionsprüfung:** reagiert der Ausgang korrekt auf das Eingangssignal?

Wichtig:
Ein Messgerät ist nur dann geeignet, wenn Messart, Messbereich und Baugruppenzustand zueinander passen.

---

## 4) Messungen fachgerecht durchführen

Grundregeln im Prüfablauf:

- Spannungsmessung am relevanten Messpunkt gegen Bezug
- Strommessung nur im passenden Messaufbau
- Widerstand und Durchgang nur bei geeignetem, sicheren Zustand
- Messbereich so wählen, dass ein sicher ablesbarer Wert entsteht

Danach immer:

- Messwert mit Einheit notieren
- Messwert fachlich einordnen (Soll/Ist, innerhalb/außerhalb Toleranz)

---

## 5) Soll/Ist-Vergleich mit Begründung

Eine gute Antwort besteht aus drei Teilen:

1) Sollwert nennen  
2) Istwert nennen  
3) fachliche Bewertung ableiten

Beispielstruktur:

- Soll: 24,0 V ± 10 %
- Ist: 21,4 V
- Bewertung: innerhalb des zulässigen Bereichs, daher i. O.

Prüfungsfalle:
Nur "passt" schreiben, ohne Zahlenbezug.

---

## 6) Funktionsabläufe von Steuerungen prüfen

Bei elektrischen Baugruppen mit Steuerungsanteil wird bewertet, ob du den Ablauf logisch prüfst:

1) Startbedingung vorhanden?
2) Eingangssignal wird erkannt?
3) Ausgang wird angesteuert?
4) Aktor reagiert wie gefordert?
5) Rückmeldung stimmt mit Zustand überein?

So vermeidest du planloses Tauschen von Komponenten.

---

## 7) Abweichungen systematisch eingrenzen

Nutze eine feste Fehlerkette:

**Symptom -> Prüfschritt -> Befund -> Ursache -> Maßnahme**

Beispiel:

- Symptom: Magnetventil zieht nicht an
- Prüfschritt: Spannung an Spule messen
- Befund: keine Spannung am Ausgang
- Ursache: Steuersignal fehlt oder Kontaktfehler im Signalweg
- Maßnahme: Signalweg abschnittsweise prüfen, Fehlerstelle beheben, erneut prüfen

---

## 8) Prüfergebnisse dokumentieren

In ein prüfungstaugliches Protokoll gehören mindestens:

- Baugruppe/Prüfpunkt/Datum
- verwendete Prüfmittel
- Sollwerte und Istwerte mit Einheit
- Bewertung (i. O. oder n. i. O.)
- bei Abweichung: Ursache, Maßnahme, Wiederholprüfung

Ohne Dokumentation ist die Prüfung fachlich nicht abgeschlossen.

---

## Typische Prüfungsfallen

- Messung ohne klare Sicherheitsprüfung
- falsche Messart oder falscher Messbereich
- Messwert ohne Sollbezug notiert
- Ursache behauptet, aber nicht nachgewiesen
- Funktionsprüfung ohne klare Reihenfolge
- Dokumentation unvollständig

---

## 20-Sekunden-Check vor Abgabe

- Habe ich den Sicherheitszustand klar beschrieben?
- Ist der Messpunkt fachlich begründet?
- Habe ich Soll und Ist mit Einheit verglichen?
- Ist die Bewertung nachvollziehbar (i. O./n. i. O.)?
- Ist bei Abweichung die Maßnahme dokumentiert?

---

## Mini-Merkkarte

- Sicherheit -> Messaufbau -> Messung -> Bewertung
- Plan lesen, Signalfluss prüfen, dann messen
- Soll/Ist mit Einheit schlägt Bauchgefühl
- erst Ursache absichern, dann Maßnahme umsetzen
- ohne Protokoll kein prüfungssicheres Ergebnis
