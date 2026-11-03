import { useState } from 'react';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { pluralGames } from '@/lib/format';
import { downloadTemplate, exportCsv, exportJson } from './exportFiles';

export function ExportPanel() {
  const toast = useToast();
  const [busy, setBusy] = useState<'csv' | 'json' | null>(null);

  const run = async (kind: 'csv' | 'json') => {
    setBusy(kind);
    try {
      const count = kind === 'csv' ? await exportCsv() : await exportJson();
      toast.success(`Wyeksportowano: ${pluralGames(count)}.`);
    } catch (err) {
      toast.error(err instanceof Error ? `Eksport nie powiódł się: ${err.message}` : 'Eksport nie powiódł się.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        CSV (UTF-8, separator średnik) otwiera się w Excelu z poprawnymi polskimi znakami. JSON to pełna kopia zapasowa: gry, ścieżki zdjęć i lista życzeń. Same pliki zdjęć nie są w niej zawarte.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void run('csv')} disabled={busy !== null}>
          <FileSpreadsheet className="h-4 w-4" aria-hidden />
          {busy === 'csv' ? 'Przygotowywanie…' : 'Eksportuj CSV'}
        </Button>
        <Button onClick={() => void run('json')} disabled={busy !== null}>
          <FileJson className="h-4 w-4" aria-hidden />
          {busy === 'json' ? 'Przygotowywanie…' : 'Eksportuj JSON'}
        </Button>
        <Button variant="ghost" onClick={downloadTemplate}>
          <Download className="h-4 w-4" aria-hidden />
          Pobierz szablon CSV
        </Button>
      </div>
    </div>
  );
}
