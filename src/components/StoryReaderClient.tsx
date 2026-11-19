"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Edit3,
  Loader2,
  Printer,
  Square,
  Upload,
  Volume2,
  Wand2,
} from "lucide-react";
import { Story } from "@/lib/types";

const SPEECH_LANG: Record<string, string> = {
  eu: "eu-ES",
  es: "es-ES",
  en: "en-US",
  fr: "fr-FR",
};

export function StoryReaderClient({ initialStory }: { initialStory: Story }) {
  const [story, setStory] = useState<Story>(initialStory);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(initialStory.title);
  const [draftDedication, setDraftDedication] = useState(initialStory.dedication);
  const [draftPageText, setDraftPageText] = useState("");
  const [draftScenePrompt, setDraftScenePrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(
    initialStory.aiWarning || null
  );
  const [isSpeaking, setIsSpeaking] = useState(false);

  const totalViews = story.pages.length + 1;
  const activePage = currentIndex > 0 ? story.pages[currentIndex - 1] : null;

  useEffect(() => {
    if (activePage) {
      setDraftPageText(activePage.text);
      setDraftScenePrompt(activePage.scenePrompt);
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
    utterance.lang = SPEECH_LANG[story.language || "eu"] || "eu-ES";
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

  const handleSaveEdit = async (regenerateImage = false) => {
    if (regenerateImage) setRegenerating(true);
    else setSaving(true);
    setActionNotice(null);

    try {
      const payload =
        currentIndex === 0
          ? {
              title: draftTitle,
              dedication: draftDedication,
              regenerateCover: regenerateImage,
            }
          : {
              pageNumber: activePage?.pageNumber,
              text: draftPageText,
              scenePrompt: draftScenePrompt,
              regenerateImage,
            };

      const res = await fetch(`/api/stories/${story.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = (await res.json()) as { story: Story; warning?: string };
        setStory(data.story);
        if (data.warning) {
          setActionNotice(data.warning);
        } else {
          setIsEditing(false);
        }
      }
    } finally {
      setSaving(false);
      setRegenerating(false);
    }
  };

  const handleUploadPageImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePage) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== "string") return;
      const res = await fetch(`/api/stories/${story.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageNumber: activePage.pageNumber,
          imageUrl: reader.result,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { story: Story };
        setStory(data.story);
      }
    };
    reader.readAsDataURL(file);
  };

  const isStylePreview = (url?: string) =>
    Boolean(url && (url.includes("/images/style-") || url.includes("/images/scene-")));

  const coverImage =
    (story.coverImageUrl && !isStylePreview(story.coverImageUrl) ? story.coverImageUrl : null) ||
    (story.pages[0]?.imageUrl && !isStylePreview(story.pages[0].imageUrl)
      ? story.pages[0].imageUrl
      : null) ||
    (story.characters[0]?.baseIllustrationUrl &&
    !isStylePreview(story.characters[0].baseIllustrationUrl)
      ? story.characters[0].baseIllustrationUrl
      : null) ||
    "/images/hero-storybook.jpg";

  return (
    <div className="container reader-shell">
      {actionNotice && (
        <div className="notice-banner no-print">
          <strong>Abisua:</strong> {actionNotice}
        </div>
      )}

      {/* Tresna-barra */}
      <div className="reader-toolbar no-print">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/mis-cuentos" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} /> Liburutegia
          </Link>
          <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>
            {currentIndex === 0
              ? "Azala eta eskaintza"
              : `${activePage?.pageNumber}. orrialdea (${story.pages.length}-tik)`}
          </span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button
            type="button"
            className={`btn btn-sm ${isSpeaking ? "btn-primary" : "btn-secondary"}`}
            onClick={toggleAudio}
          >
            {isSpeaking ? <Square size={15} /> : <Volume2 size={15} />}
            {isSpeaking ? "Narrazioa gelditu" : "Narrazioa entzun"}
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsEditing((v) => !v)}
          >
            <Edit3 size={15} />
            {isEditing ? "Editorea itxi" : "Orrialdea editatu"}
          </button>

          <button
            type="button"
            className="btn btn-forest btn-sm"
            onClick={() => window.print()}
          >
            <Printer size={15} />
            Inprimatu / PDF
          </button>
        </div>
      </div>

      {/* Liburua */}
      <div className="book-spread no-print">
        <div className="book-page-left">
          <img
            src={currentIndex === 0 ? coverImage : activePage?.imageUrl || coverImage}
            alt={
              currentIndex === 0
                ? story.title
                : `${activePage?.pageNumber}. orrialdeko ilustrazioa`
            }
          />
        </div>

        <div className="book-page-right">
          {currentIndex === 0 ? (
            <div>
              <span className="tag">Azala</span>
              {isEditing ? (
                <div>
                  <div className="field">
                    <label>Liburuaren izenburua</label>
                    <input
                      className="input"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Eskaintza</label>
                    <textarea
                      rows={3}
                      className="textarea"
                      value={draftDedication}
                      onChange={(e) => setDraftDedication(e.target.value)}
                    />
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSaveEdit(false)}
                      disabled={saving || regenerating}
                    >
                      <Check size={15} /> {saving ? "Gordetzen..." : "Aldaketak gorde"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-forest btn-sm"
                      onClick={() => handleSaveEdit(true)}
                      disabled={saving || regenerating}
                    >
                      {regenerating ? <Loader2 size={15} /> : <Wand2 size={15} />}
                      {regenerating ? "Azala birsortzen..." : "Azala birsortu"}
                    </button>
                  </div>
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
                    Protagonistak:{" "}
                    <strong>{story.characters.map((c) => c.name).join(", ")}</strong>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div>
              <span className="tag">{activePage?.pageNumber}. orrialdea</span>
              {isEditing ? (
                <div>
                  <div className="field">
                    <label>{activePage?.pageNumber}. orrialdeko testua</label>
                    <textarea
                      rows={4}
                      className="textarea"
                      value={draftPageText}
                      onChange={(e) => setDraftPageText(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Eszenaren deskribapen bisuala (ilustraziorako)</label>
                    <textarea
                      rows={3}
                      className="textarea"
                      value={draftScenePrompt}
                      onChange={(e) => setDraftScenePrompt(e.target.value)}
                    />
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSaveEdit(false)}
                      disabled={saving || regenerating}
                    >
                      <Check size={15} /> {saving ? "Gordetzen..." : "Testua gorde"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-forest btn-sm"
                      onClick={() => handleSaveEdit(true)}
                      disabled={saving || regenerating}
                    >
                      {regenerating ? <Loader2 size={15} /> : <Wand2 size={15} />}
                      {regenerating ? "Birsortzen..." : "Ilustrazioa birsortu"}
                    </button>
                    <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }}>
                      <Upload size={15} /> Nire irudia igo
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleUploadPageImage}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <p className="book-story-text">{activePage?.text}</p>
              )}
            </div>
          )}

          {/* Nabigazioa */}
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
              <ArrowLeft size={16} /> Aurrekoa
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
              Hurrengoa <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* PDF / Inprimaketa */}
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
              alt={`${p.pageNumber}. orrialdea`}
              style={{ maxWidth: 440, margin: "0 auto 20px", borderRadius: 12 }}
            />
            <p style={{ fontSize: "1.25rem", lineHeight: 1.6 }}>{p.text}</p>
            <div style={{ marginTop: 12, fontSize: "0.85rem", color: "#666" }}>
              {p.pageNumber}. orrialdea
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
