// lib/learn/explain.ts
// "Erklär mir das" — didaktischer Begleiter (spoilerfrei).
// Liefert ein UI-freundliches ViewModel (keine Markdown-Fettschrift, keine sichtbaren $$).

export type ExplainStatus = "unanswered" | "attempted" | "checked";
export type ExplainLevel = "hint" | "guided" | "conceptual";

export type ExplainContext = {
  questionId: string;
  topic?: string;
  questionText: string;
  questionType?: string;

  userInput?: string;
  status: ExplainStatus;

  checkedCorrect?: boolean;
  tipsSeen?: boolean;
};

export type ExplainSection = {
  title: string;
  bullets: string[];
  /**
   * Reine LaTeX-Formel (ohne $$).
   * UI rendert daraus $$ ... $$ via Markdown/KaTeX.
   */
  formulaLatex?: string;
  /** Optionaler kurzer Satz oberhalb der Bullets */
  lead?: string;
};

export type ExplainResult = {
  level: ExplainLevel;

  /** Menschlicher Einstieg (2–3 Sätze) */
  intro: string;

  /** Haupt-Content (links) */
  sections: ExplainSection[];

  /** Ein einzelner Denkanstoß */
  followUp?: string;

  /** Rechte Spalte (kurz, prüfungsnah) */
  side: {
    quickCheck: string[]; // max 3
    targetUnit?: string;
    keyPitfall?: string;
  };

  meta: {
    safeMode: true;
    refusedSpoilerRequest: boolean;
    detectedNumbersInUserInput: boolean;
  };

  /** Plaintext-Fallback (nicht für UI gedacht) */
  explanationText: string;
};

type TopicKey =
  | "geschwindigkeit"
  | "arbeit"
  | "leistung"
  | "druck"
  | "drehmoment"
  | "zylinder"
  | "dichte"
  | "volumen"
  | "masse"
  | "unknown";

export function chooseLevel(ctx: ExplainContext): ExplainLevel {
  if (ctx.status === "checked" && ctx.checkedCorrect === true) return "conceptual";
  if (ctx.status === "unanswered") return "hint";
  return "guided";
}

export function explainLocally(ctx: ExplainContext): ExplainResult {
  const qType = String(ctx.questionType ?? "").trim();
  if (isNonNumericType(qType)) {
    return explainNonNumeric(ctx);
  }

  const level = chooseLevel(ctx);
  const topic = detectTopic(ctx.topic, ctx.questionText);

  const input = (ctx.userInput ?? "").trim();
  const detectedNumbersInUserInput = /\d/.test(input);
  const refusedSpoilerRequest = looksLikeSpoilerRequest(input);

  const intro = introFor(topic);
  const sections: ExplainSection[] = [];

  sections.push({
    title: "Gesucht und gegeben",
    bullets: soughtGiven(topic),
  });

  const formulaLatex = formulaFor(topic);
  sections.push({
    title: "Ansatz",
    lead: formulaLatex ? "Die passende Grundformel lautet:" : undefined,
    formulaLatex: formulaLatex ?? undefined,
    bullets: approach(topic),
  });

  sections.push({
    title: "Einheitencheck",
    bullets: unitHints(topic),
  });

  sections.push({
    title: "Typische Prüfungsfalle",
    bullets: trapHints(topic, detectedNumbersInUserInput),
  });

  const followUp = followUpQuestion(topic, level);

  const side = sideInfo(topic);

  const spoilerNote = refusedSpoilerRequest
    ? "Hinweis: Ich rechne nichts aus und setze keine Zahlen ein – ich zeige dir nur den Weg, wie du es selbst sicher löst."
    : "";

  const correctnessNote =
    ctx.status === "checked" && ctx.checkedCorrect === true
      ? "Hinweis: Deine Lösung ist korrekt. Nutze das hier nur als Qualitäts-Check (Formel, Einheiten, Rundung)."
      : "";

  const explanationText = toPlaintext({
    intro,
    correctnessNote,
    spoilerNote,
    sections,
    followUp,
    side,
  });

  return {
    level,
    intro,
    sections,
    followUp,
    side,
    meta: {
      safeMode: true,
      refusedSpoilerRequest,
      detectedNumbersInUserInput,
    },
    explanationText,
  };
}

