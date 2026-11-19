export interface ParsedScriptPage {
  pageNumber: number;
  label?: string;
  text: string;
  scenePrompt: string;
}

export interface ParsedScriptResult {
  title: string;
  dedication: string;
  coverScenePrompt?: string;
  pages: ParsedScriptPage[];
}

const SECTION_HEADER_RE =
  /^(?:(azala|portada|cover)\s*:.*$|(?:(\d+)\s*[.\-°º]?\s*(?:irudia|orrialdea|eszena|p[aá]gina|escena|ilustraci[oó]n|page|scene))(?:\s*[:\-]\s*(.*))?|(?:(?:p[aá]gina|escena|ilustraci[oó]n|irudia|orrialdea|page|scene)\s+(\d+))(?:\s*[:\-]\s*(.*))?)$/i;

const TITLE_LABEL_RE = /^(?:izenburua|t[ií]tulo|title)\s*:\s*(.+)$/i;
const DEDICATION_LABEL_RE = /^(?:eskaintza|dedicatoria|dedication)\s*:\s*(.+)$/i;

const SCENE_FIELD_RE =
  /^(?:irudiaren\s+deskribapena|irudia|descripci[oó]n(?:\s+(?:de\s+la\s+imagen|visual))?|escena|imagen|scene(?:\s+description)?|image)\s*:\s*(.*)$/i;
const MOOD_FIELD_RE = /^(?:giroa|ambiente|atm[oó]sfera|mood)\s*:\s*(.*)$/i;
const TEXT_FIELD_RE =
  /^(?:testu\s+laburra|testua|texto\s+corto|texto|text)\s*:\s*(.*)$/i;

function cleanQuotes(str: string): string {
  return str.trim().replace(/^[«"“']+|[»"”']+$/g, "").trim();
}

export function parsePreparedScript(raw: string): ParsedScriptResult {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");

  let title = "";
  let dedication = "";
  let coverScenePrompt: string | undefined;

  interface RawSection {
    kind: "cover" | "page";
    label: string;
    lines: string[];
  }

  const sections: RawSection[] = [];
  let current: RawSection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      if (current) current.lines.push("");
      continue;
    }

    const titleMatch = TITLE_LABEL_RE.exec(trimmed);
    if (titleMatch && !current) {
      title = cleanQuotes(titleMatch[1]);
      continue;
    }

    const dedMatch = DEDICATION_LABEL_RE.exec(trimmed);
    if (dedMatch && !current) {
      dedication = cleanQuotes(dedMatch[1]);
      continue;
    }

    const secMatch = SECTION_HEADER_RE.exec(trimmed);
    if (secMatch) {
      if (secMatch[1]) {
        current = { kind: "cover", label: "Azala / Portada", lines: [] };
      } else {
        const num = secMatch[2] || secMatch[4] || "";
        const subtitle = (secMatch[3] || secMatch[5] || "").trim();
        current = {
          kind: "page",
          label: subtitle ? `${num}. ${subtitle}` : `Página ${num}`,
          lines: [],
        };
      }
      sections.push(current);
      continue;
    }

    // Primera línea antes de cualquier sección: usarla como título si no tenemos aún
    if (!current && !title) {
      title = cleanQuotes(trimmed);
      continue;
    }

    if (current) {
      current.lines.push(trimmed);
    }
  }

  const pages: ParsedScriptPage[] = [];

  for (const sec of sections) {
    let sceneParts: string[] = [];
    let moodParts: string[] = [];
    let textParts: string[] = [];
    const looseLines: string[] = [];

    let activeField: "scene" | "mood" | "text" | null = null;

    for (const line of sec.lines) {
      if (!line) {
        activeField = null;
        continue;
      }

      const sceneM = SCENE_FIELD_RE.exec(line);
      if (sceneM) {
        activeField = "scene";
        if (sceneM[1].trim()) sceneParts.push(sceneM[1].trim());
        continue;
      }

      const moodM = MOOD_FIELD_RE.exec(line);
      if (moodM) {
        activeField = "mood";
        if (moodM[1].trim()) moodParts.push(moodM[1].trim());
        continue;
      }

      const textM = TEXT_FIELD_RE.exec(line);
      if (textM) {
        activeField = "text";
        if (textM[1].trim()) textParts.push(textM[1].trim());
        continue;
      }

      if (activeField === "scene") {
        sceneParts.push(line);
      } else if (activeField === "mood") {
        moodParts.push(line);
      } else if (activeField === "text") {
        textParts.push(line);
      } else {
        looseLines.push(line);
      }
    }

    const sceneText = sceneParts.join(" ").trim();
    const moodText = moodParts.join(" ").trim();
    const pageText = textParts.join(" ").trim();
    const fallbackText = looseLines.join(" ").trim();

    const finalText = pageText || (sec.kind === "cover" ? title : "") || fallbackText || sceneText;
    const combinedScene = [sceneText || fallbackText || finalText, moodText ? `Mood/Giroa: ${moodText}` : ""]
      .filter(Boolean)
      .join(" | ");

    if (sec.kind === "cover" && sections.some((s) => s.kind === "page")) {
      if (!title && pageText) title = cleanQuotes(pageText);
      if (combinedScene) coverScenePrompt = combinedScene;
      continue;
    }

    if (finalText || combinedScene) {
      pages.push({
        pageNumber: pages.length + 1,
        label: sec.label,
        text: finalText,
        scenePrompt: combinedScene,
      });
    }
  }

  // Fallback si el usuario pegó un texto sin cabeceras numeradas (separado por párrafos)
  if (pages.length === 0) {
    const paragraphs = raw
      .replace(/\r\n/g, "\n")
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (paragraphs.length > 1 && !title) {
      title = cleanQuotes(paragraphs[0]);
      paragraphs.slice(1).forEach((p, idx) => {
        pages.push({
          pageNumber: idx + 1,
          text: p,
          scenePrompt: p,
        });
      });
    } else {
      paragraphs.forEach((p, idx) => {
        pages.push({
          pageNumber: idx + 1,
          text: p,
          scenePrompt: p,
        });
      });
    }
  }

  return {
    title,
    dedication,
    coverScenePrompt,
    pages,
  };
}
