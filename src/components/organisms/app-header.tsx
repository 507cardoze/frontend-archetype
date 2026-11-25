import { NavLink } from 'react-router';

type Props = { appName: string; nav: readonly { to: string; label: string }[] };

// Figma: App header (app name + main navigation).
export const AppHeader = ({ appName, nav }: Props) => (
  <header className="flex items-center gap-8 border-b border-line bg-surface px-6 py-3">
    <span className="font-semibold">{appName}</span>
    <nav aria-label="Principal">
      <ul className="flex gap-4">
        {nav.map((item) => (
          <li key={item.to}>
            <NavLink
              className={({ isActive }) =>
                isActive ? 'font-semibold text-primary' : 'text-fg-muted hover:text-fg'
              }
              to={item.to}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  </header>
);
