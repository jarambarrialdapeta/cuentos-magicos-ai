import { NextRequest, NextResponse } from "next/server";
import { generateStoryScript } from "@/lib/ai-pipeline";
import {
  BookFormat,
  CharacterInput,
  ContentType,
  IllustrationStyleId,
  StoryLanguage,
} from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      contentType?: ContentType;
      bookFormat?: BookFormat;
      styleId?: IllustrationStyleId;
      language?: StoryLanguage;
      characters: CharacterInput[];
      idea: string;
      dedication?: string;
      requestedPages?: number;
    };

    if (!body.characters?.length) {
      return NextResponse.json(
        { error: "Gutxienez pertsonaia bat aukeratu behar duzu." },
        { status: 400 }
      );
    }

    if (!body.idea?.trim()) {
      return NextResponse.json(
        { error: "Idatzi ipuinaren ideia edo laburpena." },
        { status: 400 }
      );
    }

    const requestedPages = Math.min(24, Math.max(2, Number(body.requestedPages) || 8));

    const script = await generateStoryScript({
      contentType: body.contentType || "narrativo",
      bookFormat: body.bookFormat || "mini",
      styleId: body.styleId || "watercolor",
      language: body.language || "eu",
      characters: body.characters,
      idea: body.idea.trim(),
      dedication: body.dedication?.trim(),
      requestedPages,
    });

    return NextResponse.json(script);
  } catch (err) {
    console.error("Draft script error:", err);
    return NextResponse.json(
      { error: "Errorea gertatu da gidoiaren zirriborroa sortzean." },
      { status: 500 }
    );
  }
}
