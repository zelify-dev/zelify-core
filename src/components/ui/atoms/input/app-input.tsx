import type { InputHTMLAttributes } from "react";

type AppInputProps = InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export function AppInput({ className, type = "text", ...props }: AppInputProps) {
  const classes = ["zelify-input", className ?? ""].filter(Boolean).join(" ");

  return <input type={type} className={classes} {...props} />;
}
