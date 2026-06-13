// ---------- Botón base consistente ----------
export function Btn({ children, variant = "primary", size = "md", disabled, onClick, className = "", iconLeft, iconRight, type = "button", }: {
    children?: React.ReactNode;
    variant?: "primary" | "success" | "secondary" | "danger" | "ghost";
    size?: "sm" | "md";
    disabled?: boolean;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    className?: string;
    iconLeft?: React.ReactNode;
    iconRight?: React.ReactNode;
    type?: "button" | "submit";
}) {
    const base =
        "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
    const sizes = size === "sm" ? "h-9 px-3 text-sm gap-2" : "h-10 px-4 text-sm gap-2";

    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600",
        success: "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-600",
        secondary: "bg-gray-900 text-white hover:bg-black focus-visible:ring-gray-900",
        danger: "bg-white text-red-600 border border-red-300 hover:bg-red-50 focus-visible:ring-red-600",
        ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-400",
        outline: "bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-400",
    } as const;

    return (
        <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes} ${variants[variant]} ${className}`}>
            {iconLeft ? <span className="-ml-0.5">{iconLeft}</span> : null}
            {children}
            {iconRight ? <span className="-mr-0.5">{iconRight}</span> : null}
        </button>
    );
}