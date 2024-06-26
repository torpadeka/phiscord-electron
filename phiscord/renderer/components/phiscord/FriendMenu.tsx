import firebase, { database } from "../../../firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
import type { Auth } from "firebase/auth";
import { firestore } from "../../../firebase/clientApp";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const fontSans = FontSans({
    subsets: ["latin"],
    variable: "--font-sans",
});

const FriendMenu = () => {
    interface Friend {
        userUid: string;
        isOnline: boolean;
    }

    const auth = firebase.auth() as unknown as Auth;
    const [user, loading, error] = useAuthState(auth);
    const [friendList, setFriendList] = useState([]);
    const [onlineFriendList, setOnlineFriendList] = useState([]);
    const [pendingList, setPendingList] = useState([]);
    const [blockedList, setBlockedList] = useState([]);

    useEffect(() => {
        const userFriendsRef = firestore
            .collection("users")
            .doc(user.uid)
            .collection("friendList")
            .onSnapshot((snapshot) => {
                let friends = [];
                snapshot.forEach((doc) => {
                    const newFriend: Friend = {
                        userUid: doc.data().userUid,
                        isOnline: null,
                    };
                    friends.push(newFriend);
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
            .onSnapshot((snapshot) => {
                let pendings = [];
                snapshot.forEach((doc) => {
                    pendings.push(doc.data().userUid);
                });
                setPendingList(pendings);
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
                setPendingList(blocks);
            });

        return () => userBlocksRef();
    }, []);

    // The checking of current friends' realtime statuses work
    // but it doesn't LIVE when the friend menu is open
    // TODO: Somehow make this update live without triggering infinite loops :'D
    useEffect(() => {
        console.log("REALTIME CHECKING RUN");
        const getUserRealTimeStatus = async () => {
            const onlineFriends = [];

            friendList.map((friend: Friend) => {
                const userStatusDatabaseRef = database.ref(
                    `userState/${friend.userUid}/status`
                );

                const handleStatusUpdate = (snapshot) => {
                    if (snapshot.exists()) {
                        if (snapshot.val() === "online") {
                            friend.isOnline = true;
                        } else {
                            friend.isOnline = false;
                        }
                    } else {
                        friend.isOnline = false;
                    }
                };

                userStatusDatabaseRef.on("value", handleStatusUpdate);

                // Clean up the listener when the component unmounts
                return () => {
                    userStatusDatabaseRef.off("value", handleStatusUpdate);
                };
            });
        };

        getUserRealTimeStatus();
    }, [friendList]);

    return (
        <Tabs
            defaultValue="online"
            className={cn(
                "dark:text-white text-xl font-sans antialiased w-[400px]",
                fontSans.variable
            )}
        >
            <TabsList className="gap-4 dark:text-slate-500 text-black">
                <TabsTrigger value="online">Online</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="blocked">Blocked</TabsTrigger>
                <TabsTrigger
                    className="bg-green-700 text-white"
                    value="addfriend"
                >
                    Add Friend
                </TabsTrigger>
            </TabsList>
            <TabsContent value="online">
                {friendList.map((friend: Friend, index) => {
                    return (
                        <div
                            key={index}
                            className="flex flex-col items-center justify-center text-slate-500"
                        >
                            <span>ID: {friend.userUid}</span>
                            <span>
                                Online:{" "}
                                {friend.isOnline !== null &&
                                    (friend.isOnline ? "True" : "False")}
                                {friend.isOnline === null && "LOADING"}
                            </span>
                        </div>
                    );
                })}
            </TabsContent>
            <TabsContent value="all">All Friends</TabsContent>
            <TabsContent value="pending">Pending Friend Requests</TabsContent>
            <TabsContent value="blocked">Blocked Users</TabsContent>
            <TabsContent value="addfriend">Add New Friend</TabsContent>
        </Tabs>
    );
};

const FriendItem = ({ userUid }) => {
    useEffect(() => {}, []);

    return <div className="w-full h-20"></div>;
};

export default FriendMenu;
