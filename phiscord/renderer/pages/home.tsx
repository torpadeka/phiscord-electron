import React, { useActionState } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import { useState } from "react";

import SideBar from "@/components/phiscord/SideBar";

import firebase from "../../firebase/clientApp";
import { withAuth } from "@/hoc/withAuth";
import Welcome from "@/components/phiscord/Welcome";

export default withAuth(function HomePage() {
    const [activePage, setActivePage] = useState("welcome");

    return (
        <>
            <SideBar onIconClick={setActivePage}></SideBar>
            
            <div className="ml-20 mt-16 flex flex-col w-full h-screen items-center justify-center">
                {activePage === "welcome" && <Welcome />}
                <button
                    className="h-10 w-40 flex bg-blue-200 shadow-md items-center justify-center"
                    onClick={() => {
                        firebase.auth().signOut();
                    }}
                >
                    Sign Out
                </button>
            </div>
        </>
    );
});
