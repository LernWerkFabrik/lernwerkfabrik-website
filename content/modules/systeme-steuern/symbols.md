# Signal- und Regelkette

## Kernmodell

Für Aufgaben in der Steuerungstechnik hilft ein fester Denkrahmen:

1. Eingang (Sensor/Bedienung)
2. Logik (Verknüpfung/Freigabe)
3. Ausgang (Ansteuerung)
4. Aktor (Bewegung)
5. Rückmeldung (Istwert)

---

## Abgrenzung

| Begriff | Kennzeichen | Prüffrage |
|---|---|---|
| Steuern | Keine automatische Istwert-Rückführung | Wird nur ein Befehl ausgegeben? |
| Regeln | Soll-/Ist-Vergleich mit Rückführung | Wird Abweichung automatisch nachgeführt? |
| Überwachen | Zustände erfassen und bewerten | Wird Grenzwertverletzung erkannt und reagiert? |

---

## Typische Überwachungsgrößen

- Zykluszeit
- Endlagen- und Positionssignale
- Druck
- Stromaufnahme
- Temperatur
- Störhäufigkeit

---

## Diagnose an Schnittstellen

Bei Störungen immer getrennt prüfen:

- **Sensorik:** Signal vorhanden, plausibel, reproduzierbar?
- **Logik:** Freigabe/Verriegelung korrekt verknüpft?
- **Aktorik:** Ausgang aktiv, Ventil/Antrieb arbeitet?
- **Mechanik:** Blockade, Verschleiß, Fehlstellung?

---

## Schnellcheck

- Sollwert klar benannt?
- Istwert belastbar erfasst?
- Differenz mit Einheit angegeben?
- Maßnahme mit Wirksamkeit belegt?
