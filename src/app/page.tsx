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
            <span className="hero-eyebrow">Ipuin tailer pertsonala</span>
            <h1>
              Sortu zure ipuin ilustratuak zure pertsonaiekin eta zure gidoiekin
            </h1>
            <p className="hero-lead">
              Gorde zure seme-alaba, senideak edo maskotak berrerabiltzeko pertsonaia gisa, aukeratu
              zenbat orrialde izango dituen, idatzi edo itsatsi zure gidoia eta inprimatu liburua
              PDFan.
            </p>

            <div className="hero-cta-row">
              <Link href="/crear" id="hero-cta-create" className="btn btn-primary btn-lg">
                <Sparkles size={18} />
                Ipuin bat sortu orain
              </Link>
              <Link href="/personajes" id="hero-cta-chars" className="btn btn-secondary btn-lg">
                <Users size={18} />
                Pertsonaiak kudeatu
              </Link>
            </div>

            <div className="hero-trust">
              <span>Harpidetzarik eta mugarik gabe</span>
              <span>Orrialde kopuru librea</span>
              <span>Orrialdez orrialdeko edizioa</span>
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
                  Euskaraz sortutako ipuina pertsonaia koherenteekin
                </div>
              </div>
              <Link href="/cuento/ejemplo-lukas-olentzero" className="btn btn-forest btn-sm">
                Irakurri orain
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Prozesua */}
      <section className="section section-warm">
        <div className="container">
          <div className="section-header">
            <h2>Zure sorkuntza-prozesua 3 urratsetan</h2>
            <p>
              Erabilera pertsonalerako pentsatua: diseinatu zure pertsonaiak behin eta erabili nahi
              dituzun istorio guztietan.
            </p>
          </div>

          <div className="grid-3">
            <article className="card">
              <div className="card-image-wrap">
                <img src="/images/char-base.jpg" alt="Oinarrizko pertsonaia koherentea" />
              </div>
              <span className="tag">1 · Pertsonaiak</span>
              <h3 style={{ fontSize: "1.35rem", marginBottom: 8 }}>
                Sortu eta editatu benetako pertsonak
              </h3>
              <p style={{ color: "var(--ink-muted)", marginBottom: 14 }}>
                Igo argazki bat edo deskribatu ezaugarri fisikoak, sortu oinarrizko erretratua eta
                editatu nahi duzunean.
              </p>
              <Link href="/personajes" className="btn btn-secondary btn-sm">
                Joan Nire pertsonaietara <ArrowRight size={14} />
              </Link>
            </article>

            <article className="card">
              <div className="card-image-wrap">
                <img src="/images/lukas-olentzero/p3.jpg" alt="Orrialdez orrialdeko gidoia" />
              </div>
              <span className="tag">2 · Gidoia eta estiloa</span>
              <h3 style={{ fontSize: "1.35rem", marginBottom: 8 }}>
                Itsatsi gidoia edo sortu ideiatik
              </h3>
              <p style={{ color: "var(--ink-muted)", marginBottom: 14 }}>
                Aukeratu orrialde kopurua, itsatsi prestatutako gidoia edo sortu zirriborroa
                ideia batetik ilustratu aurretik.
              </p>
              <Link href="/crear" className="btn btn-secondary btn-sm">
                Ireki sortzailea <ArrowRight size={14} />
              </Link>
            </article>

            <article className="card">
              <div className="card-image-wrap">
                <img src="/images/lukas-olentzero/p9.jpg" alt="Amaitutako liburu ilustratua" />
              </div>
              <span className="tag tag-accent">3 · Editatu eta irakurri</span>
              <h3 style={{ fontSize: "1.35rem", marginBottom: 8 }}>
                Doitu orrialde bakoitza eta inprimatu
              </h3>
              <p style={{ color: "var(--ink-muted)", marginBottom: 14 }}>
                Aldatu testuak, birsortu ilustrazio solteak, entzun narrazioa edo inprimatu PDFan.
              </p>
              <Link href="/mis-cuentos" className="btn btn-secondary btn-sm">
                Ikusi liburutegia <ArrowRight size={14} />
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* Estiloak */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Eskuragarri dauden ilustrazio estiloak</h2>
            <p>
              Aldatu edozein ipuin edo pertsonaiaren estilo bisuala klik bakar batean.
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

      {/* Tresnak */}
      <section className="section section-warm">
        <div className="container">
          <div className="grid-4">
            <div className="card">
              <Users size={24} color="var(--accent)" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Pertsonaia editagarriak</h3>
              <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem" }}>
                Aldatu izena, arropa, deskribapena edo argazkia edozein unetan.
              </p>
            </div>
            <div className="card">
              <Edit3 size={24} color="var(--accent)" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Gidoi librea</h3>
              <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem" }}>
                Sartu zure testuak eta eszenak euskaraz, gaztelaniaz, ingelesez edo frantsesez.
              </p>
            </div>
            <div className="card">
              <Volume2 size={24} color="var(--accent)" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Audio-narrazioa</h3>
              <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem" }}>
                Erreproduzitu ipuina ozenki orrialde-pasatze automatikoarekin.
              </p>
            </div>
            <div className="card">
              <Printer size={24} color="var(--accent)" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: "1.1rem", marginBottom: 6 }}>PDF inprimaketa</h3>
              <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem" }}>
                Gorde edo inprimatu maketatutako liburua paperean irakurtzeko prest.
              </p>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link href="/crear" className="btn btn-primary btn-lg">
              <BookOpen size={18} />
              Hasi ipuin berri bat
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
