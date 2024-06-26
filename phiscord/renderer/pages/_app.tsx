import type { AppProps } from "next/app";
import "../styles/globals.css";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import firebase from "../../firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
import { Auth } from "firebase/auth";
import { monitorUserStatus } from "../functions/updateUserStatus";

const fontSans = FontSans({
    subsets: ["latin"],
    variable: "--font-sans",
});

function MyApp({ Component, pageProps }: AppProps) {
    const auth = firebase.auth() as unknown as Auth;
    const [user, loading, error] = useAuthState(auth);

    useEffect(() => {
        if (user && !loading) {
            monitorUserStatus(user.uid);
        }
    }, [user, loading]);

    return (
        <div className={cn("font-sans antialiased", fontSans.variable)}>
            <Component {...pageProps} />
        </div>
    );
}

export default MyApp;
