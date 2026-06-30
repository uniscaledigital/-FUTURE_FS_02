import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      className={cn(
        "relative overflow-hidden rounded-2xl bg-slate-200/70 before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-slate-200/50 before:to-transparent before:animate-[shine_1.5s_infinite]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
