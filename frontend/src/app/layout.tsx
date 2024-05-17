import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import {cn} from "@/lib/utils";
import {ThemeProvider} from "@/components/theme-provider";
import React from "react";
import {Toaster} from "@/components/ui/toaster";
import {AppQueryClientProvider} from "@/components/app-query-client-provider";

const inter = Inter({subsets: ["latin"], variable: "--font-sans"});

export const metadata: Metadata = {
    title: "AirTags",
    description: "AirTags dashboard",
};

export default function RootLayout({children}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body className={cn(
            "min-h-screen bg-background font-sans antialiased",
            inter.variable
        )}>
        <Toaster/>
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
        >
            <AppQueryClientProvider>
                {children}
            </AppQueryClientProvider>
        </ThemeProvider>
        </body>
        </html>
    );
}
