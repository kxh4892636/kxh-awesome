export interface Technology {
  name: string;
  version: string;
}

export const TECH_STACK: readonly Technology[] = [
  { name: "React", version: "19" },
  { name: "TypeScript", version: "6" },
  { name: "Vite", version: "7" },
  { name: "Ant Design", version: "6" },
  { name: "TanStack Router", version: "1" },
  { name: "TanStack Query", version: "5" },
  { name: "Zustand", version: "5" },
  { name: "ConnectRPC", version: "2" },
  { name: "Protobuf-ES", version: "2" },
  { name: "es-toolkit", version: "1" },
  { name: "dayjs", version: "1" },
  { name: "Tailwind CSS", version: "4" },
];
