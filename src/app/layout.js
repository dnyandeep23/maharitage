import { inter, playfairDisplay, cinzelDecorative, lexend } from "./fonts";
import "./globals.css";
import { ClientLayout } from "./client-layout";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://maharitage.vercel.app"),
  title: {
    default: "MahaRitage | Maharashtra Digital Heritage Archive",
    template: "%s | MahaRitage",
  },
  description:
    "A cinematic digital archive for Maharashtra heritage sites, forts, caves, inscriptions, architecture, galleries, and preservation metadata.",
  keywords: [
    "Maharashtra heritage",
    "MahaRitage",
    "forts of Maharashtra",
    "caves of Maharashtra",
    "digital heritage archive",
    "inscriptions",
    "architecture archive",
  ],
  openGraph: {
    title: "MahaRitage | Maharashtra Digital Heritage Archive",
    description:
      "Explore Maharashtra's forts, caves, inscriptions, architecture, and archival records through a premium digital heritage platform.",
    type: "website",
    locale: "en_IN",
    siteName: "MahaRitage",
  },
  twitter: {
    card: "summary_large_image",
    title: "MahaRitage | Maharashtra Digital Heritage Archive",
    description:
      "A cinematic digital archive for Maharashtra heritage, cultural records, and preservation workflows.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfairDisplay.variable} ${cinzelDecorative.variable} ${lexend.variable}`}
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
        <meta name="apple-mobile-web-app-title" content="MahaRitage" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
