import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const apercu = localFont({
  variable: "--font-apercu",
  display: "swap",
  src: [
    { path: "../fonts/apercu-pro/Apercu Pro Thin.otf", weight: "100", style: "normal" },
    {
      path: "../fonts/apercu-pro/Apercu Pro Thin Italic.otf",
      weight: "100",
      style: "italic",
    },
    {
      path: "../fonts/apercu-pro/Apercu Pro ExtraLight.otf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../fonts/apercu-pro/Apercu Pro ExtraLight Italic.otf",
      weight: "200",
      style: "italic",
    },
    { path: "../fonts/apercu-pro/Apercu Pro Light.otf", weight: "300", style: "normal" },
    {
      path: "../fonts/apercu-pro/Apercu Pro Light Italic.otf",
      weight: "300",
      style: "italic",
    },
    { path: "../fonts/apercu-pro/Apercu Pro Regular.otf", weight: "400", style: "normal" },
    { path: "../fonts/apercu-pro/Apercu Pro Italic.otf", weight: "400", style: "italic" },
    { path: "../fonts/apercu-pro/Apercu Pro Medium.otf", weight: "500", style: "normal" },
    {
      path: "../fonts/apercu-pro/Apercu Pro Medium Italic.otf",
      weight: "500",
      style: "italic",
    },
    { path: "../fonts/apercu-pro/Apercu Pro Bold.otf", weight: "700", style: "normal" },
    {
      path: "../fonts/apercu-pro/Apercu Pro Bold Italic.otf",
      weight: "700",
      style: "italic",
    },
    { path: "../fonts/apercu-pro/Apercu Pro Black.otf", weight: "900", style: "normal" },
    {
      path: "../fonts/apercu-pro/Apercu Pro Black Italic.otf",
      weight: "900",
      style: "italic",
    },
  ],
});

const apercuMono = localFont({
  variable: "--font-apercu-mono",
  display: "swap",
  src: [
    { path: "../fonts/apercu-pro/Apercu Mono Pro Light.otf", weight: "300", style: "normal" },
    {
      path: "../fonts/apercu-pro/Apercu Mono Pro Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/apercu-pro/Apercu Mono Pro Medium.otf",
      weight: "500",
      style: "normal",
    },
    { path: "../fonts/apercu-pro/Apercu Mono Pro Bold.otf", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "SIH Navigator | Smart India Hackathon Prep Platform",
  description:
    "Prepare for Smart India Hackathon with every problem statement, searchable and filterable across every ministry, domain, and year.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${apercu.variable} ${apercuMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
