import { LuBox } from "react-icons/lu";
import firebase, { firestore } from "../../../firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
import { Auth } from "firebase/auth";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { Inter as FontSans } from "next/font/google";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { FaPlus } from "react-icons/fa6";

const fontSans = FontSans({
    subsets: ["latin"],
    variable: "--font-sans",
});

const SideBar = ({ setActivePage }) => {
    const auth = firebase.auth() as unknown as Auth;
    const [user, loading, error] = useAuthState(auth);
    const [serverIds, setServerIds] = useState<string[]>([]);
    const [isCreatingNewServer, setIsCreatingNewServer] = useState(false);

    // useEffect(() => {
    //     if(user){
    //         const getUserServers = async () => {
    //             await firestore.collection("servers").where("serverMembers", "array-contains", user.uid).onSnapshot((

    //             ));
    //         }
    //     }
    // }, [])

    const createNewServerPrompt = async () => {
        setIsCreatingNewServer(true);
    };

    return (
        <>
            <Dialog
                open={isCreatingNewServer}
                onOpenChange={setIsCreatingNewServer}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle
                            className={cn(
                                "dark:text-white text-xl font-sans antialiased",
                                fontSans.variable
                            )}
                        >
                            Create New Server
                        </DialogTitle>
                        <DialogDescription
                            className={cn(
                                "dark:text-white text-xl font-sans antialiased",
                                fontSans.variable
                            )}
                        ></DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
            <div
                className="flex flex-col items-center fixed top-0 left-0 w-20 m-0 h-screen
                        dark:bg-slate-900 bg-slate-200 dark:text-white overflow-scroll no-scrollbar::-webkit-scrollbar no-scrollbar"
            >
                <SideBarIcon
                    icon={<LuBox size={30} />}
                    onClick={() => setActivePage(["dashboard", null])}
                />

                <SideBarIcon
                    icon={<FaPlus size={30} />}
                    onClick={createNewServerPrompt}
                />
            </div>
        </>
    );
};

const SideBarIcon = ({ icon, onClick }) => {
    return (
        <>
            <div
                onClick={onClick}
                className="flex items-center justify-center min-h-14 w-14 my-2 shadow-lg bg-white dark:bg-slate-500 rounded-3xl hover:rounded-xl
                dark:hover:bg-slate-500 transition-all ease-in-out cursor-pointer"
            >
                {icon}
            </div>
        </>
    );
};

export default SideBar;
