import type { ModuleIcon } from "@/lib/modules";

const paths: Record<ModuleIcon | "logout" | "plus" | "chevronLeft" | "chevronRight" | "menu", string> = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z",
  check: "M9 12.5l2 2 4-4M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z",
  child: "M12 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm-6 17v-3a6 6 0 0 1 12 0v3",
  group: "M8 8a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm8-1a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM2 20v-1.5A4.5 4.5 0 0 1 6.5 14h3a4.5 4.5 0 0 1 4.5 4.5V20m0-4h2a4 4 0 0 1 4 4",
  educator: "M12 3a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm-7 18v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2M9 3.5 12 2l3 1.5",
  calendar: "M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Zm0 4h16M8 2v4m8-4v4",
  users: "M9 7a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm-6 13v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1m1-13a3 3 0 0 1 0 6m5 7v-1a5 5 0 0 0-3-4.6",
  settings: "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm8 4-1.5-.5.3-1.6-1.4-1.4-1.6.3L15.3 7l-1.6-.3V5l-1.7.5L10.3 4 9 5.6 7.4 5.3 6 6.7l.3 1.6L4.7 9.8 4 12l1.5.5-.3 1.6 1.4 1.4 1.6-.3.5 1.5 1.6.3v1.7l1.7-.5 1.7 1.5 1.3-1.6 1.6.3 1.4-1.4-.3-1.6 1.6-1.5L20 12Z",
  logout: "M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4m4-4 4-4-4-4m4 4H9",
  plus: "M12 5v14m-7-7h14",
  chevronLeft: "m15 6-6 6 6 6",
  chevronRight: "m9 6 6 6-6 6",
  menu: "M4 7h16M4 12h16M4 17h16",
};

export function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: keyof typeof paths;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={paths[name]} />
    </svg>
  );
}
