import { Card, Space, Tag } from "antd";

const TECH_STACK = [
  { name: "React", version: "19" },
  { name: "Ant Design", version: "6" },
  { name: "Hono RPC", version: "4" },
  { name: "Zod", version: "4" },
  { name: "Zustand", version: "5" },
  { name: "es-toolkit", version: "1" },
  { name: "dayjs", version: "1" },
  { name: "Tailwind CSS", version: "4" },
  { name: "TanStack Query", version: "5" },
  { name: "TanStack Router", version: "1" },
] as const;

export const AboutPage = () => (
  <Card title="Tech Stack">
    <Space wrap>
      {TECH_STACK.map(({ name, version }) => (
        <Tag key={name} color="blue">{`${name} v${version}`}</Tag>
      ))}
    </Space>
  </Card>
);
