// src/components/Container.tsx
type Props = React.PropsWithChildren<{ className?: string }>;

export default function Container({ children, className = "" }: Props) {
  return (
    <div
      className={`mx-auto w-full max-w-container px-4 sm:px-6 lg:px-8 ${className}`}
    >
      {children}
    </div>
  );
}
