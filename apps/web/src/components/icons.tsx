import type { SVGProps } from 'react';

// 轻量内联图标（不引外部依赖，规避 License 与体积）。
type IconProps = SVGProps<SVGSVGElement>;
const base = (p: IconProps) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...p,
});

export const CompassIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5 13 13l-4.5 2.5L11 11z" />
  </svg>
);
export const UserIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);
export const LockIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);
export const MailIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);
export const CalendarIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="5" width="16" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M4 10h16" />
  </svg>
);
export const MapPinIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);
export const SparkIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  </svg>
);
export const ArrowRightIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const ShieldIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z" />
  </svg>
);
export const SunIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
  </svg>
);
export const MoonIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5z" />
  </svg>
);
export const PlusIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const PencilIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
);
export const TrashIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
  </svg>
);
export const SearchIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
export const LogoutIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </svg>
);
export const LayoutDashboardIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);
export const ChevronDownIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);
export const MenuIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
export const XIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
export const CheckIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
export const ImageIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-5-5L5 21" />
  </svg>
);
export const TrendingUpIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M17 7h4v4" />
  </svg>
);
export const PieChartIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3a9 9 0 1 0 9 9h-9z" />
    <path d="M12 3v9h9A9 9 0 0 0 12 3z" />
  </svg>
);
export const ClockIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

