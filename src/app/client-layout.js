"use client";
import { AuthProvider } from "../contexts/AuthContext.jsx";

export function ClientLayout({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}