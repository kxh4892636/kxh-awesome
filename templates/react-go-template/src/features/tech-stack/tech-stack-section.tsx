import { Card, Space, Tag } from "antd";
import type * as React from "react";
import { TECH_STACK } from "./tech-stack";
import type { Technology } from "./tech-stack";

export const TechStackSection: React.FC = (): React.ReactElement => (
  <Card title="Tech Stack">
    <Space wrap>
      {TECH_STACK.map(
        (technology: Technology): React.ReactElement => (
          <Tag key={technology.name} color="blue">
            {`${technology.name} v${technology.version}`}
          </Tag>
        ),
      )}
    </Space>
  </Card>
);
