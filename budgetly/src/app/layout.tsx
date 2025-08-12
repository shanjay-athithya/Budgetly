import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { DataProvider } from "../context/DataContext";

export const metadata: Metadata = {
  title: {
    default: "Budgetly - Personal Finance Tracker",
    template: "%s | Budgetly",
  },
  description:
    "Track your expenses, manage income, plan EMIs, and achieve your financial goals with Budgetly.",
  keywords: [
    "budgetly",
    "expense tracker",
    "personal finance",
    "income management",
    "emi planner",
    "savings",
    "reports",
    "financial dashboard",
  ],
  applicationName: "Budgetly",
  authors: [{ name: "Budgetly Team" }],
  creator: "Budgetly",
  publisher: "Budgetly",
  metadataBase: new URL("http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "Budgetly - Personal Finance Tracker",
    description:
      "Track your expenses, manage income, plan EMIs, and achieve your financial goals with Budgetly.",
    siteName: "Budgetly",
    locale: "en_US",
    images: [
      {
        url: "/vercel.svg",
        width: 1200,
        height: 630,
        alt: "Budgetly Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Budgetly - Personal Finance Tracker",
    description:
      "Track your expenses, manage income, plan EMIs, and achieve your financial goals with Budgetly.",
    images: ["/vercel.svg"],
    creator: "@budgetly",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-snippet': -1,
      'max-image-preview': "large",
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  themeColor: "#1C1C1E",
  colorScheme: "dark",
  category: "Finance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-['Lexend']">
        <AuthProvider>
          <DataProvider>
            {children}
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
