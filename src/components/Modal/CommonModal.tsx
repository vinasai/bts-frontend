import { Modal, Typography } from "antd";
import { X } from "lucide-react";
import clsx from "clsx";
import Button from "../Button";
import OutlineSweepButton from "../OutlineSweepButton";
import type { ModalAction, ModalStep } from "./types";
import type React from "react";

type CommonModalProps = {
  open: boolean;
  onClose: () => void;

  title?: React.ReactNode;
  subtitle?: React.ReactNode;

  footer?: React.ReactNode | null;

  actions?: {
    cancelText?: string;
    hideCancel?: boolean;
    /** Optional: show pagination dots in the left side of the footer */
    pageDots?: {
      /** Zero-based active index, e.g. 0 for first page */
      current: number;
      /** Total dot count, e.g. 2 for two pages */
      total: number;
    };
    /** If you pass both pageDots and extra, pageDots will render first, then extra */
    extra?: React.ReactNode;
    items: ModalAction[];
  };

  steps?: ModalStep[];
  currentStep?: number;
  onPrevStep?: () => void;
  onNextStep?: () => void;

  width?: number | string;
  centered?: boolean;
  className?: string;

  /** Ant props pass-throughs */
  /** @deprecated Use destroyOnHidden (AntD v5) */
  destroyOnClose?: boolean;
  /** New in AntD v5+ */
  destroyOnHidden?: boolean;
  maskClosable?: boolean; // default false
  keyboard?: boolean; // default true

  children?: React.ReactNode;
};

export default function CommonModal({
  open,
  onClose,
  title,
  subtitle,
  footer,
  actions,
  steps,
  currentStep = 0,
  onPrevStep,
  onNextStep,
  width = 680,
  centered = true,
  className,
  destroyOnClose = true,
  destroyOnHidden,
  maskClosable = false,
  keyboard = true,
  children,
}: CommonModalProps) {
  const hasSteps = Array.isArray(steps) && steps.length > 0;

  const renderHeader = (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        {title ? (
          <Typography.Title level={4} className="!mb-0 truncate">
            {title}
          </Typography.Title>
        ) : null}
        {subtitle ? (
          <div className="text-sm text-gray-500 mt-1">{subtitle}</div>
        ) : null}
      </div>

      {/* Close icon */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50"
      >
        <X size={18} />
      </button>
    </div>
  );

  const renderStepper = hasSteps ? (
    <div className="mt-4 mb-2">
      <ol className="flex flex-wrap gap-3">
        {steps!.map((s, idx) => {
          const active = idx === currentStep;
          const done = idx < currentStep;
          return (
            <li
              key={s.key ?? idx}
              className={clsx(
                "px-3 py-1 rounded-full text-sm border transition-colors",
                active
                  ? "!bg-primary !text-white !border-transparent"
                  : done
                    ? "bg-primary/10 text-primary border-transparent"
                    : "bg-white text-gray-500 border-gray-200"
              )}
            >
              {s.title}
            </li>
          );
        })}
      </ol>
      {(onPrevStep || onNextStep) && (
        <div className="mt-2 flex justify-between">
          <OutlineSweepButton
            size="middle"
            onClick={onPrevStep}
            disabled={!onPrevStep || currentStep === 0}
          >
            Back
          </OutlineSweepButton>
          <Button
            size="middle"
            type="primary"
            onClick={onNextStep}
            disabled={!onNextStep || currentStep >= steps!.length - 1}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  ) : null;

  const renderPageDots = () => {
    const total = actions?.pageDots?.total ?? 0;
    const current = actions?.pageDots?.current ?? 0;
    if (!total || total < 2) return null;

    return (
      <div className="flex items-center gap-2 pl-1" aria-hidden>
        {Array.from({ length: total }).map((_, idx) => {
          const active = idx === current;
          return (
            <span
              key={idx}
              aria-label={`Page ${idx + 1}`}
              className={clsx(
                "inline-block h-2.5 w-2.5 rounded-full shrink-0",
                active ? "bg-primary" : "bg-primary/20"
              )}
            />
          );
        })}
      </div>
    );
  };

  const renderFooter =
    footer === null
      ? null
      : (footer ?? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              {/* Dots first, then any extra content user passes in */}
              {renderPageDots()}
              {actions?.extra ?? null}
            </div>

            <div className="ml-auto flex gap-2">
              {!actions?.hideCancel && (
                <OutlineSweepButton size="middle" onClick={onClose}>
                  {actions?.cancelText ?? "Cancel"}
                </OutlineSweepButton>
              )}

              {(actions?.items ?? []).map((a, i) =>
                a.variant === "primary" || (i === 0 && !a.variant) ? (
                  <Button
                    key={a.key ?? i}
                    type="primary"
                    danger={a.danger}
                    htmlType={a.htmlType}
                    loading={a.loading}
                    disabled={a.disabled}
                    onClick={a.onClick}
                    size="middle"
                  >
                    {a.label}
                  </Button>
                ) : (
                  <OutlineSweepButton
                    key={a.key ?? i}
                    onClick={a.onClick}
                    disabled={a.disabled}
                    size="middle"
                  >
                    {a.label}
                  </OutlineSweepButton>
                )
              )}
            </div>
          </div>
        ));

  return (
    <Modal
      title={renderHeader}
      open={open}
      onCancel={onClose}
      footer={renderFooter}
      destroyOnHidden={destroyOnHidden ?? destroyOnClose}
      maskClosable={maskClosable}
      keyboard={keyboard}
      centered={centered}
      width={width}
      className={clsx("!p-0", className)}
      closable={false}
    >
      {renderStepper}
      <div className={clsx(hasSteps ? "mt-2" : "mt-1")}>{children}</div>
    </Modal>
  );
}
