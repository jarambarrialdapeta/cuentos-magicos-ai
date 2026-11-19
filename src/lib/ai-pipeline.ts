import { BOOK_FORMATS, ILLUSTRATION_STYLES } from "./catalog";
import { BookFormat, CharacterInput, ContentType, IllustrationStyleId, StoryPage } from "./types";

interface GenerateCharacterResult {
  illustrationUrl: string;
  mode: "ai" | "demo";
  providerInfo: string;
}

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

async function callGeminiImage(params: {
  apiKey: string;
  prompt: string;
  referenceImageDataUrl?: string;
}): Promise<string | null> {
  const parts: Array<
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
  > = [];

  if (params.referenceImageDataUrl) {
    const parsed = parseDataUrl(params.referenceImageDataUrl);
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
    console.error("Gemini image error:", res.status, await res.text());
    return null;
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
  if (!imagePart?.inlineData?.data) return null;
  const mime = imagePart.inlineData.mimeType || "image/png";
  return `data:${mime};base64,${imagePart.inlineData.data}`;
}

/**
 * Paso 1 del pipeline de consistencia:
 * Convierte la foto real del usuario en un retrato ilustrado base (Character Sheet)
 * Prioridad: GEMINI_API_KEY (gemini-2.5-flash-image) -> FAL_KEY (flux-pulid) -> Demo.
 */
export async function generateBaseCharacter(params: {
  name: string;
  ageOrNote: string;
  styleId: IllustrationStyleId;
  photoDataUrl?: string;
}): Promise<GenerateCharacterResult> {
  const style = ILLUSTRATION_STYLES.find((s) => s.id === params.styleId) ?? ILLUSTRATION_STYLES[0];
  const geminiKey = process.env.GEMINI_API_KEY;
  const falKey = process.env.FAL_KEY;

  if (geminiKey) {
    try {
      const prompt = params.photoDataUrl
        ? `Transform the person in this reference photo into a clean children's storybook character portrait sheet of ${params.name} (${params.ageOrNote || "protagonist"}). Keep their exact facial features, hair and likeness, centered upper body, warm friendly expression, ${style.promptModifier}.`
        : `Create a clean children's storybook character portrait sheet of ${params.name} (${params.ageOrNote || "protagonist"}), centered upper body, warm friendly expression, ${style.promptModifier}.`;

      const img = await callGeminiImage({
        apiKey: geminiKey,
        prompt,
        referenceImageDataUrl: params.photoDataUrl,
      });

      if (img) {
        return {
          illustrationUrl: img,
          mode: "ai",
          providerInfo: "Gemini (gemini-nano-banana-2.1)",
        };
      }
    } catch (err) {
      console.error("Error calling Gemini image for character, trying fallback:", err);
    }
  }

  if (falKey && params.photoDataUrl) {
    try {
      const prompt = `Character portrait sheet of ${params.name} (${params.ageOrNote || "child protagonist"}), centered upper body, friendly warm smile, ${style.promptModifier}`;
      const res = await fetch("https://fal.run/fal-ai/flux-pulid", {
        method: "POST",
        headers: {
          Authorization: `Key ${falKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          reference_image_url: params.photoDataUrl,
          image_size: "square_hd",
          id_weight: 1.0,
          num_inference_steps: 20,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { images?: { url: string }[] };
        const url = data.images?.[0]?.url;
        if (url) {
          return {
            illustrationUrl: url,
            mode: "ai",
            providerInfo: "fal-ai/flux-pulid",
          };
        }
      }
    } catch (err) {
      console.error("Error calling fal-ai/flux-pulid, falling back to demo:", err);
    }
  }

  return {
    illustrationUrl: style.previewImage || "/images/char-base.jpg",
    mode: "demo",
    providerInfo: "Modo Demo (añade GEMINI_API_KEY en .env.local para generación real)",
  };
}

/**
 * Paso 2: Genera el guion página por página.
 * Prioridad: GEMINI_API_KEY (gemini-2.5-flash) -> OPENAI_API_KEY -> Demo.
 */
export async function generateStoryScript(params: {
  contentType: ContentType;
  bookFormat: BookFormat;
  styleId: IllustrationStyleId;
  characters: CharacterInput[];
  idea: string;
  dedication?: string;
}): Promise<{
  title: string;
  dedication: string;
  pages: { pageNumber: number; text: string; scenePrompt: string }[];
  mode: "ai" | "demo";
}> {
  const format = BOOK_FORMATS.find((f) => f.id === params.bookFormat) ?? BOOK_FORMATS[1];
  const mainChar = params.characters[0];
  const companion = params.characters[1];
  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  const charDesc = params.characters
    .map((c) => `${c.name} (${c.role}${c.ageOrNote ? `, ${c.ageOrNote}` : ""})`)
    .join("; ");

  if (geminiKey) {
    try {
      const prompt = `Eres un escritor galardonado de literatura ilustrada. Escribe un cuento en español de exactamente ${format.defaultPages} páginas para formato "${format.title}" (${format.ageRange}) y categoría "${params.contentType}".
Personajes: ${charDesc}.
Idea de la historia: ${params.idea}.
Dedicatoria sugerida: ${params.dedication || `Para ${mainChar.name}`}.

Devuelve JSON válido con esta estructura exacta:
{"title": string, "dedication": string, "pages": [{"pageNumber": number, "text": string, "scenePrompt": string}]}
En scenePrompt describe la escena visual en inglés manteniendo exactamente la misma apariencia y vestuario de los personajes.`;

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
      }
    } catch (err) {
      console.error("Gemini script error, trying fallback:", err);
    }
  }

  if (openAiKey) {
    try {
      const systemPrompt = `Eres un escritor galardonado de literatura ilustrada. Escribe un cuento en español de exactamente ${format.defaultPages} páginas para formato "${format.title}" (${format.ageRange}) y categoría "${params.contentType}". Responde SOLO con JSON válido con la estructura: {"title": string, "dedication": string, "pages": [{"pageNumber": number, "text": string, "scenePrompt": string}]}. En scenePrompt describe la escena visual en inglés manteniendo exactamente la misma apariencia y vestuario de los personajes.`;

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Personajes: ${charDesc}. Idea de la historia: ${params.idea}. Dedicatoria sugerida: ${params.dedication || `Para ${mainChar.name}`}.`,
            },
          ],
        }),
      });

      if (res.ok) {
        const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const rawContent = json.choices?.[0]?.message?.content;
        if (rawContent) {
          const parsed = JSON.parse(rawContent) as {
            title: string;
            dedication: string;
            pages: { pageNumber: number; text: string; scenePrompt: string }[];
          };
          return { ...parsed, mode: "ai" };
        }
      }
    } catch (err) {
      console.error("OpenAI error, using template script generator:", err);
    }
  }

  const companionText = companion ? ` junto a ${companion.name}` : "";
  const title = `La gran aventura de ${mainChar.name}`;
  const dedication =
    params.dedication?.trim() ||
    `Para ${mainChar.name}, protagonista de esta historia y de muchas más por venir.`;

  const baseBeats = [
    {
      text: `Aquella mañana comenzó de forma distinta para ${mainChar.name}. Con la mochila lista y una gran sonrisa${companionText}, sabía que hoy le esperaba algo extraordinario.`,
      scenePrompt: `${mainChar.name} preparing for an adventure with a warm smile, morning light`,
    },
    {
      text: `Siguiendo la pista de su idea —"${params.idea.slice(0, 95)}"—, ${mainChar.name} cruzó un sendero antiguo donde cada paso parecía despertar un pequeño brillo en el aire.`,
      scenePrompt: `${mainChar.name} walking across a mossy bridge toward a glowing village`,
    },
    {
      text: `Pronto descubrió un rincón mágico lleno de farolillos y detalles escondidos. ${companion ? `${companion.name} miraba asombrado cada rincón mientras exploraban juntos.` : "Cada rincón guardaba una pista nueva por descubrir."}`,
      scenePrompt: `${mainChar.name} discovering warm glowing lanterns in an enchanted forest`,
    },
    {
      text: `En lo más alto del camino apareció el corazón de la aventura. ${mainChar.name} comprendió que la verdadera magia no estaba en el mapa, sino en atreverse a dar el primer paso.`,
      scenePrompt: `${mainChar.name} looking through a brass telescope at a magical horizon`,
    },
    {
      text: `De vuelta a casa bajo un cielo lleno de estrellas, ${mainChar.name}${companionText} guardó el recuerdo de aquel día como el tesoro más bonito de su estantería.`,
      scenePrompt: `${mainChar.name} walking home under a starry sky with warm lantern light`,
    },
  ];

  const pages = Array.from({ length: format.defaultPages }, (_, i) => {
    const beat = baseBeats[i % baseBeats.length];
    return {
      pageNumber: i + 1,
      text: beat.text,
      scenePrompt: beat.scenePrompt,
    };
  });

  return { title, dedication, pages, mode: "demo" };
}

