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
          <span>IpuinMagikoak</span>
        </Link>

        <nav className="nav-links" aria-label="Nabigazio nagusia">
          <Link href="/crear" className="nav-link">
            Ipuina sortu
          </Link>
          <Link href="/personajes" className="nav-link">
            Nire pertsonaiak
          </Link>
          <Link href="/mis-cuentos" className="nav-link">
            Nire ipuinak
          </Link>
          <Link href="/ejemplos" className="nav-link">
            Adibideak
          </Link>
        </nav>

        <div className="nav-actions">
          <Link href="/personajes" className="btn btn-secondary btn-sm">
            <Users size={15} />
            Pertsonaiak
          </Link>
          <Link href="/crear" className="btn btn-primary btn-sm">
            <Sparkles size={16} />
            Ipuin berria
          </Link>
        </div>
      </div>
    </header>
  );
}
