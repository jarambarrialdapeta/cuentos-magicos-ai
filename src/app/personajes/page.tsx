"use client";

import { useEffect, useState } from "react";
import { Check, Edit3, Loader2, Plus, Trash2, Upload, Wand2, X } from "lucide-react";
import { ILLUSTRATION_STYLES } from "@/lib/catalog";
import { CharacterProfile, IllustrationStyleId } from "@/lib/types";

export default function PersonajesPage() {
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state (crear o editar)
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
      setNotice("El nombre del personaje es obligatorio.");
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
            ? `Personaje actualizado. Aviso IA: ${data.warning}`
            : "Personaje actualizado correctamente."
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
            ? `Personaje guardado. Aviso IA: ${data.warning}`
            : "Personaje creado y guardado en tu biblioteca."
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
          Mis personajes
        </h1>
        <p style={{ color: "var(--ink-muted)" }}>
          Crea y edita las personas, niños, mascotas o personajes fantásticos para reutilizarlos
          en todos tus cuentos.
        </p>
      </div>

      {notice && <div className="notice-banner">{notice}</div>}

      {/* Formulario Crear / Editar */}
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
            {editingId ? "Editar personaje" : "Añadir nuevo personaje"}
          </h2>
          {editingId && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={resetForm}>
              <X size={15} /> Cancelar edición
            </button>
          )}
        </div>

        <div className="form-grid">
          <div>
            <div className="field">
              <label htmlFor="p-name">Nombre *</label>
              <input
                id="p-name"
                className="input"
                placeholder="Ej. Lukas, Unai, Amatxo, Toby..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="p-role">Rol</label>
              <input
                id="p-role"
                className="input"
                placeholder="Ej. Protagonista, Hermana, Mascota..."
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="p-desc">Rasgos físicos y ropa (para consistencia)</label>
              <textarea
                id="p-desc"
                rows={3}
                className="textarea"
                placeholder="Ej. Niño de 5 años, pelo castaño rizado, ojos marrones, jersey amarillo y mochila verde"
                value={ageOrNote}
                onChange={(e) => setAgeOrNote(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="field">
              <label htmlFor="p-style">Estilo de retrato base</label>
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
              <label>Foto real de referencia (opcional)</label>
              <label className="upload-zone" htmlFor="p-photo">
                {photoDataUrl ? (
                  <img src={photoDataUrl} alt="Foto personaje" className="upload-preview" />
                ) : (
                  <Upload size={24} color="var(--accent)" />
                )}
                <div>
                  <strong>{photoDataUrl ? "Cambiar foto" : "Subir foto"}</strong>
                  <div style={{ fontSize: "0.84rem", color: "var(--ink-muted)" }}>
                    Se usará para mantener la cara consistente en los cuentos.
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
                    <Check size={16} /> Guardar cambios
                  </button>
                  <button
                    type="button"
                    className="btn btn-forest"
                    disabled={submitting}
                    onClick={() => handleSubmit(true)}
                  >
                    {submitting ? <Loader2 size={16} /> : <Wand2 size={16} />}
                    Guardar y regenerar retrato
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
                  {submitting ? "Creando personaje..." : "Crear personaje"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Personajes */}
      <h2 style={{ fontSize: "1.5rem", marginBottom: 20 }}>
        Personajes guardados ({characters.length})
      </h2>

      {loading ? (
        <p style={{ color: "var(--ink-muted)" }}>Cargando personajes...</p>
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
                {c.ageOrNote || "Sin descripción física añadida."}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => startEdit(c)}
                >
                  <Edit3 size={14} /> Editar
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleDelete(c.id)}
                  aria-label={`Eliminar a ${c.name}`}
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
