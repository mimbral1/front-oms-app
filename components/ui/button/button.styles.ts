// ─── Button Styles ──────────────────────────────────────────────────────────
import { cva } from "class-variance-authority";

// ActionButton (CVA)
export const actionButtonVariants = cva(
    "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95",
    {
        variants: {
            variant: {
                primary: "bg-blue-700 text-white hover:bg-blue-800",
                secondary:
                    "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
                success: "bg-green-500 text-white hover:bg-green-600",
                warning: "bg-yellow-500 text-white hover:bg-yellow-600",
                green: "bg-[#3db779] text-white hover:bg-[#34a06e]",
                gray: "bg-gray-200 text-gray-600 hover:bg-gray-300",
                text: "bg-transparent text-gray-600 shadow-none hover:text-gray-800",
                pick: "bg-blue-500 text-white hover:bg-blue-600",
                error: "bg-red-500 text-white hover:bg-red-600",
                danger: "bg-red-500 text-white hover:bg-red-600",
            },
            size: {
                default: "h-10",
                sm: "h-8",
                lg: "h-12 px-5",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "default",
        },
    }
);

// PrimaryButton
export const primaryBaseStyles =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";

export const primaryVariants: Record<string, string> = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
};

export const primarySpinner = "mr-2 h-4 w-4 animate-spin";
export const primaryIcon = "mr-2 h-4 w-4";
