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

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

async function callGeminiImage(params: {
  apiKey: string;
  prompt: string;
  referenceImageDataUrls?: string[];
}): Promise<{ imageUrl: string | null; error?: string }> {
  const parts: Array<
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
  > = [];

  for (const ref of params.referenceImageDataUrls || []) {
    const parsed = parseDataUrl(ref);
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

  if (!res.ok) {
    const errText = await res.text();
    console.error("Gemini image error:", res.status, errText);
    if (res.status === 429) {
      return {
        imageUrl: null,
        error:
          "Tu API Key de Gemini no tiene cuota de imágenes activa en el plan gratuito (error 429). Activa la facturación en Google AI Studio para generar ilustraciones reales.",
      };
    }
    return { imageUrl: null, error: `Error Gemini Imagen (${res.status})` };
  }

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
  if (!imagePart?.inlineData?.data) {
    return { imageUrl: null, error: "Gemini no devolvió imagen en la respuesta." };
  }
  const mime = imagePart.inlineData.mimeType || "image/png";
  return { imageUrl: `data:${mime};base64,${imagePart.inlineData.data}` };
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
        referenceImageDataUrls: params.photoDataUrl ? [params.photoDataUrl] : [],
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
    illustrationUrl: style.previewImage || "/images/char-base.jpg",
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
      const prompt = `Eres un escritor galardonado de literatura ilustrada. Escribe un cuento íntegro en ${langLabel} de exactamente ${pageCount} páginas para formato "${format.title}" (${format.ageRange}) y categoría "${params.contentType}".
Personajes: ${charDesc}.
Idea o argumento: ${params.idea}.
Dedicatoria sugerida: ${params.dedication || mainChar.name}.

Devuelve JSON válido con esta estructura exacta:
{"title": string, "dedication": string, "pages": [{"pageNumber": number, "text": string, "scenePrompt": string}]}
IMPORTANTE: Todo el texto ("title", "dedication", "text") debe estar escrito en ${langLabel}. En "scenePrompt" describe la escena visual en inglés manteniendo exactamente la misma apariencia física y vestuario de cada personaje.`;

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
        warning = `Gemini texto respondió ${res.status}`;
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
      ? `${mainChar.name}-ren abentura magikoa`
      : `La gran aventura de ${mainChar.name}`;

  const dedication =
    params.dedication?.trim() ||
    (params.language === "eu"
      ? `${mainChar.name}-rentzat, beti ilusioz amesten jarrai dezazun.`
      : `Para ${mainChar.name}, protagonista de esta historia.`);

  const beatsEu = [
    {
      text: `Goiz hartan, ${mainChar.name} irribarretsu esnatu zen${companionText}. Bazekien abentura berezi bat hasteko eguna zela!`,
      scenePrompt: `${mainChar.name} smiling warmly ready for an adventure in morning light`,
    },
    {
      text: `Ideia hau buruan hartuta —«${params.idea.slice(0, 80)}»—, ${mainChar.name} bidezidor magiko batera hurbildu zen.`,
      scenePrompt: `${mainChar.name} walking along a magical forest path`,
    },
    {
      text: `Laster txoko zoragarri bat aurkitu zuen, argi txikiz eta ezustekoz betea.`,
      scenePrompt: `${mainChar.name} discovering glowing lanterns in a cozy village`,
    },
    {
      text: `Ilunabarrean, izarren azpian, ${mainChar.name}${companionText} poz-pozik itzuli zen etxera oroitzapen ahaztezin batekin.`,
      scenePrompt: `${mainChar.name} waving happily under a starry twilight sky`,
    },
  ];

  const beatsEs = [
    {
      text: `Aquella mañana, ${mainChar.name} se levantó con una gran sonrisa${companionText}. ¡Sabía que le esperaba una aventura inolvidable!`,
      scenePrompt: `${mainChar.name} smiling warmly ready for an adventure in morning light`,
    },
    {
      text: `Con esta idea en mente —«${params.idea.slice(0, 80)}»—, ${mainChar.name} emprendió el camino con ilusión.`,
      scenePrompt: `${mainChar.name} walking along a magical forest path`,
    },
    {
      text: `Pronto descubrió un rincón mágico lleno de luz y pequeños detalles escondidos.`,
      scenePrompt: `${mainChar.name} discovering glowing lanterns in a cozy village`,
    },
    {
      text: `Al caer la noche bajo las estrellas, ${mainChar.name}${companionText} volvió a casa con un recuerdo mágico para siempre.`,
      scenePrompt: `${mainChar.name} waving happily under a starry twilight sky`,
    },
  ];

  const beats = params.language === "eu" ? beatsEu : beatsEs;
  const pages = Array.from({ length: pageCount }, (_, i) => {
    const beat = beats[i % beats.length];
    return {
      pageNumber: i + 1,
      text: beat.text,
      scenePrompt: beat.scenePrompt,
    };
  });

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

  const refImages = params.characters
    .map((c) => c.baseIllustrationUrl || c.photoDataUrl)
    .filter((u): u is string => Boolean(u && u.startsWith("data:")));

  const charDetails = params.characters
    .map((c) => `${c.name}: ${c.ageOrNote || c.role}`)
    .join("; ");

  const demoPool = [
    params.characters[0]?.baseIllustrationUrl || "/images/char-base.jpg",
    "/images/scene-treehouse.jpg",
    style.previewImage,
    "/images/style-classic.jpg",
    "/images/hero-storybook.jpg",
  ];

  if (geminiKey) {
    const prompt =
      refImages.length > 0
        ? `Keep the exact same character appearance, face, hair, and clothing from the reference image(s). Characters: ${charDetails}. Place them in this scene: ${params.scenePrompt}. Style: ${style.promptModifier}`
        : `Storybook illustration with characters (${charDetails}). Scene: ${params.scenePrompt}. Style: ${style.promptModifier}`;

    const { imageUrl, error } = await callGeminiImage({
      apiKey: geminiKey,
      prompt,
      referenceImageDataUrls: refImages,
    });

    if (imageUrl) {
      return { imageUrl, mode: "ai" };
    }
    return {
      imageUrl: demoPool[(params.fallbackIndex || 0) % demoPool.length],
      mode: "demo",
      warning: error,
    };
  }

  return {
    imageUrl: demoPool[(params.fallbackIndex || 0) % demoPool.length],
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

    const res = await generateSingleSceneImage({
      scenePrompt: p.scenePrompt,
      styleId: params.styleId,
      characters: params.characters,
      fallbackIndex: i,
    });

    if (res.mode === "ai") usedAi = true;
    if (res.warning) lastWarning = res.warning;

    results.push({
      pageNumber: p.pageNumber,
      text: p.text,
      scenePrompt: p.scenePrompt,
      imageUrl: res.imageUrl,
    });
  }

  return { pages: results, mode: usedAi ? "ai" : "demo", warning: lastWarning };
}
