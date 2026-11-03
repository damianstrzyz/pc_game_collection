import type { ReactNode } from 'react';
import { Download, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthContext';
import { ExportPanel } from '@/features/import-export/ExportPanel';
import { ImportWizard } from '@/features/import-export/ImportWizard';
import { promptInstall, usePwaState } from '@/lib/pwa';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-surface/50 p-5">
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function InstallSection() {
  const { installEvent, installed } = usePwaState();
  if (installed) return <p className="text-sm text-muted">Aplikacja jest zainstalowana na tym urządzeniu.</p>;
  if (installEvent) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Zainstaluj aplikację, aby uruchamiać ją z ekranu głównego lub pulpitu, w osobnym oknie.</p>
        <Button variant="primary" onClick={() => void promptInstall()}>
          <Download className="h-4 w-4" aria-hidden />
          Zainstaluj aplikację
        </Button>
      </div>
    );
  }
  return (
    <p className="text-sm text-muted">
      Instalacja: w Chrome lub Edge użyj ikony instalacji w pasku adresu. W Safari na iPhonie wybierz Udostępnij, a potem „Do ekranu początkowego”.
      Przycisk pojawia się tu automatycznie, gdy przeglądarka na to pozwala.
    </p>
  );
}

export default function SettingsPage() {
  const { session, signOut } = useAuth();
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <h1 className="text-2xl font-semibold">Ustawienia</h1>

      <Section title="Konto administratora">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            Zalogowano jako <span className="text-ink">{session?.user.email ?? 'administrator'}</span>. Waluta aplikacji: PLN.
          </p>
          <Button onClick={() => void signOut()}>
            <LogOut className="h-4 w-4" aria-hidden />
            Wyloguj
          </Button>
        </div>
      </Section>

      <Section title="Aplikacja na urządzeniu">
        <InstallSection />
      </Section>

      <Section title="Eksport i kopia zapasowa">
        <ExportPanel />
      </Section>

      <Section title="Import z pliku CSV">
        <ImportWizard />
      </Section>
    </div>
  );
}
