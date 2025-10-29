// src/pages/auth/LoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Alert, App } from "antd";
import { useAuth } from "../../contexts/AuthContext";
// import loginImg from "../../assets/images/Login.png";

import Input, { PasswordInput } from "../../components/Input";
import Button from "../../components/Button";

export default function LoginPage() {
  const { login, error: authError } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [error, setError] = useState<string | null>(null);
  const { message } = App.useApp();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError(null);

    try {
      const result = await login(values.username, values.password);

      if (result.success) {
        message.success("Welcome back!");
        navigate("/");
      } else {
        setError(result.message || "Login failed");
      }
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 overflow-hidden md:h-[480px] bg-white rounded-2xl shadow">
      {/* Left visual */}
      <div className="hidden md:block relative h-full overflow-hidden rounded-l-2xl">
        <img
          src={"https://images.pexels.com/photos/1054655/pexels-photo-1054655.jpeg"}
          alt="Login visual"
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute top-6 left-6 text-white space-y-1">
          <div className="text-2xl font-heading leading-6">SPEEDEX</div>
          <div className="text-2xl font-heading leading-6">GROUP</div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="p-8 md:p-10 flex items-center justify-center">
        <div className="w-full max-w-md">
          <h1 className="text-title text-primary mb-2">SIGN IN</h1>
          <p className="text-sm text-gray-500 mb-6">
            Enter your details to sign in to your account
          </p>

          {(error || authError) && (
            <Alert
              className="mb-4"
              type="error"
              showIcon
              banner
              message={error || authError}
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            initialValues={{ username: "", password: "" }}
          >
            <Form.Item
              label="Username"
              name="username"
              rules={[
                { required: true, message: "Please enter your username" },
              ]}
            >
              {/* Your wrapped Input */}
              <Input
                size="large"
                placeholder="Enter your username"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Please enter your password" },
              ]}
            >
              {/* Your wrapped PasswordInput (keeps AntD eye toggle) */}
              <PasswordInput
                size="large"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </Form.Item>

            <div className="mb-2 mt-4">
              <a href="#" className="text-sm hover:underline">
                Having trouble logging in?
              </a>
            </div>

            <Button
              htmlType="submit"
              loading={loading}
              block
              className="!h-10 !rounded-md !font-medium"
            >
              {loading ? "Signing in..." : "Log In"}
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
}
