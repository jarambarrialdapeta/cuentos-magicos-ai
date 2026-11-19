import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getStoryById } from "@/lib/storage";
import { StoryReaderClient } from "@/components/StoryReaderClient";

async function StoryLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const story = getStoryById(id);

  if (!story) {
    notFound();
  }

  return <StoryReaderClient initialStory={story} />;
}

export default function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="container reader-shell">
          <p style={{ color: "var(--ink-muted)" }}>Zure ipuina irekitzen...</p>
        </div>
      }
    >
      <StoryLoader params={params} />
    </Suspense>
  );
}
