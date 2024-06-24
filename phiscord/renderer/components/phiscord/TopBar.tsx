import firebase from "../../../firebase/clientApp";

import { useState } from "react";

import { MdOutlineDarkMode } from "react-icons/md";
import { FaSignOutAlt } from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";

import { useRouter } from "next/router";

const TopBar = () => {
    const [darkTheme, setDarkTheme] = useState(true);

    const router = useRouter();

    if (!(typeof document === "undefined")) {
        if (darkTheme) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
    }

    return (
        <>
            <div className="fixed top-0 h-14 w-full flex items-center justify-end px-2 bg-slate-300 dark:bg-slate-600 gap-2">
                <TopBarIcon
                    onClick={() => {
                        setDarkTheme(!darkTheme);
                    }}
                    icon={<MdOutlineDarkMode size={30} />}
                />
                <TopBarIcon
                    onClick={() => {
                        router.push("/settings");
                    }}
                    icon={<IoMdSettings size={25} />}
                ></TopBarIcon>
                <TopBarIcon
                    onClick={() => {
                        firebase.auth().signOut();
                    }}
                    icon={<FaSignOutAlt size={25} />}
                />
            </div>
        </>
    );
};

const TopBarIcon = ({ icon, onClick }) => {
    return (
        <>
            <div
                onClick={onClick}
                className="w-10 h-10 flex items-center justify-center bg-slate-200 dark:bg-slate-700 hover:brightness-150
            rounded-3xl shadow-lg hover:rounded-xl transition-all duration-75 cursor-pointer"
            >
                {icon}
            </div>
        </>
    );
};

export default TopBar;
