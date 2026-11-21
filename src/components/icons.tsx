const PATHS = {
  home: "M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",
  shelf: "M4 4h16v4H4zM4 10h16v4H4zM4 16h10v4H4z",
  dice: "M12 2 3 7v10l9 5 9-5V7zM3 7l9 5 9-5M12 12v10",
  book: "M3 5.5A2.5 2.5 0 0 1 5.5 3H21v15H5.5A2.5 2.5 0 0 0 3 20.5zM3 20.5A2.5 2.5 0 0 0 5.5 23H21v-5",
  plus: "M12 5v14M5 12h14",
  shield: "M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  arrow: "M5 12h14M13 6l6 6-6 6",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  gamepad:
    "M6 12h4M8 10v4M15.5 12h.01M18 10h.01M17.3 5H6.7a4 4 0 0 0-3.9 3.1L1.4 15.5a3.1 3.1 0 0 0 5.3 2.9L9 16h6l2.3 2.4a3.1 3.1 0 0 0 5.3-2.9l-1.4-7.4A4 4 0 0 0 17.3 5z",
  users:
    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  star: "m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  check: "m20 6-11 11-5-5",
  calendar:
    "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  chart: "M3 20h18M7 20v-5M12 20V9M17 20v-8",
  sparkles:
    "m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8zM5 16l.9 2.1L8 19l-2.1.9L5 22l-.9-2.1L2 19l2.1-.9zM19 15l.7 1.3L21 17l-1.3.7L19 19l-.7-1.3L17 17l1.3-.7z",
  trophy:
    "M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0zM7 5H4v2a4 4 0 0 0 4 4M17 5h3v2a4 4 0 0 1-4 4",
  lock: "M5 11h14v11H5zM8 11V7a4 4 0 0 1 8 0v4",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  refresh:
    "M3 12a9 9 0 0 1 15.5-6.4L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.4L3 16M3 21v-5h5",
  x: "M18 6 6 18M6 6l12 12",
} as const;

export type IconName = keyof typeof PATHS;

type IconProps = {
  name: IconName;
  className?: string;
  filled?: boolean;
};

export function Icon({
  name,
  className = "h-5 w-5",
  filled = false,
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