/**
 * Paso 3: Genera la ilustración de cada página usando la ilustración base del personaje
 * como referencia fija para mantener consistencia facial y de estilo.
 * Prioridad: GEMINI_API_KEY (gemini-2.5-flash-image) -> FAL_KEY (flux-pro/kontext) -> Demo.
 */
export async function generateConsistentStoryPages(params: {
  pages: { pageNumber: number; text: string; scenePrompt: string }[];
  styleId: IllustrationStyleId;
  baseCharacterUrl?: string;
}): Promise<{ pages: StoryPage[]; mode: "ai" | "demo" }> {
  const style = ILLUSTRATION_STYLES.find((s) => s.id === params.styleId) ?? ILLUSTRATION_STYLES[0];
  const geminiKey = process.env.GEMINI_API_KEY;
  const falKey = process.env.FAL_KEY;
  const demoImages = [
    params.baseCharacterUrl || "/images/char-base.jpg",
    "/images/scene-treehouse.jpg",
    style.previewImage,
    "/images/style-classic.jpg",
    "/images/hero-storybook.jpg",
  ];

  if (geminiKey) {
    const results: StoryPage[] = [];
    let usedAi = false;

    for (let i = 0; i < params.pages.length; i++) {
      const p = params.pages[i];
      let imageUrl = demoImages[i % demoImages.length];

      try {
        const prompt = params.baseCharacterUrl?.startsWith("data:")
          ? `Keep the exact same character appearance, face, hair, and clothing from the reference character portrait. Place them in this storybook scene: ${p.scenePrompt}. Style: ${style.promptModifier}`
          : `Storybook illustration scene: ${p.scenePrompt}. Style: ${style.promptModifier}`;

        const generated = await callGeminiImage({
          apiKey: geminiKey,
          prompt,
          referenceImageDataUrl: params.baseCharacterUrl,
        });

        if (generated) {
          imageUrl = generated;
          usedAi = true;
        }
      } catch (err) {
        console.error(`Error generating Gemini page ${p.pageNumber}:`, err);
      }

      results.push({ ...p, imageUrl });
    }

    return { pages: results, mode: usedAi ? "ai" : "demo" };
  }

  if (falKey && params.baseCharacterUrl && params.baseCharacterUrl.startsWith("http")) {
    const results: StoryPage[] = [];
    let usedAi = false;

    for (let i = 0; i < params.pages.length; i++) {
      const p = params.pages[i];
      let imageUrl = demoImages[i % demoImages.length];

      try {
        const res = await fetch("https://fal.run/fal-ai/flux-pro/kontext", {
          method: "POST",
          headers: {
            Authorization: `Key ${falKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: `Keep the exact same character appearance, face, hair and outfit from the reference image. Place them in this scene: ${p.scenePrompt}. Style: ${style.promptModifier}`,
            image_url: params.baseCharacterUrl,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { images?: { url: string }[] };
          if (data.images?.[0]?.url) {
            imageUrl = data.images[0].url;
            usedAi = true;
          }
        }
      } catch (err) {
        console.error(`Error generating page ${p.pageNumber}:`, err);
      }

      results.push({ ...p, imageUrl });
    }

    return { pages: results, mode: usedAi ? "ai" : "demo" };
  }

  return {
    pages: params.pages.map((p, idx) => ({
      ...p,
      imageUrl: demoImages[idx % demoImages.length],
    })),
    mode: "demo",
  };
}
