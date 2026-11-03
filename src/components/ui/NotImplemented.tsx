/** Jawny znacznik sekcji, której jeszcze nie zbudowano. Nie udaje gotowej funkcji. */
export function NotImplemented({ title, stage }: { title: string; stage: string }) {
  return (
    <section className="rounded-card border border-dashed border-line p-8">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-muted">Ta sekcja nie jest jeszcze gotowa. Powstanie w etapie: {stage}.</p>
    </section>
  );
}
