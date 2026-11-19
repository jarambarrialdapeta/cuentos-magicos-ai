"use client";

import { useEffect, useState } from "react";
import { Check, Edit3, Loader2, Plus, Trash2, Upload, Wand2, X } from "lucide-react";
import { ILLUSTRATION_STYLES } from "@/lib/catalog";
import { CharacterProfile, IllustrationStyleId } from "@/lib/types";

export default function PersonajesPage() {
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState("Protagonista");
  const [ageOrNote, setAgeOrNote] = useState("");
  const [styleId, setStyleId] = useState<IllustrationStyleId>("watercolor");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadCharacters = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/characters");
      const data = (await res.json()) as { characters: CharacterProfile[] };
      setCharacters(data.characters || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCharacters();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setRole("Protagonista");
    setAgeOrNote("");
    setStyleId("watercolor");
    setPhotoDataUrl(undefined);
  };

  const startEdit = (c: CharacterProfile) => {
    setEditingId(c.id);
    setName(c.name);
    setRole(c.role);
    setAgeOrNote(c.ageOrNote);
    setStyleId(c.styleId);
    setPhotoDataUrl(c.photoDataUrl);
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhotoDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (regeneratePortrait: boolean) => {
    if (!name.trim()) {
      setNotice("Pertsonaiaren izena derrigorrezkoa da.");
      return;
    }
    setSubmitting(true);
    setNotice(null);

    try {
      if (editingId) {
        const res = await fetch(`/api/characters/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            role,
            ageOrNote,
            styleId,
            photoDataUrl,
            regeneratePortrait,
          }),
        });
        const data = (await res.json()) as { character: CharacterProfile; warning?: string };
        setNotice(
          data.warning
            ? `Pertsonaia eguneratu da. IA abisua: ${data.warning}`
            : "Pertsonaia behar bezala eguneratu da."
        );
      } else {
        const res = await fetch("/api/characters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            role,
            ageOrNote,
            styleId,
            photoDataUrl,
            saveToLibrary: true,
          }),
        });
        const data = (await res.json()) as { warning?: string };
        setNotice(
          data.warning
            ? `Pertsonaia gorde da. IA abisua: ${data.warning}`
            : "Pertsonaia sortu eta zure liburutegian gorde da."
        );
      }
      resetForm();
      await loadCharacters();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/characters/${id}`, { method: "DELETE" });
    if (editingId === id) resetForm();
    await loadCharacters();
  };

  return (
    <div className="container section">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "clamp(1.9rem, 3vw, 2.6rem)", marginBottom: 8 }}>
          Nire pertsonaiak
        </h1>
        <p style={{ color: "var(--ink-muted)" }}>
          Sortu eta editatu pertsonak, haurrak, maskotak edo pertsonaia fantastikoak zure ipuin
          guztietan berrerabiltzeko.
        </p>
      </div>

      {notice && <div className="notice-banner">{notice}</div>}

      <div className="wizard-panel" style={{ marginBottom: 40 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: "1.45rem" }}>
            {editingId ? "Pertsonaia editatu" : "Pertsonaia berria gehitu"}
          </h2>
          {editingId && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={resetForm}>
              <X size={15} /> Edizioa utzi
            </button>
          )}
        </div>

        <div className="form-grid">
          <div>
            <div className="field">
              <label htmlFor="p-name">Izena *</label>
              <input
                id="p-name"
                className="input"
                placeholder="Adib. Lukas, Unai, Amatxo, Toby..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="p-role">Rola</label>
              <input
                id="p-role"
                className="input"
                placeholder="Adib. Protagonista, Arreba, Maskota..."
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="p-desc">Ezaugarri fisikoak eta arropa (koherentziarako)</label>
              <textarea
                id="p-desc"
                rows={3}
                className="textarea"
                placeholder="Adib. 5 urteko mutikoa, ile kizkur gaztainkara, begi marroiak, jertse horia eta motxila berdea"
                value={ageOrNote}
                onChange={(e) => setAgeOrNote(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="field">
              <label htmlFor="p-style">Oinarrizko erretratuaren estiloa</label>
              <select
                id="p-style"
                className="input"
                value={styleId}
                onChange={(e) => setStyleId(e.target.value as IllustrationStyleId)}
              >
                {ILLUSTRATION_STYLES.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Erreferentziazko benetako argazkia (aukerakoa)</label>
              <label className="upload-zone" htmlFor="p-photo">
                {photoDataUrl ? (
                  <img src={photoDataUrl} alt="Pertsonaiaren argazkia" className="upload-preview" />
                ) : (
                  <Upload size={24} color="var(--accent)" />
                )}
                <div>
                  <strong>{photoDataUrl ? "Argazkia aldatu" : "Argazkia igo"}</strong>
                  <div style={{ fontSize: "0.84rem", color: "var(--ink-muted)" }}>
                    Ipuinetan aurpegia koherente mantentzeko erabiliko da.
                  </div>
                </div>
                <input
                  id="p-photo"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              {editingId ? (
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={submitting}
                    onClick={() => handleSubmit(false)}
                  >
                    <Check size={16} /> Aldaketak gorde
                  </button>
                  <button
                    type="button"
                    className="btn btn-forest"
                    disabled={submitting}
                    onClick={() => handleSubmit(true)}
                  >
                    {submitting ? <Loader2 size={16} /> : <Wand2 size={16} />}
                    Gorde eta erretratua birsortu
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={submitting}
                  onClick={() => handleSubmit(true)}
                >
                  {submitting ? <Loader2 size={16} /> : <Plus size={16} />}
                  {submitting ? "Pertsonaia sortzen..." : "Pertsonaia sortu"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: "1.5rem", marginBottom: 20 }}>
        Gordetako pertsonaiak ({characters.length})
      </h2>

      {loading ? (
        <p style={{ color: "var(--ink-muted)" }}>Pertsonaiak kargatzen...</p>
      ) : (
        <div className="grid-3">
          {characters.map((c) => (
            <article key={c.id} className="card">
              <div className="card-image-wrap">
                <img
                  src={c.baseIllustrationUrl || c.photoDataUrl || "/images/char-base.jpg"}
                  alt={c.name}
                />
              </div>
              <span className="tag">{c.role}</span>
              <h3 style={{ fontSize: "1.3rem", marginBottom: 6 }}>{c.name}</h3>
              <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem", marginBottom: 16 }}>
                {c.ageOrNote || "Deskribapen fisikorik gabe."}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => startEdit(c)}
                >
                  <Edit3 size={14} /> Editatu
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleDelete(c.id)}
                  aria-label={`${c.name} ezabatu`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
