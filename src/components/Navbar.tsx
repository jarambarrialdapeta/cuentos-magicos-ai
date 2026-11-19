import Link from "next/link";
import { BookOpen, Sparkles, Users } from "lucide-react";

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
          <Link href="/crear" className="nav-link">
            Crear cuento
          </Link>
          <Link href="/personajes" className="nav-link">
            Mis personajes
          </Link>
          <Link href="/mis-cuentos" className="nav-link">
            Mis cuentos
          </Link>
          <Link href="/ejemplos" className="nav-link">
            Ejemplos
          </Link>
        </nav>

        <div className="nav-actions">
          <Link href="/personajes" className="btn btn-secondary btn-sm">
            <Users size={15} />
            Personajes
          </Link>
          <Link href="/crear" className="btn btn-primary btn-sm">
            <Sparkles size={16} />
            Nuevo cuento
          </Link>
        </div>
      </div>
    </header>
  );
}
