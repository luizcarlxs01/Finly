import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  variant?: "default" | "landing";
};

export function PageContainer({
  children,
  variant = "default",
}: PageContainerProps) {
  const className =
    variant === "landing"
      ? "finly-home-atmosphere min-h-screen w-full overflow-x-clip pt-8 sm:pt-10 lg:pt-14"
      : "mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14";

  return (
    <div className={className} data-variant={variant}>
      {children}
    </div>
  );
}
