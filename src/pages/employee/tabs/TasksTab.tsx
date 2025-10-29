import { Checkbox, List, Tag } from "antd";
import type { TaskRow } from "../types";

type Props = { data: TaskRow[] };

export default function TasksTab({ data }: Props) {
  return (
    <div className="pt-2">
      <List
        dataSource={data}
        renderItem={(t) => (
          <List.Item
            actions={[
              <Tag
                key="p"
                color={
                  t.priority === "High"
                    ? "red"
                    : t.priority === "Medium"
                      ? "orange"
                      : "blue"
                }
                style={{ marginInlineEnd: 0 }}
              >
                {t.priority.toUpperCase()}
              </Tag>,
            ]}
          >
            <div className="flex items-center gap-3">
              <Checkbox checked={t.done} disabled>
                <span className={t.done ? "line-through text-gray-500" : ""}>
                  {t.title}
                </span>
              </Checkbox>
              {t.due && (
                <span className="text-xs text-gray-500">• Due {t.due}</span>
              )}
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}
