import type { AppProps } from "next/app";

import "../styles/globals.css";

// Inter Font
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";

const fontSans = FontSans({
    subsets: ["latin"],
    variable: "--font-sans",
});

function MyApp({ Component, pageProps }: AppProps) {
    // outer div will apply the Inter font to ALL
    return (
        <>
            <div className={cn("font-sans antialiased", fontSans.variable)}>
                <Component {...pageProps} F />
            </div>
        </>
    );
}

export default MyApp;
