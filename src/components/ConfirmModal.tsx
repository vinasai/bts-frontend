// src/components/ConfirmModal.tsx
import React from "react";
import { Modal } from "antd";
import Button from "./Button";
import OutlineSweepButton from "./OutlineSweepButton";

type ConfirmModalProps = {
  title: string;
  content: string;
  danger?: boolean;
  okText?: string;
  cancelText?: string;
  onOk: () => Promise<void> | void; // allow async
};

export function showConfirmModal({
  title,
  content,
  danger,
  okText = danger ? "Confirm" : "OK",
  cancelText = "Cancel",
  onOk,
}: ConfirmModalProps) {
  // Keep a handle so we can close just this modal instance
  const instance = Modal.confirm({
    title,
    content,
    icon: null, // hides default icon
    footer: () => {
      // Local loading state JUST for these buttons
      const [loading, setLoading] = React.useState(false);

      const handleCancel = () => {
        if (!loading) instance.destroy();
      };

      const handleOk = async () => {
        // Show spinner + block both buttons
        setLoading(true);
        try {
          await onOk();
          // Only close on success
          instance.destroy();
        } catch {
          // Keep modal open; let caller show an error toast
        } finally {
          setLoading(false);
        }
      };

      return (
        <div className="flex justify-end gap-2 mt-4">
          {/* Cancel = secondary outline */}
          <OutlineSweepButton
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </OutlineSweepButton>

          {/* Ok = primary or danger, shows loading until onOk resolves */}
          <Button
            type="primary"
            danger={danger}
            onClick={handleOk}
            loading={loading}
            disabled={loading}
          >
            {okText}
          </Button>
        </div>
      );
    },
  });

  return instance;
}
