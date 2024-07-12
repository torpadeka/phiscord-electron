import firebase, { database } from "../../../firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
import type { Auth } from "firebase/auth";
import { firestore } from "../../../firebase/clientApp";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { BiDotsVerticalRounded } from "react-icons/bi";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "../ui/input";
import { Label } from "@radix-ui/react-context-menu";
import { useToast } from "../ui/use-toast";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";

const fontSans = FontSans({
    subsets: ["latin"],
    variable: "--font-sans",
});

const FriendMenu = ({
    setContent,
    closeFriendMenu,
    setSelectedConversation,
}) => {
    const auth = firebase.auth() as unknown as Auth;
    const [user, loading, error] = useAuthState(auth);
    const [friendList, setFriendList] = useState([]);
    const [ingoingPendingList, setIngoingPendingList] = useState([]);
    const [outgoingPendingList, setOutgoingPendingList] = useState([]);
    const [blockedList, setBlockedList] = useState([]);
    const [newFriendInput, setNewFriendInput] = useState("");
    const [addFriendError, setAddFriendError] = useState("");

    const [tabValue, setTabValue] = useState("online");
    const [toastMessage, setToastMessage] = useState("");
    const { toast } = useToast();

    console.log(outgoingPendingList);

    useEffect(() => {
        const userFriendsRef = firestore
            .collection("users")
            .doc(user.uid)
            .collection("friendList")
            .onSnapshot((snapshot) => {
                let friends = [];
                snapshot.forEach((doc) => {
                    friends.push(doc.data().userUid);
                });
                setFriendList(friends);
            });

        return () => userFriendsRef();
    }, []);

    useEffect(() => {
        const userPendingsRef = firestore
            .collection("users")
            .doc(user.uid)
            .collection("pendingList")
            .where("receiverUid", "==", user.uid)
            .onSnapshot((snapshot) => {
                let pendings = [];
                snapshot.forEach((doc) => {
                    pendings.push(doc.data().senderUid);
                });
                setIngoingPendingList(pendings);
            });

        return () => userPendingsRef();
    }, []);

    useEffect(() => {
        const userPendingsRef = firestore
            .collection("users")
            .doc(user.uid)
            .collection("pendingList")
            .where("senderUid", "==", user.uid)
            .onSnapshot((snapshot) => {
                console.log("SNAPSHOT EMPTY: ", snapshot.empty);
                let pendings = [];
                snapshot.forEach((doc) => {
                    pendings.push(doc.data().receiverUid);
                });
                setOutgoingPendingList(pendings);
            });

        return () => userPendingsRef();
    }, []);

    useEffect(() => {
        const userBlocksRef = firestore
            .collection("users")
            .doc(user.uid)
            .collection("blockedList")
            .onSnapshot((snapshot) => {
                let blocks = [];
                snapshot.forEach((doc) => {
                    blocks.push(doc.data().userUid);
                });
                setBlockedList(blocks);
            });

        return () => userBlocksRef();
    }, []);

    // Show toast message
    useEffect(() => {
        if (toastMessage) {
            toast({
                title: toastMessage,
            });
            setToastMessage(""); // Clear the message after showing the toast
        }
    }, [toastMessage, toast]);

    const handleNewFriendInputChange = (e) => {
        setNewFriendInput(e.target.value);
    };

    const handleAddNewFriend = async () => {
        if (!newFriendInput) {
            setAddFriendError("It's empty :(");
            return;
        }

        const input = newFriendInput.split("#");
        if (input.length !== 2) {
            setAddFriendError("Invalid format!");
            return;
        }

        const [username, tag] = input;

        if (
            username.length < 2 ||
            username.length > 20 ||
            tag.length < 4 ||
            tag.length > 5
        ) {
            setAddFriendError("Invalid format!");
            return;
        }

        const querySnapshot = await firestore
            .collection("users")
            .where("username", "==", username)
            .where("tag", "==", tag)
            .get();

        if (querySnapshot.empty) {
            setAddFriendError("User not found!");
            return;
        }

        const doc = querySnapshot.docs[0];
        const newFriendUserId = doc.data().uid;

        if (newFriendUserId === user.uid) {
            setAddFriendError("That's you!");
            return;
        }

        // check if the users are already friends
        const userFriendListRef = await firestore
            .collection("users")
            .doc(user.uid)
            .collection("friendList")
            .where("userUid", "==", newFriendUserId)
            .get();

        if (!userFriendListRef.empty) {
            setAddFriendError("You are already friends with this user!");
            return;
        }

        const userPendingListRef = await firestore
            .collection("users")
            .doc(user.uid)
            .collection("pendingList");

        // Check if this user have already sent the request before
        const checkOutgoingRequest = await userPendingListRef
            .where("senderUid", "==", user.uid)
            .where("receiverUid", "==", newFriendUserId)
            .get();
        if (!checkOutgoingRequest.empty) {
            setAddFriendError(
                "You have already sent a pending friend request to this user!"
            );
            return;
        }

        // Check if this user blocked the user they're trying to add
        const checkSenderBlockedList = await firestore
            .collection("users")
            .doc(user.uid)
            .collection("blockedList")
            .where("userUid", "==", newFriendUserId)
            .get();

        if (!checkSenderBlockedList.empty) {
            setAddFriendError("You blocked this user!");
            return;
        }

        // Check the receiver of the request already blocked this user
        const checkReceiverBlockedList = await firestore
            .collection("users")
            .doc(newFriendUserId)
            .collection("blockedList")
            .where("userUid", "==", newFriendUserId)
            .get();

        if (!checkReceiverBlockedList.empty) {
            setAddFriendError("This user has blocked you!");
            return;
        }

        // Check if the user that this user is adding have already sent a request to this user first,
        // in which case the other user will automatically become a friend.
        const checkIngoingRequest = await userPendingListRef
            .where("senderUid", "==", newFriendUserId)
            .where("receiverUid", "==", user.uid)
            .get();

        if (!checkIngoingRequest.empty) {
            // Remove the other user's outgoing pending request first
            const friendPendingRef = await firestore
                .collection("users")
                .doc(newFriendUserId)
                .collection("pendingList")
                .where("senderUid", "==", newFriendUserId)
                .where("receiverUid", "==", user.uid)
                .get();

            const friendPendingDocRef = await firestore
                .collection("users")
                .doc(newFriendUserId)
                .collection("pendingList")
                .doc(friendPendingRef.docs[0].id);

            await friendPendingDocRef.delete();

            // Then remove this user's ingoing pending request
            const userPendingRef = await firestore
                .collection("users")
                .doc(user.uid)
                .collection("pendingList")
                .where("senderUid", "==", newFriendUserId)
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
                .doc(newFriendUserId)
                .collection("friendList")
                .add({
                    userUid: user.uid,
                });

            await firestore
                .collection("users")
                .doc(user.uid)
                .collection("friendList")
                .add({
                    userUid: newFriendUserId,
                });

            setToastMessage(
                "This user has already sent you a friend request! You are now friends!"
            );
            setTabValue("all");
            setNewFriendInput("");
            return;
        }

        // Add the pending request
        await firestore
            .collection("users")
            .doc(newFriendUserId)
            .collection("pendingList")
            .add({
                senderUid: user.uid,
                receiverUid: newFriendUserId,
                sentAt: firebase.firestore.FieldValue.serverTimestamp(),
            });

        await firestore
            .collection("users")
            .doc(user.uid)
            .collection("pendingList")
            .add({
                senderUid: user.uid,
                receiverUid: newFriendUserId,
                sentAt: firebase.firestore.FieldValue.serverTimestamp(),
            });

        setAddFriendError(""); // Clear any previous error

        setToastMessage("Sent the friend request! Pray they heed your call!");
        setNewFriendInput("");
        setTabValue("pending");
    };

    return (
        <Tabs
            className={cn(
                "dark:text-white text-xl font-sans antialiased w-[400px]",
                fontSans.variable
            )}
            value={tabValue}
        >
            <TabsList className="gap-4 dark:text-slate-500 text-black flex items-center justify-center w-[460px]">
                <TabsTrigger
                    onClick={() => setTabValue("online")}
                    value="online"
                >
                    Online
                </TabsTrigger>
                <TabsTrigger onClick={() => setTabValue("all")} value="all">
                    All
                </TabsTrigger>
                <TabsTrigger
                    onClick={() => setTabValue("pending")}
                    value="pending"
                >
                    Pending
                </TabsTrigger>
                <TabsTrigger
                    onClick={() => setTabValue("blocked")}
                    value="blocked"
                >
                    Blocked
                </TabsTrigger>
                <TabsTrigger
                    className="bg-green-700 text-white"
                    onClick={() => setTabValue("addfriend")}
                    value="addfriend"
                >
                    Add Friend
                </TabsTrigger>
            </TabsList>
            <TabsContent
                className="fade-in-faster h-96 w-[460px] overflow-y-scroll overflow-x-hidden no-scrollbar no-scrollbar::-webkit-scrollbar"
                value="online"
            >
                {friendList.map((friend, index) => {
                    return (
                        <UserItem
                            key={index}
                            userUid={friend}
                            onlyOnline={true}
                            actionType={"friend"}
                            setContent={setContent}
                            closeFriendMenu={closeFriendMenu}
                            setSelectedConversation={setSelectedConversation}
                            setToastMessage={setToastMessage}
                        ></UserItem>
                    );
                })}
            </TabsContent>
            <TabsContent
                className="fade-in-faster flex-1 h-96 w-[460px] overflow-y-scroll overflow-x-hidden no-scrollbar no-scrollbar::-webkit-scrollbar"
                value="all"
            >
                {friendList.map((friend, index) => {
                    return (
                        <UserItem
                            key={index}
                            userUid={friend}
                            onlyOnline={false}
                            actionType={"friend"}
                            setContent={setContent}
                            closeFriendMenu={closeFriendMenu}
                            setSelectedConversation={setSelectedConversation}
                            setToastMessage={setToastMessage}
                        ></UserItem>
                    );
                })}
            </TabsContent>
            <TabsContent
                className="fade-in-faster flex-1 h-96 w-[460px] overflow-y-scroll overflow-x-hidden no-scrollbar no-scrollbar::-webkit-scrollbar"
                value="pending"
            >
                <div className="w-full flex items-center justify-center text-[16px] py-2 text-black dark:text-white font-bold">
                    Ingoing Friend Requests
                </div>
                <div className="h-36">
                    {!ingoingPendingList[0] && (
                        <span className="text-sm w-full h-full flex items-center justify-center">
                            No one has requested you to be friends
                        </span>
                    )}
                    {ingoingPendingList.map((pending, index) => {
                        return (
                            <UserItem
                                key={index}
                                userUid={pending}
                                onlyOnline={false}
                                actionType={"pendingIngoing"}
                                setContent={setContent}
                                closeFriendMenu={closeFriendMenu}
                                setSelectedConversation={
                                    setSelectedConversation
                                }
                                setToastMessage={setToastMessage}
                            ></UserItem>
                        );
                    })}
                </div>
                <div className="fade-in-faster w-full flex items-center justify-center text-[16px] py-2 text-black dark:text-white font-bold">
                    Outgoing Friend Requests
                </div>
                <div className="h-36">
                    {!outgoingPendingList[0] && (
                        <span className="text-sm w-full h-full flex items-center justify-center">
                            You haven't requested anyone to be friends
                        </span>
                    )}
                    {outgoingPendingList.map((pending, index) => {
                        return (
                            <UserItem
                                key={index}
                                userUid={pending}
                                onlyOnline={false}
                                actionType={"pendingOutgoing"}
                                setContent={setContent}
                                closeFriendMenu={closeFriendMenu}
                                setSelectedConversation={
                                    setSelectedConversation
                                }
                                setToastMessage={setToastMessage}
                            ></UserItem>
                        );
                    })}
                </div>
            </TabsContent>
            <TabsContent
                className="fade-in-faster flex-1 h-96 w-[460px] overflow-y-scroll overflow-x-hidden no-scrollbar no-scrollbar::-webkit-scrollbar"
                value="blocked"
            >
                {blockedList.map((blocked, index) => {
                    return (
                        <UserItem
                            key={index}
                            userUid={blocked}
                            onlyOnline={false}
                            actionType={"blocked"}
                            setContent={setContent}
                            closeFriendMenu={closeFriendMenu}
                            setSelectedConversation={setSelectedConversation}
                            setToastMessage={setToastMessage}
                        ></UserItem>
                    );
                })}
            </TabsContent>
            <TabsContent
                className="flex-1 w-[460px] overflow-y-scroll overflow-x-hidden no-scrollbar no-scrollbar::-webkit-scrollbar flex flex-col gap-2 items-center justify-center"
                value="addfriend"
            >
                <Input
                    className="fade-in-faster w-80 bg-slate-300 dark:bg-slate-700 rounded-2xl mt-4 p-4"
                    value={newFriendInput}
                    onChange={handleNewFriendInputChange}
                    placeholder="AwesomeUser#0001"
                ></Input>
                <Label
                    className={cn(
                        "text-red-500 text-sm font-sans antialiased fade-in-faster",
                        fontSans.variable
                    )}
                >
                    {addFriendError}
                </Label>
                <Button
                    className="bg-slate-900 text-white hover:text-black hover:bg-slate-200 rounded-xl gap-2 fill-white hover:fill-black fade-in-faster"
                    onClick={handleAddNewFriend}
                >
                    Add Friend
                </Button>
            </TabsContent>
        </Tabs>
    );
};

