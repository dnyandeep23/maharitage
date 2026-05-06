"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AUDIENCE_STORAGE_KEY = "heritagex:audience";

const AudienceContext = createContext(null);

const normalizeAudience = (value) =>
  value === "student" ? "student" : value === "general" ? "general" : null;

export const AudienceProvider = ({ children }) => {
  const [audience, setAudience] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedAudience = normalizeAudience(
      sessionStorage.getItem(AUDIENCE_STORAGE_KEY)
    );
    if (storedAudience) {
      setAudience(storedAudience);
    }
    setIsReady(true);
  }, []);

  const selectAudience = useCallback((nextAudience) => {
    const normalizedAudience = normalizeAudience(nextAudience);
    if (!normalizedAudience) return false;
    sessionStorage.setItem(AUDIENCE_STORAGE_KEY, normalizedAudience);
    setAudience(normalizedAudience);
    return true;
  }, []);

  const value = useMemo(
    () => ({
      audience,
      isReady,
      selectAudience,
    }),
    [audience, isReady, selectAudience]
  );

  return (
    <AudienceContext.Provider value={value}>
      {children}
    </AudienceContext.Provider>
  );
};

export const useAudience = () => {
  const context = useContext(AudienceContext);
  if (!context) {
    throw new Error("useAudience must be used within an AudienceProvider");
  }
  return context;
};
