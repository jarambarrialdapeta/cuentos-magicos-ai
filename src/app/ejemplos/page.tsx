import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";
import { getAllStories } from "@/lib/storage";

export default function EjemplosPage() {
  const stories = getAllStories().filter((s) => s.id.startsWith("ejemplo-"));

  return (
    <div className="container section">
      <div className="section-header">
        <h1>Ipuin ilustratuen adibideak</h1>
        <p>
          Arakatu istorio osoak irakurle interaktiboarekin, entzun audio-narrazioa eta ikusi nola
          mantentzen den protagonistaren koherentzia.
        </p>
      </div>

      <div className="grid-2">
        {stories.map((story) => {
          const thumb =
            story.coverImageUrl ||
            story.pages[0]?.imageUrl ||
            story.characters[0]?.baseIllustrationUrl ||
            "/images/hero-storybook.jpg";
          return (
            <article key={story.id} className="card">
              <div className="card-image-wrap">
                <img src={thumb} alt={story.title} />
              </div>
              <span className="tag">{story.contentType}</span>
              <h2 style={{ fontSize: "1.5rem", marginBottom: 8 }}>{story.title}</h2>
              <p style={{ color: "var(--ink-muted)", marginBottom: 18 }}>
                {story.dedication}
              </p>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Link href={`/cuento/${story.id}`} className="btn btn-primary btn-sm">
                  <BookOpen size={15} /> Ipuina irakurri
                </Link>
                <span style={{ fontSize: "0.85rem", color: "var(--ink-muted)" }}>
                  {story.pages.length} orrialde
                </span>
              </div>
            </article>
          );
        })}
      </div>

      <div style={{ textAlign: "center", marginTop: 48 }}>
        <Link href="/crear" className="btn btn-primary btn-lg">
          <Sparkles size={18} /> Nire ipuina sortu
        </Link>
      </div>
    </div>
  );
}
