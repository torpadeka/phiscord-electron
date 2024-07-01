import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import SideBar from "@/components/phiscord/SideBar";
import { withAuth } from "@/hoc/withAuth";
import TopBar from "@/components/phiscord/TopBar";
import Dashboard from "@/components/phiscord/Dashboard";
import UserProfileBox from "@/components/phiscord/UserProfileBox";

const HomePage = () => {
    const [activePage, setActivePage] = useState(["dashboard", null]);

    return (
        <div className="fade-in">
            <TopBar />
            <SideBar setActivePage={setActivePage} />
            <div className="content">
                {activePage[0] === "dashboard" && <Dashboard />}
                <UserProfileBox />
            </div>
        </div>
    );
};

export default withAuth(HomePage);
