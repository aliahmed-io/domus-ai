import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {Layers, Palette, Armchair, ScanLine, FolderOpen } from "lucide-react";
import DemoProjectButton from "@/components/studio/DemoProjectButton";
import PlanIllustration from "@/components/studio/PlanIllustration";
export const metadata: Metadata = {
  title: "Your workshop",
  description: "A place to draw, explore materials, and make a space your own.",
};
export default function EditorHubPage() {
  return (
    <div className="workshop-page">
      <header className="workshop-header">
        <Link href="/" className="workshop-breadcrumb">
          Domus / Workshop
        </Link>
        <span>
          <span className="local-dot" /> Local workspace
        </span>
      </header>
      <section className="workshop-welcome">
        <div>
          <h1>Your workshop.</h1>
          <p>Draw a plan, work with a blueprint, or try a finish.</p>
        </div>
        <Link href="/dashboard" className="studio-outline-button">
          <FolderOpen size={17} /> My projects
        </Link>
      </section>
      <section className="workshop-start">
        <div className="workshop-start-copy">

          <h2>Start with a plan.</h2>
          <p>
            Draw walls, add doors and windows, and explore your layout in 2D and 3D.
          </p>
          <Link
            href="/floor-plan?new=1"
            className="studio-button studio-button-light"
          >
            Start a new plan
          </Link>
          <small>No account. No setup. Just start.</small>
          <DemoProjectButton />
        </div>
        <div className="workshop-plan">
          <PlanIllustration />
          <span className="drawing-label">
            A little inspiration for your first lines.
          </span>
        </div>
      </section>
      <section className="workshop-tools">
        <div className="workshop-section-heading">
          <h2>Explore your toolbox</h2>
          <span>Pick a different starting point</span>
        </div>
        <div className="tool-preview-grid">
          <Link href="/bim-lift" className="visual-tool blueprint-tool">
            <div className="tool-art">
              <div className="blueprint-stack">
                <PlanIllustration variant="scan" />
              </div>
            </div>
            <div className="tool-info">
              <Layers size={20} />
              <h3>Blueprint studio</h3>

              <p>Bring a plan into a new dimension.</p>
            </div>
          </Link>
          <Link href="/material-lab" className="visual-tool material-tool">
            <div className="tool-art">
              <div className="material-samples">
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="tool-info">
              <Palette size={20} />
              <h3>Material lab</h3>

              <p>Find a finish that feels right.</p>
            </div>
          </Link>
          <Link href="/furniture" className="visual-tool furniture-tool">
            <div className="tool-art">
              <Image
                src="/oak_residence.png"
                alt="Oak interior with a lounge chair and soft furnishings"
                fill
                sizes="(max-width: 700px) 90vw, 30vw"
              />
            </div>
            <div className="tool-info">
              <Armchair size={20} />
              <h3>Furniture studio</h3>

              <p>Make the space a little more yours.</p>
            </div>
          </Link>
        </div>
      </section>
      <Link className="workshop-experiment" href="/ar-map">
        <ScanLine size={24} />
        <div>
          <h3>Explore the room scan demo</h3>
          <p>
            Explore the camera and sample scan tools. This is an experiment, not
            a measured survey.
          </p>
        </div>
        <span>
          Open sample demo
        </span>
      </Link>
      <footer className="workshop-footnote">
        Your projects stay in this browser. Export a copy before clearing your
        browser data.
      </footer>
    </div>
  );
}
