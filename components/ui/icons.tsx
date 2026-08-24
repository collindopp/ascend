import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { active?: boolean };

function base(props: IconProps) {
  const { active: _active, className, ...rest } = props;
  return {
    viewBox: "0 0 24 24",
    fill: "none" as const,
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: className ?? "h-5 w-5",
    ...rest,
  };
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 11.5 12 4l8 7.5" stroke="currentColor" />
      <path
        d="M6 10v9a1 1 0 0 0 1 1h3v-5.5h4V20h3a1 1 0 0 0 1-1v-9"
        stroke="currentColor"
        fill={props.active ? "currentColor" : "none"}
        fillOpacity={props.active ? 0.12 : 0}
      />
    </svg>
  );
}

export function HistoryIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" />
      <path d="M12 8v4l3 2" stroke="currentColor" />
    </svg>
  );
}

export function PerformanceIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 20V12M12 20V6M19 20v-7" stroke="currentColor" />
    </svg>
  );
}

export function LeaderboardIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 6h16M4 12h11M4 18h7" stroke="currentColor" />
    </svg>
  );
}

export function OverviewIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" />
    </svg>
  );
}

export function PeopleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="8.5" cy="8" r="3" stroke="currentColor" />
      <path d="M3 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6" stroke="currentColor" />
      <circle cx="16.5" cy="7.5" r="2.5" stroke="currentColor" />
      <path d="M14 14.1c.8-.2 1.6-.3 2.5-.3 2.8 0 5 2.5 5 5.6" stroke="currentColor" />
    </svg>
  );
}

export function PersonIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="4" stroke="currentColor" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" />
    </svg>
  );
}

export function ActivityIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 12h4l2-7 4 14 2-7h6" stroke="currentColor" />
    </svg>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" />
      <circle cx="12" cy="12" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MatrixIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" stroke="currentColor" />
    </svg>
  );
}

export function FlagIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 3v18" stroke="currentColor" />
      <path d="M6 4h12l-2.5 3.5L18 11H6" stroke="currentColor" strokeLinejoin="round" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" />
      <path d="M11 18h2" stroke="currentColor" />
    </svg>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 6h12M9 12h12M9 18h12" stroke="currentColor" />
      <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 15l6-6" stroke="currentColor" />
      <path d="M10 5.5 12 3.5a3.5 3.5 0 0 1 5 5L15 10.5" stroke="currentColor" />
      <path d="M14 18.5 12 20.5a3.5 3.5 0 0 1-5-5L9 13.5" stroke="currentColor" />
    </svg>
  );
}

export function DocumentCheckIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 3h7l4 4v14H7z" stroke="currentColor" strokeLinejoin="round" />
      <path d="M9 12.5l2 2 4-4.5" stroke="currentColor" />
    </svg>
  );
}

export function SlidersIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 6h16" stroke="currentColor" />
      <circle cx="9" cy="6" r="2" fill="var(--surface-0)" stroke="currentColor" />
      <path d="M4 12h16" stroke="currentColor" />
      <circle cx="15" cy="12" r="2" fill="var(--surface-0)" stroke="currentColor" />
      <path d="M4 18h16" stroke="currentColor" />
      <circle cx="7" cy="18" r="2" fill="var(--surface-0)" stroke="currentColor" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z" stroke="currentColor" strokeLinejoin="round" />
    </svg>
  );
}

/** Keyed by the exact nav item href — see NavLinks/MobileTabBar. */
export const NAV_ICONS: Record<string, (active: boolean) => React.ReactNode> = {
  "/home": (active) => <HomeIcon active={active} />,
  "/history": () => <HistoryIcon />,
  "/performance": () => <PerformanceIcon />,
  "/leaderboard": () => <LeaderboardIcon />,
  "/manager/overview": () => <OverviewIcon />,
  "/manager/setters": () => <PeopleIcon />,
  "/manager/activity": () => <ActivityIcon />,
  "/manager/lead-intelligence": () => <TargetIcon />,
  "/manager/matrix": () => <MatrixIcon />,
  "/manager/leaderboard": () => <LeaderboardIcon />,
  "/manager/goals": () => <FlagIcon />,
  "/manager/sessions": () => <PhoneIcon />,
  "/admin/users": () => <PersonIcon />,
  "/admin/teams": () => <PeopleIcon />,
  "/admin/lead-lists": () => <ListIcon />,
  "/admin/integrations": () => <LinkIcon />,
  "/admin/audit-log": () => <DocumentCheckIcon />,
  "/admin/settings": () => <SlidersIcon />,
};
