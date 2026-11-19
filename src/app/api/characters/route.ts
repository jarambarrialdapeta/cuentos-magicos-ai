import { NextRequest, NextResponse } from "next/server";
import { generateBaseCharacter } from "@/lib/ai-pipeline";
import { getAllCharacters, saveCharacter } from "@/lib/storage";
import { CharacterProfile, IllustrationStyleId } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ characters: getAllCharacters() });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      name?: string;
      role?: string;
      ageOrNote?: string;
      styleId?: IllustrationStyleId;
      photoDataUrl?: string;
      saveToLibrary?: boolean;
    };

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "El nombre del personaje es obligatorio." },
        { status: 400 }
      );
    }

    const styleId = body.styleId || "watercolor";
    const gen = await generateBaseCharacter({
      name: body.name.trim(),
      ageOrNote: body.ageOrNote?.trim() || "",
      styleId,
      photoDataUrl: body.photoDataUrl,
    });

    const profile: CharacterProfile = {
      id: `char-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      name: body.name.trim(),
      role: body.role?.trim() || "Protagonista",
      ageOrNote: body.ageOrNote?.trim() || "",
      styleId,
      photoDataUrl: body.photoDataUrl,
      baseIllustrationUrl: gen.illustrationUrl,
      createdAt: new Date().toISOString(),
    };

    if (body.saveToLibrary !== false) {
      saveCharacter(profile);
    }

    return NextResponse.json({
      character: profile,
      mode: gen.mode,
      providerInfo: gen.providerInfo,
      warning: gen.warning,
    });
  } catch (err) {
    console.error("POST /api/characters error:", err);
    return NextResponse.json({ error: "No se pudo crear el personaje." }, { status: 500 });
  }
}
