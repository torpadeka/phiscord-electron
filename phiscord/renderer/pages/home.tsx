import React, { use, useActionState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import { useState } from "react";

import SideBar from "@/components/phiscord/SideBar";
import { withAuth } from "@/hoc/withAuth";
import WelcomePrompt from "@/components/phiscord/WelcomePrompt";
import TopBar from "@/components/phiscord/TopBar";
import Dashboard from "@/components/phiscord/Dashboard";
import UserProfileBox from "@/components/phiscord/UserProfileBox";

export default withAuth(function HomePage() {
    const [activePage, setActivePage] = useState("welcome");
    // const auth = firebase.auth() as unknown as Auth;
    // const [user, loading, error] = useAuthState(auth);

    // const userQuery = firestore.collection("users").where("uid", "==", user.uid);
    // const userData = await userQuery.get();

    return (
        <>
            <TopBar></TopBar>
            <SideBar onIconClick={setActivePage}></SideBar>

            <div className="pl-20 pt-14 h-screen w-screen">
                {activePage === "welcome" && <WelcomePrompt />}
                {activePage === "dashboard" && (
                    <>
                        <Dashboard />
                        <UserProfileBox />
                    </>
                )}
            </div>
        </>
    );
});
