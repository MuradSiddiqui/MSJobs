import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card/90 shadow-[0_1px_2px_oklch(0.22_0.02_255/0.04)]",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  tone = "muted",
  ...props
}: React.ComponentProps<"span"> & { tone?: "muted" | "accent" | "match" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium tracking-wide",
        tone === "accent" && "border-accent/25 bg-accent/10 text-accent",
        tone === "muted" && "border-transparent bg-muted text-muted-foreground",
        tone === "match" && "border-match-good/25 bg-match-good/10 text-match-good",
        className,
      )}
      {...props}
    />
  );
}
