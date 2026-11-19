import { NextRequest, NextResponse } from "next/server";
import { getStoryById, saveStory } from "@/lib/storage";

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
    pageNumber?: number;
    text?: string;
  };

  if (typeof body.title === "string" && body.title.trim()) {
    story.title = body.title.trim();
  }
  if (typeof body.dedication === "string") {
    story.dedication = body.dedication.trim();
  }
  if (typeof body.pageNumber === "number" && typeof body.text === "string") {
    story.pages = story.pages.map((p) =>
      p.pageNumber === body.pageNumber ? { ...p, text: body.text!.trim() } : p
    );
  }

  saveStory(story);
  return NextResponse.json({ story });
}
