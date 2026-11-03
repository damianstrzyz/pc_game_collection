import { NavLink } from 'react-router-dom';
import { MOBILE_NAV_ITEMS } from './navItems';

export function MobileNavigation() {
  return (
    <nav
      aria-label="Menu główne"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {MOBILE_NAV_ITEMS.map(({ to, shortLabel, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[11px] ${isActive ? 'text-accent' : 'text-muted'}`
              }
            >
              <Icon className="h-5 w-5" aria-hidden />
              {shortLabel}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
