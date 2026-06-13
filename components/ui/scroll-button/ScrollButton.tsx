"use client";

import { useEffect, useState } from "react";
import {
    ChevronUpIcon,
    ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { scrollButtonBase, scrollButtonIcon } from "./scroll-button.styles";

export default function ScrollButton() {
    const [direction, setDirection] = useState<"down" | "up">("down");

    const updateState = () => {
        const scrollY = window.scrollY;
        const viewportHeight = window.innerHeight;
        const pageHeight = document.documentElement.scrollHeight;

        const isNearBottom =
            scrollY + viewportHeight >= pageHeight - 120;

        // 🔥 Solo permitir "up" si realmente hiciste scroll
        if (scrollY > 50 && isNearBottom) {
            setDirection("up");
        } else {
            setDirection("down");
        }
    };

    useEffect(() => {
        window.addEventListener("scroll", updateState);
        window.addEventListener("resize", updateState);

        return () => {
            window.removeEventListener("scroll", updateState);
            window.removeEventListener("resize", updateState);
        };
    }, []);

    const handleClick = () => {
        if (direction === "down") {
            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: "smooth",
            });
        } else {
            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        }
    };

    return (
        <button
            onClick={handleClick}
            className={scrollButtonBase}
            title={direction === "down" ? "Ir abajo" : "Ir arriba"}
        >
            {direction === "down" ? (
                <ChevronDownIcon className={scrollButtonIcon} />
            ) : (
                <ChevronUpIcon className={scrollButtonIcon} />
            )}
        </button>
    );
}
