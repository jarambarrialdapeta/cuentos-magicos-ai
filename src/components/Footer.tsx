import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer no-print">
      <div className="container footer-inner">
        <div>
          <strong className="font-display" style={{ color: "var(--ink)", fontSize: "1.1rem" }}>
            IpuinMagikoak
          </strong>
          <p style={{ marginTop: 4 }}>
            Zure pertsonaiekin eta gidoiekin sortutako ipuin ilustratu pertsonalizatuak.
          </p>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <Link href="/crear" className="nav-link">
            Ipuina sortu
          </Link>
          <Link href="/personajes" className="nav-link">
            Pertsonaiak
          </Link>
          <Link href="/ejemplos" className="nav-link">
            Adibideak
          </Link>
          <Link href="/mis-cuentos" className="nav-link">
            Nire ipuinak
          </Link>
        </div>
      </div>
    </footer>
  );
}
