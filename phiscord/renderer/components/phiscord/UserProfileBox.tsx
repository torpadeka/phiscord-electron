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

const UserProfileBox = () => {
    const auth = firebase.auth() as unknown as Auth;
    const [user, loading, error] = useAuthState(auth);
    const [userData, setUserData] = useState(null);
    const [isMute, setIsMute] = useState(false);
    const [isDeafen, setIsDeafen] = useState(false);

    useEffect(() => {
        if (!user) return;

        const usersRef = firestore.collection("users");

        const getUserData = async () => {
            const userDoc = await usersRef.doc(user.uid).get();

            if (userDoc.exists) {
                setUserData([
                    userDoc.data().username,
                    userDoc.data().tag,
                    userDoc.data().status,
                    userDoc.data().profilePicture,
                ]);
            }
        };

        const updateUserState = async () => {
            const userStatusRef = database.ref(`status/${user.uid}`);
            try {
                await userStatusRef.update({ isDeafen: isDeafen });
                await userStatusRef.update({ isMute: isMute });
            } catch (error) {
                console.error(
                    "Error updating user data in Realtime Database!",
                    error
                );
            }
        };

        getUserData();
        updateUserState();
    }, [user, isMute, isDeafen]);

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center shadow-md text-white text-3xl gap-4">
                <AiOutlineLoading className="animate-spin" size="20" />
            </div>
        );
    }

    return (
        <div className="flex justify-between px-4 items-center fixed min-w-72 max-w-72 left-0 bottom-0 h-16 ml-20 bg-slate-300 dark:bg-slate-800 gap-4">
            {userData !== null && (
                <>
                    <div className="flex items-center justify-center gap-2">
                        <Avatar className="bg-white">
                            <AvatarImage src={userData[3]} />
                            <AvatarFallback>{`:(`}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start justify-center text-sm">
                            <span className="max-w-32 overflow-scroll no-scrollbar no-scrollbar::-webkit-scrollbar">
                                {userData[0]}
                            </span>
                            <span className="max-w-32 overflow-scroll no-scrollbar no-scrollbar::-webkit-scrollbar">
                                {userData[2] || "Online"}
                            </span>
                        </div>
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
                    <AiOutlineLoading className="animate-spin" size="20" />
                </div>
            )}
        </div>
    );
};

export default UserProfileBox;