/* -------------------------- Content building blocks -------------------------- */

function isNonNumericType(qType: string): boolean {
  return (
    qType === "single_choice" ||
    qType === "multi_select" ||
    qType === "order" ||
    qType === "structured_text"
  );
}

function explainNonNumeric(ctx: ExplainContext): ExplainResult {
  const level = chooseLevel(ctx);
  const qType = String(ctx.questionType ?? "").trim();

  const intro = nonNumericIntro(qType);
  const sections: ExplainSection[] = nonNumericSections(qType);
  const followUp = nonNumericFollowUp(qType, level);
  const side = nonNumericSide(qType);

  const input = (ctx.userInput ?? "").trim();
  const refusedSpoilerRequest = looksLikeSpoilerRequest(input);

  const spoilerNote = refusedSpoilerRequest
    ? "Hinweis: Ich nenne keine konkrete Lösung, sondern nur die Entscheidungslogik."
    : "";

  const correctnessNote =
    ctx.status === "checked" && ctx.checkedCorrect === true
      ? "Hinweis: Deine Auswahl ist korrekt. Nutze das hier als Qualitäts-Check für die Begründungslogik."
      : "";

  const explanationText = toPlaintext({
    intro,
    correctnessNote,
    spoilerNote,
    sections,
    followUp,
    side,
  });

  return {
    level,
    intro,
    sections,
    followUp,
    side,
    meta: {
      safeMode: true,
      refusedSpoilerRequest,
      detectedNumbersInUserInput: /\d/.test(input),
    },
    explanationText,
  };
}

function nonNumericIntro(qType: string): string {
  switch (qType) {
    case "single_choice":
      return "Hier zählt Prüfungslogik: eine Option ist fachlich sauber, die anderen haben einen klaren Haken.";
    case "multi_select":
      return "Bei Mehrfachauswahl sind mehrere Aussagen richtig. Entscheide nach Schutz, Funktion und Fachlogik – nicht nach Bauchgefühl.";
    case "order":
      return "Reihenfolgen folgen einer Handlungskette: erst Anforderungen klären, dann vorbereiten, dann ausführen, dann prüfen.";
    case "structured_text":
      return "Struktur ist entscheidend: Entscheidung klar benennen, kurz begründen und einen messbaren Kontrollpunkt nennen.";
    default:
      return "Nutze Prüfungslogik: erst verstehen, dann auswählen, dann kurz begründen.";
  }
}

function nonNumericSections(qType: string): ExplainSection[] {
  if (qType === "structured_text") {
    return [
      {
        title: "Entscheidung",
        bullets: ["Sag klar, was du tust (aktiver Satz).", "Bleibe fachlich und konkret."],
      },
      {
        title: "Begründung",
        bullets: ["Nenne den fachlichen Grund (Qualität, Funktion, Sicherheit).", "Beziehe dich auf Norm/Anforderung, falls gegeben."],
      },
      {
        title: "Kontrollpunkt",
        bullets: ["Nenne ein prüfbares Kriterium (Soll/Ist).", "Falls möglich: Prüfmittel oder Sichtprüfung benennen."],
      },
    ];
  }

  if (qType === "order") {
    return [
      {
        title: "Handlungslogik",
        bullets: ["Erst klären: Zeichnung/Anforderung lesen.", "Dann vorbereiten: rüsten/spannen/einrichten.", "Dann ausführen und zwischendurch prüfen."],
      },
      {
        title: "Qualitätssicherung",
        bullets: ["Zwischenmessung vor Endkontrolle.", "Dokumentation am Schluss."],
      },
    ];
  }

  // single_choice + multi_select + default
  return [
    {
      title: "Aufgabenlogik",
      bullets: ["Suche fachlich sinnvolle Maßnahmen/Begründungen.", "Achte auf Sicherheit, Qualität und Prozesssicherheit."],
    },
    {
      title: "Ausschlussprinzip",
      bullets: ["Unlogische/extreme Aussagen streichen.", "„Absichtlich falsch“ oder gesundheitsgefährdend ist fast nie richtig."],
    },
  ];
}

