"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type DeveloperSettings = {
  footerEnabled: boolean;
  setFooterEnabled: (value: boolean) => void;
  goldenSpiralEnabled: boolean;
  setGoldenSpiralEnabled: (value: boolean) => void;
  goldenSpiralMirrorX: boolean;
  setGoldenSpiralMirrorX: (value: boolean) => void;
  goldenSpiralMirrorY: boolean;
  setGoldenSpiralMirrorY: (value: boolean) => void;
};

const DeveloperSettingsContext = createContext<DeveloperSettings | null>(null);

export function DeveloperSettingsProvider({ children }: { children: ReactNode }) {
  const [footerEnabled, setFooterEnabled] = useState(false);
  const [goldenSpiralEnabled, setGoldenSpiralEnabled] = useState(false);
  const [goldenSpiralMirrorX, setGoldenSpiralMirrorX] = useState(false);
  const [goldenSpiralMirrorY, setGoldenSpiralMirrorY] = useState(false);

  useEffect(() => {
    if (footerEnabled) {
      document.documentElement.dataset.footerEnabled = "true";
      return;
    }

    delete document.documentElement.dataset.footerEnabled;
    return () => {
      delete document.documentElement.dataset.footerEnabled;
    };
  }, [footerEnabled]);

  return (
    <DeveloperSettingsContext.Provider
      value={{
        footerEnabled,
        setFooterEnabled,
        goldenSpiralEnabled,
        setGoldenSpiralEnabled,
        goldenSpiralMirrorX,
        setGoldenSpiralMirrorX,
        goldenSpiralMirrorY,
        setGoldenSpiralMirrorY,
      }}
    >
      {children}
    </DeveloperSettingsContext.Provider>
  );
}

export function useDeveloperSettings() {
  const context = useContext(DeveloperSettingsContext);
  if (!context) {
    throw new Error("useDeveloperSettings must be used within DeveloperSettingsProvider");
  }
  return context;
}
