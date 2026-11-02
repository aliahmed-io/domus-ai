import Link from "next/link";
export default function ProjectInfo({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: { title: string; text: string }[];
}) {
  return (
    <main className="local-settings project-info">
      <span className="studio-kicker">Domus student project</span>
      <h1>{title}</h1>
      <p>{intro}</p>
      <div className="project-info-sections">
        {sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.text}</p>
          </section>
        ))}
      </div>
      <Link href="/editor" className="studio-button">
        Open the workshop
      </Link>
    </main>
  );
}