function nonNumericFollowUp(qType: string, level: ExplainLevel): string | undefined {
  if (qType === "multi_select") {
    return level === "hint" ? "Welche Aussagen schützen aktiv Gesundheit oder Prozess?" : "Welche Aussagen sind fachlich plausibel und praxistauglich?";
  }
  if (qType === "single_choice") {
    return level === "hint" ? "Welche Option ist fachlich sauber formuliert?" : "Welche Option würdest du in der Prüfung begründen können?";
  }
  if (qType === "order") {
    return "Welche Schritte müssen logisch vor der Ausführung passieren?";
  }
  if (qType === "structured_text") {
    return "Kannst du einen messbaren Kontrollpunkt nennen?";
  }
  return undefined;
}

function nonNumericSide(qType: string): ExplainResult["side"] {
  if (qType === "multi_select") {
    return {
      quickCheck: ["Mehrfachauswahl: mehrere richtig", "Schutz/Qualität/Prozess im Blick", "Extreme/unsichere Aussagen meiden"],
    };
  }
  if (qType === "single_choice") {
    return {
      quickCheck: ["Nur eine Option", "Saubere Fachlogik", "Keine unnötigen Risiken"],
    };
  }
  if (qType === "order") {
    return {
      quickCheck: ["Klären → Vorbereiten → Ausführen → Prüfen", "Messung vor Endkontrolle", "Dokumentation am Schluss"],
    };
  }
  if (qType === "structured_text") {
    return {
      quickCheck: ["Entscheidung klar", "Begründung fachlich", "Kontrollpunkt messbar"],
    };
  }
  return {
    quickCheck: ["Aufgabenlogik prüfen", "Fachlich plausibel", "Prüfbar formuliert"],
  };
}

function introFor(topic: TopicKey): string {
  switch (topic) {
    case "geschwindigkeit":
      return [
        "Hier geht es darum, wie schnell sich etwas bewegt: Weg pro Zeit.",
        "Wenn bei gleicher Zeit der Weg größer wird, steigt die Geschwindigkeit – und umgekehrt.",
        "Wichtig ist vor allem: Einheiten sauber machen, dann ist der Rechenweg fast immer geradeaus.",
      ].join(" ");
    case "arbeit":
      return [
        "Arbeit beschreibt, wie viel Energie durch eine Kraft entlang eines Weges umgesetzt wird.",
        "Du brauchst dafür immer zwei Dinge: Kraft und Weg – und am Ende muss die Einheit passen.",
        "Wenn die Einheiten stimmen, ist die Aufgabe in Prüfungen oft ein sicherer Punkt.",
      ].join(" ");
    case "leistung":
      return [
        "Leistung ist Arbeit pro Zeit: Sie sagt, wie schnell Arbeit umgesetzt wird.",
        "Typisch in Prüfungen: kW/W und Sekunden/Minuten sauber trennen.",
        "Erst Formel, dann Einheiten – dann rechnen.",
      ].join(" ");
    case "druck":
      return [
        "Druck ist Kraft pro Fläche: Es geht also darum, wie stark eine Kraft auf eine bestimmte Fläche „wirkt“.",
        "Der Klassiker ist die Flächenumrechnung (mm²/cm² zu m²).",
        "Wenn A sauber in m² steht, ist das Ergebnis praktisch automatisch in Pa.",
      ].join(" ");
    case "drehmoment":
      return [
        "Drehmoment ist Kraft am Hebelarm: Entscheidend ist der senkrechte Abstand zur Drehachse.",
        "Die häufigste Fehlerquelle ist mm statt m beim Hebelarm.",
        "Sauber umrechnen, dann ist das Moment nur noch ein einfacher Schritt.",
      ].join(" ");
    case "zylinder":
      return [
        "Bei Zylinderaufgaben trennst du erst die Geometrie (Volumen) von der Physik (z. B. Masse über Dichte).",
        "Achte besonders auf Durchmesser vs. Radius und auf mm³/cm³.",
        "Wenn die Einheiten konsistent sind, ist der Rechenweg sehr stabil.",
      ].join(" ");
    case "dichte":
      return [
        "Dichte bedeutet Masse pro Volumen: Sie sagt, wie „schwer“ ein Stoff bei gleichem Volumen ist.",
        "In Prüfungen ist die größte Hürde meist die Volumeneinheit (cm³, mm³, m³).",
        "Wenn m und V in passenden Einheiten stehen, ist die Rechnung straightforward.",
      ].join(" ");
    case "volumen":
      return [
        "Beim Volumen geht es darum, die passende Geometrieformel korrekt anzuwenden.",
        "Quadrate und Kuben machen Umrechnungen fehleranfällig – hier verliert man Punkte.",
        "Sauber aufschreiben, Einheiten prüfen, dann rechnen.",
      ].join(" ");
    case "masse":
      return [
        "Masse hängt häufig an Dichte und Volumen: m = ρ · V ist der typische Weg.",
        "Damit steht und fällt alles mit der Volumeneinheit (cm³/mm³/m³).",
        "Erst Einheiten klären, dann einsetzen.",
      ].join(" ");
    default:
      return [
        "Wir bringen zuerst Ordnung rein: gesucht und gegeben mit Einheiten.",
        "Dann wählen wir die passende Grundformel und stellen um.",
        "Erst wenn die Einheiten sauber sind, lohnt es sich zu rechnen.",
      ].join(" ");
  }
}

