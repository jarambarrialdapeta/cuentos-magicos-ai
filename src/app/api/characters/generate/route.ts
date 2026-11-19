import { NextRequest, NextResponse } from "next/server";
import { generateBaseCharacter } from "@/lib/ai-pipeline";
import { IllustrationStyleId } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      name?: string;
      ageOrNote?: string;
      styleId?: IllustrationStyleId;
      photoDataUrl?: string;
    };

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "El nombre del protagonista es obligatorio." },
        { status: 400 }
      );
    }

    const result = await generateBaseCharacter({
      name: body.name.trim(),
      ageOrNote: body.ageOrNote?.trim() || "",
      styleId: body.styleId || "watercolor",
      photoDataUrl: body.photoDataUrl,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Character generation error:", err);
    return NextResponse.json(
      { error: "No se pudo generar el retrato del personaje." },
      { status: 500 }
    );
  }
}
