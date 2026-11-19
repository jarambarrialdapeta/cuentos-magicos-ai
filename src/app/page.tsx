import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Edit3,
  Printer,
  Sparkles,
  Users,
  Volume2,
} from "lucide-react";
import { ILLUSTRATION_STYLES } from "@/lib/catalog";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="hero-eyebrow">Taller personal de cuentos</span>
            <h1>
              Crea tus propios cuentos ilustrados con tus personajes y tus guiones
            </h1>
            <p className="hero-lead">
              Guarda a tu hijo, familiares o mascotas como personajes reutilizables, escribe tu
              propio guion página a página (en euskera, español o el idioma que elijas), edita
              cada escena e imprime el libro en PDF.
            </p>

            <div className="hero-cta-row">
              <Link href="/crear" id="hero-cta-create" className="btn btn-primary btn-lg">
                <Sparkles size={18} />
                Crear un cuento ahora
              </Link>
              <Link href="/personajes" id="hero-cta-chars" className="btn btn-secondary btn-lg">
                <Users size={18} />
                Gestionar personajes
              </Link>
            </div>

            <div className="hero-trust">
              <span>Sin suscripciones ni pagos</span>
              <span>Guion propio o asistido</span>
              <span>Edición página a página</span>
            </div>
          </div>

          <div className="hero-visual">
            <img
              src="/images/lukas-olentzero/azala.jpg"
              alt="Lukas eta Olentzeroren Gurdi Magikoa"
              width={960}
              height={960}
            />
            <div className="hero-caption">
              <div>
                <strong>Lukas eta Olentzeroren Gurdi Magikoa</strong>
                <div style={{ color: "var(--ink-muted)", fontSize: "0.82rem" }}>
                  Cuento en euskera creado con personajes consistentes
                </div>
              </div>
              <Link href="/cuento/ejemplo-lukas-olentzero" className="btn btn-forest btn-sm">
                Leer ahora
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Flujo del taller */}
      <section className="section section-warm">
        <div className="container">
          <div className="section-header">
            <h2>Tu proceso creativo en 3 pasos</h2>
            <p>
              Pensado para uso personal: diseña tus personajes una vez y úsalos en todas las
              historias que quieras crear para tu hijo.
            </p>
          </div>

          <div className="grid-3">
            <article className="card">
              <div className="card-image-wrap">
                <img src="/images/char-base.jpg" alt="Personaje base consistente" />
              </div>
              <span className="tag">1 · Personajes</span>
              <h3 style={{ fontSize: "1.35rem", marginBottom: 8 }}>
                Crea y edita personas reales
              </h3>
              <p style={{ color: "var(--ink-muted)", marginBottom: 14 }}>
                Sube una foto o describe rasgos físicos, genera su retrato base y edítalo cuando
                quieras.
              </p>
              <Link href="/personajes" className="btn btn-secondary btn-sm">
                Ir a Mis personajes <ArrowRight size={14} />
              </Link>
            </article>

            <article className="card">
              <div className="card-image-wrap">
                <img src="/images/lukas-olentzero/p3.jpg" alt="Guion página a página" />
              </div>
              <span className="tag">2 · Guion y estilo</span>
              <h3 style={{ fontSize: "1.35rem", marginBottom: 8 }}>
                Mete tu propio guion o una idea
              </h3>
              <p style={{ color: "var(--ink-muted)", marginBottom: 14 }}>
                Escribe escena por escena lo que ocurre en cada página o deja que la IA redacte
                el borrador.
              </p>
              <Link href="/crear" className="btn btn-secondary btn-sm">
                Abrir el creador <ArrowRight size={14} />
              </Link>
            </article>

            <article className="card">
              <div className="card-image-wrap">
                <img src="/images/lukas-olentzero/p9.jpg" alt="Libro ilustrado terminado" />
              </div>
              <span className="tag tag-accent">3 · Edita y lee</span>
              <h3 style={{ fontSize: "1.35rem", marginBottom: 8 }}>
                Ajusta cada página e imprime
              </h3>
              <p style={{ color: "var(--ink-muted)", marginBottom: 14 }}>
                Modifica textos, regenera ilustraciones sueltas, escucha la narración o imprime en
                PDF.
              </p>
              <Link href="/mis-cuentos" className="btn btn-secondary btn-sm">
                Ver biblioteca <ArrowRight size={14} />
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* Estilos disponibles */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Estilos de ilustración disponibles</h2>
            <p>
              Cambia el estilo visual de cualquier cuento o personaje en un clic.
            </p>
          </div>

          <div className="grid-3">
            {ILLUSTRATION_STYLES.map((style) => (
              <div key={style.id} className="card">
                <div className="card-image-wrap">
                  <img src={style.previewImage} alt={style.name} />
                </div>
                <span className="tag">{style.tag}</span>
                <h3 style={{ fontSize: "1.25rem", marginBottom: 6 }}>{style.name}</h3>
                <p style={{ color: "var(--ink-muted)", fontSize: "0.94rem" }}>
                  {style.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Herramientas */}
      <section className="section section-warm">
        <div className="container">
          <div className="grid-4">
            <div className="card">
              <Users size={24} color="var(--accent)" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Personajes editables</h3>
              <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem" }}>
                Cambia nombre, ropa, descripción o foto en cualquier momento.
              </p>
            </div>
            <div className="card">
              <Edit3 size={24} color="var(--accent)" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Guion libre</h3>
              <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem" }}>
                Introduce tus propios textos y escenas en euskera, español, inglés o francés.
              </p>
            </div>
            <div className="card">
              <Volume2 size={24} color="var(--accent)" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Narración en audio</h3>
              <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem" }}>
                Reproduce el cuento en voz alta con paso automático de páginas.
              </p>
            </div>
            <div className="card">
              <Printer size={24} color="var(--accent)" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Impresión PDF</h3>
              <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem" }}>
                Guarda o imprime el libro maquetado listo para leer en papel.
              </p>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link href="/crear" className="btn btn-primary btn-lg">
              <BookOpen size={18} />
              Empezar un nuevo cuento
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
