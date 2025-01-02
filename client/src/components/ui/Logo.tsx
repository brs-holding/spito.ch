import { FC } from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-8",
  md: "h-12",
  lg: "h-16",
};

export const Logo: FC<LogoProps> = ({ className = "", size = "md" }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        className={sizes[size]}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="100" height="100" rx="20" fill="currentColor" />
        <path
          d="M30 30H70M30 50H70M30 70H70"
          stroke="white"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </svg>
      <span className={`font-bold tracking-tighter ${size === "sm" ? "text-xl" : size === "lg" ? "text-4xl" : "text-2xl"}`}>
        SPITO.CH
      </span>
    </div>
  );
};
