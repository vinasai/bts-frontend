export type ModalAction = {
  label: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "default";
  danger?: boolean;
  loading?: boolean;
  disabled?: boolean;
  htmlType?: "button" | "submit" | "reset";
  key?: React.Key;
  className?: string;
};

export type ModalStep = {
  title: string;
  key?: React.Key;
};
