import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";

export function Navbar() {
  return (
    <header className="navbar no-print">
      <div className="container navbar-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <BookOpen size={20} />
          </span>
          <span>CuentosMágicos</span>
        </Link>

        <nav className="nav-links" aria-label="Navegación principal">
          <Link href="/ejemplos" className="nav-link">
            Ejemplos
          </Link>
          <Link href="/mis-cuentos" className="nav-link">
            Mis cuentos
          </Link>
          <Link href="/#como-funciona" className="nav-link">
            Consistencia IA
          </Link>
          <Link href="/#precios" className="nav-link">
            Precios
          </Link>
        </nav>

        <div className="nav-actions">
          <Link href="/mis-cuentos" className="btn btn-secondary btn-sm">
            Biblioteca
          </Link>
          <Link href="/crear" className="btn btn-primary btn-sm">
            <Sparkles size={16} />
            Crear cuento
          </Link>
        </div>
      </div>
    </header>
  );
}
