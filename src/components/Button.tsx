import { Button as AntButton, type ButtonProps } from "antd";
import React from "react";

type Props = ButtonProps & { className?: string; children?: React.ReactNode };

function getSizeClasses(size: ButtonProps["size"], hasChildren: boolean) {
  const s = size ?? "small"; // default mid
  // Heights are matched for text & icon-only. Text buttons get horizontal padding; icon-only are square.
  const map = {
    small: hasChildren ? "!h-8 !px-3" : "!h-8 !w-8 !p-2",
    middle: hasChildren ? "!h-10 !px-4" : "!h-10 !w-10",
    large: hasChildren ? "!h-12 !px-6" : "!h-12 !w-12",
  } as const;
  return map[s];
}

export default function Button({ className = "", children, size, ...props }: Props) {
  const hasChildren = React.Children.count(children) > 0;
  const sizeClasses = getSizeClasses(size, hasChildren);

  return (
    <AntButton
      type="primary"
      size={size ?? "middle"}
      {...props}
      className={[
        "relative group !rounded-md !font-medium !shadow",
        "!bg-primary hover:!bg-primary/90 !text-white overflow-hidden",
        sizeClasses,
        // remove conflicting padding/width rules from old version:
        "!py-0 !w-auto",
        className,
      ].join(" ")}
    >
      {hasChildren ? (
        <>
          {/* hover effect layer */}
          <span className="pointer-events-none absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
          {/* content */}
          <span className="relative z-10">{children}</span>
        </>
      ) : null}
    </AntButton>
  );
}
