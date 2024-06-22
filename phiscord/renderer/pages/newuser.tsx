import React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import { withAuth } from "@/hoc/withAuth";
import { LuBox } from "react-icons/lu";
import NewUserPrompt from "@/components/phiscord/NewUserPrompt";

export default withAuth(function NewUserPage() {
    // Set to dark mode (default theme)
    document.documentElement.classList.add("dark");

    return (
        <>
            <div className="dark flex flex-col items-center justify-center gap-10 h-screen w-screen">
                <LuBox
                    className="hover:scale-105 transition-all duration-150 shadow-lg"
                    size={100}
                ></LuBox>
                <div className="text-4xl font-bold">Welcome to PHiscord!</div>
                <div className="text-xl">New User, Please Enter Your Username and Tag</div>
                <NewUserPrompt/>
            </div>
        </>
    );
});
