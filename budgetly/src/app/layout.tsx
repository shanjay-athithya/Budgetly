import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { DataProvider } from "../context/DataContext";

export const metadata: Metadata = {
  title: "Budgetly - Personal Finance Tracker",
  description: "Track your expenses, manage income, and achieve your financial goals with Budgetly",
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
