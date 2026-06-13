import clsx from "clsx";
import { avatarBase, avatarDefaultBg, avatarText } from "./avatar.styles";

const avatarColorPalette = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-amber-500",
];

interface AvatarProps {
  name?: string;
  src?: string;
  alt?: string;
  /** utilidades tailwind extra  */
  className?: string;
}

export const getUserInitials = (name?: string, fallback = "US") => {
  const tokens = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return fallback;
  }

  if (tokens.length === 1) {
    return tokens[0].charAt(0).toUpperCase();
  }

  return `${tokens[0].charAt(0)}${tokens[tokens.length - 1].charAt(0)}`.toUpperCase();
};

const getAvatarBgByName = (name?: string) => {
  const key = (name ?? "").trim().toLowerCase();
  if (!key) return avatarDefaultBg;

  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }

  const index = Math.abs(hash) % avatarColorPalette.length;
  return avatarColorPalette[index];
};

export const Avatar = ({ name, src, alt, className }: AvatarProps) => {
  const initials = getUserInitials(name);

  // ¿el caller ya envía un bg-*?
  const hasCustomBg = className?.match(/\bbg-[\w-]+\b/);
  const autoBg = getAvatarBgByName(name);

  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? name ?? "Avatar"}
        className={clsx("h-8 w-8 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={clsx(
        avatarBase,
        !hasCustomBg && autoBg,
        avatarText,
        className
      )}
    >
      {initials}
    </div>
  );
};
