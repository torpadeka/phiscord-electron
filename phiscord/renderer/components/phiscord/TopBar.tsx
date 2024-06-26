import firebase, { firestore } from "../../../firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
import type { Auth } from "firebase/auth";

import { useEffect, useState } from "react";

import { MdOutlineDarkMode } from "react-icons/md";
import { FaSignOutAlt } from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";

import { useRouter } from "next/router";

const TopBar = () => {
    const auth = firebase.auth() as unknown as Auth;
    const [user, loading, error] = useAuthState(auth);

    const [darkTheme, setDarkTheme] = useState(null);

    const router = useRouter();

    useEffect(() => {
        if (darkTheme === null) return;

        if (!(typeof document === "undefined")) {
            if (darkTheme) document.documentElement.classList.add("dark");
            else document.documentElement.classList.remove("dark");
        }
    }, [darkTheme]);

    useEffect(() => {
        if (user) {
            const getDarkModeSetting = async () => {
                const userDoc = await firestore
                    .collection("users")
                    .doc(user.uid)
                    .get();
                if (userDoc.exists) {
                    const useDarkMode = userDoc.data()?.useDarkMode;
                    setDarkTheme(useDarkMode);
                }
            };
            getDarkModeSetting();
        }
    }, []);

    useEffect(() => {
        if (user) {
            const updateDarkModeSetting = async () => {
                const userRef = await firestore.collection("users").doc(user.uid).get();
                if(userRef.exists){
                    await firestore.collection("users").doc(user.uid).update({
                        useDarkMode: darkTheme,
                    });
                }
            };
            updateDarkModeSetting();
        }
    }, [darkTheme, user]);

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
