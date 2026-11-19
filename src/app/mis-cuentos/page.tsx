import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { BookOpen, Sparkles } from "lucide-react";
import { getAllStories } from "@/lib/storage";

async function StoriesGrid() {
  await connection();
  const stories = getAllStories();

  return (
    <div className="grid-3">
      {stories.map((story) => {
        const thumb =
          story.pages[0]?.imageUrl ||
          story.characters[0]?.baseIllustrationUrl ||
          "/images/hero-storybook.jpg";
        return (
          <article key={story.id} className="card">
            <div className="card-image-wrap">
              <img src={thumb} alt={story.title} />
            </div>
            <span className="tag">
              {story.contentType} · {story.pages.length} págs
            </span>
            <h2 style={{ fontSize: "1.3rem", marginBottom: 8 }}>{story.title}</h2>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem", marginBottom: 16 }}>
              Protagonistas: {story.characters.map((c) => c.name).join(", ")}
            </p>
            <Link href={`/cuento/${story.id}`} className="btn btn-secondary btn-sm">
              <BookOpen size={15} /> Abrir libro
            </Link>
          </article>
        );
      })}
    </div>
  );
}

export default function MisCuentosPage() {
  return (
    <div className="container section">
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 36,
        }}
      >
        <div>
          <h1 style={{ fontSize: "clamp(1.9rem, 3vw, 2.6rem)", marginBottom: 6 }}>
            Biblioteca de cuentos
          </h1>
          <p style={{ color: "var(--ink-muted)" }}>
            Todos tus cuentos creados y ejemplos listos para leer, editar o imprimir en PDF.
          </p>
        </div>
        <Link href="/crear" className="btn btn-primary">
          <Sparkles size={16} /> Nuevo cuento
        </Link>
      </div>

      <Suspense fallback={<p style={{ color: "var(--ink-muted)" }}>Cargando biblioteca...</p>}>
        <StoriesGrid />
      </Suspense>
    </div>
  );
}
