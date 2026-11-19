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
  Wand2,
} from "lucide-react";
import {
  BOOK_FORMATS,
  CONTENT_TYPES,
  ILLUSTRATION_STYLES,
  STORY_TEMPLATES,
} from "@/lib/catalog";
import { parsePreparedScript } from "@/lib/script-parser";
import {
  BookFormat,
  CharacterInput,
  CharacterProfile,
  ContentType,
  IllustrationStyleId,
  ImageAspectRatio,
  StoryLanguage,
} from "@/lib/types";

interface DraftPage {
  pageNumber: number;
  text: string;
  scenePrompt: string;
}

const PAGE_COUNT_PRESETS = [4, 6, 8, 10, 12, 16, 20, 24];

function resizeDraftPages(current: DraftPage[], targetCount: number): DraftPage[] {
  const clamped = Math.min(24, Math.max(2, targetCount));
  if (current.length === clamped) return current;
  if (current.length > clamped) {
    return current.slice(0, clamped).map((p, i) => ({ ...p, pageNumber: i + 1 }));
  }
  const extra: DraftPage[] = Array.from(
    { length: clamped - current.length },
    (_, i) => ({
      pageNumber: current.length + i + 1,
      text: "",
      scenePrompt: "",
    })
  );
  return [...current, ...extra];
}