const UserItem = ({
    userUid,
    onlyOnline,
    actionType,
    setContent,
    closeFriendMenu,
    setSelectedConversation,
    setToastMessage,
}) => {
    const { toast } = useToast();
    const auth = firebase.auth() as unknown as Auth;
    const [user, loading, error] = useAuthState(auth);

    // actionType is either "friend", "blocked", "pendingIngoing" or "pendingOutgoing"
    const [isOnline, setIsOnline] = useState(null);
    const [userData, setUserData] = useState(null);
    const [isBlocking, setIsBlocking] = useState(false);
    const [isRemovingFriend, setIsRemovingFriend] = useState(false);

    useEffect(() => {
        console.log("REALTIME CHECKING RUN");
        const getUserRealTimeStatus = async () => {
            const userStatusDatabaseRef = database.ref(
                `userState/${userUid}/status`
            );

            const handleStatusUpdate = (snapshot) => {
                if (snapshot.exists()) {
                    if (snapshot.val() === "online") {
                        setIsOnline(true);
                    } else {
                        setIsOnline(false);
                    }
                } else {
                    setIsOnline(false);
                }
            };

            userStatusDatabaseRef.on("value", handleStatusUpdate);

            // Clean up the listener when the component unmounts
            return () => {
                userStatusDatabaseRef.off("value", handleStatusUpdate);
            };
        };

        const usersRef = firestore.collection("users");

        const getUserData = async () => {
            const userDoc = await usersRef
                .doc(userUid)
                .onSnapshot((snapshot) => {
                    setUserData([
                        snapshot.data().username,
                        snapshot.data().tag,
                        snapshot.data().customStatus,
                        snapshot.data().profilePicture,
                    ]);
                });
        };

        getUserData();
        getUserRealTimeStatus();
    }, [userUid]);

    const handleRemoveFriend = async () => {
        const thisFriendDocRefId = (
            await firestore
                .collection("users")
                .doc(user.uid)
                .collection("friendList")
                .where("userUid", "==", userUid)
                .get()
        ).docs[0].id;

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

        setIsRemovingFriend(false);
    };

    const handleBlockUser = async () => {
        handleRemoveFriend();

        await firestore
            .collection("users")
            .doc(user.uid)
            .collection("blockedList")
            .add({
                userUid: userUid,
            });

        setIsBlocking(false);
    };

    const handleAcceptPending = async () => {
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

        setToastMessage(cn("Accepted friend request from ", userData[0]));
    };

    const handleDenyPending = async () => {
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

        setToastMessage(cn("Denied friend request from ", userData[0]));
    };

    const handleCancelPending = async () => {
        // Remove the other user's outgoing pending request first
        const friendPendingRef = await firestore
            .collection("users")
            .doc(userUid)
            .collection("pendingList")
            .where("senderUid", "==", user.uid)
            .where("receiverUid", "==", userUid)
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
            .where("senderUid", "==", user.uid)
            .where("receiverUid", "==", userUid)
            .get();

        const userPendingDocRef = await firestore
            .collection("users")
            .doc(user.uid)
            .collection("pendingList")
            .doc(userPendingRef.docs[0].id);

        await userPendingDocRef.delete();

        setToastMessage(cn("Cancelled friend request to ", userData[0]));
    };

    const handleUnblockUser = async () => {
        const blockListRef = await firestore
            .collection("users")
            .doc(user.uid)
            .collection("blockedList")
            .where("userUid", "==", userUid)
            .get();

        const blockListDocRef = await firestore
            .collection("users")
            .doc(user.uid)
            .collection("blockedList")
            .doc(blockListRef.docs[0].id);

        await blockListDocRef.delete();

        setToastMessage(cn("Removed the block on ", userData[0]));
    };

    const handleChatFriend = async () => {
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
            setToastMessage(
                "Conversation already exists! Redirecting now . . ."
            );
            setContent(["conversation", userUid]);
            return;
        }

        await firestore.collection("conversations").add({
            userIds: [user.uid, userUid],
            lastChanged: firebase.firestore.FieldValue.serverTimestamp(),
        });

        setContent(["conversation", userUid]);
        setToastMessage("New chat created successfully!");
        closeFriendMenu();
        setSelectedConversation(userUid);
    };

    if (onlyOnline) {
        return (
            <>
                {userData === null && null}
                {userData && isOnline === true && (
                    <div
                        className={
                            "flex min-w-[460px] min-h-12 items-center justify-between px-6 py-2 gap-3 rounded-xl"
                        }
                    >
                        <div className="flex justify-center items-center gap-3">
                            <Avatar className="bg-white">
                                <AvatarImage src={userData[3]} />
                                <AvatarFallback>{`:(`}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col justify-center items-start">
                                <span className="font-semibold text-black dark:text-white">
                                    {userData[0]}
                                </span>
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    {userData[2] || "Online"}
                                </span>
                            </div>
                        </div>
                        <div>
                            <Popover>
                                <PopoverTrigger>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <BiDotsVerticalRounded
                                                    size="25"
                                                    className="cursor-pointer hover:"
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Actions</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </PopoverTrigger>
                                <PopoverContent className="w-40">
                                    {actionType === "friend" && (
                                        <div className="w-full flex flex-col items-start justify-center">
                                            <span
                                                onClick={handleChatFriend}
                                                className={cn(
                                                    "w-full p-1 dark:text-white font-bold text-sm font-sans antialiased cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm",
                                                    fontSans.variable
                                                )}
                                            >
                                                Chat
                                            </span>
                                            <Dialog
                                                open={isBlocking}
                                                onOpenChange={setIsBlocking}
                                            >
                                                <DialogTrigger className="w-full">
                                                    <span
                                                        className={cn(
                                                            "w-full p-1 flex justify-start items-center text-red-500 font-bold text-sm font-sans antialiased hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm ",
                                                            fontSans.variable
                                                        )}
                                                    >
                                                        Block User
                                                    </span>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader className="flex flex-col gap-4">
                                                        <DialogTitle
                                                            className={cn(
                                                                "dark:text-white text-xl font-sans antialiased",
                                                                fontSans.variable
                                                            )}
                                                        >
                                                            Block {userData[0]}?
                                                        </DialogTitle>
                                                        <DialogDescription
                                                            className={cn(
                                                                "dark:text-white text-xl font-sans antialiased",
                                                                fontSans.variable
                                                            )}
                                                        >
                                                            <span className="text-red text-[16px]">
                                                                Are you sure you
                                                                want to do this?
                                                                This will also
                                                                remove the user
                                                                from your friend
                                                                list!
                                                            </span>
                                                            <div className="w-full flex justify-end pt-4 gap-4">
                                                                <Button
                                                                    onClick={() => {
                                                                        handleBlockUser();
                                                                        setToastMessage(
                                                                            cn(
                                                                                "Blocked the user ",
                                                                                userData[0],
                                                                                "!"
                                                                            )
                                                                        );
                                                                    }}
                                                                    className="bg-red-600 text-white hover:text-black hover:bg-slate-200 rounded-xl"
                                                                >
                                                                    Confirm
                                                                </Button>
                                                                <Button
                                                                    onClick={() =>
                                                                        setIsBlocking(
                                                                            false
                                                                        )
                                                                    }
                                                                    className="bg-slate-900 text-white hover:text-black hover:bg-slate-200 rounded-xl"
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                </DialogContent>
                                            </Dialog>
                                            <Dialog>
                                                <DialogTrigger className="w-full">
                                                    <span
                                                        className={cn(
                                                            "w-full p-1 flex justify-start items-center text-red-500 font-bold text-sm font-sans antialiased hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm",
                                                            fontSans.variable
                                                        )}
                                                    >
                                                        Remove Friend
                                                    </span>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader className="flex flex-col gap-4">
                                                        <DialogTitle
                                                            className={cn(
                                                                "dark:text-white text-xl font-sans antialiased",
                                                                fontSans.variable
                                                            )}
                                                        >
                                                            Remove {userData[0]}{" "}
                                                            as Friend?
                                                        </DialogTitle>
                                                        <DialogDescription
                                                            className={cn(
                                                                "dark:text-white text-xl font-sans antialiased",
                                                                fontSans.variable
                                                            )}
                                                        >
                                                            <span className="text-red text-[16px]">
                                                                Are you sure you
                                                                want to do this?
                                                            </span>
                                                            <div className="w-full flex justify-end pt-4 gap-4">
                                                                <Button
                                                                    onClick={() => {
                                                                        handleRemoveFriend();
                                                                        setToastMessage(
                                                                            cn(
                                                                                "Removed the user ",
                                                                                userData[0],
                                                                                " from the friend list!"
                                                                            )
                                                                        );
                                                                    }}
                                                                    className="bg-red-600 text-white hover:text-black hover:bg-slate-200 rounded-xl"
                                                                >
                                                                    Confirm
                                                                </Button>
                                                                <Button className="bg-slate-900 text-white hover:text-black hover:bg-slate-200 rounded-xl">
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    )}
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                )}
                {(isOnline === false || isOnline === null) && null}
            </>
        );
    }

    return (
        <>
            {userData === null && null}
            {userData && (
                <div
                    className={
                        "flex min-w-[460px] min-h-12 items-center justify-between px-6 py-2 gap-3 rounded-xl"
                    }
                >
                    <div className="flex justify-center items-center gap-3">
                        <Avatar className="bg-white">
                            <AvatarImage src={userData[3]} />
                            <AvatarFallback>{`:(`}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col justify-center items-start">
                            <span className="font-semibold text-black dark:text-white">
                                {userData[0]}
                            </span>
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                {isOnline ? userData[2] || "Online" : "Offline"}
                            </span>
                        </div>
                    </div>
                    <div>
                        <Popover>
                            <PopoverTrigger>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <BiDotsVerticalRounded
                                                size="25"
                                                className="cursor-pointer hover:"
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Actions</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </PopoverTrigger>
                            <PopoverContent className="w-40">
                                {actionType === "friend" && (
                                    <div className="w-full flex flex-col items-start justify-center">
                                        <span
                                            onClick={() => {
                                                setContent([
                                                    "conversation",
                                                    userUid,
                                                ]);
                                                closeFriendMenu();
                                                setSelectedConversation(
                                                    userUid
                                                );
                                            }}
                                            className={cn(
                                                "w-full p-1 dark:text-white font-bold text-sm font-sans antialiased cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm",
                                                fontSans.variable
                                            )}
                                        >
                                            Chat
                                        </span>
                                        <Dialog
                                            open={isBlocking}
                                            onOpenChange={setIsBlocking}
                                        >
                                            <DialogTrigger className="w-full">
                                                <span
                                                    className={cn(
                                                        "w-full p-1 flex justify-start items-center text-red-500 font-bold text-sm font-sans antialiased hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm ",
                                                        fontSans.variable
                                                    )}
                                                >
                                                    Block User
                                                </span>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader className="flex flex-col gap-4">
                                                    <DialogTitle
                                                        className={cn(
                                                            "dark:text-white text-xl font-sans antialiased",
                                                            fontSans.variable
                                                        )}
                                                    >
                                                        Block {userData[0]}?
                                                    </DialogTitle>
                                                    <DialogDescription
                                                        className={cn(
                                                            "dark:text-white text-xl font-sans antialiased",
                                                            fontSans.variable
                                                        )}
                                                    >
                                                        <span className="text-red text-[16px]">
                                                            Are you sure you
                                                            want to do this?
                                                            This will also
                                                            remove the user from
                                                            your friend list!
                                                        </span>
                                                        <div className="w-full flex justify-end pt-4 gap-4">
                                                            <Button
                                                                onClick={() => {
                                                                    handleBlockUser();
                                                                    setToastMessage(
                                                                        cn(
                                                                            "Blocked the user ",
                                                                            userData[0],
                                                                            "!"
                                                                        )
                                                                    );
                                                                }}
                                                                className="bg-red-600 text-white hover:text-black hover:bg-slate-200 rounded-xl"
                                                            >
                                                                Confirm
                                                            </Button>
                                                            <Button
                                                                onClick={() =>
                                                                    setIsBlocking(
                                                                        false
                                                                    )
                                                                }
                                                                className="bg-slate-900 text-white hover:text-black hover:bg-slate-200 rounded-xl"
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </DialogDescription>
                                                </DialogHeader>
                                            </DialogContent>
                                        </Dialog>
                                        <Dialog>
                                            <DialogTrigger className="w-full">
                                                <span
                                                    className={cn(
                                                        "w-full p-1 flex justify-start items-center text-red-500 font-bold text-sm font-sans antialiased hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm",
                                                        fontSans.variable
                                                    )}
                                                >
                                                    Remove Friend
                                                </span>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader className="flex flex-col gap-4">
                                                    <DialogTitle
                                                        className={cn(
                                                            "dark:text-white text-xl font-sans antialiased",
                                                            fontSans.variable
                                                        )}
                                                    >
                                                        Remove {userData[0]} as
                                                        Friend?
                                                    </DialogTitle>
                                                    <DialogDescription
                                                        className={cn(
                                                            "dark:text-white text-xl font-sans antialiased",
                                                            fontSans.variable
                                                        )}
                                                    >
                                                        <span className="text-red text-[16px]">
                                                            Are you sure you
                                                            want to do this?
                                                        </span>
                                                        <div className="w-full flex justify-end pt-4 gap-4">
                                                            <Button
                                                                onClick={() => {
                                                                    handleRemoveFriend();
                                                                    setToastMessage(
                                                                        cn(
                                                                            "Removed the user ",
                                                                            userData[0],
                                                                            " from the friend list!"
                                                                        )
                                                                    );
                                                                }}
                                                                className="bg-red-600 text-white hover:text-black hover:bg-slate-200 rounded-xl"
                                                            >
                                                                Confirm
                                                            </Button>
                                                            <Button className="bg-slate-900 text-white hover:text-black hover:bg-slate-200 rounded-xl">
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </DialogDescription>
                                                </DialogHeader>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                )}
                                {actionType === "pendingIngoing" && (
                                    <div className="w-full flex flex-col items-start justify-center">
                                        <span
                                            onClick={handleAcceptPending}
                                            className={cn(
                                                "w-full p-1 dark:text-white font-bold text-sm font-sans antialiased cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm",
                                                fontSans.variable
                                            )}
                                        >
                                            Accept
                                        </span>
                                        <span
                                            onClick={handleDenyPending}
                                            className={cn(
                                                "w-full p-1 dark:text-white font-bold text-sm font-sans antialiased cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm",
                                                fontSans.variable
                                            )}
                                        >
                                            Deny
                                        </span>
                                    </div>
                                )}
                                {actionType === "pendingOutgoing" && (
                                    <div className="w-full flex flex-col items-start justify-center">
                                        <span
                                            onClick={handleCancelPending}
                                            className={cn(
                                                "w-full p-1 dark:text-white font-bold text-sm font-sans antialiased cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm",
                                                fontSans.variable
                                            )}
                                        >
                                            Cancel
                                        </span>
                                    </div>
                                )}
                                {actionType === "blocked" && (
                                    <div className="w-full flex flex-col items-start justify-center">
                                        <span
                                            onClick={handleUnblockUser}
                                            className={cn(
                                                "w-full p-1 dark:text-white font-bold text-sm font-sans antialiased cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm",
                                                fontSans.variable
                                            )}
                                        >
                                            Unblock
                                        </span>
                                    </div>
                                )}
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            )}
        </>
    );
};
export default FriendMenu;
