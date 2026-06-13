/* "use client";

import React, { ReactNode } from "react";
import { IconType } from "react-icons";

type IconProp = IconType | React.ElementType | React.ReactNode | undefined;
interface CardProps {
  title: string;
  icon?: IconProp;
  children?: React.ReactNode;
  className?: string;
  hasOptions?: boolean;
  hasTitleDivider?: boolean;
  noDefaultStyles?: boolean; // Nueva prop para omitir estilos por defecto
}

const Card: React.FC<CardProps> = ({
  title,
  icon: Icon,
  children,
  className = "",
  hasOptions = false,
  hasTitleDivider = false,
  noDefaultStyles = false,
}) => {
  const defaultStyles =
    "bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow relative";

  // Si noDefaultStyles es true, se aplican solo los estilos pasados por props
  const combinedClassName = noDefaultStyles
    ? className
    : `${defaultStyles} ${className}`;
  const IconComponent = Icon as React.FC<{ className?: string }>;

  let iconElement: React.ReactNode = null;
  if (Icon) {
    // Si ya es un nodo JSX lo usamos tal cual
    if (React.isValidElement(Icon)) {
      iconElement = Icon;
    } else {
      // Si es la referencia al componente => lo instanciamos
      const IconComp = Icon as React.ElementType;
      iconElement = <IconComp className="h-6 w-6 text-gray-500" />;
    }
  }

  return (
    <div className={combinedClassName}>
      <div className="flex items-center">
        <div className="flex items-center gap-3">
          {Icon && <IconComponent className="w-6 h-6 text-gray-500" />}
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        </div>
        {hasTitleDivider && <div className="flex-1 h-px bg-gray-800 mx-4" />}
        {hasOptions && (
          <button className="p-2 hover:bg-gray-100 rounded-full transition">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6h.01M12 12h.01M12 18h.01"
              />
            </svg>
          </button>
        )}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
};

export default Card;
 */

// views/PedidosView/Detalles-Pedido/components/Card.tsx
"use client";

import React from "react";
import { IconType } from "react-icons";

type IconProp = IconType | React.ElementType | React.ReactNode | undefined;

interface CardProps {
  title: string;
  icon?: IconProp;
  children?: React.ReactNode;
  className?: string;
  hasOptions?: boolean;
  hasTitleDivider?: boolean;
  noDefaultStyles?: boolean;

  borderClass?: string;
  roundedClass?: string;
  titleClassName?: string;
}

const Card: React.FC<CardProps> = ({
  title,
  icon,
  children,
  className = "",
  hasOptions = false,
  hasTitleDivider = false,
  noDefaultStyles = false,
  borderClass = "border-gray-200",
  roundedClass = "rounded-xl",
  titleClassName = "text-lg",
}) => {
  /* ---------- estilos ---------- */
  /* const base = "bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"; */
  /* const merged = noDefaultStyles ? className : `${base} ${className}`; */

  const base = "bg-white shadow-sm p-6 hover:shadow-md transition-shadow";
  const merged = noDefaultStyles
    ? className
    : `${base} border ${borderClass} ${roundedClass} ${className}`;

  /* ---------- icono ---------- */
  let iconElement: React.ReactNode = null;

  if (icon) {
    // ① Si ya viene como <CubeIcon …/>
    if (React.isValidElement(icon)) {
      iconElement = icon;
    } else {
      // ② Si viene como CubeIcon (referencia)
      const IconComp = icon as React.ElementType;
      iconElement = <IconComp className="h-8 w-8 text-gray-500" />;
    }
  }

  return (
    <div className={merged}>
      {/* Header ------------------------------------------------------ */}
      <div className="flex items-center">
        <div className="flex items-center gap-3">
          {iconElement}
          <h2 className={`${titleClassName} font-semibold text-gray-800`}>
            {title}
          </h2>
        </div>

        {hasTitleDivider && <div className="flex-1 h-px bg-gray-800 mx-4" />}

        {hasOptions && (
          <button className="p-2 hover:bg-gray-100 rounded-full transition">
            {/* … icono “options” … */}
            <svg
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              fill="none"
              className="w-6 h-6 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6h.01M12 12h.01M12 18h.01"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Body -------------------------------------------------------- */}
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
};

export default Card;
