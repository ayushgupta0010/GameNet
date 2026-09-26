import { Space_Grotesk, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export const metadata = {
  title: "GameNet — find your next game",
  description:
    "Pick up to five games you love and get a selected-games of similar titles, pulled from RAWG and shaped by AI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="bg-ink-950 text-parchment-100 font-body antialiased">
        {children}
      </body>
    </html>
  );
}
