// 关于页 - 展示项目前端技术栈列表
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TECH_STACK = [
  { name: "React", version: "19" },
  { name: "shadcn/ui", version: "4" },
  { name: "Zustand", version: "5" },
  { name: "es-toolkit", version: "1" },
  { name: "dayjs", version: "1" },
  { name: "Tailwind CSS", version: "4" },
  { name: "TanStack Query", version: "5" },
  { name: "TanStack Router", version: "1" },
] as const;

export const AboutPage = () => (
  <Card>
    <CardHeader>
      <CardTitle>Tech Stack</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex flex-wrap gap-2">
        {TECH_STACK.map(({ name, version }) => (
          <Badge key={name} variant="secondary">{`${name} v${version}`}</Badge>
        ))}
      </div>
    </CardContent>
  </Card>
);
