import { Card, Space, Tag } from "antd";
import type { ReactElement } from "react";
import { TECH_STACK } from "../model/tech-stack";

export const TechStackSection = (): ReactElement => (
  <Card title="Tech Stack">
    <Space wrap>
      {TECH_STACK.map(({ name, version }) => (
        <Tag key={name} color="blue">{`${name} v${version}`}</Tag>
      ))}
    </Space>
  </Card>
);
