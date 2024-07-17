import firebase, { database, firestore } from "../../../firebase/clientApp";
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

const UserProfilePopup = ({
    serverId,
    userUid,
    setActivePage,
    dashboardContent,
    setDashboardContent,
}) => {
    const auth = firebase.auth() as unknown as Auth;
    const [user] = useAuthState(auth);

    const [userData, setUserData] = useState(null);
    const [changeNickname, setChangeNickname] = useState(false);
    const [changeNicknameInput, setChangeNicknameInput] = useState("");
    const [changeNicknameError, setChangeNicknameError] = useState("");
    const [nickname, setNickname] = useState(null);
    const [userRealtimeStatus, setUserRealtimeStatus] = useState(null);
    const [localToastMessage, setLocalToastMessage] = useState(""); // Local toast message state
    const { toast } = useToast();
    const [isBlocked, setIsBlocked] = useState(null);

    useEffect(() => {
        const checkIsBlocked = firestore
            .collection("users")
            .doc(user.uid)
            .collection("blockedList")
            .where("userUid", "==", userUid)
            .onSnapshot((snapshot) => {
                if (!snapshot.empty) {
                    setIsBlocked(true);
                } else {
                    setIsBlocked(false);
                }
            });

        return () => checkIsBlocked();
    }, []);

    useEffect(() => {
        const getUserRealTimeStatus = async () => {
            const userStatusDatabaseRef = database.ref(
                `userState/${userUid}/status`
            );

            const handleStatusUpdate = (snapshot) => {
                if (snapshot.exists()) {
                    if (snapshot.val() === "online") {
                        setUserRealtimeStatus("Online");
                    } else {
                        setUserRealtimeStatus("Offline");
                    }
                } else {
                    setUserRealtimeStatus("Offline");
                }
            };

            userStatusDatabaseRef.on("value", handleStatusUpdate);

            // Clean up the listener when the component unmounts
            return () => {
                userStatusDatabaseRef.off("value", handleStatusUpdate);
            };
        };

        getUserRealTimeStatus();
    }, []);

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
        if (changeNicknameInput.length > 20) {
            setChangeNicknameError(
                "Nicknames can only be 20 characters at most!"
            );
            return;
        }

        if (!/^(?!\s)(.*?)(?<!\s)$/.test(changeNicknameInput)) {
            setChangeNicknameError(
                "Nicknames cannot have spaces in the beginning or end!"
            );
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

    const handleAddFriend = async () => {
        const checkSenderBlockedList = await firestore
            .collection("users")
            .doc(user.uid)
            .collection("blockedList")
            .where("userUid", "==", userUid)
            .get();

        if (!checkSenderBlockedList.empty) {
            setLocalToastMessage("You blocked this user!");
            return;
        }

        const checkReceiverBlockedList = await firestore
            .collection("users")
            .doc(userUid)
            .collection("blockedList")
            .where("userUid", "==", user.uid)
            .get();

        if (!checkReceiverBlockedList.empty) {
            setLocalToastMessage("This user has blocked you!");
            return;
        }

        // check if the users are already friends
        const userFriendListRef = await firestore
            .collection("users")
            .doc(user.uid)
            .collection("friendList")
            .where("userUid", "==", userUid)
            .get();

        if (!userFriendListRef.empty) {
            setLocalToastMessage("You are already friends with this user!");
            return;
        }

        const userPendingListRef = await firestore
            .collection("users")
            .doc(user.uid)
            .collection("pendingList");

        // Check if this user have already sent the request before
        const checkOutgoingRequest = await userPendingListRef
            .where("senderUid", "==", user.uid)
            .where("receiverUid", "==", userUid)
            .get();
        if (!checkOutgoingRequest.empty) {
            setLocalToastMessage(
                "You have already sent a pending friend request to this user!"
            );
            return;
        }

        // Check if the user that this user is adding have already sent a request to this user first,
        // in which case the other user will automatically become a friend.
        const checkIngoingRequest = await userPendingListRef
            .where("senderUid", "==", userUid)
            .where("receiverUid", "==", user.uid)
            .get();

        if (!checkIngoingRequest.empty) {
            // Remove the other user's outgoing pending request first
            const friendPendingRef = await firestore
                .collection("users")
                .doc(userUid)
                .collection("pendingList")
                .where("senderUid", "==", userUid)
                .where("receiverUid", "==", user.uid)
                .get();

            const friendPendingDocRef = await firestore
                .collection("users")
                .doc(userUid)
                .collection("pendingList")
                .doc(friendPendingRef.docs[0].id);

            await friendPendingDocRef.delete();

            // Then remove this user's ingoing pending request
            const userPendingRef = await firestore
                .collection("users")
                .doc(user.uid)
                .collection("pendingList")
                .where("senderUid", "==", userUid)
                .where("receiverUid", "==", user.uid)
                .get();

            const userPendingDocRef = await firestore
                .collection("users")
                .doc(user.uid)
                .collection("pendingList")
                .doc(userPendingRef.docs[0].id);

            await userPendingDocRef.delete();

            // Finally, add each other as friends
            await firestore
                .collection("users")
                .doc(userUid)
                .collection("friendList")
                .add({
                    userUid: user.uid,
                });

            await firestore
                .collection("users")
                .doc(user.uid)
                .collection("friendList")
                .add({
                    userUid: userUid,
                });

            setLocalToastMessage(
                "This user has already sent you a friend request! You are now friends!"
            );

            return;
        }

        // Add the pending request
        await firestore
            .collection("users")
            .doc(userUid)
            .collection("pendingList")
            .add({
                senderUid: user.uid,
                receiverUid: userUid,
                sentAt: firebase.firestore.FieldValue.serverTimestamp(),
            });

        await firestore
            .collection("users")
            .doc(user.uid)
            .collection("pendingList")
            .add({
                senderUid: user.uid,
                receiverUid: userUid,
                sentAt: firebase.firestore.FieldValue.serverTimestamp(),
            });

        setLocalToastMessage(
            "Sent the friend request! Pray they heed your call!"
        );
    };

    const handleBlock = async () => {
        const thisFriendDocRef = (
            await firestore
                .collection("users")
                .doc(user.uid)
                .collection("friendList")
                .where("userUid", "==", userUid)
                .get()
        ).docs[0];

        if (thisFriendDocRef && thisFriendDocRef.exists) {
            const thisFriendDocRefId = thisFriendDocRef.id;

            await firestore
                .collection("users")
                .doc(user.uid)
                .collection("friendList")
                .doc(thisFriendDocRefId)
                .delete();

            const otherFriendDocRefId = (
                await firestore
                    .collection("users")
                    .doc(userUid)
                    .collection("friendList")
                    .where("userUid", "==", user.uid)
                    .get()
            ).docs[0].id;

            await firestore
                .collection("users")
                .doc(userUid)
                .collection("friendList")
                .doc(otherFriendDocRefId)
                .delete();
        }

        await firestore
            .collection("users")
            .doc(user.uid)
            .collection("blockedList")
            .add({
                userUid: userUid,
            });

        setLocalToastMessage("User Blocked!");
    };

    const handleCreateConversation = async () => {
        const checkSenderBlockedList = await firestore
            .collection("users")
            .doc(user.uid)
            .collection("blockedList")
            .where("userUid", "==", userUid)
            .get();

        if (!checkSenderBlockedList.empty) {
            setLocalToastMessage("You blocked this user!");
            return;
        }

        const checkReceiverBlockedList = await firestore
            .collection("users")
            .doc(userUid)
            .collection("blockedList")
            .where("userUid", "==", user.uid)
            .get();

        if (!checkReceiverBlockedList.empty) {
            setLocalToastMessage("This user has blocked you!");
            return;
        }

        const checkExistingConversation = await firestore
            .collection("conversations")
            .where("userIds", "array-contains", user.uid)
            .get();

        let conversationExists = false;
        checkExistingConversation.forEach((conversationDoc) => {
            if (conversationDoc.data().userIds.includes(userUid)) {
                conversationExists = true;
            }
        });

        if (conversationExists) {
            setLocalToastMessage(
                "Conversation already exists! Redirecting now . . ."
            );

            setActivePage(["dashboard", null]);
            setDashboardContent(["conversation", userUid]);
            return;
        }

        await firestore.collection("conversations").add({
            userIds: [user.uid, userUid],
            lastChanged: firebase.firestore.FieldValue.serverTimestamp(),
        });

        setActivePage(["dashboard", null]);
        setDashboardContent(["conversation", userUid]);
        setLocalToastMessage("New chat created successfully!");
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
            <div className="min-w-40 min-h-60 bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-start pt-4 gap-4">
                {userData && (
                    <>
                        <div className="relative">
                            <Avatar className="bg-white w-20 h-20">
                                <AvatarImage src={userData[2]} />
                                <AvatarFallback>{`:(`}</AvatarFallback>
                            </Avatar>
                            {userRealtimeStatus === "Online" && (
                                <div className="absolute bottom-0 right-0 flex items-center justify-center w-6 h-6 bg-slate-100 dark:bg-slate-900 rounded-full">
                                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                                </div>
                            )}
                            {userRealtimeStatus === "Offline" && (
                                <div className="absolute bottom-0 right-0 flex items-center justify-center w-6 h-6 bg-slate-100 dark:bg-slate-900 rounded-full">
                                    <div className="w-4 h-4 bg-slate-500 rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-slate-100 dark:bg-slate-900 rounded-full"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col justify-center items-center w-full">
                            <span
                                className={cn(
                                    "dark:text-white text-2xl font-sans font-semibold antialiased max-w-48 overflow-scroll no-scrollbar no-scrollbar::-webkit-scrollbar",
                                    fontSans.variable
                                )}
                            >
                                {nickname || userData[0]}
                            </span>
                            {nickname && (
                                <span
                                className={cn(
                                    "dark:text-white text-base font-sans font-semibold antialiased max-w-48 overflow-scroll no-scrollbar no-scrollbar::-webkit-scrollbar",
                                    fontSans.variable
                                )}
                            >
                                {userData[0]}
                            </span>
                            )}
                            <span
                                className={cn(
                                    "dark:text-slate-400 text-slate-700 text-sm font-sans antialiased",
                                    fontSans.variable
                                )}
                            >
                                #{userData[1]}
                            </span>
                        </div>
                        {userData[3] && (
                            <span
                                className={cn(
                                    "dark:text-white text-sm font-sans antialiased text-center bg-slate-300 dark:bg-slate-600 rounded-2xl py-2 px-4",
                                    fontSans.variable
                                )}
                            >
                                {userData[3]}
                            </span>
                        )}
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
                        {isBlocked && (
                            <div
                                className={cn(
                                    "dark:text-white text-xl font-sans antialiased w-full flex flex-col items-center justify-center gap-1 font-bold text-red-600",
                                    fontSans.variable
                                )}
                            >
                                BLOCKED
                            </div>
                        )}
                        {isBlocked !== null && isBlocked === false && !(userUid === user.uid) && (
                            <div className="w-full flex flex-col items-center justify-center gap-1">
                                <Button
                                    onClick={handleCreateConversation}
                                    className="w-28 bg-slate-900 text-white hover:text-black hover:bg-slate-200 rounded-xl gap-2 fill-white hover:fill-black"
                                >
                                    <span
                                        className={cn(
                                            "text-sm font-sans antialiased",
                                            fontSans.variable
                                        )}
                                    >
                                        Chat
                                    </span>
                                </Button>
                                <Button
                                    onClick={handleAddFriend}
                                    className="w-28 bg-slate-900 text-white hover:text-black hover:bg-slate-200 rounded-xl gap-2 fill-white hover:fill-black"
                                >
                                    <span
                                        className={cn(
                                            "text-sm font-sans antialiased",
                                            fontSans.variable
                                        )}
                                    >
                                        Add Friend
                                    </span>
                                </Button>
                                <Button
                                    onClick={handleBlock}
                                    className="w-28 bg-slate-900 text-white hover:text-black hover:bg-slate-200 rounded-xl gap-2 fill-white hover:fill-black"
                                >
                                    <span
                                        className={cn(
                                            "text-sm font-sans antialiased",
                                            fontSans.variable
                                        )}
                                    >
                                        Block
                                    </span>
                                </Button>
                            </div>
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
