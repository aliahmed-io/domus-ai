"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  LayoutGrid,
  PencilRuler,
  Layers,
  Palette,
  Armchair,
  ScanLine,
  FolderOpen,
  Settings,
} from "lucide-react";
const links = [
  { href: "/editor", label: "Workshop", Icon: LayoutGrid },
  { href: "/floor-plan", label: "Floor plan", Icon: PencilRuler },
  { href: "/bim-lift", label: "Blueprints", Icon: Layers },
  { href: "/material-lab", label: "Materials", Icon: Palette },
  { href: "/furniture", label: "Furniture", Icon: Armchair },
  { href: "/ar-map", label: "Scan demo", Icon: ScanLine },
  { href: "/dashboard", label: "Projects", Icon: FolderOpen },
  { href: "/settings", label: "Settings", Icon: Settings },
];
export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="workshop-rail" aria-label="Workshop navigation">
      <Link href="/" className="rail-brand" aria-label="Domus home">
        <House size={26} strokeWidth={1.7} />
      </Link>
      <nav>
        {links.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={pathname === href ? "rail-link active" : "rail-link"}
            aria-current={pathname === href ? "page" : undefined}
          >
            <Icon size={21} strokeWidth={1.6} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <span className="rail-bottom" title="Saved on this device">
        D.
      </span>
    </aside>
  );
}
