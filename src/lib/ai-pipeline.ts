import fs from "fs";
import path from "path";
import { BOOK_FORMATS, ILLUSTRATION_STYLES } from "./catalog";
import {
  BookFormat,
  CharacterInput,
  ContentType,
  IllustrationStyleId,
  StoryLanguage,
  StoryPage,
} from "./types";

interface GenerateCharacterResult {
  illustrationUrl: string;
  mode: "ai" | "demo";
  providerInfo: string;
  warning?: string;
}

const LANGUAGE_LABELS: Record<StoryLanguage, string> = {
  eu: "euskera (Basque)",
  es: "español",
  en: "English",
  fr: "français",
};

function resolveImageAsDataUrl(urlOrPath?: string): { mimeType: string; data: string } | null {
  if (!urlOrPath) return null;

  if (urlOrPath.startsWith("data:")) {
    const match = /^data:([^;]+);base64,(.+)$/.exec(urlOrPath);
    if (!match) return null;
    return { mimeType: match[1], data: match[2] };
  }

  if (urlOrPath.startsWith("/images/")) {
    try {
      const localPath = path.join(process.cwd(), "public", urlOrPath);
      if (fs.existsSync(localPath)) {
        const buf = fs.readFileSync(localPath);
        const ext = path.extname(localPath).toLowerCase();
        const mimeType = ext === ".png" ? "image/png" : "image/jpeg";
        return { mimeType, data: buf.toString("base64") };
      }
    } catch {
      return null;
    }
  }

  return null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callGeminiImage(params: {
  apiKey: string;
  prompt: string;
  referenceImages?: string[];
}): Promise<{ imageUrl: string | null; error?: string }> {
  const parts: Array<
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
  > = [];

  for (const ref of params.referenceImages || []) {
    const parsed = resolveImageAsDataUrl(ref);
    if (parsed) {
      parts.push({
        inlineData: {
          mimeType: parsed.mimeType,
          data: parsed.data,
        },
      });
    }
  }

  parts.push({ text: params.prompt });

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-nano-banana-2.1:generateContent?key=${params.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
          },
        }),
      }
    );

    if (res.ok) {
      const json = (await res.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              inlineData?: { mimeType?: string; data?: string };
            }>;
          };
        }>;
      };
      const imagePart = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      if (imagePart?.inlineData?.data) {
        const mime = imagePart.inlineData.mimeType || "image/png";
        return { imageUrl: `data:${mime};base64,${imagePart.inlineData.data}` };
      }
      return { imageUrl: null, error: "Gemini no devolvió imagen en la respuesta." };
    }

    const errText = await res.text();
    console.error("Gemini image error:", res.status, errText);

    if (res.status === 429) {
      if (errText.includes("limit: 0")) {
        return {
          imageUrl: null,
          error:
            "Tu API Key de Gemini tiene límite 0 para imágenes en el plan gratuito (Free Tier). Activa la facturación en Google AI Studio para generar ilustraciones reales.",
        };
      }
      if (attempt === 0) {
        await sleep(3000);
        continue;
      }
      return {
        imageUrl: null,
        error: "Límite temporal de peticiones de imagen en Gemini (429). Inténtalo en unos segundos.",
      };
    }

    return { imageUrl: null, error: `Error Gemini Imagen (${res.status})` };
  }

  return { imageUrl: null, error: "No se pudo generar la imagen con Gemini." };
}

export async function generateBaseCharacter(params: {
  name: string;
  ageOrNote: string;
  styleId: IllustrationStyleId;
  photoDataUrl?: string;
}): Promise<GenerateCharacterResult> {
  const style = ILLUSTRATION_STYLES.find((s) => s.id === params.styleId) ?? ILLUSTRATION_STYLES[0];
  const geminiKey = process.env.GEMINI_API_KEY;
  let warning: string | undefined;

  if (geminiKey) {
    try {
      const prompt = params.photoDataUrl
        ? `Transform the person in this reference photo into a clean children's storybook character portrait sheet of ${params.name} (${params.ageOrNote || "protagonist"}). Keep their exact facial features, hair and likeness, centered upper body, warm friendly expression, ${style.promptModifier}.`
        : `Create a clean children's storybook character portrait sheet of ${params.name} (${params.ageOrNote || "protagonist"}), centered upper body, warm friendly expression, ${style.promptModifier}.`;

      const { imageUrl, error } = await callGeminiImage({
        apiKey: geminiKey,
        prompt,
        referenceImages: params.photoDataUrl ? [params.photoDataUrl] : [],
      });

      if (imageUrl) {
        return {
          illustrationUrl: imageUrl,
          mode: "ai",
          providerInfo: "Gemini (gemini-nano-banana-2.1)",
        };
      }
      warning = error;
    } catch (err) {
      warning = err instanceof Error ? err.message : "Error conectando con Gemini";
    }
  }

  return {
    illustrationUrl: params.photoDataUrl || style.previewImage || "/images/char-base.jpg",
    mode: "demo",
    providerInfo: "Modo Demo",
    warning,
  };
}

