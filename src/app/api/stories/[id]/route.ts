import { NextRequest, NextResponse } from "next/server";
import { generateSingleSceneImage } from "@/lib/ai-pipeline";
import { deleteStory, getStoryById, saveStory } from "@/lib/storage";
import { StoryLanguage } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const story = getStoryById(id);
  if (!story) {
    return NextResponse.json({ error: "Cuento no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ story });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const story = getStoryById(id);
  if (!story) {
    return NextResponse.json({ error: "Cuento no encontrado." }, { status: 404 });
  }

  const body = (await req.json()) as {
    title?: string;
    dedication?: string;
    language?: StoryLanguage;
    pageNumber?: number;
    text?: string;
    scenePrompt?: string;
    imageUrl?: string;
    regenerateImage?: boolean;
  };

  if (typeof body.title === "string" && body.title.trim()) {
    story.title = body.title.trim();
  }
  if (typeof body.dedication === "string") {
    story.dedication = body.dedication.trim();
  }
  if (body.language) {
    story.language = body.language;
  }

  let warning: string | undefined;
  let imageMode: "ai" | "demo" | undefined;

  if (typeof body.pageNumber === "number") {
    const targetPage = story.pages.find((p) => p.pageNumber === body.pageNumber);
    if (targetPage) {
      if (typeof body.text === "string") targetPage.text = body.text.trim();
      if (typeof body.scenePrompt === "string") targetPage.scenePrompt = body.scenePrompt.trim();
      if (typeof body.imageUrl === "string") targetPage.imageUrl = body.imageUrl;

      if (body.regenerateImage) {
        const regen = await generateSingleSceneImage({
          scenePrompt: targetPage.scenePrompt || targetPage.text,
          styleId: story.styleId,
          characters: story.characters,
          fallbackIndex: targetPage.pageNumber,
        });
        targetPage.imageUrl = regen.imageUrl;
        warning = regen.warning;
        imageMode = regen.mode;
        if (regen.mode === "ai") {
          story.mode = "ai";
          delete story.aiWarning;
        } else if (regen.warning) {
          story.aiWarning = regen.warning;
        }
      }
    }
  }

  saveStory(story);
  return NextResponse.json({ story, warning, imageMode });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  deleteStory(id);
  return NextResponse.json({ ok: true });
}
