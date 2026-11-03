import { BarChart3, Heart, LayoutDashboard, Library, PlusCircle, Settings, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  end?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Dashboard', shortLabel: 'Start', icon: LayoutDashboard, end: true },
  { to: '/kolekcja', label: 'Moja kolekcja', shortLabel: 'Kolekcja', icon: Library },
  { to: '/dodaj', label: 'Dodaj grę', shortLabel: 'Dodaj', icon: PlusCircle },
  { to: '/lista-zyczen', label: 'Lista życzeń', shortLabel: 'Życzenia', icon: Heart },
  { to: '/statystyki', label: 'Statystyki', shortLabel: 'Statystyki', icon: BarChart3 },
  { to: '/ustawienia', label: 'Ustawienia', shortLabel: 'Ustawienia', icon: Settings },
];

/** Na telefonie dolny pasek mieści 5 pozycji; Ustawienia są w nagłówku. */
export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) => item.to !== '/ustawienia');
