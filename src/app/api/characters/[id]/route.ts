import { NextRequest, NextResponse } from "next/server";
import { generateBaseCharacter } from "@/lib/ai-pipeline";
import { deleteCharacter, getCharacterById, saveCharacter } from "@/lib/storage";
import { IllustrationStyleId } from "@/lib/types";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const existing = getCharacterById(id);
  if (!existing) {
    return NextResponse.json({ error: "Personaje no encontrado." }, { status: 404 });
  }

  const body = (await req.json()) as {
    name?: string;
    role?: string;
    ageOrNote?: string;
    styleId?: IllustrationStyleId;
    photoDataUrl?: string;
    regeneratePortrait?: boolean;
  };

  const updated = {
    ...existing,
    name: body.name?.trim() || existing.name,
    role: body.role?.trim() || existing.role,
    ageOrNote: body.ageOrNote !== undefined ? body.ageOrNote.trim() : existing.ageOrNote,
    styleId: body.styleId || existing.styleId,
    photoDataUrl: body.photoDataUrl !== undefined ? body.photoDataUrl : existing.photoDataUrl,
  };

  let warning: string | undefined;
  if (body.regeneratePortrait) {
    const gen = await generateBaseCharacter({
      name: updated.name,
      ageOrNote: updated.ageOrNote,
      styleId: updated.styleId,
      photoDataUrl: updated.photoDataUrl,
    });
    updated.baseIllustrationUrl = gen.illustrationUrl;
    warning = gen.warning;
  }

  saveCharacter(updated);
  return NextResponse.json({ character: updated, warning });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  deleteCharacter(id);
  return NextResponse.json({ ok: true });
}
