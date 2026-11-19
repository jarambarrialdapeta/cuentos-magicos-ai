import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer no-print">
      <div className="container footer-inner">
        <div>
          <strong className="font-display" style={{ color: "var(--ink)", fontSize: "1.1rem" }}>
            CuentosMágicos
          </strong>
          <p style={{ marginTop: 4 }}>
            Historias ilustradas con personajes consistentes a partir de tu foto.
          </p>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <Link href="/crear" className="nav-link">
            Crear cuento
          </Link>
          <Link href="/ejemplos" className="nav-link">
            Ejemplos
          </Link>
          <Link href="/mis-cuentos" className="nav-link">
            Mis cuentos
          </Link>
        </div>
      </div>
    </footer>
  );
}
