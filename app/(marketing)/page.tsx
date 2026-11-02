import Link from "next/link";
import Image from "next/image";
import {
  Check,
  PencilRuler,
  Layers,
  Palette,
} from "lucide-react";
import DesignBoard from "@/components/studio/DesignBoard";

export default function MarketingPage() {
  return (
    <main className="studio-landing">
      <section className="landing-hero">
        <div className="hero-copy">
          <span className="studio-kicker">
            <span /> An open workshop for better spaces
          </span>
          <h1>
            Make room
            <br />
            for your ideas.
          </h1>
          <p>
            Sketch the layout. Find the feeling. Bring your next space a little
            closer to home.
          </p>
          <div className="hero-actions">
            <Link href="/editor" className="studio-button">
              Open the workshop
            </Link>
            <a href="#inside" className="studio-text-link">
              Take a look inside
            </a>
          </div>
          <div className="hero-reassurance">
            <span>
              <Check size={14} /> No sign-up
            </span>
            <span>
              <Check size={14} /> Saved on your device
            </span>
          </div>
        </div>
        <DesignBoard />
      </section>
      <div className="landing-divider">
        <span>From a small idea to a space that feels right.</span>
        <span>Draw. Explore. Make it yours.</span>
      </div>
      <section id="inside" className="landing-inside">
        <div className="section-intro">
          <h2>
            Your ideas.
            <br />A few good tools.
          </h2>
          <p>
            You do not need a perfect plan to begin. Start with a blank canvas,
            a sketch, or a material you love.
          </p>
        </div>
        <div className="landing-tool-list">
          {[
            {
              Icon: PencilRuler,
              title: "Give your idea a shape",
              text: "Draw walls, arrange rooms, and work out what goes where.",
              href: "/floor-plan?new=1",
            },
            {
              Icon: Layers,
              title: "See the bigger picture",
              text: "Bring in a blueprint and explore a different view of your space.",
              href: "/bim-lift",
            },
            {
              Icon: Palette,
              title: "Find the right mix",
              text: "Try surfaces and furniture until the space feels like you.",
              href: "/material-lab",
            },
          ].map(({ Icon, title, text, href }) => (
            <Link key={title} href={href}>
              <Icon size={24} strokeWidth={1.5} />
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>

            </Link>
          ))}
        </div>
      </section>
      <section className="landing-inspiration" aria-labelledby="inspiration-title">
        <div className="inspiration-copy">
          <h2 id="inspiration-title">Good spaces<br />start with you.</h2>
          <p>A quiet corner. A bigger table. A place to call your own. Make room for the way you live.</p>
          <Link href="/editor" className="studio-button">Start your next room</Link>
        </div>
        <figure className="inspiration-study">
          <div className="inspiration-image">
            <Image
              src="/oak_residence.png"
              alt="Oak living room with a linen sofa, stone fireplace, and garden light"
              fill
              sizes="(max-width: 750px) 90vw, 45vw"
            />
          </div>
          <div className="inspiration-palette" aria-label="Room palette: oak, linen, and clay">
            <span className="inspiration-swatch swatch-oak" />
            <span className="inspiration-swatch swatch-linen" />
            <span className="inspiration-swatch swatch-clay" />
            <span>Oak. Linen. A little daylight.</span>
          </div>
          <figcaption>Interior inspiration for your next idea.</figcaption>
        </figure>
      </section>
    </main>
  );
}