function soughtGiven(topic: TopicKey): string[] {
  switch (topic) {
    case "geschwindigkeit":
      return ["Gesucht ist die Geschwindigkeit v.", "Gegeben sind Weg s und Zeit t (mit Einheiten)."];
    case "arbeit":
      return ["Gesucht ist die Arbeit W.", "Gegeben sind Kraft F und Weg s."];
    case "leistung":
      return ["Gesucht ist die Leistung P.", "Gegeben sind Arbeit W und Zeit t (oder Größen, aus denen W folgt)."];
    case "druck":
      return ["Gesucht ist der Druck p.", "Gegeben sind Kraft F und Fläche A."];
    case "drehmoment":
      return ["Gesucht ist das Drehmoment M.", "Gegeben sind Kraft F und Hebelarm r (senkrechter Abstand)."];
    case "zylinder":
      return ["Gesucht ist meist das Volumen V (oder daraus die Masse m).", "Gegeben sind r/d und h, ggf. auch die Dichte ρ."];
    case "dichte":
      return ["Gesucht ist die Dichte ρ (oder entsprechend umstellen).", "Gegeben sind Masse m und Volumen V."];
    default:
      return ["Schreibe gesucht und gegeben sauber auf (immer mit Einheiten)."];
  }
}

function formulaFor(topic: TopicKey): string | null {
  switch (topic) {
    case "geschwindigkeit":
      return "v = \\frac{s}{t}";
    case "arbeit":
      return "W = F \\cdot s";
    case "leistung":
      return "P = \\frac{W}{t}";
    case "druck":
      return "p = \\frac{F}{A}";
    case "drehmoment":
      return "M = F \\cdot r";
    case "zylinder":
      return "V = \\pi r^2 h \\quad (r = \\tfrac{d}{2})";
    case "dichte":
      return "\\rho = \\frac{m}{V}";
    default:
      return null;
  }
}

function approach(topic: TopicKey): string[] {
  switch (topic) {
    case "geschwindigkeit":
      return ["Formel zuerst nach der gesuchten Größe umstellen (falls nötig).", "Dann schrittweise rechnen – ohne im Kopf zu springen."];
    case "druck":
      return ["Achte darauf, dass A wirklich die Fläche ist (nicht eine Länge).", "Erst umstellen, dann rechnen."];
    case "zylinder":
      return ["Erst Volumen bestimmen, erst danach (falls gefragt) über m = ρ · V weiter.", "Bei Durchmesser zuerst den Radius bilden, dann r²."];
    default:
      return ["Passende Grundformel wählen, umstellen, dann rechnen."];
  }
}

