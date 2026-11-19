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
} from "@/lib/types";

export async function GET() {
  const stories = getAllStories();
  return NextResponse.json({ stories });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      contentType: ContentType;
      bookFormat: BookFormat;
      styleId: IllustrationStyleId;
      characters: CharacterInput[];
      idea: string;
      dedication?: string;
    };

    if (!body.characters?.length || !body.characters[0]?.name?.trim()) {
      return NextResponse.json(
        { error: "Debes incluir al menos un protagonista con nombre." },
        { status: 400 }
      );
    }

    if (!body.idea?.trim()) {
      return NextResponse.json(
        { error: "Describe una idea o elige una plantilla para la historia." },
        { status: 400 }
      );
    }

    const mainChar = body.characters[0];
    let baseIllustrationUrl = mainChar.baseIllustrationUrl;

    if (!baseIllustrationUrl) {
      const charRes = await generateBaseCharacter({
        name: mainChar.name,
        ageOrNote: mainChar.ageOrNote,
        styleId: body.styleId,
        photoDataUrl: mainChar.photoDataUrl,
      });
      baseIllustrationUrl = charRes.illustrationUrl;
    }

    const updatedCharacters: CharacterInput[] = body.characters.map((c, i) => ({
      id: c.id || `char-${i + 1}`,
      name: c.name.trim(),
      role: c.role?.trim() || (i === 0 ? "Protagonista" : "Acompañante"),
      ageOrNote: c.ageOrNote?.trim() || "",
      baseIllustrationUrl: i === 0 ? baseIllustrationUrl : c.baseIllustrationUrl,
    }));

    const script = await generateStoryScript({
      contentType: body.contentType || "narrativo",
      bookFormat: body.bookFormat || "mini",
      styleId: body.styleId || "watercolor",
      characters: updatedCharacters,
      idea: body.idea.trim(),
      dedication: body.dedication,
    });

    const pagesResult = await generateConsistentStoryPages({
      pages: script.pages,
      styleId: body.styleId || "watercolor",
      baseCharacterUrl: baseIllustrationUrl,
    });

    const id = `cuento-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const story: Story = {
      id,
      title: script.title,
      dedication: script.dedication,
      contentType: body.contentType || "narrativo",
      bookFormat: body.bookFormat || "mini",
      styleId: body.styleId || "watercolor",
      characters: updatedCharacters,
      pages: pagesResult.pages,
      mode: script.mode === "ai" || pagesResult.mode === "ai" ? "ai" : "demo",
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
