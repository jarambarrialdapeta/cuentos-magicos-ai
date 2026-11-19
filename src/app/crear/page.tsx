"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import {
  BOOK_FORMATS,
  CONTENT_TYPES,
  ILLUSTRATION_STYLES,
} from "@/lib/catalog";
import { parsePreparedScript } from "@/lib/script-parser";
import {
  BookFormat,
  CharacterInput,
  CharacterProfile,
  ContentType,
  IllustrationStyleId,
  StoryLanguage,
} from "@/lib/types";

interface DraftPage {
  pageNumber: number;
  text: string;
  scenePrompt: string;
}

export default function CrearCuentoPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [language, setLanguage] = useState<StoryLanguage>("eu");
  const [contentType, setContentType] = useState<ContentType>("narrativo");
  const [bookFormat, setBookFormat] = useState<BookFormat>("mini");
  const [styleId, setStyleId] = useState<IllustrationStyleId>("watercolor");

  // Personajes guardados y seleccionados
  const [savedCharacters, setSavedCharacters] = useState<CharacterProfile[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<CharacterInput[]>([]);
  const [newCharName, setNewCharName] = useState("");
  const [newCharRole, setNewCharRole] = useState("Protagonista");
  const [newCharNote, setNewCharNote] = useState("");
  const [newCharPhoto, setNewCharPhoto] = useState<string | undefined>(undefined);
  const [addingChar, setAddingChar] = useState(false);

  // Guion: "import" (pegar/subir guion), "custom" (página a página) o "idea" (generado por IA)
  const [scriptMode, setScriptMode] = useState<"import" | "custom" | "idea">("import");
  const [rawScriptText, setRawScriptText] = useState("");
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [dedication, setDedication] = useState("");
  const [idea, setIdea] = useState("");
  const [customPages, setCustomPages] = useState<DraftPage[]>([
    { pageNumber: 1, text: "", scenePrompt: "" },
    { pageNumber: 2, text: "", scenePrompt: "" },
    { pageNumber: 3, text: "", scenePrompt: "" },
  ]);

  const [generatingStory, setGeneratingStory] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imageQuotaWarning, setImageQuotaWarning] = useState<string | null>(null);
  const [createdDraftStoryId, setCreatedDraftStoryId] = useState<string | null>(null);

  const [showKeySettings, setShowKeySettings] = useState(false);
  const [geminiInput, setGeminiInput] = useState("");
  const [falInput, setFalInput] = useState("");
  const [keyStatus, setKeyStatus] = useState<{
    hasGeminiKey: boolean;
    hasFalKey: boolean;
    geminiPreview: string | null;
    falPreview: string | null;
  } | null>(null);
  const [savingKeys, setSavingKeys] = useState(false);

  useEffect(() => {
    fetch("/api/characters")
      .then((r) => r.json())
      .then((data: { characters?: CharacterProfile[] }) => {
        setSavedCharacters(data.characters || []);
      })
      .catch(() => {});

    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setKeyStatus(data);
        if (!data.hasGeminiKey && !data.hasFalKey) {
          setShowKeySettings(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveApiKeys = async () => {
    setSavingKeys(true);
    try {
      const payload: { geminiApiKey?: string; falApiKey?: string } = {};
      if (geminiInput.trim()) payload.geminiApiKey = geminiInput.trim();
      if (falInput.trim()) payload.falApiKey = falInput.trim();
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setKeyStatus(data);
        setGeminiInput("");
        setFalInput("");
        setShowKeySettings(false);
      }
    } finally {
      setSavingKeys(false);
    }
  };

  const toggleSavedCharacter = (c: CharacterProfile) => {
    setSelectedCharacters((prev) => {
      const exists = prev.some((item) => item.id === c.id);
      if (exists) {
        return prev.filter((item) => item.id !== c.id);
      }
      return [
        ...prev,
        {
          id: c.id,
          name: c.name,
          role: c.role,
          ageOrNote: c.ageOrNote,
          photoDataUrl: c.photoDataUrl,
          baseIllustrationUrl: c.baseIllustrationUrl,
        },
      ];
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setNewCharPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleQuickAddCharacter = async () => {
    if (!newCharName.trim()) return;
    setAddingChar(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCharName.trim(),
          role: newCharRole.trim() || "Protagonista",
          ageOrNote: newCharNote.trim(),
          styleId,
          photoDataUrl: newCharPhoto,
          saveToLibrary: true,
        }),
      });
      const data = (await res.json()) as { character?: CharacterProfile; error?: string };
      if (!res.ok || !data.character) throw new Error(data.error || "Error creando personaje");
      const created = data.character;
      setSavedCharacters((prev) => [created, ...prev]);
      setSelectedCharacters((prev) => [
        ...prev,
        {
          id: created.id,
          name: created.name,
          role: created.role,
          ageOrNote: created.ageOrNote,
          photoDataUrl: created.photoDataUrl,
          baseIllustrationUrl: created.baseIllustrationUrl,
        },
      ]);
      setNewCharName("");
      setNewCharNote("");
      setNewCharPhoto(undefined);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "No se pudo añadir el personaje");
    } finally {
      setAddingChar(false);
    }
  };

  const addCustomPage = () => {
    setCustomPages((prev) => [
      ...prev,
      { pageNumber: prev.length + 1, text: "", scenePrompt: "" },
    ]);
  };

  const removeCustomPage = (idx: number) => {
    if (customPages.length <= 1) return;
    setCustomPages((prev) =>
      prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, pageNumber: i + 1 }))
    );
  };

  const handleScriptFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setRawScriptText(reader.result);
        setImportNotice(null);
      }
    };
    reader.readAsText(file, "utf-8");
  };

  const handleParsePreparedScript = () => {
    setErrorMsg(null);
    setImportNotice(null);
    if (!rawScriptText.trim()) {
      setErrorMsg("Pega un guion o sube un archivo .txt / .md primero.");
      return;
    }
    const parsed = parsePreparedScript(rawScriptText);
    if (parsed.pages.length === 0) {
      setErrorMsg("No se pudieron detectar páginas en el texto. Revisa el formato.");
      return;
    }
    if (parsed.title) setTitle(parsed.title);
    if (parsed.dedication) setDedication(parsed.dedication);
    setCustomPages(
      parsed.pages.map((p, idx) => ({
        pageNumber: idx + 1,
        text: p.text,
        scenePrompt: p.scenePrompt,
      }))
    );
    setScriptMode("custom");
    setImportNotice(
      `¡Guion importado! Se han cargado ${parsed.pages.length} páginas listas para revisar e ilustrar.`
    );
  };

  const generateImagesForStory = async (storyId: string, pageNumbers: number[]) => {
    setImageQuotaWarning(null);
    let generatedAiCount = 0;

    for (let i = 0; i < pageNumbers.length; i++) {
      const pageNum = pageNumbers[i];
      setProgressStatus(`Ilustrando página ${i + 1} de ${pageNumbers.length}...`);
      const patchRes = await fetch(`/api/stories/${storyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageNumber: pageNum,
          regenerateImage: true,
        }),
      });
      if (patchRes.ok) {
        const patchData = (await patchRes.json()) as {
          warning?: string;
          imageMode?: "ai" | "demo";
        };
        if (patchData.imageMode === "ai") {
          generatedAiCount++;
        } else if (patchData.warning) {
          setImageQuotaWarning(patchData.warning);
          setCreatedDraftStoryId(storyId);
          setGeneratingStory(false);
          setProgressStatus("");
          return false;
        }
      }
    }

    if (generatedAiCount === 0) {
      setImageQuotaWarning("No se pudieron generar las ilustraciones con IA.");
      setCreatedDraftStoryId(storyId);
      setGeneratingStory(false);
      setProgressStatus("");
      return false;
    }

    return true;
  };

  const handleCreateStory = async () => {
    setErrorMsg(null);
    setImageQuotaWarning(null);
    setCreatedDraftStoryId(null);

    if (selectedCharacters.length === 0) {
      setErrorMsg("Selecciona o crea al menos un personaje en el Paso 3.");
      return;
    }

    let pagesToCreate = customPages;
    let resolvedTitle = title.trim();
    let resolvedDedication = dedication.trim();

    if (scriptMode === "import") {
      if (!rawScriptText.trim()) {
        setErrorMsg("Pega tu guion preparado o sube un archivo .txt / .md.");
        return;
      }
      const parsed = parsePreparedScript(rawScriptText);
      if (parsed.pages.length === 0) {
        setErrorMsg("No se pudieron detectar páginas en el guion pegado.");
        return;
      }
      if (!resolvedTitle && parsed.title) resolvedTitle = parsed.title;
      if (!resolvedDedication && parsed.dedication) resolvedDedication = parsed.dedication;
      pagesToCreate = parsed.pages.map((p, idx) => ({
        pageNumber: idx + 1,
        text: p.text,
        scenePrompt: p.scenePrompt,
      }));
      setCustomPages(pagesToCreate);
      if (resolvedTitle) setTitle(resolvedTitle);
    } else if (scriptMode === "custom") {
      const validPages = customPages.filter((p) => p.text.trim() || p.scenePrompt.trim());
      if (validPages.length === 0) {
        setErrorMsg("Escribe al menos una página de tu guion.");
        return;
      }
      pagesToCreate = validPages;
    } else if (!idea.trim()) {
      setErrorMsg("Escribe la idea o argumento del cuento.");
      return;
    }

    setGeneratingStory(true);
    setProgressStatus("Preparando el guion y los personajes...");
    try {
      const useCustomPages = scriptMode === "import" || scriptMode === "custom";
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: resolvedTitle || undefined,
          dedication: resolvedDedication || undefined,
          language,
          contentType,
          bookFormat,
          styleId,
          characters: selectedCharacters,
          skipImages: true,
          idea: scriptMode === "idea" ? idea.trim() : undefined,
          customPages: useCustomPages
            ? pagesToCreate
                .filter((p) => p.text.trim() || p.scenePrompt.trim())
                .map((p, idx) => ({
                  pageNumber: idx + 1,
                  text: p.text.trim(),
                  scenePrompt: p.scenePrompt.trim() || p.text.trim(),
                }))
            : undefined,
        }),
      });
      const data = (await res.json()) as {
        story?: { id: string; pages: { pageNumber: number }[] };
        error?: string;
      };
      if (!res.ok || !data.story) throw new Error(data.error || "Error creando el cuento");

      const storyId = data.story.id;
      const pageNums = data.story.pages.map((p) => p.pageNumber);
      const ok = await generateImagesForStory(storyId, pageNums);
      if (ok) {
        setProgressStatus("¡Cuento listo! Abriendo libro...");
        router.push(`/cuento/${storyId}`);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "No se pudo crear el cuento");
      setGeneratingStory(false);
      setProgressStatus("");
    }
  };

  return (
    <div className="container wizard-shell">
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", marginBottom: 8 }}>
            Crear un nuevo cuento
          </h1>
          <p style={{ color: "var(--ink-muted)" }}>
            Elige tus personajes, selecciona el estilo y mete tu propio guion o una idea.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setShowKeySettings((v) => !v)}
        >
          {keyStatus?.hasGeminiKey || keyStatus?.hasFalKey
            ? `Claves IA activas (${[
                keyStatus.hasGeminiKey ? `Gemini ${keyStatus.geminiPreview || ""}` : "",
                keyStatus.hasFalKey ? `Fal ${keyStatus.falPreview || ""}` : "",
              ]
                .filter(Boolean)
                .join(" · ")})`
            : "Configurar clave IA (Gemini / Fal)"}
        </button>
      </div>

      {showKeySettings && (
        <div
          style={{
            padding: 18,
            borderRadius: "var(--radius-md)",
            background: "var(--bg-cream)",
            border: "1px solid var(--border)",
            marginBottom: 20,
          }}
        >
          <strong style={{ display: "block", marginBottom: 6 }}>
            Configurar claves de IA (se guardan localmente en tu equipo)
          </strong>
          <p style={{ color: "var(--ink-muted)", fontSize: "0.88rem", marginBottom: 12 }}>
            Para generar ilustraciones necesitas una clave de <strong>Gemini con facturación activa</strong> en Google AI Studio o una clave de <strong>Fal.ai</strong>.
          </p>
          <div className="form-grid" style={{ marginBottom: 12 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>GEMINI_API_KEY {keyStatus?.hasGeminiKey ? `(actual: ${keyStatus.geminiPreview})` : ""}</label>
              <input
                type="password"
                className="input"
                placeholder="AIzaSy..."
                value={geminiInput}
                onChange={(e) => setGeminiInput(e.target.value)}
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>FAL_KEY (opcional) {keyStatus?.hasFalKey ? `(actual: ${keyStatus.falPreview})` : ""}</label>
              <input
                type="password"
                className="input"
                placeholder="fal_..."
                value={falInput}
                onChange={(e) => setFalInput(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="btn btn-forest btn-sm"
              disabled={savingKeys || (!geminiInput.trim() && !falInput.trim())}
              onClick={handleSaveApiKeys}
            >
              {savingKeys ? "Guardando..." : "Guardar claves"}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowKeySettings(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Stepper */}
      <div className="stepper" role="tablist">
        {[
          { num: 1, label: "Idioma y Formato" },
          { num: 2, label: "Estilo" },
          { num: 3, label: `Personajes (${selectedCharacters.length})` },
          { num: 4, label: "Guion" },
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

        {imageQuotaWarning && (
          <div
            style={{
              padding: "16px 18px",
              borderRadius: "var(--radius-md)",
              background: "#fff4e5",
              border: "1px solid #f0c36d",
              color: "#6b4300",
              marginBottom: 18,
              fontSize: "0.94rem",
            }}
          >
            <strong style={{ display: "block", marginBottom: 6 }}>
              No se pudieron generar las ilustraciones con IA
            </strong>
            <p style={{ marginBottom: 12 }}>{imageQuotaWarning}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowKeySettings(true)}
              >
                Configurar clave IA aquí
              </button>
              {createdDraftStoryId && (
                <>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={async () => {
                      setGeneratingStory(true);
                      const pageNums = customPages.map((_, i) => i + 1);
                      const ok = await generateImagesForStory(createdDraftStoryId, pageNums);
                      if (ok) {
                        router.push(`/cuento/${createdDraftStoryId}`);
                      }
                    }}
                  >
                    <Sparkles size={15} /> Reintentar generación de imágenes
                  </button>
                  <Link
                    href={`/cuento/${createdDraftStoryId}`}
                    className="btn btn-secondary btn-sm"
                  >
                    Abrir borrador del cuento de todas formas
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 style={{ fontSize: "1.5rem", marginBottom: 14 }}>
              1. Idioma, tipo y formato
            </h2>

            <div className="field" style={{ maxWidth: 340 }}>
              <label htmlFor="story-lang">Idioma del cuento</label>
              <select
                id="story-lang"
                className="input"
                value={language}
                onChange={(e) => setLanguage(e.target.value as StoryLanguage)}
              >
                <option value="eu">Euskera</option>
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>

            <h3 style={{ fontSize: "1.15rem", marginTop: 20 }}>Tipo de historia</h3>
            <div className="option-grid">
              {CONTENT_TYPES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`option-card ${contentType === item.id ? "selected" : ""}`}
                  onClick={() => setContentType(item.id)}
                >
                  <span className="tag">{item.subtitle}</span>
                  <h4 style={{ fontSize: "1.15rem", marginBottom: 6 }}>{item.title}</h4>
                  <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem" }}>
                    {item.description}
                  </p>
                </button>
              ))}
            </div>

            <h3 style={{ fontSize: "1.15rem", marginTop: 12 }}>Formato del libro</h3>
            <div className="option-grid">
              {BOOK_FORMATS.map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  className={`option-card ${bookFormat === fmt.id ? "selected" : ""}`}
                  onClick={() => setBookFormat(fmt.id)}
                >
                  <span className="tag">{fmt.ageRange}</span>
                  <h4 style={{ fontSize: "1.15rem", marginBottom: 6 }}>{fmt.title}</h4>
                  <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem" }}>
                    {fmt.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: "1.5rem", marginBottom: 6 }}>
              2. Elige el estilo de ilustración
            </h2>
            <p style={{ color: "var(--ink-muted)" }}>
              Todas las páginas seguirán este mismo estilo visual.
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

        {step === 3 && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.5rem", marginBottom: 4 }}>
                  3. Selecciona o añade tus personajes
                </h2>
                <p style={{ color: "var(--ink-muted)" }}>
                  Haz clic en tus personajes guardados para incluirlos en este cuento.
                </p>
              </div>
              <Link href="/personajes" className="btn btn-secondary btn-sm">
                Editar biblioteca de personajes
              </Link>
            </div>

            {savedCharacters.length > 0 && (
              <div className="option-grid">
                {savedCharacters.map((c) => {
                  const isSelected = selectedCharacters.some((s) => s.id === c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`option-card ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleSavedCharacter(c)}
                    >
                      <img
                        src={c.baseIllustrationUrl || c.photoDataUrl || "/images/char-base.jpg"}
                        alt={c.name}
                        className="style-thumb"
                      />
                      <span className="tag">{isSelected ? "Seleccionado ✓" : c.role}</span>
                      <h3 style={{ fontSize: "1.15rem", marginBottom: 4 }}>{c.name}</h3>
                      <p style={{ color: "var(--ink-muted)", fontSize: "0.85rem" }}>
                        {c.ageOrNote || c.role}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Añadir personaje rápido */}
            <div
              style={{
                marginTop: 24,
                padding: 20,
                borderRadius: "var(--radius-md)",
                background: "var(--bg-cream)",
                border: "1px solid var(--border)",
              }}
            >
              <h3 style={{ fontSize: "1.15rem", marginBottom: 14 }}>
                + Añadir un personaje nuevo (se guarda en tu biblioteca)
              </h3>
              <div className="form-grid">
                <div>
                  <div className="field">
                    <label>Nombre</label>
                    <input
                      className="input"
                      placeholder="Ej. Unai, Amatxo, Astotxoa..."
                      value={newCharName}
                      onChange={(e) => setNewCharName(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Rol</label>
                    <input
                      className="input"
                      placeholder="Ej. Protagonista, Acompañante..."
                      value={newCharRole}
                      onChange={(e) => setNewCharRole(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <div className="field">
                    <label>Rasgos físicos / ropa</label>
                    <input
                      className="input"
                      placeholder="Ej. 4 años, pelo rubio, txapela y jersey azul"
                      value={newCharNote}
                      onChange={(e) => setNewCharNote(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Foto opcional</label>
                    <label className="upload-zone" htmlFor="wizard-char-photo" style={{ padding: 12 }}>
                      {newCharPhoto ? (
                        <img src={newCharPhoto} alt="Foto" className="upload-preview" style={{ width: 48, height: 48 }} />
                      ) : (
                        <Upload size={20} color="var(--accent)" />
                      )}
                      <span style={{ fontSize: "0.88rem" }}>
                        {newCharPhoto ? "Foto lista" : "Subir foto"}
                      </span>
                      <input
                        id="wizard-char-photo"
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-forest btn-sm"
                disabled={addingChar || !newCharName.trim()}
                onClick={handleQuickAddCharacter}
              >
                {addingChar ? <Loader2 size={15} /> : <Plus size={15} />}
                {addingChar ? "Guardando..." : "Guardar y añadir al cuento"}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 style={{ fontSize: "1.5rem", marginBottom: 6 }}>
              4. Guion del cuento
            </h2>
            <p style={{ color: "var(--ink-muted)", marginBottom: 18 }}>
              Pega o sube un guion ya preparado, escríbelo página a página, o escribe una idea para que la IA lo redacte.
            </p>

            {/* Selector de modo de guion */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
              <button
                type="button"
                className={`btn btn-sm ${scriptMode === "import" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setScriptMode("import")}
              >
                <FileText size={15} /> Subir o pegar guion preparado
              </button>
              <button
                type="button"
                className={`btn btn-sm ${scriptMode === "custom" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setScriptMode("custom")}
              >
                Editar página a página ({customPages.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${scriptMode === "idea" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setScriptMode("idea")}
              >
                Generar guion desde una idea
              </button>
            </div>

            {importNotice && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  background: "#e7f5ec",
                  color: "#1b5e34",
                  marginBottom: 16,
                  fontSize: "0.9rem",
                }}
              >
                {importNotice}
              </div>
            )}

            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="field">
                <label htmlFor="story-title">Título del cuento</label>
                <input
                  id="story-title"
                  className="input"
                  placeholder="Ej. Lukas eta Olentzeroren Gurdi Magikoa"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="story-dedication">Dedicatoria</label>
                <input
                  id="story-dedication"
                  className="input"
                  placeholder="Ej. Nire semearentzat, maitasun osoz."
                  value={dedication}
                  onChange={(e) => setDedication(e.target.value)}
                />
              </div>
            </div>

            {scriptMode === "import" ? (
              <div
                style={{
                  padding: 20,
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-cream)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <strong>Pega tu guion completo o sube un archivo (.txt / .md)</strong>
                    <p style={{ color: "var(--ink-muted)", fontSize: "0.86rem", marginTop: 2 }}>
                      Detecta automáticamente secciones como <code>Azala:</code>, <code>1. Irudia:</code>,{" "}
                      <code>Irudiaren deskribapena:</code>, <code>Giroa:</code>, <code>Testu laburra:</code> (o en español/inglés).
                    </p>
                  </div>
                  <label className="btn btn-secondary btn-sm" htmlFor="script-file-upload" style={{ cursor: "pointer" }}>
                    <Upload size={15} /> Subir archivo .txt / .md
                    <input
                      id="script-file-upload"
                      type="file"
                      accept=".txt,.md,.text"
                      style={{ display: "none" }}
                      onChange={handleScriptFileUpload}
                    />
                  </label>
                </div>

                <textarea
                  rows={12}
                  className="textarea"
                  value={rawScriptText}
                  onChange={(e) => setRawScriptText(e.target.value)}
                  placeholder={`"LUKAS ETA OLENTZEROREN GURDI MAGIKOA"\nAzala:\nIrudia: ...\nTestua: ...\n\n1. Irudia: Lukas basozain alaia\nIrudiaren deskribapena: ...\nGiroa: ...\nTestu laburra: ...`}
                />

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                  <button
                    type="button"
                    className="btn btn-forest btn-sm"
                    onClick={handleParsePreparedScript}
                  >
                    <Check size={15} /> Analizar y revisar páginas antes de ilustrar
                  </button>
                </div>
              </div>
            ) : scriptMode === "custom" ? (
              <div>
                {customPages.map((p, idx) => (
                  <div
                    key={p.pageNumber}
                    style={{
                      padding: 18,
                      borderRadius: "var(--radius-md)",
                      background: "var(--bg-cream)",
                      border: "1px solid var(--border)",
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 10,
                      }}
                    >
                      <strong>Página {p.pageNumber}</strong>
                      {customPages.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => removeCustomPage(idx)}
                        >
                          <Trash2 size={14} /> Quitar
                        </button>
                      )}
                    </div>
                    <div className="form-grid">
                      <div className="field" style={{ marginBottom: 0 }}>
                        <label>Texto que aparecerá en el libro</label>
                        <textarea
                          rows={3}
                          className="textarea"
                          placeholder="Ej. Hau Lukas da! Basozain gazte eta oso alai bat..."
                          value={p.text}
                          onChange={(e) =>
                            setCustomPages((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, text: e.target.value } : item
                              )
                            )
                          }
                        />
                      </div>
                      <div className="field" style={{ marginBottom: 0 }}>
                        <label>Descripción visual de la escena (para la ilustración)</label>
                        <textarea
                          rows={3}
                          className="textarea"
                          placeholder="Ej. Lukas con ropa verde y txapela saludando en el bosque nevado con su caserío detrás."
                          value={p.scenePrompt}
                          onChange={(e) =>
                            setCustomPages((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, scenePrompt: e.target.value } : item
                              )
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={addCustomPage}
                >
                  <Plus size={15} /> Añadir página
                </button>
              </div>
            ) : (
              <div className="field">
                <label htmlFor="story-idea">Tu idea o argumento *</label>
                <textarea
                  id="story-idea"
                  rows={5}
                  className="textarea"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Describe qué aventura quieres que vivan tus personajes..."
                />
              </div>
            )}
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
              {generatingStory ? progressStatus || "Creando cuento..." : "Crear cuento"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
