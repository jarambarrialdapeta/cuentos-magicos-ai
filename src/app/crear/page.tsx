"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";
import {
  BOOK_FORMATS,
  CONTENT_TYPES,
  ILLUSTRATION_STYLES,
  STORY_TEMPLATES,
} from "@/lib/catalog";
import {
  BookFormat,
  CharacterInput,
  ContentType,
  IllustrationStyleId,
} from "@/lib/types";

export default function CrearCuentoPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [contentType, setContentType] = useState<ContentType>("narrativo");
  const [bookFormat, setBookFormat] = useState<BookFormat>("mini");
  const [styleId, setStyleId] = useState<IllustrationStyleId>("watercolor");

  const [characters, setCharacters] = useState<CharacterInput[]>([
    {
      id: "char-1",
      name: "",
      role: "Protagonista",
      ageOrNote: "",
    },
  ]);

  const [idea, setIdea] = useState(STORY_TEMPLATES[0].idea);
  const [dedication, setDedication] = useState("");
  const [generatingChar, setGeneratingChar] = useState(false);
  const [generatingStory, setGeneratingStory] = useState(false);
  const [charNotice, setCharNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mainChar = characters[0];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : undefined;
      setCharacters((prev) =>
        prev.map((c, idx) => (idx === 0 ? { ...c, photoDataUrl: dataUrl } : c))
      );
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateBasePortrait = async () => {
    setErrorMsg(null);
    if (!mainChar.name.trim()) {
      setErrorMsg("Escribe primero el nombre del protagonista.");
      return;
    }
    setGeneratingChar(true);
    try {
      const res = await fetch("/api/characters/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mainChar.name,
          ageOrNote: mainChar.ageOrNote,
          styleId,
          photoDataUrl: mainChar.photoDataUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error generando personaje");

      setCharacters((prev) =>
        prev.map((c, idx) =>
          idx === 0 ? { ...c, baseIllustrationUrl: data.illustrationUrl } : c
        )
      );
      setCharNotice(
        data.mode === "ai"
          ? `Retrato base consistente generado con ${data.providerInfo}.`
          : `Vista previa lista (${data.providerInfo}).`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setGeneratingChar(false);
    }
  };

  const addExtraCharacter = () => {
    if (characters.length >= 4) return;
    setCharacters((prev) => [
      ...prev,
      {
        id: `char-${Date.now()}`,
        name: "",
        role: "Acompañante",
        ageOrNote: "",
      },
    ]);
  };

  const removeCharacter = (id: string) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id));
  };

  const handleCreateStory = async () => {
    setErrorMsg(null);
    if (!mainChar.name.trim()) {
      setErrorMsg("Por favor, indica el nombre del protagonista.");
      return;
    }
    if (!idea.trim()) {
      setErrorMsg("Por favor, describe una idea o selecciona una plantilla.");
      return;
    }

    setGeneratingStory(true);
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType,
          bookFormat,
          styleId,
          characters: characters.filter((c) => c.name.trim()),
          idea,
          dedication,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error creando el cuento");
      router.push(`/cuento/${data.story.id}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "No se pudo crear el cuento");
      setGeneratingStory(false);
    }
  };

  return (
    <div className="container wizard-shell">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", marginBottom: 8 }}>
          Personaliza tu cuento ilustrado
        </h1>
        <p style={{ color: "var(--ink-muted)" }}>
          Configura el tipo, formato, estilo visual y protagonista en 4 pasos sencillos.
        </p>
      </div>

      {/* Stepper */}
      <div className="stepper" role="tablist">
        {[
          { num: 1, label: "Tipo" },
          { num: 2, label: "Formato" },
          { num: 3, label: "Estilo" },
          { num: 4, label: "Protagonista e Idea" },
        ].map((item) => {
          const isActive = step === item.num;
          const isDone = step > item.num;
          return (
            <button
              key={item.num}
              type="button"
              className={`step-pill ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}
              onClick={() => setStep(item.num as 1 | 2 | 3 | 4)}
            >
              <span className="step-num">
                {isDone ? <Check size={14} /> : item.num}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="wizard-panel">
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: "1.6rem", marginBottom: 6 }}>
              1. ¿Qué tipo de cuento quieres crear?
            </h2>
            <p style={{ color: "var(--ink-muted)" }}>
              Adaptamos el tono narrativo y el vocabulario según tu elección.
            </p>

            <div className="option-grid">
              {CONTENT_TYPES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`option-card ${contentType === item.id ? "selected" : ""}`}
                  onClick={() => setContentType(item.id)}
                >
                  <span className="tag">{item.subtitle}</span>
                  <h3 style={{ fontSize: "1.2rem", marginBottom: 6 }}>{item.title}</h3>
                  <p style={{ color: "var(--ink-muted)", fontSize: "0.92rem" }}>
                    {item.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: "1.6rem", marginBottom: 6 }}>
              2. Elige el formato del libro
            </h2>
            <p style={{ color: "var(--ink-muted)" }}>
              Define la extensión de texto y el tamaño de letra ideal para el lector.
            </p>

            <div className="option-grid">
              {BOOK_FORMATS.map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  className={`option-card ${bookFormat === fmt.id ? "selected" : ""}`}
                  onClick={() => setBookFormat(fmt.id)}
                >
                  <span className="tag">{fmt.ageRange}</span>
                  <h3 style={{ fontSize: "1.2rem", marginBottom: 6 }}>{fmt.title}</h3>
                  <p style={{ color: "var(--ink-muted)", fontSize: "0.92rem" }}>
                    {fmt.description}
                  </p>
                  <div style={{ marginTop: 10, fontSize: "0.85rem", fontWeight: 600 }}>
                    {fmt.defaultPages} páginas ilustradas
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontSize: "1.6rem", marginBottom: 6 }}>
              3. Selecciona el estilo de ilustración
            </h2>
            <p style={{ color: "var(--ink-muted)" }}>
              Este estilo se aplicará primero al retrato base y luego a todas las páginas.
            </p>

            <div className="option-grid">
              {ILLUSTRATION_STYLES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  className={`option-card ${styleId === st.id ? "selected" : ""}`}
                  onClick={() => setStyleId(st.id)}
                >
                  <img src={st.previewImage} alt={st.name} className="style-thumb" />
                  <span className="tag">{st.tag}</span>
                  <h3 style={{ fontSize: "1.15rem", marginBottom: 4 }}>{st.name}</h3>
                  <p style={{ color: "var(--ink-muted)", fontSize: "0.88rem" }}>
                    {st.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 style={{ fontSize: "1.6rem", marginBottom: 6 }}>
              4. Protagonista, foto e historia
            </h2>
            <p style={{ color: "var(--ink-muted)", marginBottom: 22 }}>
              Sube una foto para generar el retrato base consistente y cuéntanos de qué trata
              el cuento.
            </p>

            {errorMsg && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "var(--radius-sm)",
                  background: "#fde8e4",
                  color: "#8f2612",
                  marginBottom: 18,
                  fontSize: "0.92rem",
                }}
              >
                {errorMsg}
              </div>
            )}

            {charNotice && <div className="notice-banner">{charNotice}</div>}

            <div className="form-grid">
              <div>
                <div className="field">
                  <label htmlFor="char-name">Nombre del protagonista *</label>
                  <input
                    id="char-name"
                    className="input"
                    placeholder="Ej. Sofía, Mateo, Abuela Carmen..."
                    value={mainChar.name}
                    onChange={(e) =>
                      setCharacters((prev) =>
                        prev.map((c, idx) =>
                          idx === 0 ? { ...c, name: e.target.value } : c
                        )
                      )
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="char-note">Edad y rasgos (pelo, gafas, ropa)</label>
                  <input
                    id="char-note"
                    className="input"
                    placeholder="Ej. 6 años, pelo rizado castaño, jersey amarillo"
                    value={mainChar.ageOrNote}
                    onChange={(e) =>
                      setCharacters((prev) =>
                        prev.map((c, idx) =>
                          idx === 0 ? { ...c, ageOrNote: e.target.value } : c
                        )
                      )
                    }
                  />
                </div>

                <div className="field">
                  <label>Foto de referencia (opcional)</label>
                  <label className="upload-zone" htmlFor="photo-upload">
                    {mainChar.photoDataUrl ? (
                      <img
                        src={mainChar.photoDataUrl}
                        alt="Foto subida"
                        className="upload-preview"
                      />
                    ) : (
                      <Upload size={26} color="var(--accent)" />
                    )}
                    <div>
                      <strong>
                        {mainChar.photoDataUrl
                          ? "Foto cargada correctamente"
                          : "Haz clic para subir una foto"}
                      </strong>
                      <div style={{ fontSize: "0.84rem", color: "var(--ink-muted)" }}>
                        Se transforma en retrato ilustrado para mantener consistencia.
                      </div>
                    </div>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handlePhotoUpload}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleGenerateBasePortrait}
                  disabled={generatingChar}
                >
                  {generatingChar ? (
                    <Loader2 size={16} />
                  ) : (
                    <Wand2 size={16} />
                  )}
                  {generatingChar
                    ? "Generando retrato base..."
                    : "Previsualizar retrato base consistente"}
                </button>

                {mainChar.baseIllustrationUrl && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: 12,
                      borderRadius: "var(--radius-sm)",
                      background: "var(--bg-cream)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    <img
                      src={mainChar.baseIllustrationUrl}
                      alt="Retrato base consistente"
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 10,
                        objectFit: "cover",
                      }}
                    />
                    <div style={{ fontSize: "0.86rem" }}>
                      <strong>Personaje base listo</strong>
                      <div style={{ color: "var(--ink-muted)" }}>
                        Esta ilustración se usará como referencia en cada página.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="field">
                  <label>Plantillas Súper Rápidas (clic para usar)</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {STORY_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setIdea(tpl.idea)}
                      >
                        {tpl.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="story-idea">Tu idea o argumento *</label>
                  <textarea
                    id="story-idea"
                    rows={4}
                    className="textarea"
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="Describe qué aventura quieres que viva el protagonista..."
                  />
                </div>

                <div className="field">
                  <label htmlFor="story-dedication">Dedicatoria en la primera página</label>
                  <input
                    id="story-dedication"
                    className="input"
                    value={dedication}
                    onChange={(e) => setDedication(e.target.value)}
                    placeholder="Ej. Para Sofía, en tu sexto cumpleaños. Con todo nuestro cariño."
                  />
                </div>

                {/* Personajes extra */}
                <div style={{ marginTop: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                      Acompañantes o mascotas ({characters.length - 1}/3)
                    </span>
                    {characters.length < 4 && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={addExtraCharacter}
                      >
                        <Plus size={14} /> Añadir
                      </button>
                    )}
                  </div>

                  {characters.slice(1).map((extra) => (
                    <div
                      key={extra.id}
                      style={{
                        display: "flex",
                        gap: 8,
                        marginBottom: 8,
                        alignItems: "center",
                      }}
                    >
                      <input
                        className="input"
                        placeholder="Nombre (ej. Toby)"
                        value={extra.name}
                        onChange={(e) =>
                          setCharacters((prev) =>
                            prev.map((c) =>
                              c.id === extra.id ? { ...c, name: e.target.value } : c
                            )
                          )
                        }
                      />
                      <input
                        className="input"
                        placeholder="Rol (ej. Perrito)"
                        value={extra.role}
                        onChange={(e) =>
                          setCharacters((prev) =>
                            prev.map((c) =>
                              c.id === extra.id ? { ...c, role: e.target.value } : c
                            )
                          )
                        }
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => removeCharacter(extra.id)}
                        aria-label="Eliminar personaje"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="wizard-footer">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3 | 4)}
          >
            <ArrowLeft size={16} /> Anterior
          </button>

          {step < 4 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setStep((s) => Math.min(4, s + 1) as 1 | 2 | 3 | 4)}
            >
              Siguiente <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              id="btn-generate-story"
              className="btn btn-primary btn-lg"
              disabled={generatingStory}
              onClick={handleCreateStory}
            >
              {generatingStory ? <Loader2 size={18} /> : <Sparkles size={18} />}
              {generatingStory ? "Creando tu cuento..." : "Crear cuento ilustrado"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