export async function generateStoryScript(params: {
  contentType: ContentType;
  bookFormat: BookFormat;
  styleId: IllustrationStyleId;
  language: StoryLanguage;
  characters: CharacterInput[];
  idea: string;
  dedication?: string;
  requestedPages?: number;
}): Promise<{
  title: string;
  dedication: string;
  pages: { pageNumber: number; text: string; scenePrompt: string }[];
  mode: "ai" | "demo";
  warning?: string;
}> {
  const format = BOOK_FORMATS.find((f) => f.id === params.bookFormat) ?? BOOK_FORMATS[1];
  const pageCount = params.requestedPages || format.defaultPages;
  const mainChar = params.characters[0];
  const companion = params.characters[1];
  const geminiKey = process.env.GEMINI_API_KEY;
  const langLabel = LANGUAGE_LABELS[params.language] || "español";
  let warning: string | undefined;

  const charDesc = params.characters
    .map((c) => `${c.name} (${c.role}${c.ageOrNote ? `, ${c.ageOrNote}` : ""})`)
    .join("; ");

  if (geminiKey) {
    try {
      const prompt = `Eres un escritor galardonado de literatura ilustrada infantil.
Escribe un cuento COHERENTE con principio, desarrollo, clímax y final en ${langLabel} de exactamente ${pageCount} páginas para formato "${format.title}" (${format.ageRange}) y categoría "${params.contentType}".
Personajes obligatorios: ${charDesc}.
Argumento / idea del usuario: ${params.idea}.
Dedicatoria sugerida: ${params.dedication || mainChar.name}.

Devuelve JSON válido con esta estructura exacta:
{"title": string, "dedication": string, "pages": [{"pageNumber": number, "text": string, "scenePrompt": string}]}

Reglas estrictas:
1. Cada página debe continuar lógicamente la historia de la página anterior.
2. Todo ("title", "dedication", "text") debe estar escrito en ${langLabel} natural y rico.
3. En "scenePrompt", describe en inglés la escena visual concreta de ESA página incluyendo los rasgos físicos/ropa exactos de los personajes que aparecen en ella.`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (res.ok) {
        const json = (await res.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText) as {
            title: string;
            dedication: string;
            pages: { pageNumber: number; text: string; scenePrompt: string }[];
          };
          return { ...parsed, mode: "ai" };
        }
      } else {
        const t = await res.text();
        console.error("Gemini script error:", res.status, t);
        warning = `No se pudo generar el guion con Gemini (${res.status}).`;
      }
    } catch (err) {
      warning = err instanceof Error ? err.message : "Error generando guion con Gemini";
    }
  }

  const companionText = companion
    ? params.language === "eu"
      ? ` ${companion.name}-rekin batera`
      : ` junto a ${companion.name}`
    : "";

  const title =
    params.language === "eu"
      ? `${mainChar.name}-ren abentura`
      : `La aventura de ${mainChar.name}`;

  const dedication =
    params.dedication?.trim() ||
    (params.language === "eu"
      ? `${mainChar.name}-rentzat, maitasun osoz.`
      : `Para ${mainChar.name}, con todo cariño.`);

  const pages = Array.from({ length: pageCount }, (_, i) => ({
    pageNumber: i + 1,
    text:
      params.language === "eu"
        ? `${i + 1}. orrialdea — ${mainChar.name}${companionText}: ${params.idea.slice(0, 120)}`
        : `Página ${i + 1} — ${mainChar.name}${companionText}: ${params.idea.slice(0, 120)}`,
    scenePrompt: `${mainChar.name} in scene ${i + 1}: ${params.idea}`,
  }));

  return { title, dedication, pages, mode: "demo", warning };
}

