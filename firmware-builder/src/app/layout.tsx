import type {Metadata} from "next";
import "./globals.css";
import {Toaster} from "@/components/ui/toaster";
import {AppQueryClientProvider} from "@/components/app-query-client-provider";

export const metadata: Metadata = {
    title: "Espeon-Builder",
    description: "Espeon AirWCH firmware builder",
};

export default function RootLayout({children,}: Readonly<{ children: React.ReactNode; }>) {
    return (
        <html lang="en">
        <body>
        <Toaster/>
        <AppQueryClientProvider>
            {children}
        </AppQueryClientProvider>
        </body>
        </html>
    );
}