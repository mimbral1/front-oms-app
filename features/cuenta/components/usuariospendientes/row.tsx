export function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <label className="min-w-[120px] text-sm text-gray-600 pt-2">
        {label}
      </label>
      <div className="flex-1">{children}</div>
    </div>
  );
}
