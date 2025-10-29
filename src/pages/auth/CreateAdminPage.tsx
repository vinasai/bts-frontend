// src/pages/auth/CreateAdminPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Alert, App, Select, Card, Typography, Tooltip } from "antd";
import Input, { PasswordInput } from "../../components/Input";
import Button from "../../components/Button";
import axiosInstance from "../../utils/axiosInstance";

import PageHeader from "../../components/PageHeader";
import { InfoCircleOutlined } from "@ant-design/icons";

export default function CreateAdminPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const navigate = useNavigate();

  const onFinish = async (values: {
    username: string;
    password: string;
    role: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      await axiosInstance.post("/auth/register", {
        ...values,
        // no createdBy, no isLogin
      });

      message.success("Admin account created successfully!");
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="py-4">
        <PageHeader title="Add New Admin" />
      </div>

      <Card className="!rounded-2xl !shadow !border-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Typography.Title level={5} className="!mb-0">
              Create Admin
            </Typography.Title>
            <Tooltip title="Fill in the details to create a new admin account.">
              <InfoCircleOutlined />
            </Tooltip>
          </div>
        </div>

        {error && (
          <Alert
            className="mb-4"
            type="error"
            showIcon
            banner
            message={error}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          initialValues={{ username: "", password: "", role: "admin" }}
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Please enter a username" }]}
          >
            <Input size="large" placeholder="Enter a username" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: "Please enter a password" },
              {
                min: 8,
                message: "Password must be at least 8 characters long",
              },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();

                  // At least one letter, one number, one special char, no spaces
                  const strongPasswordRe =
                    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s])[^\s]+$/;

                  return strongPasswordRe.test(value)
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error(
                          "Password must contain a letter, number, special character, and no spaces."
                        )
                      );
                },
              },
            ]}
          >
            <PasswordInput size="large" placeholder="Enter a password" />
          </Form.Item>

          <Form.Item
            label="Role"
            name="role"
            rules={[{ required: true, message: "Please select a role" }]}
          >
            <Select size="large" disabled>
              <Select.Option value="admin">Admin</Select.Option>
            </Select>
          </Form.Item>

          <div className="mt-4 flex justify-end gap-2">
            <Button htmlType="submit" loading={loading} block size="middle">
              {loading ? "Creating..." : "Create Admin"}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
