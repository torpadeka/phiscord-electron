import firebase, { firestore } from "../../../firebase/clientApp";
import { database } from "../../../firebase/clientApp";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import type { Auth } from "firebase/auth";
import { AiOutlineLoading } from "react-icons/ai";
import {
    TbMicrophone,
    TbMicrophoneOff,
    TbHeadphones,
    TbHeadphonesOff,
} from "react-icons/tb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import UserProfilePopup from "./UserProfilePopup";

const fontSans = FontSans({
    subsets: ["latin"],
    variable: "--font-sans",
});

const UserProfileBox = ({
    dashboardContent,
    setDashboardContent,
    setActivePage,
}) => {
    const auth = firebase.auth() as unknown as Auth;
    const [user, loading, error] = useAuthState(auth);
    const [userData, setUserData] = useState(null);
    const [isMute, setIsMute] = useState(false);
    const [isDeafen, setIsDeafen] = useState(false);
    const [customStatus, setCustomStatus] = useState("");

    useEffect(() => {
        if (!user) return;

        const usersRef = firestore.collection("users");

        const getUserData = () => {
            const unsubscribe = usersRef
                .doc(user.uid)
                .onSnapshot((snapshot) => {
                    if (snapshot.exists) {
                        setUserData([
                            snapshot.data().username,
                            snapshot.data().tag,
                            snapshot.data().customStatus,
                            snapshot.data().profilePicture,
                        ]);
                    }
                });

            return unsubscribe;
        };

        const updateUserState = async () => {
            const userStatusRef = database.ref(`userState/${user.uid}`);

            await userStatusRef.update({ isDeafen: isDeafen });
            await userStatusRef.update({ isMute: isMute });
        };

        const unsubscribe = getUserData();
        updateUserState();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user, isMute, isDeafen]);

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center shadow-md text-white text-3xl gap-4">
                <AiOutlineLoading className="animate-spin" size="20" />
            </div>
        );
    }

    const handleStatusInputChange = (e) => {
        setCustomStatus(e.target.value);
    };

    const handleChangeCustomStatus = async () => {
        if (customStatus !== "") {
            // Add the new message to the conversation's "messages" collection
            await firestore.collection("users").doc(user.uid).update({
                customStatus: customStatus,
            });
        } else {
            await firestore.collection("users").doc(user.uid).update({
                customStatus: null,
            });
        }
    };

    return (
        <div className="flex justify-between px-4 items-center fixed min-w-72 max-w-72 left-0 bottom-0 h-16 ml-20 bg-slate-300 dark:bg-slate-800 gap-4">
            {userData !== null && (
                <>
                    <Popover>
                        <PopoverTrigger className="relative">
                            <Avatar className="bg-white">
                                <AvatarImage src={userData[3]} />
                                <AvatarFallback>{}</AvatarFallback>
                            </Avatar>
                            <div className="absolute bottom-0 right-0 flex items-center justify-center w-3 h-3 bg-slate-100 dark:bg-slate-900 rounded-full">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent
                            sideOffset={10}
                            className="w-min h-min bg-slate-100 dark:bg-slate-900 border-slate-500"
                        >
                            <UserProfilePopup
                                serverId={null}
                                userUid={user.uid}
                                dashboardContent={dashboardContent}
                                setDashboardContent={setDashboardContent}
                                setActivePage={setActivePage}
                            ></UserProfilePopup>
                        </PopoverContent>
                    </Popover>
                    <div className="flex items-center justify-center gap-2">
                        <Popover>
                            <PopoverTrigger
                                onClick={() => {
                                    if (userData[2] !== null) {
                                        setCustomStatus(userData[2]);
                                    }
                                }}
                            >
                                <div className="flex flex-col items-start justify-center text-sm w-32">
                                    <span className="font-semibold max-w-32 overflow-scroll no-scrollbar no-scrollbar::-webkit-scrollbar">
                                        {userData[0]}
                                    </span>
                                    <span className="text-slate-600 dark:text-slate-400 max-w-32 overflow-x-scroll whitespace-nowrap no-scrollbar no-scrollbar::-webkit-scrollbar">
                                        {userData[2] || "Online"}
                                    </span>
                                </div>
                            </PopoverTrigger>
                            <PopoverContent
                                sideOffset={10}
                                className="bg-slate-300 dark:bg-slate-900 w-60 border-slate-500"
                            >
                                <div className="w-full flex flex-col gap-6 items-center justify-center">
                                    <Input
                                        onChange={handleStatusInputChange}
                                        placeholder="I need coffee :("
                                        value={customStatus}
                                        className={cn(
                                            "dark:text-white text-sm w-48 h-8 font-sans antialiased p-2 rounded-2xl",
                                            fontSans.variable
                                        )}
                                        type="text"
                                    ></Input>
                                    <Button
                                        onClick={handleChangeCustomStatus}
                                        className="bg-slate-400 flex gap-2 items-center justify-center"
                                    >
                                        <span
                                            className={cn(
                                                "text-white dark:text-black text-sm font-sans antialiased",
                                                fontSans.variable
                                            )}
                                        >
                                            Change Status
                                        </span>
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        {!isMute && (
                            <TbMicrophone
                                className="hover:scale-110 transition-all cursor-pointer"
                                onClick={() => {
                                    setIsMute(true);

                                }}
                                size="25"
                            />
                        )}
                        {isMute && (
                            <TbMicrophoneOff
                                className="hover:scale-110 transition-all cursor-pointer"
                                color="red"
                                onClick={() => {
                                    setIsMute(false);
                                }}
                                size="25"
                            />
                        )}
                        {!isDeafen && (
                            <TbHeadphones
                                className="hover:scale-110 transition-all cursor-pointer"
                                onClick={() => {
                                    setIsDeafen(true);
                                }}
                                size="25"
                            />
                        )}
                        {isDeafen && (
                            <TbHeadphonesOff
                                className="hover:scale-110 transition-all cursor-pointer"
                                color="red"
                                onClick={() => {
                                    setIsDeafen(false);
                                }}
                                size="25"
                            />
                        )}
                    </div>
                </>
            )}
            {userData === null && (
                <div className="h-full w-full flex items-center justify-center shadow-md text-white text-3xl gap-4">
                    <AiOutlineLoading
                        className="animate-spin fill-black dark:fill-white"
                        size="20"
                    />
                </div>
            )}
        </div>
    );
};

export default UserProfileBox;
