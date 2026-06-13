"use client";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

type CenteredLoadingProps = {
    label?: string;
    size?: number;
    minHeightClassName?: string;
};

export default function CenteredLoading({
    label = "Loading...",
    size = 72,
    minHeightClassName = "min-h-[calc(100vh-220px)]",
}: CenteredLoadingProps) {
    return (
        <div className={`flex ${minHeightClassName} items-center justify-center`}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                <CircularProgress size={size} thickness={4.5} aria-label={label} />
                <Typography variant="body2" color="text.secondary">
                    {label}
                </Typography>
            </Box>
        </div>
    );
}