export default function CrearCuentoPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [language, setLanguage] = useState<StoryLanguage>("eu");
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>("3:4");
  const [contentType, setContentType] = useState<ContentType>("narrativo");
  const [bookFormat, setBookFormat] = useState<BookFormat>("mini");
  const [pageCount, setPageCount] = useState<number>(8);
  const [styleId, setStyleId] = useState<IllustrationStyleId>("watercolor");

  // Pertsonaiak
  const [savedCharacters, setSavedCharacters] = useState<CharacterProfile[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<CharacterInput[]>([]);
  const [newCharName, setNewCharName] = useState("");
  const [newCharRole, setNewCharRole] = useState("Protagonista");
  const [newCharNote, setNewCharNote] = useState("");
  const [newCharPhoto, setNewCharPhoto] = useState<string | undefined>(undefined);
  const [addingChar, setAddingChar] = useState(false);

  // Gidoia: "import" | "idea" | "custom"
  const [scriptMode, setScriptMode] = useState<"import" | "idea" | "custom">("import");
  const [rawScriptText, setRawScriptText] = useState("");
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [dedication, setDedication] = useState("");
  const [coverScenePrompt, setCoverScenePrompt] = useState("");
  const [idea, setIdea] = useState("");
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [customPages, setCustomPages] = useState<DraftPage[]>(() =>
    resizeDraftPages([], 8)
  );

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

  const updatePageCount = (count: number) => {
    const clamped = Math.min(24, Math.max(2, count || 8));
    setPageCount(clamped);
    setCustomPages((prev) => resizeDraftPages(prev, clamped));
  };

  const handleSelectFormat = (fmtId: BookFormat, defaultPages: number) => {
    setBookFormat(fmtId);
    updatePageCount(defaultPages);
  };

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
      if (!res.ok || !data.character) throw new Error(data.error || "Errorea pertsonaia sortzean");
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
      setErrorMsg(err instanceof Error ? err.message : "Ezin izan da pertsonaia gehitu");
    } finally {
      setAddingChar(false);
    }
  };

  const addCustomPage = () => {
    if (customPages.length >= 24) return;
    setCustomPages((prev) => {
      const next = [...prev, { pageNumber: prev.length + 1, text: "", scenePrompt: "" }];
      setPageCount(next.length);
      return next;
    });
  };

  const removeCustomPage = (idx: number) => {
    if (customPages.length <= 2) return;
    setCustomPages((prev) => {
      const next = prev
        .filter((_, i) => i !== idx)
        .map((p, i) => ({ ...p, pageNumber: i + 1 }));
      setPageCount(next.length);
      return next;
    });
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
      setErrorMsg("Itsatsi gidoia edo igo .txt / .md fitxategi bat lehenengo.");
      return;
    }
    const parsed = parsePreparedScript(rawScriptText);
    if (parsed.pages.length === 0) {
      setErrorMsg("Ezin izan da orrialderik antzeman testuan. Egiaztatu formatua.");
      return;
    }
    if (parsed.title) setTitle(parsed.title);
    if (parsed.dedication) setDedication(parsed.dedication);
    if (parsed.coverScenePrompt) setCoverScenePrompt(parsed.coverScenePrompt);
    const nextPages = parsed.pages.map((p, idx) => ({
      pageNumber: idx + 1,
      text: p.text,
      scenePrompt: p.scenePrompt,
    }));
    setCustomPages(nextPages);
    setPageCount(nextPages.length);
    setScriptMode("custom");
    setImportNotice(
      `Gidoia inportatuta! ${nextPages.length} orrialde${parsed.coverScenePrompt ? " + azala" : ""} kargatu dira berrikusi eta ilustratzeko prest.`
    );
  };

  const handleGenerateDraftFromIdea = async () => {
    setErrorMsg(null);
    setImportNotice(null);
    if (selectedCharacters.length === 0) {
      setErrorMsg("Aukeratu edo sortu gutxienez pertsonaia bat 3. urratsean.");
      return;
    }
    if (!idea.trim()) {
      setErrorMsg("Idatzi ipuinaren ideia edo aukeratu txantiloi bat.");
      return;
    }

    setGeneratingDraft(true);
    try {
      const res = await fetch("/api/stories/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType,
          bookFormat,
          styleId,
          language,
          characters: selectedCharacters,
          idea: idea.trim(),
          dedication: dedication.trim() || undefined,
          requestedPages: pageCount,
        }),
      });
      const data = (await res.json()) as {
        title?: string;
        dedication?: string;
        pages?: DraftPage[];
        error?: string;
        warning?: string;
      };
      if (!res.ok || !data.pages) {
        throw new Error(data.error || "Ezin izan da zirriborroa sortu");
      }
      if (!title.trim() && data.title) setTitle(data.title);
      if (!dedication.trim() && data.dedication) setDedication(data.dedication);
      setCustomPages(
        data.pages.map((p, idx) => ({
          pageNumber: idx + 1,
          text: p.text,
          scenePrompt: p.scenePrompt,
        }))
      );
      setPageCount(data.pages.length);
      setScriptMode("custom");
      setImportNotice(
        data.warning
          ? `Zirriborroa sortu da (${data.pages.length} orrialde), abisuarekin: ${data.warning}`
          : `${data.pages.length} orrialdeko gidoia sortu da! Orain orrialdez orrialde berrikusi eta editatu dezakezu ilustratu aurretik.`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Errorea zirriborroa sortzean");
    } finally {
      setGeneratingDraft(false);
    }
  };

  const generateImagesForStory = async (storyId: string, pageNumbers: number[]) => {
    setImageQuotaWarning(null);
    let generatedAiCount = 0;

    for (let i = 0; i < pageNumbers.length; i++) {
      const pageNum = pageNumbers[i];
      setProgressStatus(`${i + 1}. orrialdea ilustratzen (${pageNumbers.length}-tik)...`);

      let success = false;
      let lastWarn: string | undefined;

      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) {
          setProgressStatus(`${i + 1}. orrialdea berriro saiatzen (${pageNumbers.length}-tik)...`);
          await new Promise((r) => setTimeout(r, 2000));
        }

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
            success = true;
            break;
          }
          lastWarn = patchData.warning;
          if (
            lastWarn &&
            (lastWarn.includes("límite 0") || lastWarn.includes("No hay ningún proveedor"))
          ) {
            break;
          }
        } else {
          lastWarn = `Zerbitzariaren errorea ${pageNum}. orrialdean (${patchRes.status})`;
        }
      }

      if (!success) {
        setImageQuotaWarning(lastWarn || `Ezin izan da ${pageNum}. orrialdea ilustratu.`);
        setCreatedDraftStoryId(storyId);
        setGeneratingStory(false);
        setProgressStatus("");
        return false;
      }
    }

    setProgressStatus("Ipuinaren azala ilustratzen...");
    await fetch(`/api/stories/${storyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        regenerateCover: true,
      }),
    });

    if (generatedAiCount === 0) {
      setImageQuotaWarning("Ezin izan dira ilustrazioak IArekin sortu.");
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
      setErrorMsg("Aukeratu edo sortu gutxienez pertsonaia bat 3. urratsean.");
      return;
    }

    let pagesToCreate = customPages;
    let resolvedTitle = title.trim();
    let resolvedDedication = dedication.trim();
    let resolvedCoverPrompt = coverScenePrompt.trim();

    if (scriptMode === "import") {
      if (!rawScriptText.trim()) {
        setErrorMsg("Itsatsi prestatutako gidoia edo igo .txt / .md fitxategi bat.");
        return;
      }
      const parsed = parsePreparedScript(rawScriptText);
      if (parsed.pages.length === 0) {
        setErrorMsg("Ezin izan da orrialderik antzeman itsatsitako gidoian.");
        return;
      }
      if (!resolvedTitle && parsed.title) resolvedTitle = parsed.title;
      if (!resolvedDedication && parsed.dedication) resolvedDedication = parsed.dedication;
      if (!resolvedCoverPrompt && parsed.coverScenePrompt) {
        resolvedCoverPrompt = parsed.coverScenePrompt;
        setCoverScenePrompt(parsed.coverScenePrompt);
      }
      pagesToCreate = parsed.pages.map((p, idx) => ({
        pageNumber: idx + 1,
        text: p.text,
        scenePrompt: p.scenePrompt,
      }));
      setCustomPages(pagesToCreate);
      setPageCount(pagesToCreate.length);
      if (resolvedTitle) setTitle(resolvedTitle);
    } else if (scriptMode === "custom") {
      const validPages = customPages.filter((p) => p.text.trim() || p.scenePrompt.trim());
      if (validPages.length === 0) {
        setErrorMsg("Idatzi gutxienez zure gidoiko orrialde bat.");
        return;
      }
      pagesToCreate = validPages;
    } else if (!idea.trim()) {
      setErrorMsg("Idatzi ipuinaren ideia edo laburpena.");
      return;
    }

    setGeneratingStory(true);
    setProgressStatus("Gidoia eta pertsonaiak prestatzen...");
    try {
      const useCustomPages = scriptMode === "import" || scriptMode === "custom";
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: resolvedTitle || undefined,
          dedication: resolvedDedication || undefined,
          coverScenePrompt: resolvedCoverPrompt || undefined,
          language,
          aspectRatio,
          contentType,
          bookFormat,
          styleId,
          requestedPages: pageCount,
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
      if (!res.ok || !data.story) throw new Error(data.error || "Errorea ipuina sortzean");

      const storyId = data.story.id;
      const pageNums = data.story.pages.map((p) => p.pageNumber);
      const ok = await generateImagesForStory(storyId, pageNums);
      if (ok) {
        setProgressStatus("Ipuina prest! Liburua irekitzen...");
        router.push(`/cuento/${storyId}`);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Ezin izan da ipuina sortu");
      setGeneratingStory(false);
      setProgressStatus("");
    }
  };

  const activeStyle =
    ILLUSTRATION_STYLES.find((s) => s.id === styleId) ?? ILLUSTRATION_STYLES[0];

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
            Pertsonalizatu zure ipuina
          </h1>
          <p style={{ color: "var(--ink-muted)" }}>
            Aukeratu formatua, orrialde kopurua, estiloa, pertsonaiak eta berrikusi orrialde
            bakoitza ilustratu aurretik.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setShowKeySettings((v) => !v)}
        >
          {keyStatus?.hasGeminiKey || keyStatus?.hasFalKey
            ? `IA gakoak aktibo (${[
                keyStatus.hasGeminiKey ? `Gemini ${keyStatus.geminiPreview || ""}` : "",
                keyStatus.hasFalKey ? `Fal ${keyStatus.falPreview || ""}` : "",
              ]
                .filter(Boolean)
                .join(" · ")})`
            : "Konfiguratu IA gakoak (Gemini / Fal)"}
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
            IA gakoen konfigurazioa (zure ekipoan gordetzen dira lokalki)
          </strong>
          <p style={{ color: "var(--ink-muted)", fontSize: "0.88rem", marginBottom: 12 }}>
            Ilustrazioak sortzeko, Google AI Studio-n <strong>faktura-kontua aktibatuta duen Gemini</strong>{" "}
            gako bat edo <strong>Fal.ai</strong> gako bat behar duzu.
          </p>
          <div className="form-grid" style={{ marginBottom: 12 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>
                GEMINI_API_KEY{" "}
                {keyStatus?.hasGeminiKey ? `(oraingoa: ${keyStatus.geminiPreview})` : ""}
              </label>
              <input
                type="password"
                className="input"
                placeholder="AIzaSy..."
                value={geminiInput}
                onChange={(e) => setGeminiInput(e.target.value)}
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>
                FAL_KEY (aukerakoa){" "}
                {keyStatus?.hasFalKey ? `(oraingoa: ${keyStatus.falPreview})` : ""}
              </label>
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
              {savingKeys ? "Gordetzen..." : "Gakoak gorde"}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowKeySettings(false)}
            >
              Itxi
            </button>
          </div>
        </div>
      )}

      {/* Urratsak (cuentosia.ai estilora, mugarik gabe) */}
      <div className="stepper" role="tablist">
        {[
          { num: 1, label: `Mota eta Orriak (${pageCount})` },
          { num: 2, label: "Estiloa" },
          { num: 3, label: `Pertsonaiak (${selectedCharacters.length})` },
          { num: 4, label: "Gidoia eta Berrikuspena" },
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
              Ezin izan dira ilustrazioak IArekin sortu
            </strong>
            <p style={{ marginBottom: 12 }}>{imageQuotaWarning}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowKeySettings(true)}
              >
                Konfiguratu IA gakoa hemen
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
                    <Sparkles size={15} /> Ilustrazioak berriro sortu
                  </button>
                  <Link
                    href={`/cuento/${createdDraftStoryId}`}
                    className="btn btn-secondary btn-sm"
                  >
                    Ireki zirriborroa hala ere
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 style={{ fontSize: "1.5rem", marginBottom: 14 }}>
              1. Hizkuntza, mota, formatua eta orrialde kopurua
            </h2>

            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="field">
                <label htmlFor="story-lang">Ipuinaren hizkuntza</label>
                <select
                  id="story-lang"
                  className="input"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as StoryLanguage)}
                >
                  <option value="eu">Euskara</option>
                  <option value="es">Gaztelania (Español)</option>
                  <option value="en">Ingelesa (English)</option>
                  <option value="fr">Frantsesa (Français)</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="page-count-input">
                  Zenbat orrialde izango ditu ipuinak? (2 - 24 orrialde)
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {PAGE_COUNT_PRESETS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`btn btn-sm ${pageCount === n ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => updatePageCount(n)}
                    >
                      {n} orr.
                    </button>
                  ))}
                  <input
                    id="page-count-input"
                    type="number"
                    min={2}
                    max={24}
                    className="input"
                    style={{ width: 84, padding: "8px 10px" }}
                    value={pageCount}
                    onChange={(e) => updatePageCount(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: "1.15rem", marginTop: 18 }}>
              Irudien formatua (orientazioa)
            </h3>
            <div className="option-grid">
              {[
                {
                  id: "3:4" as ImageAspectRatio,
                  title: "Bertikala (3:4)",
                  tag: "Liburu bertikala",
                  desc: "Orrialde bertikal klasikoa, PDF bertikalean ere primeran geratzeko.",
                },
                {
                  id: "1:1" as ImageAspectRatio,
                  title: "Karratua (1:1)",
                  tag: "Albuma",
                  desc: "Album ilustratu karratua, liburu irekiaren maketaziorako aproposa.",
                },
                {
                  id: "4:3" as ImageAspectRatio,
                  title: "Etzana (4:3)",
                  tag: "Panoramikoa",
                  desc: "Ikuspegi zabalagoa paisaia eta eszena handietarako.",
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`option-card ${aspectRatio === opt.id ? "selected" : ""}`}
                  onClick={() => setAspectRatio(opt.id)}
                >
                  <span className="tag">{opt.tag}</span>
                  <h4 style={{ fontSize: "1.15rem", marginBottom: 6 }}>{opt.title}</h4>
                  <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem" }}>{opt.desc}</p>
                </button>
              ))}
            </div>

            <h3 style={{ fontSize: "1.15rem", marginTop: 18 }}>Zein ipuin mota sortu nahi duzu?</h3>
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

            <h3 style={{ fontSize: "1.15rem", marginTop: 12 }}>Liburuaren formatua</h3>
            <div className="option-grid">
              {BOOK_FORMATS.map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  className={`option-card ${bookFormat === fmt.id ? "selected" : ""}`}
                  onClick={() => handleSelectFormat(fmt.id, fmt.defaultPages)}
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
              2. Aukeratu ilustrazio estiloa
            </h2>
            <p style={{ color: "var(--ink-muted)", marginBottom: 18 }}>
              Zure ipuineko orrialde guztiek estilo bisual bera jarraituko dute.
            </p>

            {/* Aukeratutako estiloaren aurrebista handia (cuentosia.ai bezala) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(200px, 260px) 1fr",
                gap: 20,
                padding: 18,
                borderRadius: "var(--radius-md)",
                background: "var(--bg-cream)",
                border: "1px solid var(--border)",
                marginBottom: 22,
                alignItems: "center",
              }}
            >
              <img
                src={activeStyle.previewImage}
                alt={activeStyle.name}
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  objectFit: "cover",
                  borderRadius: "var(--radius-sm)",
                }}
              />
              <div>
                <span className="tag">Aukeratuta · {activeStyle.tag}</span>
                <h3 style={{ fontSize: "1.4rem", marginBottom: 8 }}>{activeStyle.name}</h3>
                <p style={{ color: "var(--ink-muted)" }}>{activeStyle.description}</p>
              </div>
            </div>

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
                  3. Aukeratu edo gehitu zure pertsonaiak
                </h2>
                <p style={{ color: "var(--ink-muted)" }}>
                  Egin klik gordetako pertsonaietan ipuin honetan sartzeko (mugarik gabe).
                </p>
              </div>
              <Link href="/personajes" className="btn btn-secondary btn-sm">
                Pertsonaien liburutegia editatu
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
                      <span className="tag">{isSelected ? "Aukeratuta ✓" : c.role}</span>
                      <h3 style={{ fontSize: "1.15rem", marginBottom: 4 }}>{c.name}</h3>
                      <p style={{ color: "var(--ink-muted)", fontSize: "0.85rem" }}>
                        {c.ageOrNote || c.role}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

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
                + Pertsonaia berri bat gehitu (zure liburutegian gordetzen da)
              </h3>
              <div className="form-grid">
                <div>
                  <div className="field">
                    <label>Izena</label>
                    <input
                      className="input"
                      placeholder="Adib. Unai, Amatxo, Astotxoa..."
                      value={newCharName}
                      onChange={(e) => setNewCharName(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Rola</label>
                    <input
                      className="input"
                      placeholder="Adib. Protagonista, Laguntzailea..."
                      value={newCharRole}
                      onChange={(e) => setNewCharRole(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <div className="field">
                    <label>Ezaugarri fisikoak / arropa</label>
                    <input
                      className="input"
                      placeholder="Adib. 4 urte, ile horia, txapela eta jertse urdina"
                      value={newCharNote}
                      onChange={(e) => setNewCharNote(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Argazkia (aukerakoa)</label>
                    <label
                      className="upload-zone"
                      htmlFor="wizard-char-photo"
                      style={{ padding: 12 }}
                    >
                      {newCharPhoto ? (
                        <img
                          src={newCharPhoto}
                          alt="Argazkia"
                          className="upload-preview"
                          style={{ width: 48, height: 48 }}
                        />
                      ) : (
                        <Upload size={20} color="var(--accent)" />
                      )}
                      <span style={{ fontSize: "0.88rem" }}>
                        {newCharPhoto ? "Argazkia prest" : "Argazkia igo"}
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
                {addingChar ? "Gordetzen..." : "Gorde eta ipuinera gehitu"}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 style={{ fontSize: "1.5rem", marginBottom: 6 }}>
              4. Gidoia eta orrialdeen berrikuspena ({pageCount} orrialde)
            </h2>
            <p style={{ color: "var(--ink-muted)", marginBottom: 18 }}>
              Kontrol osoa: itsatsi gidoia, sortu zirriborroa ideiatik eta berrikusi orrialde
              bakoitza ilustratu aurretik.
            </p>

            {/* Gidoi moduak */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
              <button
                type="button"
                className={`btn btn-sm ${scriptMode === "import" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setScriptMode("import")}
              >
                <FileText size={15} /> Prestatutako gidoia igo edo itsatsi
              </button>
              <button
                type="button"
                className={`btn btn-sm ${scriptMode === "idea" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setScriptMode("idea")}
              >
                <Wand2 size={15} /> Ideiatik sortu ({pageCount} orr.)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${scriptMode === "custom" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setScriptMode("custom")}
              >
                Orrialdez orrialde editatu ({customPages.length})
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
                <label htmlFor="story-title">Ipuinaren izenburua</label>
                <input
                  id="story-title"
                  className="input"
                  placeholder="Adib. Lukas eta Olentzeroren Gurdi Magikoa"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="story-dedication">Eskaintza</label>
                <input
                  id="story-dedication"
                  className="input"
                  placeholder="Adib. Nire semearentzat, maitasun osoz."
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
                    <strong>Itsatsi gidoi osoa edo igo fitxategi bat (.txt / .md)</strong>
                    <p style={{ color: "var(--ink-muted)", fontSize: "0.86rem", marginTop: 2 }}>
                      Automatikoki antzematen ditu <code>Azala:</code>, <code>1. Irudia:</code>,{" "}
                      <code>Irudiaren deskribapena:</code>, <code>Giroa:</code> eta{" "}
                      <code>Testu laburra:</code> atalak.
                    </p>
                  </div>
                  <label
                    className="btn btn-secondary btn-sm"
                    htmlFor="script-file-upload"
                    style={{ cursor: "pointer" }}
                  >
                    <Upload size={15} /> Igo .txt / .md fitxategia
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
                    <Check size={15} /> Aztertu eta berrikusi orrialdeak ilustratu aurretik
                  </button>
                </div>
              </div>
            ) : scriptMode === "idea" ? (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
                    Txantiloi azkarrak (aukerakoa)
                  </label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {STORY_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setTitle(tpl.title);
                          setIdea(tpl.idea);
                        }}
                      >
                        {tpl.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="story-idea">Zure ideia edo argumentua *</label>
                  <textarea
                    id="story-idea"
                    rows={5}
                    className="textarea"
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="Deskribatu zer abentura bizi nahi duzun zure pertsonaiekin..."
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-forest btn-sm"
                  disabled={generatingDraft}
                  onClick={handleGenerateDraftFromIdea}
                >
                  {generatingDraft ? <Loader2 size={15} /> : <Wand2 size={15} />}
                  {generatingDraft
                    ? `${pageCount} orrialdeko zirriborroa sortzen...`
                    : `Sortu ${pageCount} orrialdeko zirriborroa (IA) berrikusteko`}
                </button>
              </div>
            ) : (
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
                      <strong>{p.pageNumber}. orrialdea</strong>
                      {customPages.length > 2 && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => removeCustomPage(idx)}
                        >
                          <Trash2 size={14} /> Kendu
                        </button>
                      )}
                    </div>
                    <div className="form-grid">
                      <div className="field" style={{ marginBottom: 0 }}>
                        <label>Liburuan agertuko den testua</label>
                        <textarea
                          rows={3}
                          className="textarea"
                          placeholder="Adib. Hau Lukas da! Basozain gazte eta oso alai bat..."
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
                        <label>Eszenaren deskribapen bisuala (ilustraziorako)</label>
                        <textarea
                          rows={3}
                          className="textarea"
                          placeholder="Adib. Lukas jantzi berdearekin eta txapelarekin baso elurtuan agurtzen..."
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

                {customPages.length < 24 && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={addCustomPage}
                  >
                    <Plus size={15} /> Orrialdea gehitu
                  </button>
                )}
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
            <ArrowLeft size={16} /> Aurrekoa
          </button>

          {step < 4 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setStep((s) => Math.min(4, s + 1) as 1 | 2 | 3 | 4)}
            >
              Hurrengoa <ArrowRight size={16} />
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
              {generatingStory
                ? progressStatus || "Ipuina sortzen..."
                : "Ipuina eta ilustrazioak sortu"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