function unitHints(topic: TopicKey): string[] {
  switch (topic) {
    case "geschwindigkeit":
      return ["Weg in m, Zeit in s, Ziel ist m/s.", "Kurz prüfen: Passt die Einheit zur Formel?"];
    case "arbeit":
      return ["Kraft in N, Weg in m, Ziel ist Joule.", "Merke: N·m entspricht Joule."];
    case "leistung":
      return ["Zeit in s, Leistung oft in W oder kW (Umrechnung beachten).", "Kurz prüfen: Passt die Einheit zur Formel?"];
    case "druck":
      return ["Fläche in m², Ziel ist Pascal.", "Häufiger Fehler: cm² oder mm² nicht sauber zu m² umgerechnet."];
    case "drehmoment":
      return ["Hebelarm in m, Ziel ist N·m.", "mm → m ist hier der Klassiker."];
    case "zylinder":
    case "dichte":
    case "volumen":
    case "masse":
      return ["Bei Flächen/Volumen Quadrate und Kuben beachten (mm²/mm³ sind kritisch).", "Einheiten erst konsistent machen, dann rechnen."];
    default:
      return ["SI-Einheiten prüfen (m, s, N …).", "Einheitentest vor dem Rechnen."];
  }
}

function trapHints(topic: TopicKey, hasNumbers: boolean): string[] {
  const out: string[] = [];
  switch (topic) {
    case "geschwindigkeit":
      out.push("Zeit wirklich in Sekunden (Minuten sind der Klassiker).");
      break;
    case "druck":
      out.push("Fläche: cm²/mm² ↔ m² ist die häufigste Fehlerquelle.");
      break;
    case "zylinder":
      out.push("Durchmesser vs. Radius: erst r = d/2, dann r².");
      break;
    case "leistung":
      out.push("kW ↔ W wird oft vergessen (Faktor 1000).");
      break;
    default:
      out.push("Zu früh rechnen, ohne Einheiten sauber zu haben.");
      break;
  }
  if (hasNumbers) out.push("Wenn du Zahlen notiert hast: nach jedem Schritt kurz prüfen, ob die Einheit noch passt.");
  return out;
}

function followUpQuestion(topic: TopicKey, level: ExplainLevel): string | undefined {
  if (level === "conceptual") return "Welche Einheit muss am Ende herauskommen – und warum passt sie zur Formel?";
  switch (topic) {
    case "geschwindigkeit":
      return "Welche Einheit erwartest du am Ende – und sind Weg und Zeit bereits in m und s angegeben?";
    case "druck":
      return "Ist deine Fläche wirklich in m² (nicht in cm² oder mm²)?";
    case "zylinder":
      return "Hast du aus dem Durchmesser schon den Radius gemacht, bevor du r² nutzt?";
    case "leistung":
      return "Ist deine Leistung in W oder kW gefragt – und hast du die Umrechnung im Blick?";
    default:
      return "Welche Größe ist gesucht – und welche Grundformel passt dazu?";
  }
}

