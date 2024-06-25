import firebase, { database, storage } from "../../../firebase/clientApp";
import { firestore } from "../../../firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
import type { Auth } from "firebase/auth";

import { useEffect, useState } from "react";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";

import { LuBox } from "react-icons/lu";
import { FaPlus } from "react-icons/fa6";
import { IoChatboxEllipsesSharp } from "react-icons/io5";
import { FaRegFileImage } from "react-icons/fa";
import { MdEmojiEmotions } from "react-icons/md";

import EmojiPicker from "emoji-picker-react";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Button } from "../ui/button";
import { AiOutlineLoading } from "react-icons/ai";
import { Avatar, AvatarImage } from "../ui/avatar";
import { AvatarFallback } from "@radix-ui/react-avatar";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "../ui/toaster";

const fontSans = FontSans({
    subsets: ["latin"],
    variable: "--font-sans",
});

const Dashboard = () => {
    const [content, setContent] = useState(["welcome", null]);

    console.log("CONTENT: ", content);
    return (
        <>
            <div className="flex w-full h-screen pl-20 pt-14">
                <DashboardNavigation setContent={setContent} />
                <DashboardContent content={content} />
            </div>
        </>
    );
};

const DashboardNavigation = ({ setContent }) => {
    const auth = firebase.auth() as unknown as Auth;
    const [user] = useAuthState(auth);
    const [newChatInput, setNewChatInput] = useState("");
    const [newChatError, setNewChatError] = useState("");
    const [userConversationIds, setUserConversationIds] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);

    const [toastMessage, setToastMessage] = useState("");
    const { toast } = useToast();

    const handleNewChatInputChange = (e) => {
        setNewChatInput(e.target.value);
    };

    const handleCreateNewChat = async () => {
        if (!newChatInput) {
            setNewChatError("It's empty :(");
            return;
        }

        const input = newChatInput.split("#");
        if (input.length !== 2) {
            setNewChatError("Invalid format!");
            return;
        }

        const [username, tag] = input;

        if (
            username.length < 2 ||
            username.length > 20 ||
            tag.length < 4 ||
            tag.length > 5
        ) {
            setNewChatError("Invalid format!");
            return;
        }

        try {
            const querySnapshot = await firestore
                .collection("users")
                .where("username", "==", username)
                .where("tag", "==", tag)
                .get();

            if (querySnapshot.empty) {
                setNewChatError("User not found!");
                return;
            }

            const doc = querySnapshot.docs[0];
            const newChatUserId = doc.data().uid;

            if (newChatUserId === user.uid) {
                setNewChatError("That's you!");
                return;
            }

            const checkExistingConversation = await firestore
                .collection("conversations")
                .where("userIds", "array-contains", user.uid)
                .get();

            let conversationExists = false;
            checkExistingConversation.forEach((conversationDoc) => {
                if (conversationDoc.data().userIds.includes(newChatUserId)) {
                    conversationExists = true;
                }
            });

            if (conversationExists) {
                setNewChatError("Conversation already exists!");
                return;
            }

            await firestore.collection("conversations").add({
                userIds: [user.uid, newChatUserId],
                lastChanged: firebase.firestore.FieldValue.serverTimestamp(),
            });

            setNewChatError(""); // Clear any previous error
            setToastMessage("New chat created successfully!");
        } catch (error) {
            console.error("Error creating chat:", error);
            setNewChatError("An Error Occured!");
        }
    };

    useEffect(() => {
        const unsubscribe = firestore
            .collection("conversations")
            .where("userIds", "array-contains", user.uid)
            .orderBy("lastChanged", "desc")
            .onSnapshot((snapshot) => {
                const userIds = [];
                snapshot.forEach((doc) => {
                    const ids = doc.data().userIds;
                    if (ids[0] === user.uid) {
                        userIds.push(ids[1]);
                    } else {
                        userIds.push(ids[0]);
                    }
                });
                setUserConversationIds(userIds);
            });

        return () => unsubscribe();
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

    return (
        <div className="h-full min-w-72 bg-slate-100 dark:bg-slate-700 overflow-scroll no-scrollbar no-scrollbar::-webkit-scrollbar flex-col items-center justify-center pt-2">
            <Toaster />
            <div className="flex flex-col w-full h-14 justify-start items-center p-4 gap-4 cursor-pointer">
                <Popover>
                    <PopoverTrigger>
                        <div
                            className="flex w-52 h-10 justify-center items-center gap-2 rounded-3xl bg-slate-300 dark:bg-slate-600
                                        hover:scale-105 hover:brightness-125 transition-all shadow-md"
                        >
                            <FaPlus size="15" />
                            <span>New Chat</span>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="bg-slate-300 dark:bg-slate-900 w-60 border-slate-500">
                        <div className="flex flex-col items-center justify-center gap-4">
                            <Label
                                className={cn(
                                    "dark:text-white text-sm font-sans antialiased",
                                    fontSans.variable
                                )}
                            >
                                Enter User Username & Tag
                            </Label>
                            <Input
                                id="new-chat-input"
                                onChange={handleNewChatInputChange}
                                placeholder="AwesomeUser#0001"
                                className={cn(
                                    "dark:text-white text-sm w-48 h-8 font-sans antialiased p-2 rounded-2xl",
                                    fontSans.variable
                                )}
                                type="text"
                            ></Input>
                            <Label
                                className={cn(
                                    "text-red-500 text-sm font-bold font-sans antialiased",
                                    fontSans.variable
                                )}
                            >
                                {newChatError}
                            </Label>
                            <Button
                                onClick={handleCreateNewChat}
                                className="bg-slate-400 flex gap-2 items-center justify-center"
                            >
                                <IoChatboxEllipsesSharp
                                    size="20"
                                    className="fill-white dark:fill-black"
                                />
                                <span
                                    className={cn(
                                        "text-white dark:text-black text-sm font-sans antialiased",
                                        fontSans.variable
                                    )}
                                >
                                    Chat
                                </span>
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
                <div className="flex flex-col">
                    {userConversationIds.map((id) => (
                        <ConversationNavigationItem
                            key={id}
                            setContent={setContent}
                            userId={id}
                            selected={selectedConversation === id}
                            setSelected={setSelectedConversation}
                        ></ConversationNavigationItem>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ConversationNavigationItem = ({
    setContent,
    userId,
    selected,
    setSelected,
}) => {
    const [userData, setUserData] = useState(null);
    const [userRealtimeStatus, setUserRealtimeStatus] = useState(null);

    useEffect(() => {
        const getUserRealTimeStatus = async () => {
            const userStatusDatabaseRef = database.ref(
                `userState/${userId}/status`
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

        const usersRef = firestore.collection("users");

        const getUserData = async () => {
            const userDoc = await usersRef
                .doc(userId)
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
    }, []);

    // console.log("REALTIME STATUS", userRealtimeStatus);

    return (
        <>
            {userData && (
                <div
                    className={cn(
                        "flex min-w-72 min-h-12 items-center justify-start px-6 py-2 gap-3 dark:hover:bg-slate-800 hover:bg-slate-300",
                        selected === true
                            ? "dark:bg-slate-800 bg-slate-300"
                            : ""
                    )}
                    onClick={() => {
                        console.log("CONVO CLICKED");
                        setSelected(userId);
                        setContent(["conversation", userId]);
                    }}
                >
                    <Avatar className="bg-white">
                        <AvatarImage src={userData[3]} />
                        <AvatarFallback>{}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col justify-center items-start">
                        <span className="font-semibold">{userData[0]}</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                            {userRealtimeStatus === "Offline"
                                ? userRealtimeStatus
                                : userData[2] || userRealtimeStatus}
                        </span>
                    </div>
                </div>
            )}
            {!userData && (
                <div className="flex min-w-72 min-h-12 items-center justify-start px-6 py-2 gap-3">
                    <AiOutlineLoading
                        className="animate-spin fill-black dark:fill-white"
                        size="20"
                    />
                </div>
            )}
        </>
    );
};

const DashboardContent = ({ content }) => {
    interface Message {
        senderUid: string;
        isFileType: boolean;
        text: string | null;
        createdAt: firebase.firestore.Timestamp;
        file: string | null;
    }

    const auth = firebase.auth() as unknown as Auth;
    const [user] = useAuthState(auth);
    const [messages, setMessages] = useState<Message[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<Record<string, any>>({});
    const [inputValue, setInputValue] = useState("");
    const [conversationId, setConversationId] = useState("");

    useEffect(() => {
        if (content[0] !== "conversation") {
            setLoading(false);
            return;
        }

        const getUserData = async (uid: string) => {
            if (!userData[uid]) {
                const userDoc = await firestore
                    .collection("users")
                    .doc(uid)
                    .get();
                if (userDoc.exists) {
                    setUserData((prevData) => ({
                        ...prevData,
                        [uid]: userDoc.data(),
                    }));
                }
            }
        };

        console.log(
            "Fetching messages for conversation with user:",
            content[1]
        );

        const unsubscribe = firestore
            .collection("conversations")
            .where("userIds", "array-contains", user.uid)
            .onSnapshot(
                (snapshot) => {
                    let conversation = null;
                    snapshot.forEach((doc) => {
                        if (doc.data().userIds.includes(content[1])) {
                            conversation = doc;
                        }
                    });

                    if (conversation) {
                        console.log("Conversation found:", conversation.id);
                        setConversationId(conversation.id);
                        const messageRef =
                            conversation.ref.collection("messages");
                        messageRef.orderBy("createdAt", "asc").onSnapshot(
                            (snapshot) => {
                                const messagesList: Message[] =
                                    snapshot.docs.map((messageDoc) => {
                                        const messageData = messageDoc.data();
                                        getUserData(messageData.senderUid);
                                        return {
                                            senderUid: messageData.senderUid,
                                            isFileType: messageData.type,
                                            text: messageData.text,
                                            createdAt: messageData.createdAt,
                                            file: messageData.file,
                                        };
                                    });
                                setMessages(messagesList);
                                setLoading(false);
                                console.log("Messages loaded:", messagesList);
                            },
                            (error) => {
                                console.error(
                                    "Error fetching messages:",
                                    error
                                );
                                setLoading(false);
                            }
                        );
                    } else {
                        console.error("Conversation not found");
                        setLoading(false);
                    }
                },
                (error) => {
                    console.error("Error fetching conversations:", error);
                    setLoading(false);
                }
            );

        return () => unsubscribe();
    }, [content]);

    const onEmojiClick = async (emojiObject, event) => {
        console.log("Emoji clicked:", emojiObject);
        if (!emojiObject || !emojiObject.emoji) {
            console.error("Invalid emoji object");
            return;
        }

        // Create a new message object
        const newMessage = {
            senderUid: user.uid,
            isFileType: false,
            text: emojiObject.emoji || "", // Ensure a default value
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            file: null,
        };

        try {
            // Add the new message to the conversation's "messages" collection
            await firestore
                .collection("conversations")
                .doc(conversationId)
                .collection("messages")
                .add(newMessage);
        } catch (error) {
            console.error("Error sending message: ", error);
        }
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const storageRef = storage.ref();
            const fileRef = storageRef.child(
                `messages/${conversationId}/${file.name}`
            );
            try {
                await fileRef.put(file);
                const fileUrl = await fileRef.getDownloadURL();

                const newMessage = {
                    senderUid: user.uid,
                    isFileType: true,
                    text: null,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    file: fileUrl,
                };

                await firestore
                    .collection("conversations")
                    .doc(conversationId)
                    .collection("messages")
                    .add(newMessage);
            } catch (error) {
                console.error("Error uploading file: ", error);
            }
        }
    };

    const handleSendMessage = async () => {
        if (inputValue !== "") {
            const newMessage = {
                senderUid: user.uid,
                isFileType: false,
                text: inputValue,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                file: null,
            };

            try {
                // Add the new message to the conversation's "messages" collection
                await firestore
                    .collection("conversations")
                    .doc(conversationId)
                    .collection("messages")
                    .add(newMessage);

                setInputValue("");
            } catch (error) {
                console.error("Error sending message: ", error);
            }
        }
    };

    return (
        <div className="h-full w-full bg-slate-200 dark:bg-slate-900 overflow-scroll no-scrollbar no-scrollbar::-webkit-scrollbar">
            {content[0] === "welcome" && (
                <div className="h-full w-full flex flex-col justify-center items-center gap-10">
                    <LuBox
                        className="hover:scale-105 transition-all duration-150"
                        size={100}
                    />
                    <div className="text-4xl font-bold">
                        Welcome to PHiscord
                    </div>
                </div>
            )}
            {messages && content[0] === "conversation" && (
                <>
                    <div className="min-h-full w-full flex flex-col items-start justify-end p-4 pb-24 overflow-scroll no-scrollbar no-scrollbar::-webkit-scrollbar">
                        <span className="flex w-full text-sm items-center justify-center py-10 dark:text-slate-300 text-slate-700">
                            Thus marks the beginning of your legendary chat
                        </span>
                        {messages.map((message, index) => {
                            const senderData = userData[message.senderUid];
                            return (
                                <div
                                    key={index}
                                    className="flex items-start justify-start gap-4 w-full min-h-16 p-1"
                                >
                                    <Avatar className="bg-white">
                                        <AvatarImage
                                            src={
                                                senderData
                                                    ? senderData.profilePicture
                                                    : null
                                            }
                                        />
                                        <AvatarFallback>{}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col items-start justify-center">
                                        <span>
                                            {senderData
                                                ? senderData.username
                                                : "Loading..."}
                                        </span>
                                        <img
                                            className="max-h-60"
                                            src={message.file}
                                        ></img>
                                        <span>{message.text}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="fixed flex items-center justify-start px-6 bottom-0 w-full h-20 dark:bg-slate-900 bg-slate-200 gap-4">
                        <Input
                            className="w-9 h-9 opacity-0 absolute bg-slate-100 cursor-pointer"
                            type="file"
                            onChange={handleFileChange}
                            placeholder="Type a message..."
                        ></Input>
                        <FaRegFileImage className="bg-slate-200 dark:bg-slate-900 w-9 h-9 p-1 rounded-xl fill-black dark:fill-white cursor-pointer" />
                        <Popover>
                            <PopoverTrigger>
                                <MdEmojiEmotions className="bg-slate-200 dark:bg-slate-900 w-9 h-9 p-1 rounded-xl fill-black dark:fill-white cursor-pointer" />
                            </PopoverTrigger>
                            <PopoverContent className="bg-slate-300 dark:bg-slate-900 w-60">
                                <EmojiPicker onEmojiClick={onEmojiClick} />
                            </PopoverContent>
                        </Popover>
                        <Input
                            onChange={handleInputChange}
                            className="min-w-44 max-w-[500px] h-1/2 bg-slate-300 dark:bg-slate-700 rounded-2xl"
                        ></Input>
                        <Button
                            onClick={handleSendMessage}
                            className="bg-slate-900 text-white hover:text-black rounded-xl"
                        >
                            Send
                        </Button>
                    </div>
                </>
            )}
            {!messages && loading && (
                <div className="h-full w-full flex items-center justify-center shadow-md text-white text-3xl gap-3">
                    <AiOutlineLoading
                        className="animate-spin fill-black dark:fill-white"
                        size="30"
                    />
                </div>
            )}
        </div>
    );
};

export default Dashboard;
