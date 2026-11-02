import Link from "next/link";
import { ArrowUpRight, PencilRuler } from "lucide-react";

export default function LocalEntry() {
  return (
    <div className="entry-panel">
      <PencilRuler size={36} aria-hidden="true" />
      <h1>A little room for your ideas.</h1>
      <p>
        No account needed. Open your workshop and start making something yours.
      </p>
      <Link className="studio-button" href="/editor">
        Enter the workshop <ArrowUpRight size={18} />
      </Link>
      <small>
        Projects stay in this browser. You can export a copy to keep.
      </small>
    </div>
  );
}
