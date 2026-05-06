"use client";
import { AuthProvider } from "../contexts/AuthContext.jsx";
import { AudienceProvider } from "../contexts/AudienceContext.jsx";

export function ClientLayout({ children }) {
  return (
    <AuthProvider>
      <AudienceProvider>{children}</AudienceProvider>
    </AuthProvider>
  );
}
