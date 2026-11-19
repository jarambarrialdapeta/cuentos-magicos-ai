"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Edit3,
  Printer,
  Square,
  Volume2,
} from "lucide-react";
import { Story } from "@/lib/types";

export function StoryReaderClient({ initialStory }: { initialStory: Story }) {
  const [story, setStory] = useState<Story>(initialStory);
  const [currentIndex, setCurrentIndex] = useState(0); // 0 = portada/dedicatoria, 1..N = páginas
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(initialStory.title);
  const [draftDedication, setDraftDedication] = useState(initialStory.dedication);
  const [draftPageText, setDraftPageText] = useState("");
  const [saving, setSaving] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const totalViews = story.pages.length + 1;
  const activePage = currentIndex > 0 ? story.pages[currentIndex - 1] : null;

  useEffect(() => {
    if (activePage) {
      setDraftPageText(activePage.text);
    }
  }, [activePage]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const speakFromIndex = (index: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const textToRead =
      index === 0
        ? `${story.title}. ${story.dedication}`
        : story.pages[index - 1]?.text || "";

    if (!textToRead) {
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = "es-ES";
    utterance.rate = 0.96;
    utterance.onend = () => {
      if (index + 1 < totalViews) {
        setCurrentIndex(index + 1);
        speakFromIndex(index + 1);
      } else {
        setIsSpeaking(false);
      }
    };
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const toggleAudio = () => {
    if (isSpeaking) {
      stopSpeech();
    } else {
      speakFromIndex(currentIndex);
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const payload =
        currentIndex === 0
          ? { title: draftTitle, dedication: draftDedication }
          : { pageNumber: activePage?.pageNumber, text: draftPageText };

      const res = await fetch(`/api/stories/${story.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = (await res.json()) as { story: Story };
        setStory(data.story);
        setIsEditing(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const coverImage =
    story.characters[0]?.baseIllustrationUrl ||
    story.pages[0]?.imageUrl ||
    "/images/hero-storybook.jpg";

  return (
    <div className="container reader-shell">
      {story.mode === "demo" && (
        <div className="notice-banner no-print">
          <strong>Modo Demo activo:</strong> Este cuento usa ilustraciones de demostración.
          Para generar imágenes reales de tu foto y guiones personalizados con IA, añade tu{" "}
          <code>GEMINI_API_KEY</code> en <code>.env.local</code>.
        </div>
      )}

      {/* Toolbar */}
      <div className="reader-toolbar no-print">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/mis-cuentos" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} /> Biblioteca
          </Link>
          <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>
            {currentIndex === 0
              ? "Portada y dedicatoria"
              : `Página ${activePage?.pageNumber} de ${story.pages.length}`}
          </span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button
            type="button"
            className={`btn btn-sm ${isSpeaking ? "btn-primary" : "btn-secondary"}`}
            onClick={toggleAudio}
          >
            {isSpeaking ? <Square size={15} /> : <Volume2 size={15} />}
            {isSpeaking ? "Detener narración" : "Escuchar narración"}
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsEditing((v) => !v)}
          >
            <Edit3 size={15} />
            {isEditing ? "Cancelar edición" : "Editar página"}
          </button>

          <button
            type="button"
            className="btn btn-forest btn-sm"
            onClick={() => window.print()}
          >
            <Printer size={15} />
            Descargar / Imprimir PDF
          </button>
        </div>
      </div>

      {/* Book Spread */}
      <div className="book-spread no-print">
        <div className="book-page-left">
          <img
            src={currentIndex === 0 ? coverImage : activePage?.imageUrl || coverImage}
            alt={
              currentIndex === 0
                ? story.title
                : `Ilustración página ${activePage?.pageNumber}`
            }
          />
        </div>

        <div className="book-page-right">
          {currentIndex === 0 ? (
            <div>
              <span className="tag">Edición personalizada</span>
              {isEditing ? (
                <div>
                  <div className="field">
                    <label>Título del libro</label>
                    <input
                      className="input"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Dedicatoria</label>
                    <textarea
                      rows={3}
                      className="textarea"
                      value={draftDedication}
                      onChange={(e) => setDraftDedication(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleSaveEdit}
                    disabled={saving}
                  >
                    <Check size={15} /> {saving ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              ) : (
                <>
                  <h1 style={{ fontSize: "clamp(1.9rem, 3vw, 2.6rem)", marginBottom: 20 }}>
                    {story.title}
                  </h1>
                  <p
                    style={{
                      fontStyle: "italic",
                      color: "var(--ink-muted)",
                      fontSize: "1.1rem",
                      borderLeft: "3px solid var(--gold)",
                      paddingLeft: 16,
                      marginBottom: 24,
                    }}
                  >
                    “{story.dedication}”
                  </p>
                  <div style={{ fontSize: "0.9rem", color: "var(--ink-muted)" }}>
                    Protagonistas:{" "}
                    <strong>{story.characters.map((c) => c.name).join(", ")}</strong>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div>
              <span className="tag">Página {activePage?.pageNumber}</span>
              {isEditing ? (
                <div>
                  <div className="field">
                    <label>Texto de la página {activePage?.pageNumber}</label>
                    <textarea
                      rows={6}
                      className="textarea"
                      value={draftPageText}
                      onChange={(e) => setDraftPageText(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleSaveEdit}
                    disabled={saving}
                  >
                    <Check size={15} /> {saving ? "Guardando..." : "Guardar página"}
                  </button>
                </div>
              ) : (
                <p className="book-story-text">{activePage?.text}</p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="book-nav">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={currentIndex === 0}
              onClick={() => {
                stopSpeech();
                setIsEditing(false);
                setCurrentIndex((i) => Math.max(0, i - 1));
              }}
            >
              <ArrowLeft size={16} /> Página anterior
            </button>

            <span style={{ fontSize: "0.85rem", color: "var(--ink-muted)" }}>
              {currentIndex + 1} / {totalViews}
            </span>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={currentIndex >= totalViews - 1}
              onClick={() => {
                stopSpeech();
                setIsEditing(false);
                setCurrentIndex((i) => Math.min(totalViews - 1, i + 1));
              }}
            >
              Siguiente página <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Print / PDF Layout */}
      <div className="print-only">
        <div className="print-page" style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "2.4rem", marginBottom: 16 }}>{story.title}</h1>
          <p style={{ fontStyle: "italic", marginBottom: 24 }}>{story.dedication}</p>
          <img
            src={coverImage}
            alt={story.title}
            style={{ maxWidth: 420, margin: "0 auto", borderRadius: 12 }}
          />
        </div>
        {story.pages.map((p) => (
          <div key={p.pageNumber} className="print-page">
            <img
              src={p.imageUrl}
              alt={`Página ${p.pageNumber}`}
              style={{ maxWidth: 440, margin: "0 auto 20px", borderRadius: 12 }}
            />
            <p style={{ fontSize: "1.25rem", lineHeight: 1.6 }}>{p.text}</p>
            <div style={{ marginTop: 12, fontSize: "0.85rem", color: "#666" }}>
              Página {p.pageNumber}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
