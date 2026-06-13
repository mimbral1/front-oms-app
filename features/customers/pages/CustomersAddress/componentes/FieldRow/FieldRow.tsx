import { cn } from "@/lib/utils";

export function FieldRow({
  label,
  children,
  borderBottom = false,
}: {
  label: string;
  children: React.ReactNode;
  borderBottom?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[160px_auto] items-center gap-4",
        borderBottom && "border-b border-gray-300",
        "py-2"
      )}
    >
      <span className="text-sm text-gray-600">{label}</span>
      {children}
    </div>
  );
}
