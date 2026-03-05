// scripts/scaffold-modules.mjs
import fs from "node:fs/promises";
import path from "node:path";

const MODULES = [
  // Grundlagen Metalltechnik (6)
  {
    id: "technische-berechnungen",
    title: "Technische Berechnungen sicher anwenden",
    description: "Technische Rechenwege (inkl. Einheiten/Umstellen) sicher in Aufgaben anwenden.",
    difficulty: "easy",
    tags: ["Grundlagen", "Mathe", "Einheiten"],
    estimatedMinutes: 35,
  },
  {
    id: "stoffwerte-bauteilauswahl",
    title: "Stoffwerte zur Bauteilauswahl nutzen",
    description: "Dichte, Masse, Volumen und Stoffwerte zur Bauteil- und Materialentscheidung nutzen.",
    difficulty: "easy",
    tags: ["Werkstoffe", "Stoffwerte", "Dichte"],
    estimatedMinutes: 35,
  },
  {
    id: "kraefte-drehmomente",
    title: "Kräfte und Drehmomente in Bauteilen beurteilen",
    description: "Kräfte/Lasten verstehen und Drehmomente sicher berechnen und prüfen.",
    difficulty: "medium",
    tags: ["Mechanik", "Kraft", "Drehmoment"],
    estimatedMinutes: 40,
  },
  {
    id: "technische-zeichnungen",
    title: "Technische Zeichnungen lesen und nutzen",
    description: "Zeichnungen interpretieren: Ansichten, Maße, Symbole und Grundregeln.",
    difficulty: "medium",
    tags: ["Zeichnung", "Normen", "Maße"],
    estimatedMinutes: 40,
  },
  {
    id: "sicherheit-umwelt",
    title: "Sicherheits- und Umweltvorgaben einhalten",
    description: "Arbeits- und Umweltschutz im metalltechnischen Alltag sicher umsetzen.",
    difficulty: "easy",
    tags: ["Sicherheit", "Umwelt", "PSA"],
    estimatedMinutes: 30,
  },
  {
    id: "werkstoffeigenschaften",
    title: "Werkstoffeigenschaften vergleichen",
    description: "Härte, Festigkeit, Zähigkeit: Eigenschaften vergleichen und Einsatz ableiten.",
    difficulty: "medium",
    tags: ["Werkstoffe", "Eigenschaften", "Härte"],
    estimatedMinutes: 35,
  },

  // Fertigen & Montieren (5)
  {
    id: "bauteile-fertigen",
    title: "Bauteile nach Zeichnung fertigen",
    description: "Arbeitsfolge ableiten und ein Bauteil nach Zeichnung herstellen (prüfungsnah).",
    difficulty: "medium",
    tags: ["Fertigung", "Zeichnung", "Arbeitsfolge"],
    estimatedMinutes: 45,
  },
  {
    id: "fertigungsverfahren",
    title: "Fertigungsverfahren auswählen und anwenden",
    description: "Trennen/Umformen/Spanen: geeignetes Verfahren auswählen und begründen.",
    difficulty: "medium",
    tags: ["Fertigungsverfahren", "Spanen", "Umformen"],
    estimatedMinutes: 45,
  },
  {
    id: "baugruppen-montieren",
    title: "Baugruppen montieren und prüfen",
    description: "Baugruppen montieren, Funktionsprüfung durchführen, Fehler erkennen.",
    difficulty: "medium",
    tags: ["Montage", "Baugruppe", "Prüfen"],
    estimatedMinutes: 45,
  },
  {
    id: "toleranzen-fertigung",
    title: "Toleranzen in der Fertigung berücksichtigen",
    description: "Maße/Toleranzen in der Fertigung beachten und messbar absichern.",
    difficulty: "hard",
    tags: ["Toleranzen", "Messmittel", "Qualität"],
    estimatedMinutes: 45,
  },
  {
    id: "werkzeuge-maschinen",
    title: "Werkzeuge und Maschinen fachgerecht einsetzen",
    description: "Werkzeuge auswählen, sicher einsetzen und typische Fehler vermeiden.",
    difficulty: "easy",
    tags: ["Werkzeug", "Maschine", "Sicherheit"],
    estimatedMinutes: 35,
  },

  // Instandhalten & Warten (4)
  {
    id: "wartung-planen",
    title: "Wartungsarbeiten planen und durchführen",
    description: "Wartung planen, Schritte durchführen und Ergebnisse bewerten.",
    difficulty: "medium",
    tags: ["Wartung", "Planung", "Instandhaltung"],
    estimatedMinutes: 45,
  },
  {
    id: "stoerungen-eingrenzen",
    title: "Störungen systematisch eingrenzen",
    description: "Fehlersuche strukturiert durchführen und Ursachen ableiten (AP2-typisch).",
    difficulty: "hard",
    tags: ["Fehlersuche", "Störung", "Systematik"],
    estimatedMinutes: 45,
  },
  {
    id: "mechanische-schaeden",
    title: "Mechanische Schäden beurteilen",
    description: "Schadensbilder erkennen, bewerten und Maßnahmen ableiten.",
    difficulty: "medium",
    tags: ["Schäden", "Beurteilung", "Mechanik"],
    estimatedMinutes: 40,
  },
  {
    id: "instandhaltung-dokumentieren",
    title: "Instandhaltungsmaßnahmen dokumentieren",
    description: "Dokumentation, Protokolle, Übergabe: sauber und prüfungsfähig festhalten.",
    difficulty: "easy",
    tags: ["Dokumentation", "Prozess", "Qualität"],
    estimatedMinutes: 30,
  },

  // Steuerung & Automatisierung (4)
  {
    id: "systeme-steuern",
    title: "Technische Systeme steuern und überwachen",
    description: "Steuerung/Regelung im System verstehen und Zustände bewerten.",
    difficulty: "medium",
    tags: ["Systeme", "Steuerung", "Überwachung"],
    estimatedMinutes: 45,
  },
  {
    id: "schaltplaene-lesen",
    title: "Schalt- und Funktionspläne lesen",
    description: "Symbole, Signalfluss und Funktionslogik verstehen (AP2-klassisch).",
    difficulty: "medium",
    tags: ["Schaltplan", "Funktion", "Elektrik"],
    estimatedMinutes: 45,
  },
  {
    id: "elektrische-baugruppen",
    title: "Elektrische Baugruppen prüfen",
    description: "Grundlegende Prüfungen sicher durchführen (Sicherheit, Logik, Messung).",
    difficulty: "hard",
    tags: ["Elektrik", "Prüfen", "Sicherheit"],
    estimatedMinutes: 45,
  },
  {
    id: "fehler-steuerungen",
    title: "Fehler in Steuerungen systematisch suchen",
    description: "Fehlerbilder erkennen und Schritt-für-Schritt eingrenzen.",
    difficulty: "hard",
    tags: ["Fehlersuche", "Steuerung", "Systematik"],
    estimatedMinutes: 45,
  },

  // Qualität & Prozesse (4)
  {
    id: "masse-toleranzen-pruefen",
    title: "Maße und Toleranzen prüfen",
    description: "Messmittel nutzen, Ergebnisse bewerten, Abweichungen beurteilen.",
    difficulty: "medium",
    tags: ["Messen", "Toleranzen", "Qualität"],
    estimatedMinutes: 40,
  },
  {
    id: "pruefmittel-einsetzen",
    title: "Prüfmittel auswählen und einsetzen",
    description: "Prüfmittel passend auswählen, richtig anwenden und dokumentieren.",
    difficulty: "medium",
    tags: ["Prüfmittel", "Messmittel", "Qualität"],
    estimatedMinutes: 40,
  },
  {
    id: "qualitaetsmaengel",
    title: "Qualitätsmängel erkennen und bewerten",
    description: "Abweichungen analysieren, Ursachen ableiten und Maßnahmen planen.",
    difficulty: "hard",
    tags: ["Qualität", "Analyse", "Ursachen"],
    estimatedMinutes: 45,
  },
  {
    id: "arbeitsablaeufe-planen",
    title: "Arbeitsabläufe planen und dokumentieren",
    description: "Aufträge strukturieren, Ablauf planen, dokumentieren und bewerten.",
    difficulty: "medium",
    tags: ["Planung", "Dokumentation", "Prozess"],
    estimatedMinutes: 45,
  },

  // Prüfungsvorbereitung (4)
  {
    id: "ap1-arbeitsaufgaben",
    title: "AP1 Training – Arbeitsaufgaben",
    description: "Prüfungsnahe Arbeitsaufgaben: Ablauf, Zeit, Bewertung und typische Fehler.",
    difficulty: "hard",
    tags: ["AP1", "Prüfung", "Praxis"],
    estimatedMinutes: 45,
  },
  {
    id: "ap1-rechen-fachaufgaben",
    title: "AP1 Prüfungs-Simulator",
    description: "Prüfungsnahe Rechen-/Fachaufgaben: sicher, schnell, plausibel.",
    difficulty: "hard",
    tags: ["AP1", "Rechnen", "Fachkunde"],
    estimatedMinutes: 45,
  },
  {
    id: "ap2-systemaufgaben",
    title: "AP2 Prüfungs-Simulator",
    description: "Systemaufgaben, Instandhaltung und Ursachenanalyse im Prüfungsstil.",
    difficulty: "hard",
    tags: ["AP2", "System", "Instandhaltung"],
    estimatedMinutes: 50,
  },
  {
    id: "ap2-situationsaufgaben",
    title: "AP2 Training – Situationsaufgaben",
    description: "Situationsaufgaben: Planung, Qualität, Organisation, Bewertung (prüfungsnah).",
    difficulty: "hard",
    tags: ["AP2", "Situation", "Organisation"],
    estimatedMinutes: 50,
  },
];

