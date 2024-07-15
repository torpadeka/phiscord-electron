import firebase, { firestore } from "../../../firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Auth } from "firebase/auth";

import { AiOutlineLoading } from "react-icons/ai";

import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

import { useToast } from "@/components/ui/use-toast";

const fontSans = FontSans({
    subsets: ["latin"],
    variable: "--font-sans",
});

const UserProfilePopup = ({ serverId, userUid }) => {
    const auth = firebase.auth() as unknown as Auth;
    const [user] = useAuthState(auth);

    const [userData, setUserData] = useState(null);
    const [changeNickname, setChangeNickname] = useState(false);
    const [changeNicknameInput, setChangeNicknameInput] = useState("");
    const [changeNicknameError, setChangeNicknameError] = useState("");
    const [nickname, setNickname] = useState(null);
    const [localToastMessage, setLocalToastMessage] = useState(""); // Local toast message state
    const { toast } = useToast();

    // Show local toast message
    useEffect(() => {
        if (localToastMessage) {
            toast({
                title: localToastMessage,
            });
            setLocalToastMessage(""); // Clear the message after showing the toast
        }
    }, [localToastMessage, toast]);

    // Effect to fetch user data
    useEffect(() => {
        const userDoc = firestore.collection("users").doc(userUid).get();

        const getUserData = async () => {
            setUserData([
                (await userDoc).data().username,
                (await userDoc).data().tag,
                (await userDoc).data().profilePicture,
                (await userDoc).data().customStatus,
            ]);
        };

        getUserData();
    }, []);

    // Effect to fetch nickname when changeNickname state changes
    useEffect(() => {
        if (serverId) {
            const getNickname = async () => {
                const nicknameDoc = await firestore
                    .collection("users")
                    .doc(userUid)
                    .collection("nicknames")
                    .doc(serverId)
                    .get();

                if (nicknameDoc.exists) {
                    console.log("NICKNAME EXISTS");
                    setNickname(nicknameDoc.data().nickname);
                    setChangeNicknameInput(nicknameDoc.data().nickname);
                }
            };

            getNickname();
        }
    }, [changeNickname]);

    // Function to handle nickname change
    const handleChangeNickname = async () => {
        if (changeNicknameInput.length < 2) {
            setChangeNicknameError("Nicknames must have 2 characters minimum!");
            return;
        }

        if (changeNicknameInput.length > 20) {
            setChangeNicknameError("Nicknames can only be 20 characters at most!");
            return;
        }

        if (changeNicknameInput === "" || !/\S/.test(changeNicknameInput)) {
            await firestore
                .collection("users")
                .doc(userUid)
                .collection("nicknames")
                .doc(serverId)
                .delete();
        } else {
            const nicknameDoc = await firestore
                .collection("users")
                .doc(userUid)
                .collection("nicknames")
                .doc(serverId)
                .get();

            if (nicknameDoc.exists) {
                await firestore
                    .collection("users")
                    .doc(userUid)
                    .collection("nicknames")
                    .doc(serverId)
                    .update({
                        nickname: changeNicknameInput,
                    });
            } else {
                await firestore
                    .collection("users")
                    .doc(userUid)
                    .collection("nicknames")
                    .doc(serverId)
                    .set({
                        nickname: changeNicknameInput,
                    });
            }
        }
        
        setLocalToastMessage("Nickname changed!"); // Set local toast message
        setChangeNicknameError("");
        setChangeNickname(false);
    };

    return (
        <>
            <Dialog open={changeNickname} onOpenChange={setChangeNickname}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle
                            className={cn(
                                "dark:text-white text-xl font-sans antialiased",
                                fontSans.variable
                            )}
                        >
                            Change Nickname
                        </DialogTitle>
                        <DialogDescription
                            className={cn(
                                "dark:text-white text-xl font-sans antialiased",
                                fontSans.variable
                            )}
                        >
                            <div className="flex flex-col items-center justify-center gap-3 pt-4">
                                <Input
                                    type="text"
                                    value={changeNicknameInput}
                                    onChange={(e) =>
                                        setChangeNicknameInput(e.target.value)
                                    }
                                    className="w-full bg-slate-300 dark:bg-slate-700 rounded-2xl mt-4 p-4"
                                ></Input>
                                <Label
                                    className={cn(
                                        "text-red-500 text-sm font-sans antialiased mt-1 text-center w-3/4",
                                        fontSans.variable
                                    )}
                                >
                                    {changeNicknameError}
                                </Label>
                                <Button
                                    onClick={handleChangeNickname}
                                    className="mt-1 bg-slate-900 text-white hover:text-black hover:bg-slate-200 rounded-xl gap-2 fill-white hover:fill-black"
                                >
                                    Change Nickname
                                </Button>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
            <div className="min-w-40 min-h-60 bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-start py-2 gap-4">
                {userData && (
                    <>
                        <Avatar className="bg-white w-20 h-20">
                            <AvatarImage src={userData[2]} />
                            <AvatarFallback>{`:(`}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col justify-center items-center w-full">
                            <span
                                className={cn(
                                    "dark:text-white text-2xl font-sans font-semibold antialiased max-w-48 overflow-scroll no-scrollbar no-scrollbar::-webkit-scrollbar",
                                    fontSans.variable
                                )}
                            >
                                {nickname || userData[0]}
                            </span>
                            <span
                                className={cn(
                                    "dark:text-slate-400 text-slate-700 text-sm font-sans antialiased",
                                    fontSans.variable
                                )}
                            >
                                #{userData[1]}
                            </span>
                        </div>
                        <span
                            className={cn(
                                "dark:text-white text-sm font-sans antialiased text-center bg-slate-300 dark:bg-slate-600 rounded-2xl py-2 px-4",
                                fontSans.variable
                            )}
                        >
                            {userData[3]}
                        </span>
                        {serverId && userUid === user.uid && (
                            <Button
                                onClick={() => setChangeNickname(true)}
                                className="bg-slate-900 text-white hover:text-black hover:bg-slate-200 rounded-xl gap-2 fill-white hover:fill-black"
                            >
                                <span
                                    className={cn(
                                        "text-sm font-sans antialiased",
                                        fontSans.variable
                                    )}
                                >
                                    Change Nickname
                                </span>
                            </Button>
                        )}
                    </>
                )}
                {!userData && (
                    <div className="h-full w-full flex items-center justify-center shadow-md text-white text-3xl gap-4">
                        <AiOutlineLoading
                            className="animate-spin fill-black dark:fill-white"
                            size="20"
                        />
                    </div>
                )}
            </div>
        </>
    );
};

export default UserProfilePopup;
