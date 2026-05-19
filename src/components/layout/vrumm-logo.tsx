import { cn } from "@/lib/utils";

function VrummIconMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="0" y="0" width="64" height="64" rx="18" fill="#F59E0B" />
      <polyline
        points="12,54 27,28 42,54"
        stroke="#09090b"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.28"
      />
      <polyline
        points="26,54 41,28 56,54"
        stroke="#09090b"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function VrummLogo({
  className,
  iconSize = 32,
  textClass,
}: {
  className?: string;
  iconSize?: number;
  textClass?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)} aria-label="Vrumm">
      <VrummIconMark size={iconSize} />
      <span
        className={cn(
          "font-display font-black uppercase tracking-tight leading-none",
          textClass ?? "text-xl"
        )}
      >
        VRUMM
      </span>
    </div>
  );
}

export { VrummIconMark };