function modulesRootDir() {
  return path.join(process.cwd(), "content", "modules");
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function writeIfMissing(filePath, content) {
  if (await exists(filePath)) return false;
  await fs.writeFile(filePath, content, "utf8");
  return true;
}

function moduleJson(def) {
  return (
    JSON.stringify(
      {
        id: def.id,
        title: def.title,
        description: def.description,
        difficulty: def.difficulty,
        tags: def.tags,
        estimatedMinutes: def.estimatedMinutes,
        files: {
          explanation: "explanation.md",
          example: "example.md",
          practiceQuestions: "questions.practice.json",
          examQuestions: "questions.exam.json",
        },
      },
      null,
      2
    ) + "\n"
  );
}

function stubExplanation(def) {
  return `# ${def.title}

## Ziel
${def.description}

## Praxisbezug
- Wo begegnet dir das in der Ausbildung / Prüfung?

## Kernpunkte
- Begriff / Formel / Vorgehen
- Einheiten / typische Fehler
`;
}

function stubExample(def) {
  return `# Beispiel – ${def.title}

**Gegeben:** …
**Gesucht:** …
**Lösung:** …
`;
}

function stubQuestions() {
  return (
    JSON.stringify(
      [
        {
          id: "q1",
          prompt: "Platzhalter-Aufgabe (bitte ersetzen).",
          answer: { value: 0, unit: "" },
          tolerance: 0,
          solution: "Platzhalter-Lösung.",
        },
      ],
      null,
      2
    ) + "\n"
  );
}

async function main() {
  const root = modulesRootDir();
  await ensureDir(root);

  let createdDirs = 0;
  let createdFiles = 0;
  let skippedFiles = 0;

  for (const def of MODULES) {
    const dir = path.join(root, def.id);

    if (!(await exists(dir))) {
      await ensureDir(dir);
      createdDirs++;
    }

    const results = await Promise.all([
      writeIfMissing(path.join(dir, "module.json"), moduleJson(def)),
      writeIfMissing(path.join(dir, "explanation.md"), stubExplanation(def)),
      writeIfMissing(path.join(dir, "example.md"), stubExample(def)),
      writeIfMissing(path.join(dir, "questions.practice.json"), stubQuestions()),
      writeIfMissing(path.join(dir, "questions.exam.json"), stubQuestions()),
    ]);

    const wrote = results.filter(Boolean).length;
    createdFiles += wrote;
    skippedFiles += 5 - wrote;
  }

  console.log(
    `[scaffold] createdDirs=${createdDirs}, createdFiles=${createdFiles}, skippedFiles(existing)=${skippedFiles}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
