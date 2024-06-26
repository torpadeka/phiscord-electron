import React, { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import StyledFirebaseAuth from "@/components/firebase/StyledFirebaseAuth";
import firebase from "../../firebase/clientApp";
import { withoutAuth } from "@/hoc/withoutAuth";
import { LuBox } from "react-icons/lu";

const uiConfig = {
    signInFlow: "popup",
    signInSuccessUrl: "/home",
    signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
    ],
};

export default withoutAuth(function AuthPage() {
    

    // Set to dark mode (default theme)
    useEffect(() => {
        if (typeof document !== "undefined") {
            document.documentElement.classList.add("dark");
        }
    }, []);

    return (
        <div className="fade-in">
            <div className="bg-slate-9500 flex flex-col items-center justify-center gap-10 h-screen w-screen">
                <LuBox
                    className="hover:scale-105 transition-all duration-150 shadow-lg"
                    size={100}
                ></LuBox>
                <div className="text-4xl font-bold">Welcome to PHiscord!</div>
                <div className="text-xl">Sign-in to Continue</div>
                <StyledFirebaseAuth
                    className="w-80"
                    uiConfig={uiConfig}
                    firebaseAuth={firebase.auth()}
                />
            </div>
        </div>
    );
});
