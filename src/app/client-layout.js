"use client";
import { ApiProvider } from "../contexts/ApiContext";

export function ClientLayout({ children }) {
  return <ApiProvider>{children}</ApiProvider>;
}