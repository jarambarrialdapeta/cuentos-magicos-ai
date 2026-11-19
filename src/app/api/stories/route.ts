import { NextRequest, NextResponse } from "next/server";
import {
  generateBaseCharacter,
  generateConsistentStoryPages,
  generateStoryScript,
} from "@/lib/ai-pipeline";
import { getAllStories, saveStory } from "@/lib/storage";
import {
  BookFormat,
  CharacterInput,
  ContentType,
  IllustrationStyleId,
  Story,
  StoryLanguage,
} from "@/lib/types";

export async function GET() {
  const stories = getAllStories();
  return NextResponse.json({ stories });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      title?: string;
      dedication?: string;
      language?: StoryLanguage;
      contentType: ContentType;
      bookFormat: BookFormat;
      styleId: IllustrationStyleId;
      characters: CharacterInput[];
      idea?: string;
      requestedPages?: number;
      skipImages?: boolean;
      customPages?: { pageNumber: number; text: string; scenePrompt: string; imageUrl?: string }[];
    };

    if (!body.characters?.length || !body.characters[0]?.name?.trim()) {
      return NextResponse.json(
        { error: "Debes incluir al menos un personaje con nombre." },
        { status: 400 }
      );
    }

    const hasCustomPages = Array.isArray(body.customPages) && body.customPages.length > 0;
    if (!hasCustomPages && !body.idea?.trim()) {
      return NextResponse.json(
        { error: "Escribe una idea o añade las páginas de tu guion." },
        { status: 400 }
      );
    }

    const styleId = body.styleId || "watercolor";
    const language = body.language || "es";
    const warnings: string[] = [];

    // Asegurar retrato base para el protagonista si no tiene aún
    const updatedCharacters: CharacterInput[] = [];
    for (let i = 0; i < body.characters.length; i++) {
      const c = body.characters[i];
      if (!c.name.trim()) continue;
      let baseIllustrationUrl = c.baseIllustrationUrl;
      if (!baseIllustrationUrl && i === 0) {
        const charRes = await generateBaseCharacter({
          name: c.name,
          ageOrNote: c.ageOrNote,
          styleId,
          photoDataUrl: c.photoDataUrl,
        });
        baseIllustrationUrl = charRes.illustrationUrl;
        if (charRes.warning) warnings.push(charRes.warning);
      }
      updatedCharacters.push({
        id: c.id || `char-${i + 1}`,
        name: c.name.trim(),
        role: c.role?.trim() || (i === 0 ? "Protagonista" : "Acompañante"),
        ageOrNote: c.ageOrNote?.trim() || "",
        photoDataUrl: c.photoDataUrl,
        baseIllustrationUrl,
      });
    }

    let finalTitle = body.title?.trim() || "";
    let finalDedication = body.dedication?.trim() || "";
    let scriptPages: { pageNumber: number; text: string; scenePrompt: string; imageUrl?: string }[] = [];
    let scriptMode: "ai" | "demo" = "demo";

    if (hasCustomPages) {
      finalTitle = finalTitle || `Cuento de ${updatedCharacters[0].name}`;
      finalDedication = finalDedication || `Para ${updatedCharacters[0].name}.`;
      scriptPages = body.customPages!.map((p, idx) => ({
        pageNumber: idx + 1,
        text: p.text.trim(),
        scenePrompt: p.scenePrompt.trim() || p.text.trim(),
        imageUrl: p.imageUrl,
      }));
      scriptMode = "ai";
    } else {
      const script = await generateStoryScript({
        contentType: body.contentType || "narrativo",
        bookFormat: body.bookFormat || "mini",
        styleId,
        language,
        characters: updatedCharacters,
        idea: body.idea!.trim(),
        dedication: finalDedication,
        requestedPages: body.requestedPages,
      });
      finalTitle = finalTitle || script.title;
      finalDedication = finalDedication || script.dedication;
      scriptPages = script.pages;
      scriptMode = script.mode;
      if (script.warning) warnings.push(script.warning);
    }

    const fallbackThumb =
      updatedCharacters[0]?.photoDataUrl ||
      updatedCharacters[0]?.baseIllustrationUrl ||
      "/images/char-base.jpg";

    const pagesResult = body.skipImages
      ? {
          pages: scriptPages.map((p) => ({
            pageNumber: p.pageNumber,
            text: p.text,
            scenePrompt: p.scenePrompt,
            imageUrl: p.imageUrl || fallbackThumb,
          })),
          mode: "demo" as const,
          warning: undefined,
        }
      : await generateConsistentStoryPages({
          pages: scriptPages,
          styleId,
          characters: updatedCharacters,
        });
    if (pagesResult.warning) warnings.push(pagesResult.warning);

    const id = `cuento-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const story: Story = {
      id,
      title: finalTitle,
      dedication: finalDedication,
      language,
      contentType: body.contentType || "narrativo",
      bookFormat: body.bookFormat || "mini",
      styleId,
      characters: updatedCharacters,
      pages: pagesResult.pages,
      mode: scriptMode === "ai" && pagesResult.mode === "ai" ? "ai" : "demo",
      aiWarning: warnings[0],
      createdAt: new Date().toISOString(),
    };

    saveStory(story);

    return NextResponse.json({ story }, { status: 201 });
  } catch (err) {
    console.error("Story creation error:", err);
    return NextResponse.json(
      { error: "Ocurrió un error al generar el cuento." },
      { status: 500 }
    );
  }
}