export async function generateSingleSceneImage(params: {
  scenePrompt: string;
  styleId: IllustrationStyleId;
  characters: CharacterInput[];
  fallbackIndex?: number;
}): Promise<{ imageUrl: string; mode: "ai" | "demo"; warning?: string }> {
  const style = ILLUSTRATION_STYLES.find((s) => s.id === params.styleId) ?? ILLUSTRATION_STYLES[0];
  const geminiKey = process.env.GEMINI_API_KEY;

  // Priorizar foto real o retrato IA (data:) antes que rutas de ejemplo
  const refImages = params.characters
    .map((c) => {
      if (c.baseIllustrationUrl?.startsWith("data:")) return c.baseIllustrationUrl;
      if (c.photoDataUrl?.startsWith("data:")) return c.photoDataUrl;
      return c.baseIllustrationUrl;
    })
    .filter((u): u is string => Boolean(u));

  const charDetails = params.characters
    .map((c) => `${c.name}: ${c.ageOrNote || c.role}`)
    .join("; ");

  const consistentFallback =
    params.characters[0]?.photoDataUrl ||
    params.characters[0]?.baseIllustrationUrl ||
    style.previewImage;

  if (geminiKey) {
    const prompt =
      refImages.length > 0
        ? `Keep the exact same character appearance, face, hair, and clothing from the reference image(s). Characters: ${charDetails}. Place them in this storybook scene: ${params.scenePrompt}. Style: ${style.promptModifier}`
        : `Children's storybook illustration with characters (${charDetails}). Scene: ${params.scenePrompt}. Style: ${style.promptModifier}`;

    const { imageUrl, error } = await callGeminiImage({
      apiKey: geminiKey,
      prompt,
      referenceImages: refImages,
    });

    if (imageUrl) {
      return { imageUrl, mode: "ai" };
    }
    return {
      imageUrl: consistentFallback,
      mode: "demo",
      warning: error,
    };
  }

  return {
    imageUrl: consistentFallback,
    mode: "demo",
  };
}

export async function generateConsistentStoryPages(params: {
  pages: { pageNumber: number; text: string; scenePrompt: string; imageUrl?: string }[];
  styleId: IllustrationStyleId;
  characters: CharacterInput[];
}): Promise<{ pages: StoryPage[]; mode: "ai" | "demo"; warning?: string }> {
  const results: StoryPage[] = [];
  let usedAi = false;
  let lastWarning: string | undefined;
  let quotaBlocked = false;

  for (let i = 0; i < params.pages.length; i++) {
    const p = params.pages[i];
    if (p.imageUrl) {
      results.push({
        pageNumber: p.pageNumber,
        text: p.text,
        scenePrompt: p.scenePrompt,
        imageUrl: p.imageUrl,
      });
      continue;
    }

    if (quotaBlocked) {
      const fallback =
        params.characters[0]?.photoDataUrl ||
        params.characters[0]?.baseIllustrationUrl ||
        "/images/char-base.jpg";
      results.push({
        pageNumber: p.pageNumber,
        text: p.text,
        scenePrompt: p.scenePrompt,
        imageUrl: fallback,
      });
      continue;
    }

    const res = await generateSingleSceneImage({
      scenePrompt: p.scenePrompt,
      styleId: params.styleId,
      characters: params.characters,
      fallbackIndex: i,
    });

    if (res.mode === "ai") {
      usedAi = true;
      // Pequeña pausa entre páginas para evitar rate-limit 429
      if (i < params.pages.length - 1) await sleep(800);
    } else if (res.warning) {
      lastWarning = res.warning;
      if (res.warning.includes("límite 0")) {
        quotaBlocked = true;
      }
    }

    results.push({
      pageNumber: p.pageNumber,
      text: p.text,
      scenePrompt: p.scenePrompt,
      imageUrl: res.imageUrl,
    });
  }

  return { pages: results, mode: usedAi ? "ai" : "demo", warning: lastWarning };
}
