import React from "react";
import { Button as AntButton, type ButtonProps } from "antd";

type Props = ButtonProps & {
  className?: string;
  children?: React.ReactNode;
};

function getSizeClasses(size: ButtonProps["size"], hasChildren: boolean) {
  const s = size ?? "small"; // default mid
  const map = {
    small: hasChildren ? "!h-8 !px-3" : "!h-8 !w-8 !p-2",
    middle: hasChildren ? "!h-10 !px-4" : "!h-10 !w-10",
    large: hasChildren ? "!h-12 !px-6" : "!h-12 !w-12",
  } as const;
  return map[s];
}

export default function OutlineSweepButton({
  className = "",
  children,
  size,
  ...props
}: Props) {
  const hasChildren = React.Children.count(children) > 0;
  const sizeClasses = getSizeClasses(size, hasChildren);

  const base =
    "!rounded-md !font-medium transition-colors duration-300 ease-out " +
    "!border !border-primary !bg-transparent !text-primary " +
    "hover:!bg-primary hover:!text-white " +
    "focus-visible:!outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

  return (
    <AntButton
      type="default"
      size={size ?? "middle"}
      {...props}
      className={[
        base,
        sizeClasses,
        "!py-0 !w-auto", // normalize like the filled button
        className,
      ].join(" ")}
    >
      {children}
    </AntButton>
  );
}
