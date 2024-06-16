import React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import SideBar from "@/components/phiscord/SideBar";

export default function HomePage() {
    return (
        <>
            <SideBar></SideBar>
            <Link className="h-200 w-100 flex flex-col items-center justify-center bg-blue-200 shadow-md" href="/auth">Login</Link>
        </>
    );
}