function sideInfo(topic: TopicKey): ExplainResult["side"] {
  switch (topic) {
    case "geschwindigkeit":
      return {
        targetUnit: "m/s",
        keyPitfall: "Minuten nicht vergessen: ggf. in Sekunden umrechnen.",
        quickCheck: ["Ziel-Einheit festlegen", "s in m und t in s?", "Formel umstellen, dann einsetzen"],
      };
    case "arbeit":
      return {
        targetUnit: "J",
        keyPitfall: "N·m entspricht Joule (nicht durcheinanderbringen).",
        quickCheck: ["F und s mit Einheiten", "Ziel: J (N·m)", "Plausibilität: mehr F/mehr s → mehr W"],
      };
    case "leistung":
      return {
        targetUnit: "W / kW",
        keyPitfall: "kW ↔ W (×1000) ist der häufigste Punktverlust.",
        quickCheck: ["Zeit in Sekunden?", "W oder kW gefragt?", "Erst umstellen, dann rechnen"],
      };
    case "druck":
      return {
        targetUnit: "Pa (oder bar)",
        keyPitfall: "Flächenumrechnung cm²/mm² → m² ist der Klassiker.",
        quickCheck: ["A wirklich Fläche?", "A in m²?", "Ziel-Einheit prüfen (Pa/bar)"],
      };
    case "drehmoment":
      return {
        targetUnit: "N·m",
        keyPitfall: "Hebelarm in mm → m umrechnen.",
        quickCheck: ["r senkrecht?", "r in m?", "Moment wächst mit F und r"],
      };
    case "zylinder":
      return {
        targetUnit: "m³ / cm³ (je nach Aufgabe)",
        keyPitfall: "Durchmesser ≠ Radius (r = d/2) und mm³-Umrechnung.",
        quickCheck: ["r aus d bilden", "Einheiten bei r² und h", "Erst V, dann ggf. m = ρ·V"],
      };
    case "dichte":
      return {
        targetUnit: "kg/m³ (oder g/cm³)",
        keyPitfall: "Volumeneinheit sauber: cm³/mm³/m³.",
        quickCheck: ["m und V mit Einheiten", "Ziel-Einheit festlegen", "Umrechnen vor dem Einsetzen"],
      };
    default:
      return {
        quickCheck: ["Gesucht/gegeben sauber", "Einheiten konsistent", "Erst umstellen, dann rechnen"],
      };
  }
}

/* -------------------------------- Utilities -------------------------------- */

function detectTopic(topic?: string, questionText?: string): TopicKey {
  const hay = `${topic ?? ""} ${questionText ?? ""}`.toLowerCase();

  if (hay.includes("geschwindigkeit") || hay.includes("m/s")) return "geschwindigkeit";
  if (hay.includes("arbeit")) return "arbeit";
  if (hay.includes("leistung")) return "leistung";
  if (hay.includes("druck") || hay.includes("hydraul") || hay.includes("bar") || hay.includes("pa")) return "druck";
  if (hay.includes("drehmoment") || hay.includes("hebelarm") || hay.includes("n·m") || hay.includes("nm")) return "drehmoment";
  if (hay.includes("zylinder")) return "zylinder";
  if (hay.includes("dichte") || hay.includes("rho") || hay.includes("ρ")) return "dichte";
  if (hay.includes("volumen")) return "volumen";
  if (hay.includes("masse")) return "masse";

  return "unknown";
}

function looksLikeSpoilerRequest(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("rechne") ||
    t.includes("rechn") ||
    t.includes("lösung") ||
    t.includes("endgebnis") ||
    t.includes("ergebnis") ||
    t.includes("was kommt raus") ||
    t.includes("setz")
  );
}

function toPlaintext(args: {
  intro: string;
  correctnessNote: string;
  spoilerNote: string;
  sections: ExplainSection[];
  followUp?: string;
  side: ExplainResult["side"];
}): string {
  const lines: string[] = [];
  if (args.correctnessNote) lines.push(args.correctnessNote, "");
  lines.push(args.intro, "");
  if (args.spoilerNote) lines.push(args.spoilerNote, "");

  lines.push("Quick-Check:");
  for (const q of args.side.quickCheck) lines.push(`- ${q}`);
  if (args.side.targetUnit) lines.push(`- Ziel-Einheit: ${args.side.targetUnit}`);
  if (args.side.keyPitfall) lines.push(`- Prüfungsfalle: ${args.side.keyPitfall}`);
  lines.push("");

  for (const s of args.sections) {
    lines.push(s.title);
    if (s.lead) lines.push(`- ${s.lead}`);
    if (s.formulaLatex) lines.push(`- Formel: ${s.formulaLatex}`);
    for (const b of s.bullets) lines.push(`- ${b}`);
    lines.push("");
  }

  if (args.followUp) lines.push(`Denkanstoß: ${args.followUp}`);
  return lines.join("\n").trim();
}
