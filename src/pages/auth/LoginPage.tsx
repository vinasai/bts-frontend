import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Alert, App } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import Input, { PasswordInput } from "../../components/Input";
import Button from "../../components/Button";

function PianoGrid({ rows = 6, cols = 8 }) {
  const total = rows * cols;
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: total }).map((_, i) => {
        const isEvenCol = (i % cols) % 2 === 0;
        return (
          <div
            key={i}
            className={[
              "border border-white/15 transition-colors duration-150 backdrop-blur-[1px]",
              isEvenCol ? "bg-white/5" : "bg-black/10",
              "hover:bg-primary/90",
            ].join(" ")}
          />
        );
      })}
    </div>
  );
}

export default function LoginPage() {
  const { login, error: authError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [form] = Form.useForm();
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
    <div className="relative h-full">
      {/* Fullscreen background image */}
      <img
        src="https://images.pexels.com/photos/6693646/pexels-photo-6693646.jpeg"
        alt="Work setup"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Left-half white overlay (full width on small screens) */}
      <div className="absolute inset-y-0 left-0 w-full md:w-1/2 bg-white/85 backdrop-blur-[2px]" />

      {/* Foreground content */}
      <div className="relative z-10 flex min-h-full">
        {/* Left side: center the card */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 md:p-8">
            {/* Logo / brand */}
            <div className="mb-6">
              <div className="text-2xl font-bold tracking-wide text-gray-800">
                YourLogo
                <span className="text-[#FFB800]">#</span>
              </div>
            </div>

            <h1 className="text-xl font-semibold text-gray-900 mb-1">
              Sign in
            </h1>
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
                <Input
                  size="large"
                  placeholder="Enter your username"
                  autoComplete="username"
                  prefix={<UserOutlined className="text-gray-400" />}
                  className="!bg-gray-50"
                />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[
                  { required: true, message: "Please enter your password" },
                ]}
              >
                <PasswordInput
                  size="large"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  prefix={<LockOutlined className="text-gray-400" />}
                  className="!bg-gray-50"
                />
              </Form.Item>

              <div className="mb-3">
                <a href="#" className="text-sm text-primary hover:underline">
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

        <div className="hidden md:block relative w-1/2">
          <div className="absolute inset-0 bg-gradient-to-l from-black/20 to-transparent" />
          <PianoGrid rows={5} cols={6} />
        </div>
      </div>
    </div>
  );
}
