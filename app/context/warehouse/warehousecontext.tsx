"use client";

import React, { createContext, useContext, useState } from "react";

export type HeaderComponent = React.ReactNode;

interface Ctx {
  header: HeaderComponent;
  setHeader: (h: HeaderComponent) => void;
}

const WarehouseHeaderContext = createContext<Ctx>({
  header: null,
  setHeader: () => {},
});

export const useWarehouseHeader = () => useContext(WarehouseHeaderContext);

export const WarehouseHeaderProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [header, setHeader] = useState<HeaderComponent>(null);
  return (
    <WarehouseHeaderContext.Provider value={{ header, setHeader }}>
      {children}
    </WarehouseHeaderContext.Provider>
  );
};
