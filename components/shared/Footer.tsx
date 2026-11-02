import Link from "next/link";
export default function Footer() {
  return (
    <footer className="studio-footer">
      <div>
        <Link href="/" className="studio-wordmark">

          domus
        </Link>
        <p>A little room for your ideas.</p>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/editor">
          Workshop
        </Link>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </nav>
      <small>Domus. Made for the spaces we live in.</small>
    </footer>
  );
}
