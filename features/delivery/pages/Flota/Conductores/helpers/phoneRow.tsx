import { XMarkIcon } from "@heroicons/react/24/outline";
import { Input } from "@mui/material";

export function PhoneRow({
  value,
  onChange,
  onDelete,
}: {
  value: string;
  onChange: (v: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="tel"
        className="flex-1/2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={onDelete}
        className="rounded p-1 text-red-500 hover:bg-red-50"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
