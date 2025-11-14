import { inter, playfairDisplay, cinzelDecorative } from "./fonts";
import "./globals.css";
import { ClientLayout } from "./client-layout";
import { AuthProvider } from "../contexts/AuthContext";

export const metadata = {
  title: "Maharitage",
  description: "Preserving Maharashtra's magnificent cave heritage.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfairDisplay.variable} ${cinzelDecorative.variable}`}
    >
      <head>
        <link
          rel="icon"
          type="image/png"
          href="/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <meta name="apple-mobile-web-app-title" content="MyWebSite" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="antialiased">
        <ClientLayout>
          <AuthProvider>{children}</AuthProvider>
        </ClientLayout>
      </body>
    </html>
  );
}
