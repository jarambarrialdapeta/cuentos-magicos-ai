import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Edit3,
  Printer,
  ShieldCheck,
  Sparkles,
  Volume2,
} from "lucide-react";
import { ILLUSTRATION_STYLES } from "@/lib/catalog";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="hero-eyebrow">Cuentos ilustrados a medida</span>
            <h1>
              Convierte a tus personas favoritas en protagonistas de su propio cuento
            </h1>
            <p className="hero-lead">
              Sube una foto, elige el estilo de ilustración y en minutos tendrás un libro
              completo con personajes consistentes página a página, listo para leer, escuchar
              narrado o imprimir en PDF.
            </p>

            <div className="hero-cta-row">
              <Link href="/crear" id="hero-cta-create" className="btn btn-primary btn-lg">
                <Sparkles size={18} />
                Crear mi primer cuento gratis
              </Link>
              <Link href="/ejemplos" id="hero-cta-examples" className="btn btn-secondary btn-lg">
                Ver ejemplos ilustrados
              </Link>
            </div>

            <div className="hero-trust">
              <span>
                <CheckCircle2 size={16} color="var(--forest)" /> Sin tarjeta para empezar
              </span>
              <span>
                <ShieldCheck size={16} color="var(--forest)" /> Consistencia facial garantizada
              </span>
              <span>
                <Volume2 size={16} color="var(--forest)" /> Incluye audio narración
              </span>
            </div>
          </div>

          <div className="hero-visual">
            <img
              src="/images/hero-storybook.jpg"
              alt="Libro ilustrado personalizado abierto sobre una mesa de madera"
              width={960}
              height={720}
            />
            <div className="hero-caption">
              <div>
                <strong>Misma cara, infinitas aventuras</strong>
                <div style={{ color: "var(--ink-muted)", fontSize: "0.82rem" }}>
                  Acuarela, 3D, Gouache y Cuento Clásico
                </div>
              </div>
              <Link href="/cuento/ejemplo-lucia-bosque" className="btn btn-forest btn-sm">
                Leer ejemplo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tres mundos */}
      <section className="section section-warm">
        <div className="container">
          <div className="section-header">
            <h2>Tres mundos distintos. Mismo protagonista.</h2>
            <p>
              Elige el enfoque perfecto según la edad y la ocasión: desde aventuras antes de
              dormir hasta regalos de cumpleaños o recuerdos familiares.
            </p>
          </div>

          <div className="grid-3">
            <article className="card">
              <div className="card-image-wrap">
                <img src="/images/style-classic.jpg" alt="Cuento infantil de piratas" />
              </div>
              <span className="tag">Infantil · Recreativo</span>
              <h3 style={{ fontSize: "1.4rem", marginBottom: 8 }}>Aventuras y magia</h3>
              <p style={{ color: "var(--ink-muted)" }}>
                Piratas, exploradores, dinosaurios o superhéroes con su rostro y su nombre en
                cada escena del libro.
              </p>
            </article>

            <article className="card">
              <div className="card-image-wrap">
                <img src="/images/style-3d.jpg" alt="Cuento educativo espacial" />
              </div>
              <span className="tag">Educativo</span>
              <h3 style={{ fontSize: "1.4rem", marginBottom: 8 }}>Aprende jugando</h3>
              <p style={{ color: "var(--ink-muted)" }}>
                Historias diseñadas para fomentar valores, emociones, lectura temprana, ciencia
                y curiosidad escolar.
              </p>
            </article>

            <article className="card">
              <div className="card-image-wrap">
                <img src="/images/style-watercolor.jpg" alt="Cuento ilustrado de recuerdos" />
              </div>
              <span className="tag tag-accent">Adultos y Memorias</span>
              <h3 style={{ fontSize: "1.4rem", marginBottom: 8 }}>Regalos inolvidables</h3>
              <p style={{ color: "var(--ink-muted)" }}>
                Convierte un viaje en pareja, una amistad o una historia real en un álbum
                ilustrado único.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Arquitectura de consistencia */}
      <section id="como-funciona" className="section">
        <div className="container">
          <div className="section-header">
            <h2>Cómo mantenemos la cara consistente en todo el cuento</h2>
            <p>
              No generamos cada página desde cero. Primero creamos un retrato ilustrado base
              y lo usamos como referencia visual en cada escena.
            </p>
          </div>

          <div className="consistency-box">
            <div className="consistency-step">
              <span className="tag">Paso 1 · Retrato base (PuLID)</span>
              <img
                src="/images/char-base.jpg"
                alt="Retrato ilustrado base del protagonista"
              />
              <p style={{ color: "var(--ink-muted)", fontSize: "0.95rem" }}>
                Transformamos la foto real en una hoja de personaje limpia en el estilo elegido,
                fijando rasgos faciales, pelo y vestuario.
              </p>
            </div>

            <div className="consistency-arrow">
              <ArrowRight size={28} />
              <span>Referencia fija página a página (Kontext)</span>
            </div>

            <div className="consistency-step">
              <span className="tag tag-accent">Paso 2 · Escenas consistentes</span>
              <img
                src="/images/scene-treehouse.jpg"
                alt="Escena completa del cuento manteniendo el mismo personaje"
              />
              <p style={{ color: "var(--ink-muted)", fontSize: "0.95rem" }}>
                Cada página coloca a ese mismo personaje dentro de la nueva acción junto a sus
                acompañantes o mascotas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Estilos disponibles */}
      <section className="section section-warm">
        <div className="container">
          <div className="section-header">
            <h2>Estilos de ilustración para cada historia</h2>
            <p>
              Elige entre acuarela artesanal, animación 3D cinematográfica, tinta europea o
              gouache nocturno.
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

      {/* Funcionalidades clave */}
      <section id="precios" className="section">
        <div className="container">
          <div className="section-header">
            <h2>Todo lo que incluye tu cuento</h2>
            <p>
              Diseñado para que puedas crear, revisar, escuchar y descargar sin complicaciones.
            </p>
          </div>

          <div className="grid-4">
            <div className="card">
              <BookOpen size={24} color="var(--accent)" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: "1.15rem", marginBottom: 8 }}>Visor tipo libro</h3>
              <p style={{ color: "var(--ink-muted)", fontSize: "0.92rem" }}>
                Lee a doble página con ilustración a la izquierda y tipografía editorial a la
                derecha.
              </p>
            </div>
            <div className="card">
              <Edit3 size={24} color="var(--accent)" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: "1.15rem", marginBottom: 8 }}>Edita página a página</h3>
              <p style={{ color: "var(--ink-muted)", fontSize: "0.92rem" }}>
                Ajusta el título, la dedicatoria o cualquier párrafo en vivo sin empezar de cero.
              </p>
            </div>
            <div className="card">
              <Volume2 size={24} color="var(--accent)" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: "1.15rem", marginBottom: 8 }}>Audio narración</h3>
              <p style={{ color: "var(--ink-muted)", fontSize: "0.92rem" }}>
                Escucha la historia narrada en español con paso automático de páginas.
              </p>
            </div>
            <div className="card">
              <Printer size={24} color="var(--accent)" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: "1.15rem", marginBottom: 8 }}>PDF imprimible</h3>
              <p style={{ color: "var(--ink-muted)", fontSize: "0.92rem" }}>
                Exporta e imprime el libro maquetado en un clic para regalar en papel.
              </p>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 48 }}>
            <Link href="/crear" className="btn btn-primary btn-lg">
              <Sparkles size={18} />
              Empezar a crear mi cuento ahora
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
