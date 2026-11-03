import { useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Upload, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { queryKeys } from '@/lib/queryClient';
import { parseCsv } from './csv';
import { fetchExistingKeys, insertGames, type InsertResult } from './dataApi';
import { flagDuplicates, mapCsvRows, MAX_IMPORT_ROWS, type ImportRow } from './importMapping';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const PREVIEW_LIMIT = 200;

type Stage =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'review'; fileName: string; rows: ImportRow[]; ignored: string[] }
  | { kind: 'importing'; done: number; total: number }
  | { kind: 'done'; result: InsertResult; skipped: number };

type Filter = 'all' | 'errors' | 'warnings';

function StatusIcon({ row }: { row: ImportRow }) {
  if (row.errors.length > 0) return <XCircle className="h-4 w-4 text-cond-poor" aria-label="Błąd" />;
  if (row.warnings.length > 0) return <AlertTriangle className="h-4 w-4 text-cond-good" aria-label="Ostrzeżenie" />;
  return <CheckCircle2 className="h-4 w-4 text-cond-excellent" aria-label="Poprawny" />;
}

export function ImportWizard() {
  const toast = useToast();
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>({ kind: 'idle' });
  const [problem, setProblem] = useState<string | null>(null);
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const [filter, setFilter] = useState<Filter>('all');

  const reset = () => {
    setStage({ kind: 'idle' });
    setProblem(null);
    setSelected(new Set());
    setFilter('all');
    if (fileInput.current) fileInput.current.value = '';
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setProblem(null);
    if (file.size > MAX_FILE_BYTES) return setProblem('Plik jest większy niż 5 MB.');
    setStage({ kind: 'loading' });
    try {
      const text = await file.text();
      if (text.includes('\uFFFD')) {
        throw new Error('Plik nie jest zapisany w UTF-8 (polskie znaki byłyby uszkodzone). W Excelu wybierz „CSV UTF-8”.');
      }
      const table = parseCsv(text);
      if (table.length < 2) throw new Error('Plik nie zawiera żadnych wierszy z danymi.');
      const parsed = mapCsvRows(table);
      if (!parsed.titleColumnFound) throw new Error('Nie znaleziono kolumny „Tytuł”. Pobierz szablon CSV i użyj jego nagłówków.');
      if (parsed.rows.length > MAX_IMPORT_ROWS) throw new Error(`Plik ma ${parsed.rows.length} wierszy; maksymalnie ${MAX_IMPORT_ROWS} na jeden import.`);

      const rows = flagDuplicates(parsed.rows, await fetchExistingKeys());
      setSelected(new Set(rows.filter((r) => r.errors.length === 0).map((r) => r.line)));
      setStage({ kind: 'review', fileName: file.name, rows, ignored: parsed.ignoredColumns });
    } catch (err) {
      setStage({ kind: 'idle' });
      setProblem(err instanceof Error ? err.message : 'Nie udało się wczytać pliku.');
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const review = stage.kind === 'review' ? stage : null;
  const counts = useMemo(() => {
    const rows = review?.rows ?? [];
    return {
      total: rows.length,
      errors: rows.filter((r) => r.errors.length > 0).length,
      warnings: rows.filter((r) => r.errors.length === 0 && r.warnings.length > 0).length,
    };
  }, [review]);

  const visible = useMemo(() => {
    const rows = review?.rows ?? [];
    const filtered = filter === 'errors' ? rows.filter((r) => r.errors.length > 0) : filter === 'warnings' ? rows.filter((r) => r.warnings.length > 0) : rows;
    return filtered.slice(0, PREVIEW_LIMIT);
  }, [review, filter]);

  const toggle = (line: number) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(line)) next.delete(line);
      else next.add(line);
      return next;
    });

  const runImport = async () => {
    if (!review) return;
    const chosen = review.rows.filter((r) => selected.has(r.line) && r.insert);
    const inserts = chosen.flatMap((r) => (r.insert ? [r.insert] : []));
    setStage({ kind: 'importing', done: 0, total: inserts.length });
    try {
      const result = await insertGames(inserts, (done, total) => setStage({ kind: 'importing', done, total }));
      await Promise.all([qc.invalidateQueries({ queryKey: queryKeys.games }), qc.invalidateQueries({ queryKey: queryKeys.stats })]);
      setStage({ kind: 'done', result, skipped: review.rows.length - inserts.length });
      if (result.failures.length === 0) toast.success(`Zaimportowano ${result.imported} gier.`);
    } catch (err) {
      toast.error(err instanceof Error ? `Import nie powiódł się: ${err.message}` : 'Import nie powiódł się.');
      setStage({ kind: 'idle' });
    }
  };

  if (stage.kind === 'importing') {
    const pct = stage.total === 0 ? 100 : Math.round((stage.done / stage.total) * 100);
    return (
      <div role="status" className="space-y-2">
        <p className="text-sm">Importowanie: {stage.done} z {stage.total}…</p>
        <div className="h-2 overflow-hidden rounded-full bg-raised">
          <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }

  if (stage.kind === 'done') {
    const { result, skipped } = stage;
    return (
      <div className="space-y-3">
        <p className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-5 w-5 text-cond-excellent" aria-hidden />
          Zaimportowano: {result.imported}. Pominięto: {skipped}. Niepowodzenia: {result.failures.length}.
        </p>
        {result.failures.length > 0 && (
          <ul role="alert" className="space-y-1 text-sm text-cond-poor">
            {result.failures.map((f, i) => (
              <li key={`${f.title}-${i}`}>
                „{f.title}”: {f.message}
              </li>
            ))}
          </ul>
        )}
        <Button onClick={reset}>Importuj kolejny plik</Button>
      </div>
    );
  }

  if (review) {
    const chosenCount = review.rows.filter((r) => selected.has(r.line) && r.errors.length === 0).length;
    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm">
            Plik <strong>{review.fileName}</strong>: {counts.total} wierszy, w tym poprawnych {counts.total - counts.errors}, z ostrzeżeniami {counts.warnings}, z błędami {counts.errors}.
          </p>
          <p className="mt-1 text-xs text-muted">Wiersze z błędami nie zostaną zaimportowane. Zdjęcia nie są importowane z CSV; dodasz je w edycji gry.</p>
          {review.ignored.length > 0 && (
            <p className="mt-1 text-xs text-cond-good">Pominięte nieznane kolumny: {review.ignored.join(', ')}.</p>
          )}
        </div>

        <div role="group" aria-label="Filtr wierszy" className="flex flex-wrap gap-1">
          {([['all', 'Wszystkie'], ['errors', `Błędy (${counts.errors})`], ['warnings', `Ostrzeżenia (${counts.warnings})`]] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`rounded-lg border px-3 py-1 text-xs ${filter === value ? 'border-accent text-accent' : 'border-line text-muted hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-surface text-xs text-muted">
              <tr>
                <th className="w-10 p-2" scope="col"><span className="sr-only">Importuj</span></th>
                <th className="p-2" scope="col">Wiersz</th>
                <th className="p-2" scope="col">Status</th>
                <th className="p-2" scope="col">Tytuł</th>
                <th className="p-2" scope="col">EAN</th>
                <th className="p-2" scope="col">Uwagi</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.line} className="border-t border-line align-top">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selected.has(row.line)}
                      disabled={row.errors.length > 0}
                      onChange={() => toggle(row.line)}
                      aria-label={`Importuj wiersz ${row.line}`}
                    />
                  </td>
                  <td className="p-2 text-muted">{row.line}</td>
                  <td className="p-2"><StatusIcon row={row} /></td>
                  <td className="p-2">
                    {row.values.title || <span className="text-muted">(brak)</span>}
                    {row.values.edition && <span className="text-muted"> ({row.values.edition})</span>}
                  </td>
                  <td className="p-2 text-muted">{row.values.ean || '—'}</td>
                  <td className="p-2 text-xs">
                    {row.errors.map((e) => (
                      <p key={e} className="text-cond-poor">{e}</p>
                    ))}
                    {row.warnings.map((w) => (
                      <p key={w} className="text-cond-good">{w}</p>
                    ))}
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-muted">Brak wierszy w tym filtrze.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {(filter === 'all' ? counts.total : visible.length) > PREVIEW_LIMIT && (
          <p className="text-xs text-muted">Pokazano pierwsze {PREVIEW_LIMIT} wierszy; zaznaczenie obejmuje cały plik.</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={() => void runImport()} disabled={chosenCount === 0}>
            Importuj {chosenCount} gier
          </Button>
          <Button variant="ghost" onClick={() => setSelected(new Set(review.rows.filter((r) => r.errors.length === 0).map((r) => r.line)))}>
            Zaznacz wszystkie poprawne
          </Button>
          <Button variant="ghost" onClick={() => setSelected(new Set())}>Odznacz wszystkie</Button>
          <Button variant="ghost" onClick={reset} className="ml-auto">Anuluj</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Wybierz plik CSV (UTF-8; separator średnik, przecinek lub tabulator). Najpierw zobaczysz podgląd z wykrytymi błędami i duplikatami EAN, a zapis nastąpi dopiero po Twoim potwierdzeniu. Uwaga: Excel potrafi obciąć zera na początku EAN, więc kolumnę EAN zapisuj jako tekst.
      </p>
      <input ref={fileInput} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
      <Button onClick={() => fileInput.current?.click()} disabled={stage.kind === 'loading'}>
        <Upload className="h-4 w-4" aria-hidden />
        {stage.kind === 'loading' ? 'Analizowanie pliku…' : 'Wybierz plik CSV'}
      </Button>
      {problem && <p role="alert" className="text-sm text-cond-poor">{problem}</p>}
    </div>
  );
}
