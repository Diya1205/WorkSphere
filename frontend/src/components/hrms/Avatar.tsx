import { initials, avatarColor } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

const sizeMap = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

export function Avatar({ name, size = "md", color, className }: Props) {
  const bg = color ?? avatarColor(name);
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white tabular",
        sizeMap[size],
        className,
      )}
      style={{ backgroundColor: bg }}
      aria-label={name}
    >
      {initials(name)}
    </div>
  );
}
