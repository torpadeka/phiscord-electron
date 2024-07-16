import firebase, { database, storage } from "../../../firebase/clientApp";
import { firestore } from "../../../firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
import type { Auth } from "firebase/auth";

import { useEffect, useRef, useState } from "react";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";

import { LuBox } from "react-icons/lu";
import { FaFile, FaPlus } from "react-icons/fa6";
import { IoChatboxEllipsesSharp } from "react-icons/io5";
import { FaSearch, FaUserFriends } from "react-icons/fa";
import { MdCall, MdCallEnd, MdEmojiEmotions } from "react-icons/md";

import EmojiPicker from "emoji-picker-react";
import { useDropzone } from "react-dropzone";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Button } from "../ui/button";
import { AiOutlineLoading } from "react-icons/ai";
import { Avatar, AvatarImage } from "../ui/avatar";
import { AvatarFallback } from "@radix-ui/react-avatar";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "../ui/toaster";
import UserProfilePopup from "./UserProfilePopup";
import TextareaAutosize from "react-textarea-autosize";
import FriendMenu from "./FriendMenu";
import { ScrollArea } from "../ui/scroll-area";

const fontSans = FontSans({
    subsets: ["latin"],
    variable: "--font-sans",
});

const Dashboard = ({
    inCall,
    setInCall,
    channelName,
    setChannelName,
    users,
    localTracks,
    leaveCall,
    unmuteVideo,
    muteVideo,
    muteAudio,
    unmuteAudio,
    deafenAudio,
    undeafenAudio,
    setActivePage,
    content,
    setContent,
}) => {
    return (
        <>
            <div className="flex w-full h-screen pl-20 pt-14">
                <DashboardNavigation content={content} setContent={setContent} inCall={inCall} />
                <DashboardContent
                    content={content}
                    setContent={setContent}
                    setActivePage={setActivePage}
                    inCall={inCall}
                    setInCall={setInCall}
                    channelName={channelName}
                    setChannelName={setChannelName}
                    users={users}
                    localTracks={localTracks}
                    leaveCall={leaveCall}
                    unmuteVideo={unmuteVideo}
                    muteVideo={muteVideo}
                    muteAudio={muteAudio}
                    unmuteAudio={unmuteAudio}
                />
                <DashboardInfo
                    content={content}
                    inCall={inCall}
                    setInCall={setInCall}
                    channelName={channelName}
                    setChannelName={setChannelName}
                    users={users}
                    localTracks={localTracks}
                    leaveCall={leaveCall}
                ></DashboardInfo>
            </div>
        </>
    );
};

const DashboardNavigation = ({ content, setContent, inCall }) => {
    const [loading, setLoading] = useState(true);
    const auth = firebase.auth() as unknown as Auth;
    const [user] = useAuthState(auth);
    const [newChatInput, setNewChatInput] = useState("");
    const [newChatError, setNewChatError] = useState("");
    const [userConversationIds, setUserConversationIds] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);
    const [isFriendMenuOpen, setIsFriendMenuOpen] = useState(false);
    const [deletingConversation, setDeletingConversation] = useState<
        boolean | string
    >(false);
    const [conversationSearchInput, setConversationSearchInput] = useState("");

    const [toastMessage, setToastMessage] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        setSelectedConversation(content[1]);
    }, [content])

    useEffect(() => {
        setNewChatError("");
        setNewChatInput("");
    }, [isCreatingNewChat]);

    const closeFriendMenu = () => {
        setIsFriendMenuOpen(false);
    };

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

        const checkSenderBlockedList = await firestore
            .collection("users")
            .doc(user.uid)
            .collection("blockedList")
            .where("userUid", "==", newChatUserId)
            .get();

        if (!checkSenderBlockedList.empty) {
            setNewChatError("You blocked this user!");
            return;
        }

        const checkReceiverBlockedList = await firestore
            .collection("users")
            .doc(newChatUserId)
            .collection("blockedList")
            .where("userUid", "==", user.uid)
            .get();

        if (!checkReceiverBlockedList.empty) {
            setNewChatError("This user has blocked you!");
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
            setNewChatError("");
            setToastMessage(
                "Conversation already exists! Redirecting now . . ."
            );
            setSelectedConversation(newChatUserId);
            setContent(["conversation", newChatUserId]);
            setIsCreatingNewChat(false);
            return;
        }

        await firestore.collection("conversations").add({
            userIds: [user.uid, newChatUserId],
            lastChanged: firebase.firestore.FieldValue.serverTimestamp(),
        });

        setNewChatError(""); // Clear any previous error
        setToastMessage("New chat created successfully!");
        setIsCreatingNewChat(false);
        setSelectedConversation(newChatUserId);
        setContent(["conversation", newChatUserId]);
    };

    useEffect(() => {
        const unsubscribe = firestore
            .collection("conversations")
            .where("userIds", "array-contains", user.uid)
            .orderBy("lastChanged", "desc")
            .onSnapshot((snapshot) => {
                setLoading(true);
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
                setLoading(false);
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

    const handleDeleteConversation = async () => {
        if (inCall) {
            setToastMessage("Error! You are still in a call!");
            return;
        }

        const conversationDoc = await firestore
            .collection("conversations")
            .where("userIds", "array-contains", user.uid)
            .get();

        let conversationId = "";
        let conversationRef = null;

        conversationDoc.forEach((doc) => {
            if (doc.data().userIds.includes(deletingConversation)) {
                conversationRef = doc.ref;
                conversationId = doc.ref.id;
                return;
            }
        });

        if (!conversationRef) {
            console.error("Conversation not found");
            setToastMessage("Error! Conversation not found.");
            return;
        }

        // Reference to the 'messages' subcollection
        const messagesCollectionRef = conversationRef.collection("messages");

        // Fetch all documents in the 'messages' subcollection and delete them
        const deleteMessages = async () => {
            const snapshot = await messagesCollectionRef.get();
            const deletePromises = snapshot.docs.map((doc) => doc.ref.delete());
            await Promise.all(deletePromises);
        };

        // Delete the 'messages' subcollection
        await deleteMessages();

        // Now delete the conversation document
        await conversationRef.delete();

        console.log("firestore deletion conversation: ", conversationId);

        const listRef = storage.ref().child(`messages/${conversationId}/`);

        // List all files in the folder and delete them
        listRef
            .listAll()
            .then(async (result) => {
                // Delete each file in the folder
                const deletePromises = result.items.map((fileRef) =>
                    fileRef.delete()
                );

                // Wait for all delete promises to resolve
                await Promise.all(deletePromises);

                // Now check if there are any remaining sub-folders and delete them
                const deleteFolderPromises = result.prefixes.map((folderRef) =>
                    handleDeleteSubFolder(folderRef)
                );
                await Promise.all(deleteFolderPromises);

                console.log(
                    `All files in the folder messages/${conversationId}/ have been deleted`
                );
            })
            .catch((error) => {
                console.error("Error listing files:", error);
            });

        setToastMessage("Successfully deleted conversation!");
        setSelectedConversation(null);
        setContent(["welcome", null]);
        setDeletingConversation(false);
    };

    // Recursive function to delete files within sub-folders
    const handleDeleteSubFolder = async (folderRef) => {
        return folderRef
            .listAll()
            .then(async (result) => {
                // Delete each file in the sub-folder
                const deletePromises = result.items.map((fileRef) =>
                    fileRef.delete()
                );

                // Wait for all delete promises to resolve
                await Promise.all(deletePromises);

                // Recursively delete any sub-folders
                const deleteFolderPromises = result.prefixes.map(
                    (subFolderRef) => handleDeleteSubFolder(subFolderRef)
                );
                await Promise.all(deleteFolderPromises);

                console.log(
                    `All files in the folder ${folderRef.fullPath} have been deleted`
                );
            })
            .catch((error) => {
                console.error("Error listing files in sub-folder:", error);
            });
    };

    return (
        <div className="h-full min-w-72 bg-slate-100 dark:bg-slate-700 overflow-scroll no-scrollbar no-scrollbar::-webkit-scrollbar flex-col items-center justify-center pt-2">
            <Toaster />
            <div className="flex flex-col w-full h-14 justify-start items-center p-4 gap-4 cursor-pointer">
                <Popover
                    open={isCreatingNewChat}
                    onOpenChange={setIsCreatingNewChat}
                >
                    <PopoverTrigger onClick={() => setIsCreatingNewChat(true)}>
                        <div
                            className="flex w-52 h-10 justify-center items-center gap-2 rounded-3xl bg-slate-300 dark:bg-slate-600
                                        hover:scale-105 hover:brightness-125 transition-all shadow-md"
                        >
                            <div className="flex justify-start items-center gap-2 w-1/2">
                                <FaPlus size="15" />
                                <span>New Chat</span>
                            </div>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="bg-slate-100 dark:bg-slate-900 w-60 border-slate-500">
                        <div className="flex flex-col items-center justify-center gap-3">
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
                                    "dark:text-white text-sm w-48 font-sans antialiased p-4 rounded-2xl bg-slate-300 dark:bg-slate-700",
                                    fontSans.variable
                                )}
                                type="text"
                            ></Input>
                            <Label
                                className={cn(
                                    "text-red-500 text-sm font-sans antialiased",
                                    fontSans.variable
                                )}
                            >
                                {newChatError}
                            </Label>
                            <Button
                                onClick={handleCreateNewChat}
                                className="bg-slate-900 text-white hover:text-black hover:bg-slate-200 rounded-xl gap-2 fill-white hover:fill-black"
                            >
                                <IoChatboxEllipsesSharp size="20" />
                                <span
                                    className={cn(
                                        "text-sm font-sans antialiased",
                                        fontSans.variable
                                    )}
                                >
                                    Chat
                                </span>
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
                <Dialog
                    open={isFriendMenuOpen}
                    onOpenChange={setIsFriendMenuOpen}
                >
                    <DialogTrigger>
                        <div
                            className="flex w-52 h-10 justify-center items-center gap-2 rounded-3xl bg-slate-300 dark:bg-slate-600
                                        hover:scale-105 hover:brightness-125 transition-all shadow-md"
                        >
                            <div className="flex justify-start items-center gap-2 w-1/2">
                                <FaUserFriends size="15" />
                                <span>Friends</span>
                            </div>
                        </div>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle
                                className={cn(
                                    "dark:text-white text-xl font-sans antialiased",
                                    fontSans.variable
                                )}
                            >
                                Friends
                            </DialogTitle>
                            <DialogDescription>
                                <FriendMenu
                                    setContent={setContent}
                                    closeFriendMenu={closeFriendMenu}
                                    setSelectedConversation={
                                        setSelectedConversation
                                    }
                                ></FriendMenu>
                            </DialogDescription>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
                <Input
                    onChange={(e) => setConversationSearchInput(e.target.value)}
                    placeholder="Search Conversations"
                    className={cn(
                        "dark:text-white text-sm w-60 font-sans antialiased p-4 mt-2 rounded-2xl bg-slate-300 dark:bg-slate-800",
                        fontSans.variable
                    )}
                    type="text"
                ></Input>
                <div className="flex flex-col w-full gap-1">
                    {loading && (
                        <div className="h-full min-w-72 bg-slate-100 dark:bg-slate-700 flex flex-col items-center justify-center gap-4 mt-10">
                            <AiOutlineLoading
                                className="animate-spin"
                                size="30"
                            />
                            <span>Loading...</span>
                        </div>
                    )}
                    {!loading &&
                        userConversationIds.map((id) => (
                            <ContextMenu key={id}>
                                <ContextMenuTrigger>
                                    <ConversationNavigationItem
                                        key={id}
                                        setContent={setContent}
                                        userUid={id}
                                        selected={selectedConversation === id}
                                        setSelected={setSelectedConversation}
                                        searchInput={conversationSearchInput}
                                    ></ConversationNavigationItem>
                                </ContextMenuTrigger>
                                <ContextMenuContent
                                    className={cn(
                                        "dark:text-white text-sm font-sans antialiased",
                                        fontSans.variable
                                    )}
                                >
                                    <ContextMenuItem
                                        onClick={() => {
                                            setDeletingConversation(id);
                                            console.log(
                                                "Conversation Deletion ID Set"
                                            );
                                        }}
                                    >
                                        <span className="text-red-600 font-bold cursor-pointer">
                                            Delete Conversation
                                        </span>
                                    </ContextMenuItem>
                                </ContextMenuContent>
                            </ContextMenu>
                        ))}
                </div>
                <Dialog
                    open={deletingConversation !== false}
                    onOpenChange={setDeletingConversation}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle
                                className={cn(
                                    "dark:text-white text-xl font-sans antialiased",
                                    fontSans.variable
                                )}
                            >
                                Delete Conversation
                            </DialogTitle>
                            <DialogDescription
                                className={cn(
                                    "dark:text-white text-[16px] font-sans antialiased flex flex-col gap-4",
                                    fontSans.variable
                                )}
                            >
                                <div>
                                    This will wipe all messages and files in the
                                    conversation and it cannot be undone! Are
                                    you sure?
                                </div>
                                <div className="flex items-center justify-end w-full gap-4">
                                    <Button
                                        className="bg-red-600 text-white hover:text-black hover:bg-slate-200 rounded-xl"
                                        onClick={() => {
                                            handleDeleteConversation();
                                        }}
                                    >
                                        Confirm Deletion
                                    </Button>
                                    <Button
                                        onClick={() =>
                                            setDeletingConversation(false)
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
            </div>
        </div>
    );
};

const ConversationNavigationItem = ({
    setContent,
    userUid,
    selected,
    setSelected,
    searchInput,
}) => {
    const [userData, setUserData] = useState(null);
    const [userRealtimeStatus, setUserRealtimeStatus] = useState(null);

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

        const usersRef = firestore.collection("users");

        const getUserData = async () => {
            const unsubscribeUserDoc = usersRef
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
    }, []);

    // console.log("REALTIME STATUS", userRealtimeStatus);

    return (
        <>
            {userData &&
                userData[0]
                    .toLowerCase()
                    .includes(searchInput.toLowerCase()) && (
                    <div
                        className={cn(
                            "flex w-full min-h-12 items-center justify-start px-2 py-2 gap-3 dark:hover:bg-slate-800 hover:bg-slate-300 rounded-xl",
                            selected === true
                                ? "dark:bg-slate-800 bg-slate-300"
                                : ""
                        )}
                        onClick={() => {
                            console.log("CONVO CLICKED");
                            setSelected(userUid);
                            setContent(["conversation", userUid]);
                        }}
                    >
                        <Avatar className="bg-white">
                            <AvatarImage src={userData[3]} />
                            <AvatarFallback>{}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col justify-center items-start">
                            <span className="font-semibold max-w-44 overflow-x-scroll no-scrollbar no-scrollbar::-webkit-scrollbar">
                                {userData[0]}
                            </span>
                            <span className="text-sm text-slate-600 dark:text-slate-400 max-w-44 whitespace-nowrap overflow-x-scroll no-scrollbar no-scrollbar::-webkit-scrollbar">
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

const DashboardContent = ({
    content,
    setContent,
    setActivePage,
    inCall,
    setInCall,
    channelName,
    setChannelName,
    users,
    localTracks,
    leaveCall,
    unmuteVideo,
    muteVideo,
    muteAudio,
    unmuteAudio,
}) => {
    interface Message {
        senderUid: string;
        isFileType: boolean;
        isImageType: boolean;
        isVideoType: boolean;
        text: string | null;
        createdAt: firebase.firestore.Timestamp;
        file: string | null;
        fileName: string | null;
        messageId: string | null;
        edited: boolean;
    }

    const auth = firebase.auth() as unknown as Auth;
    const [user] = useAuthState(auth);
    const [messages, setMessages] = useState<Message[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<Record<string, any>>({});
    const [inputValue, setInputValue] = useState("");
    const [conversationId, setConversationId] = useState("");
    const [isOutgoingBlocked, setIsOutgoingBlocked] = useState(false);
    const [isIngoingBlocked, setIsIngoingBlocked] = useState(false);
    const [textareaHeight, setTextareaHeight] = useState("2.5rem");
    const [emojiOpen, setEmojiOpen] = useState(false);
    const textareaRef = useRef(null);
    const messagesRef = useRef(null);
    const [editingMessage, setEditingMessage] = useState<
        [boolean, string, string]
    >([false, "", ""]);
    const [deletingMessage, setDeletingMessage] = useState<[boolean, string]>([
        false,
        "",
    ]);
    const [isDropzoneVisible, setDropzoneVisible] = useState(false);
    const [searchingMessage, setSearchingMessage] = useState(false);
    const [searchMessageInput, setSearchMessageInput] = useState("");
    const dragCounter = useRef(0);

    useEffect(() => {
        const handleDragEnter = (e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current++;
            setDropzoneVisible(true);
        };

        const handleDragLeave = (e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current--;
            if (dragCounter.current === 0) {
                setDropzoneVisible(false);
            }
        };

        const handleDrop = (e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current = 0;
            setDropzoneVisible(false);
        };

        window.addEventListener("dragenter", handleDragEnter);
        window.addEventListener("dragleave", handleDragLeave);
        window.addEventListener("drop", handleDrop);

        return () => {
            window.removeEventListener("dragenter", handleDragEnter);
            window.removeEventListener("dragleave", handleDragLeave);
            window.removeEventListener("drop", handleDrop);
        };
    }, []);

    const { getRootProps, isDragActive } = useDropzone({
        noClick: true,
        onDrop: (acceptedFiles) => {
            console.log(acceptedFiles);
            acceptedFiles.forEach(async (file) => {
                const storageRef = storage.ref();
                const fileRef = storageRef.child(
                    `messages/${conversationId}/${file.name}`
                );

                const isImage = file.type.startsWith("image/");
                const isVideo = file.type.startsWith("video/");

                await fileRef.put(file);
                const fileUrl = await fileRef.getDownloadURL();

                const newMessage = {
                    senderUid: user.uid,
                    isFileType: true,
                    isImageType: isImage,
                    isVideoType: isVideo,
                    text: null,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    messageId: null,
                    file: fileUrl,
                    fileName: file.name,
                    edited: false,
                };

                const newMessageDocRef = await firestore
                    .collection("conversations")
                    .doc(conversationId)
                    .collection("messages")
                    .add(newMessage);

                await newMessageDocRef.update({
                    messageId: newMessageDocRef.id,
                });
            });
        },
    });

    const Filter = require("bad-words");
    const filter = new Filter();

    const localVideoRef = useRef(null);
    const remoteVideoRefs = useRef({});

    useEffect(() => {
        console.log("RENDERING LOCAL 1");
        if (localTracks.cameraTrack && localVideoRef.current) {
            localTracks.cameraTrack.play(localVideoRef.current);
        }
        console.log("RENDERING LOCAL 2");
    }, [localTracks.cameraTrack, conversationId]);

    useEffect(() => {
        console.log("Users array:", users);
        users.forEach((user) => {
            if (user.videoTrack && remoteVideoRefs.current[user.uid]) {
                console.log("Playing remote video for user:", user.uid);
                user.videoTrack.play(remoteVideoRefs.current[user.uid]);
            }
        });
    }, [users, conversationId]);

    useEffect(() => {
        if (content[0] !== "conversation") {
            setLoading(false);
            return;
        }

        const trackedUids = new Set();
        let unsubscribeFunctions = [];

        const getUserData = (uid) => {
            if (!trackedUids.has(uid)) {
                trackedUids.add(uid);
                const unsubscribe = firestore
                    .collection("users")
                    .doc(uid)
                    .onSnapshot((userDoc) => {
                        if (userDoc.exists) {
                            setUserData((prevData) => ({
                                ...prevData,
                                [uid]: userDoc.data(),
                            }));
                        }
                    });

                // Store the unsubscribe function for cleanup
                unsubscribeFunctions.push(unsubscribe);
            }
        };

        console.log(
            "Fetching messages for conversation with user:",
            content[1]
        );

        const unsubscribeConversation = firestore
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
                        const unsubscribeMessages = messageRef
                            .orderBy("createdAt", "asc")
                            .onSnapshot(
                                (snapshot) => {
                                    const messagesList = snapshot.docs.map(
                                        (messageDoc) => {
                                            const messageData =
                                                messageDoc.data();
                                            getUserData(messageData.senderUid);
                                            return {
                                                senderUid:
                                                    messageData.senderUid,
                                                isFileType:
                                                    messageData.isFileType,
                                                isImageType:
                                                    messageData.isImageType,
                                                isVideoType:
                                                    messageData.isVideoType,
                                                fileName: messageData.fileName,
                                                text: messageData.text,
                                                createdAt:
                                                    messageData.createdAt,
                                                file: messageData.file,
                                                messageId: messageDoc.id,
                                                edited: messageData.edited,
                                            };
                                        }
                                    );
                                    setMessages(messagesList);
                                    setLoading(false);
                                    console.log(
                                        "Messages loaded:",
                                        messagesList
                                    );

                                    const checkBlocked = () => {
                                        const unsubscribeIngoing = firestore
                                            .collection("users")
                                            .doc(content[1])
                                            .collection("blockedList")
                                            .where("userUid", "==", user.uid)
                                            .onSnapshot((snapshot) => {
                                                setIsIngoingBlocked(
                                                    !snapshot.empty
                                                );
                                            });

                                        const unsubscribeOutgoing = firestore
                                            .collection("users")
                                            .doc(user.uid)
                                            .collection("blockedList")
                                            .where("userUid", "==", content[1])
                                            .onSnapshot((snapshot) => {
                                                setIsOutgoingBlocked(
                                                    !snapshot.empty
                                                );
                                            });

                                        return () => {
                                            unsubscribeIngoing();
                                            unsubscribeOutgoing();
                                        };
                                    };

                                    const unsubscribeBlocked = checkBlocked();
                                    unsubscribeFunctions.push(
                                        unsubscribeBlocked
                                    );

                                    return unsubscribeMessages;
                                },
                                (error) => {
                                    console.error(
                                        "Error fetching messages:",
                                        error
                                    );
                                    setLoading(false);
                                }
                            );

                        unsubscribeFunctions.push(unsubscribeMessages);
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

        unsubscribeFunctions.push(unsubscribeConversation);

        return () => {
            unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
        };
    }, [content]);

    const onEmojiClick = (emojiObject, event) => {
        setInputValue(inputValue + emojiObject.emoji);
    };

    const onEditEmojiClick = (emojiObject, event) => {
        setEditingMessage([
            editingMessage[0],
            editingMessage[1],
            editingMessage[2] + emojiObject.emoji,
        ]);
    };

    const scrollToBottom = () => {
        messagesRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [textareaHeight]);

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

            const isImage = file.type.startsWith("image/");
            const isVideo = file.type.startsWith("video/");

            await fileRef.put(file);
            const fileUrl = await fileRef.getDownloadURL();

            const newMessage = {
                senderUid: user.uid,
                isFileType: true,
                isImageType: isImage,
                isVideoType: isVideo,
                text: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                messageId: null,
                file: fileUrl,
                fileName: file.name,
                edited: false,
            };

            const newMessageDocRef = await firestore
                .collection("conversations")
                .doc(conversationId)
                .collection("messages")
                .add(newMessage);

            await newMessageDocRef.update({
                messageId: newMessageDocRef.id,
            });
        }
    };

    const handleSendMessage = async () => {
        if (inputValue !== "") {
            const newMessage = {
                senderUid: user.uid,
                isFileType: false,
                isImageType: false,
                isVideoType: false,
                text: inputValue,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                file: null,
                fileName: null,
                edited: false,
            };

            await firestore
                .collection("conversations")
                .doc(conversationId)
                .update({
                    lastChanged:
                        firebase.firestore.FieldValue.serverTimestamp(),
                });

            // Add the new message to the conversation's "messages" collection
            const newMessageDocRef = await firestore
                .collection("conversations")
                .doc(conversationId)
                .collection("messages")
                .add(newMessage);

            newMessageDocRef.update({
                messageId: newMessageDocRef.id,
            });

            setInputValue("");

            scrollToBottom();

            const conversationRef = await firestore
                .collection("conversations")
                .doc(conversationId)
                .get();

            const uids: string = conversationRef.data().userIds;
            let receiverUid;
            let senderUid;

            if (uids[0] === user.uid) {
                receiverUid = uids[1];
                senderUid = uids[0];
            } else {
                receiverUid = uids[0];
                senderUid = uids[1];
            }

            console.log(uids[0]);
            console.log(uids[1]);
            console.log(receiverUid);

            // Add Notifications
            firestore
                .collection("users")
                .doc(receiverUid)
                .collection("notifications")
                .add({
                    title: userData[user.uid].username,
                    body: newMessage.text,
                    icon: userData[user.uid].profilePicture,
                });
        }
    };

    const handleEditMessageClick = (messageId, messageText) => {
        setEditingMessage([true, messageId, messageText]);
        console.log("Editing Message:", editingMessage); // Debugging to check values
    };

    const handleTextareaChange = (e) => {
        setEditingMessage([
            editingMessage[0],
            editingMessage[1],
            e.target.value,
        ]);
    };

    const handleConfirmEditMessage = async () => {
        if (editingMessage[2] === "") {
            handleDeleteMessageClick(editingMessage[1]);
        } else {
            await firestore
                .collection("conversations")
                .doc(conversationId)
                .collection("messages")
                .doc(editingMessage[1])
                .update({
                    text: editingMessage[2],
                    edited: true,
                });
        }

        setEditingMessage([false, "", ""]);
    };

    const handleDeleteMessageClick = (messageId) => {
        setDeletingMessage([true, messageId]);
    };

    const handleConfirmDeleteMessage = async () => {
        const messageRef = await firestore
            .collection("conversations")
            .doc(conversationId)
            .collection("messages")
            .doc(deletingMessage[1])
            .get();

        const isFileType = messageRef.data().isFileType;
        const file = messageRef.data().file;

        await firestore
            .collection("conversations")
            .doc(conversationId)
            .collection("messages")
            .doc(deletingMessage[1])
            .delete();

        if (isFileType) {
            const messageFileRef = storage.refFromURL(file);
            await messageFileRef.delete();
        }

        setDeletingMessage([false, ""]);
    };

    const canModifyMessage = (messageSenderUid) => {
        if (messageSenderUid === user.uid) return true;
        return false;
    };

    const truncateString = (str, num) => {
        if (str.length <= num) {
            return str;
        }
        return str.slice(0, num) + "...";
    };

    return (
        <div className="h-full w-full bg-slate-200 dark:bg-slate-900 overflow-scroll no-scrollbar no-scrollbar::-webkit-scrollbar">
            {inCall && channelName === conversationId && (
                <div className="sticky top-0 z-50 w-full h-72 gap-4 bg-slate-400 flex justify-center items-center flex-col">
                    <div className="local-video relative w-[328px] h-[188px] rounded-2xl border-slate-300 border-4">
                        <div
                            ref={localVideoRef}
                            className="video-player z-50 rounded-xl"
                        ></div>
                        <div className="w-full h-full absolute bg-slate-100 top-0 rounded-xl"></div>
                    </div>
                    <div className="remote-videos">
                        {users.map((user) => (
                            <div
                                key={user.uid}
                                className="relative w-64 h-[148px] rounded-2xl border-slate-300 border-4"
                            >
                                <div
                                    ref={(el) => {
                                        remoteVideoRefs.current[user.uid] = el;
                                    }}
                                    className="video-player"
                                ></div>
                                {!user.videoTrack && (
                                    <div className="w-full h-full absolute bg-slate-100 top-0 rounded-xl"></div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-center w-full gap-2">
                        <Button onClick={unmuteVideo}>Camera On</Button>
                        <Button onClick={muteVideo}>Camera Off</Button>
                    </div>
                </div>
            )}
            {content[0] === "welcome" && (
                <div className="h-full w-full flex flex-col justify-center items-center gap-4">
                    <LuBox
                        className="hover:scale-105 transition-all duration-150"
                        size={100}
                    />
                    <div className="text-3xl font-bold">
                        Welcome to PHiscord
                    </div>
                </div>
            )}
            {messages && content[0] === "conversation" && (
                <>
                    {isDropzoneVisible && (
                        <div
                            {...getRootProps({
                                className: `fixed w-full h-screen z-20 pointer-events-auto`,
                            })}
                        >
                            {isDragActive && (
                                <div className="w-full h-full flex items-center justify-center bg-gray-800 dark:bg-slate-600 dark:bg-opacity-30 bg-opacity-50"></div>
                            )}
                        </div>
                    )}
                    <div
                        className="relative min-h-full w-full flex flex-col items-start justify-end p-4 overflow-y-auto no-scrollbar no-scrollbar::-webkit-scrollbar"
                        style={{
                            paddingBottom: `calc(${textareaHeight} + 2rem)`,
                        }}
                    >
                        <Dialog
                            open={searchingMessage}
                            onOpenChange={setSearchingMessage}
                        >
                            <DialogTrigger>
                                <div
                                    onClick={() => setSearchingMessage(true)}
                                    className={cn("shadow-md transition-colors cursor-pointer hover:brightness-150 flex items-center justify-center w-10 h-10 bg-slate-600 rounded-full dark:bg-slate-600 fixed left-[376px] z-50", 
                                        inCall? "top-[355px]" : "top-16"
                                    )}
                                >
                                    <FaSearch
                                        className="fill-white"
                                        size={20}
                                    />
                                </div>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle
                                        className={cn(
                                            "dark:text-white text-xl font-sans antialiased",
                                            fontSans.variable
                                        )}
                                    >
                                        Search Messages
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
                                                placeholder="Search Here"
                                                value={searchMessageInput}
                                                onChange={(e) =>
                                                    setSearchMessageInput(
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full bg-slate-300 dark:bg-slate-700 rounded-2xl mt-4 p-4"
                                            ></Input>
                                            <ScrollArea className="w-[460px] h-72">
                                                {messages.map(
                                                    (message, index) => {
                                                        const senderData =
                                                            userData[
                                                                message
                                                                    .senderUid
                                                            ];
                                                        if (
                                                            (message.text &&
                                                                message.text
                                                                    .toLowerCase()
                                                                    .includes(
                                                                        searchMessageInput.toLowerCase()
                                                                    )) ||
                                                            (message.isFileType &&
                                                                message.fileName
                                                                    .toLowerCase()
                                                                    .includes(
                                                                        searchMessageInput.toLowerCase()
                                                                    ))
                                                        )
                                                            return (
                                                                <div
                                                                    key={index}
                                                                    className="flex items-start justify-start gap-4 w-full min-h-16 p-1 my-1"
                                                                >
                                                                    <Popover>
                                                                        <PopoverTrigger>
                                                                            <Avatar className="bg-white">
                                                                                <AvatarImage
                                                                                    src={
                                                                                        senderData
                                                                                            ? senderData.profilePicture
                                                                                            : null
                                                                                    }
                                                                                />
                                                                                <AvatarFallback>
                                                                                    {}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                        </PopoverTrigger>
                                                                        <PopoverContent
                                                                            sideOffset={
                                                                                10
                                                                            }
                                                                            className="w-min h-min bg-slate-100 dark:bg-slate-900 border-slate-500"
                                                                        >
                                                                            <UserProfilePopup
                                                                                serverId={
                                                                                    null
                                                                                }
                                                                                userUid={
                                                                                    message.senderUid
                                                                                }
                                                                                dashboardContent={
                                                                                    content
                                                                                }
                                                                                setDashboardContent={
                                                                                    setContent
                                                                                }
                                                                                setActivePage={
                                                                                    setActivePage
                                                                                }
                                                                            ></UserProfilePopup>
                                                                        </PopoverContent>
                                                                    </Popover>
                                                                    <div className="flex flex-col items-start justify-center">
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            <span className="font-bold text-black dark:text-white text-lg">
                                                                                {senderData
                                                                                    ? senderData.username
                                                                                    : "Loading..."}
                                                                            </span>
                                                                            <span className="text-black dark:text-white text-[11px]">
                                                                                {message &&
                                                                                    message.createdAt &&
                                                                                    (
                                                                                        message.createdAt
                                                                                            .toDate()
                                                                                            .getMonth() +
                                                                                        1
                                                                                    ).toString()}

                                                                                /
                                                                                {message &&
                                                                                    message.createdAt &&
                                                                                    message.createdAt
                                                                                        .toDate()
                                                                                        .getDate()
                                                                                        .toString()}

                                                                                /
                                                                                {message &&
                                                                                    message.createdAt &&
                                                                                    message.createdAt
                                                                                        .toDate()
                                                                                        .getFullYear()
                                                                                        .toString()}
                                                                            </span>
                                                                            <span className="text-black dark:text-white text-[11px]">
                                                                                {message &&
                                                                                    message.createdAt &&
                                                                                    message.createdAt
                                                                                        .toDate()
                                                                                        .getHours()
                                                                                        .toString()}

                                                                                :
                                                                                {message &&
                                                                                    message.createdAt &&
                                                                                    (message.createdAt
                                                                                        .toDate()
                                                                                        .getMinutes() <
                                                                                    10
                                                                                        ? 0 +
                                                                                          message.createdAt
                                                                                              .toDate()
                                                                                              .getMinutes()
                                                                                              .toString()
                                                                                        : message.createdAt
                                                                                              .toDate()
                                                                                              .getMinutes()
                                                                                              .toString())}
                                                                                {message &&
                                                                                message.createdAt &&
                                                                                message.createdAt
                                                                                    .toDate()
                                                                                    .getHours() >
                                                                                    11 &&
                                                                                message.createdAt
                                                                                    .toDate()
                                                                                    .getHours() <
                                                                                    24
                                                                                    ? " PM"
                                                                                    : " AM"}
                                                                            </span>
                                                                        </div>
                                                                        <ContextMenu>
                                                                            <ContextMenuTrigger>
                                                                                {message.isFileType &&
                                                                                    message.isImageType &&
                                                                                    !message.isVideoType && (
                                                                                        <div className="flex flex-col gap-2 items-start">
                                                                                            <a
                                                                                                href={
                                                                                                    message.file
                                                                                                }
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                            >
                                                                                                <img
                                                                                                    className="max-h-60 rounded-xl"
                                                                                                    src={
                                                                                                        message.file
                                                                                                    }
                                                                                                ></img>
                                                                                            </a>
                                                                                            <div className="text-sm italic">
                                                                                                {truncateString(
                                                                                                    message.fileName,
                                                                                                    50
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                {message.isFileType &&
                                                                                    !message.isImageType &&
                                                                                    message.isVideoType && (
                                                                                        <div className="flex flex-col gap-2 items-start">
                                                                                            <video
                                                                                                className="max-h-60 rounded-xl"
                                                                                                src={
                                                                                                    message.file
                                                                                                }
                                                                                                controls={
                                                                                                    true
                                                                                                }
                                                                                            ></video>
                                                                                            <div className="text-sm italic">
                                                                                                {truncateString(
                                                                                                    message.fileName,
                                                                                                    50
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                {message.isFileType &&
                                                                                    !message.isImageType &&
                                                                                    !message.isVideoType && (
                                                                                        <div className="flex flex-col gap-2 items-start">
                                                                                            <a
                                                                                                href={
                                                                                                    message.file
                                                                                                }
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                            >
                                                                                                <FaFile
                                                                                                    className="m-2"
                                                                                                    size={
                                                                                                        70
                                                                                                    }
                                                                                                />
                                                                                            </a>
                                                                                            <div className="text-sm italic">
                                                                                                {truncateString(
                                                                                                    message.fileName,
                                                                                                    50
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                <span className="text-base">
                                                                                    {message.text &&
                                                                                        filter.clean(
                                                                                            message.text
                                                                                        )}
                                                                                </span>
                                                                                {message.edited && (
                                                                                    <div className="text-[10px]">
                                                                                        (edited)
                                                                                    </div>
                                                                                )}
                                                                            </ContextMenuTrigger>
                                                                            <ContextMenuContent
                                                                                className={cn(
                                                                                    "dark:text-white text-sm font-sans antialiased",
                                                                                    fontSans.variable
                                                                                )}
                                                                            >
                                                                                {(canModifyMessage(
                                                                                    message.senderUid
                                                                                ) &&
                                                                                    (isIngoingBlocked ||
                                                                                    isOutgoingBlocked ? (
                                                                                        <span className="text-red-600">
                                                                                            Cannot
                                                                                            modify
                                                                                            messages
                                                                                            when
                                                                                            blocked!
                                                                                        </span>
                                                                                    ) : (
                                                                                        <>
                                                                                            {!message.file && (
                                                                                                <ContextMenuItem
                                                                                                    onClick={() => {
                                                                                                        handleEditMessageClick(
                                                                                                            message.messageId,
                                                                                                            message.text
                                                                                                        );
                                                                                                    }}
                                                                                                >
                                                                                                    Edit
                                                                                                    Message
                                                                                                </ContextMenuItem>
                                                                                            )}
                                                                                            <ContextMenuItem
                                                                                                onClick={() => {
                                                                                                    handleDeleteMessageClick(
                                                                                                        message.messageId
                                                                                                    );
                                                                                                }}
                                                                                            >
                                                                                                <span className="text-red-600 font-bold">
                                                                                                    Delete
                                                                                                    Message
                                                                                                </span>
                                                                                            </ContextMenuItem>
                                                                                        </>
                                                                                    ))) || (
                                                                                    <span className="text-red-600">
                                                                                        You
                                                                                        can't
                                                                                        modify
                                                                                        this
                                                                                        message!
                                                                                    </span>
                                                                                )}
                                                                            </ContextMenuContent>
                                                                        </ContextMenu>
                                                                    </div>
                                                                    <Dialog
                                                                        open={
                                                                            editingMessage[0]
                                                                        }
                                                                        onOpenChange={(
                                                                            isOpen
                                                                        ) =>
                                                                            setEditingMessage(
                                                                                [
                                                                                    isOpen,
                                                                                    editingMessage[1],
                                                                                    editingMessage[2],
                                                                                ]
                                                                            )
                                                                        }
                                                                    >
                                                                        <DialogContent>
                                                                            <DialogHeader className="flex flex-col gap-4">
                                                                                <DialogTitle
                                                                                    className={cn(
                                                                                        "dark:text-white text-xl font-sans antialiased",
                                                                                        fontSans.variable
                                                                                    )}
                                                                                >
                                                                                    Edit
                                                                                    Message
                                                                                </DialogTitle>
                                                                                <DialogDescription
                                                                                    className={cn(
                                                                                        "dark:text-white text-xl font-sans antialiased",
                                                                                        fontSans.variable
                                                                                    )}
                                                                                >
                                                                                    <TextareaAutosize
                                                                                        value={
                                                                                            editingMessage[2]
                                                                                        }
                                                                                        onChange={
                                                                                            handleTextareaChange
                                                                                        }
                                                                                        className={cn(
                                                                                            "flex w-full min-h-10 rounded-2xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-slate-300 dark:bg-slate-700 resize-none no-scrollbar no-scrollbar::-webkit-scrollbar"
                                                                                        )}
                                                                                    ></TextareaAutosize>
                                                                                    <div className="w-full flex justify-end pt-4 gap-4">
                                                                                        <Popover>
                                                                                            <PopoverTrigger>
                                                                                                <MdEmojiEmotions className="w-9 h-9 p-1 rounded-xl fill-black dark:fill-white" />
                                                                                            </PopoverTrigger>
                                                                                            <PopoverContent className="bg-slate-300 dark:bg-slate-900 w-96">
                                                                                                <EmojiPicker
                                                                                                    onEmojiClick={
                                                                                                        onEditEmojiClick
                                                                                                    }
                                                                                                />
                                                                                            </PopoverContent>
                                                                                        </Popover>
                                                                                        <Button
                                                                                            onClick={
                                                                                                handleConfirmEditMessage
                                                                                            }
                                                                                            className="bg-slate-900 text-white hover:text-black hover:bg-slate-200 rounded-xl"
                                                                                        >
                                                                                            Confirm
                                                                                            Edit
                                                                                        </Button>
                                                                                    </div>
                                                                                </DialogDescription>
                                                                            </DialogHeader>
                                                                        </DialogContent>
                                                                    </Dialog>
                                                                    <Dialog
                                                                        open={
                                                                            deletingMessage[0]
                                                                        }
                                                                        onOpenChange={(
                                                                            isOpen
                                                                        ) =>
                                                                            setDeletingMessage(
                                                                                [
                                                                                    isOpen,
                                                                                    deletingMessage[1],
                                                                                ]
                                                                            )
                                                                        }
                                                                    >
                                                                        <DialogContent>
                                                                            <DialogHeader className="flex flex-col gap-4">
                                                                                <DialogTitle
                                                                                    className={cn(
                                                                                        "dark:text-white text-xl font-sans antialiased",
                                                                                        fontSans.variable
                                                                                    )}
                                                                                >
                                                                                    Confirm
                                                                                    Message
                                                                                    Deletion?
                                                                                </DialogTitle>
                                                                                <DialogDescription
                                                                                    className={cn(
                                                                                        "dark:text-white text-xl font-sans antialiased",
                                                                                        fontSans.variable
                                                                                    )}
                                                                                >
                                                                                    <span className="text-red text-[16px]">
                                                                                        The
                                                                                        message
                                                                                        will
                                                                                        be
                                                                                        permanently
                                                                                        deleted
                                                                                        from
                                                                                        our
                                                                                        database!
                                                                                        This
                                                                                        cannot
                                                                                        be
                                                                                        undone!
                                                                                    </span>
                                                                                    <div className="w-full flex justify-end pt-4 gap-4">
                                                                                        <Button
                                                                                            onClick={
                                                                                                handleConfirmDeleteMessage
                                                                                            }
                                                                                            className="bg-red-600 text-white hover:text-black hover:bg-slate-200 rounded-xl"
                                                                                        >
                                                                                            Confirm
                                                                                        </Button>
                                                                                        <Button
                                                                                            onClick={() => {
                                                                                                setDeletingMessage(
                                                                                                    [
                                                                                                        false,
                                                                                                        "",
                                                                                                    ]
                                                                                                );
                                                                                            }}
                                                                                            className="bg-slate-900 text-white hover:text-black hover:bg-slate-200 rounded-xl"
                                                                                        >
                                                                                            Cancel
                                                                                        </Button>
                                                                                    </div>
                                                                                </DialogDescription>
                                                                            </DialogHeader>
                                                                        </DialogContent>
                                                                    </Dialog>
                                                                </div>
                                                            );
                                                    }
                                                )}
                                            </ScrollArea>
                                        </div>
                                    </DialogDescription>
                                </DialogHeader>
                            </DialogContent>
                        </Dialog>
                        <span className="flex w-full text-sm items-center justify-center py-10 dark:text-slate-300 text-slate-700">
                            Thus marks the beginning of your legendary chat
                        </span>
                        {messages.map((message, index) => {
                            const senderData = userData[message.senderUid];
                            return (
                                <div
                                    key={index}
                                    className="flex items-start justify-start gap-4 w-full min-h-16 p-1 my-1"
                                >
                                    <Popover>
                                        <PopoverTrigger>
                                            <Avatar className="bg-white">
                                                <AvatarImage
                                                    src={
                                                        senderData
                                                            ? senderData.profilePicture
                                                            : null
                                                    }
                                                />
                                                <AvatarFallback>
                                                    {}
                                                </AvatarFallback>
                                            </Avatar>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            sideOffset={10}
                                            className="w-min h-min bg-slate-100 dark:bg-slate-900 border-slate-500"
                                        >
                                            <UserProfilePopup
                                                serverId={null}
                                                userUid={message.senderUid}
                                                dashboardContent={content}
                                                setDashboardContent={setContent}
                                                setActivePage={setActivePage}
                                            ></UserProfilePopup>
                                        </PopoverContent>
                                    </Popover>
                                    <div className="flex flex-col items-start justify-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <span className="font-bold text-black dark:text-white">
                                                {senderData
                                                    ? senderData.username
                                                    : "Loading..."}
                                            </span>
                                            <span className="text-black dark:text-white text-[11px]">
                                                {message &&
                                                    message.createdAt &&
                                                    (
                                                        message.createdAt
                                                            .toDate()
                                                            .getMonth() + 1
                                                    ).toString()}
                                                /
                                                {message &&
                                                    message.createdAt &&
                                                    message.createdAt
                                                        .toDate()
                                                        .getDate()
                                                        .toString()}
                                                /
                                                {message &&
                                                    message.createdAt &&
                                                    message.createdAt
                                                        .toDate()
                                                        .getFullYear()
                                                        .toString()}
                                            </span>
                                            <span className="text-black dark:text-white text-[11px]">
                                                {message &&
                                                    message.createdAt &&
                                                    message.createdAt
                                                        .toDate()
                                                        .getHours()
                                                        .toString()}
                                                :
                                                {message &&
                                                    message.createdAt &&
                                                    (message.createdAt
                                                        .toDate()
                                                        .getMinutes() < 10
                                                        ? 0 +
                                                          message.createdAt
                                                              .toDate()
                                                              .getMinutes()
                                                              .toString()
                                                        : message.createdAt
                                                              .toDate()
                                                              .getMinutes()
                                                              .toString())}
                                                {message &&
                                                message.createdAt &&
                                                message.createdAt
                                                    .toDate()
                                                    .getHours() > 11 &&
                                                message.createdAt
                                                    .toDate()
                                                    .getHours() < 24
                                                    ? " PM"
                                                    : " AM"}
                                            </span>
                                        </div>
                                        <ContextMenu>
                                            <ContextMenuTrigger>
                                                {message.isFileType &&
                                                    message.isImageType &&
                                                    !message.isVideoType && (
                                                        <div className="flex flex-col gap-2 items-start">
                                                            <a
                                                                href={
                                                                    message.file
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <img
                                                                    className="max-h-60 rounded-xl"
                                                                    src={
                                                                        message.file
                                                                    }
                                                                ></img>
                                                            </a>
                                                            <div className="text-sm italic">
                                                                {truncateString(
                                                                    message.fileName,
                                                                    50
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                {message.isFileType &&
                                                    !message.isImageType &&
                                                    message.isVideoType && (
                                                        <div className="flex flex-col gap-2 items-start">
                                                            <video
                                                                className="max-h-60 rounded-xl"
                                                                src={
                                                                    message.file
                                                                }
                                                                controls={true}
                                                            ></video>
                                                            <div className="text-sm italic">
                                                                {truncateString(
                                                                    message.fileName,
                                                                    50
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                {message.isFileType &&
                                                    !message.isImageType &&
                                                    !message.isVideoType && (
                                                        <div className="flex flex-col gap-2 items-start">
                                                            <a
                                                                href={
                                                                    message.file
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <FaFile
                                                                    className="m-2"
                                                                    size={70}
                                                                />
                                                            </a>
                                                            <div className="text-sm italic">
                                                                {truncateString(
                                                                    message.fileName,
                                                                    50
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                <span>
                                                    {message.text &&
                                                        filter.clean(
                                                            message.text
                                                        )}
                                                </span>
                                                {message.edited && (
                                                    <div className="text-[10px]">
                                                        (edited)
                                                    </div>
                                                )}
                                            </ContextMenuTrigger>
                                            <ContextMenuContent
                                                className={cn(
                                                    "dark:text-white text-sm font-sans antialiased",
                                                    fontSans.variable
                                                )}
                                            >
                                                {(canModifyMessage(
                                                    message.senderUid
                                                ) &&
                                                    (isIngoingBlocked ||
                                                    isOutgoingBlocked ? (
                                                        <span className="text-red-600">
                                                            Cannot modify
                                                            messages when
                                                            blocked!
                                                        </span>
                                                    ) : (
                                                        <>
                                                            {!message.file && (
                                                                <ContextMenuItem
                                                                    onClick={() => {
                                                                        handleEditMessageClick(
                                                                            message.messageId,
                                                                            message.text
                                                                        );
                                                                    }}
                                                                >
                                                                    Edit Message
                                                                </ContextMenuItem>
                                                            )}
                                                            <ContextMenuItem
                                                                onClick={() => {
                                                                    handleDeleteMessageClick(
                                                                        message.messageId
                                                                    );
                                                                }}
                                                            >
                                                                <span className="text-red-600 font-bold">
                                                                    Delete
                                                                    Message
                                                                </span>
                                                            </ContextMenuItem>
                                                        </>
                                                    ))) || (
                                                    <span className="text-red-600">
                                                        You can't modify this
                                                        message!
                                                    </span>
                                                )}
                                            </ContextMenuContent>
                                        </ContextMenu>
                                    </div>
                                    <Dialog
                                        open={editingMessage[0]}
                                        onOpenChange={(isOpen) =>
                                            setEditingMessage([
                                                isOpen,
                                                editingMessage[1],
                                                editingMessage[2],
                                            ])
                                        }
                                    >
                                        <DialogContent>
                                            <DialogHeader className="flex flex-col gap-4">
                                                <DialogTitle
                                                    className={cn(
                                                        "dark:text-white text-xl font-sans antialiased",
                                                        fontSans.variable
                                                    )}
                                                >
                                                    Edit Message
                                                </DialogTitle>
                                                <DialogDescription
                                                    className={cn(
                                                        "dark:text-white text-xl font-sans antialiased",
                                                        fontSans.variable
                                                    )}
                                                >
                                                    <TextareaAutosize
                                                        value={
                                                            editingMessage[2]
                                                        }
                                                        onChange={
                                                            handleTextareaChange
                                                        }
                                                        className={cn(
                                                            "flex w-full min-h-10 rounded-2xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-slate-300 dark:bg-slate-700 resize-none no-scrollbar no-scrollbar::-webkit-scrollbar"
                                                        )}
                                                    ></TextareaAutosize>
                                                    <div className="w-full flex justify-end pt-4 gap-4">
                                                        <Popover>
                                                            <PopoverTrigger>
                                                                <MdEmojiEmotions className="w-9 h-9 p-1 rounded-xl fill-black dark:fill-white" />
                                                            </PopoverTrigger>
                                                            <PopoverContent className="bg-slate-300 dark:bg-slate-900 w-96">
                                                                <EmojiPicker
                                                                    onEmojiClick={
                                                                        onEditEmojiClick
                                                                    }
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                        <Button
                                                            onClick={
                                                                handleConfirmEditMessage
                                                            }
                                                            className="bg-slate-900 text-white hover:text-black hover:bg-slate-200 rounded-xl"
                                                        >
                                                            Confirm Edit
                                                        </Button>
                                                    </div>
                                                </DialogDescription>
                                            </DialogHeader>
                                        </DialogContent>
                                    </Dialog>
                                    <Dialog
                                        open={deletingMessage[0]}
                                        onOpenChange={(isOpen) =>
                                            setDeletingMessage([
                                                isOpen,
                                                deletingMessage[1],
                                            ])
                                        }
                                    >
                                        <DialogContent>
                                            <DialogHeader className="flex flex-col gap-4">
                                                <DialogTitle
                                                    className={cn(
                                                        "dark:text-white text-xl font-sans antialiased",
                                                        fontSans.variable
                                                    )}
                                                >
                                                    Confirm Message Deletion?
                                                </DialogTitle>
                                                <DialogDescription
                                                    className={cn(
                                                        "dark:text-white text-xl font-sans antialiased",
                                                        fontSans.variable
                                                    )}
                                                >
                                                    <span className="text-red text-[16px]">
                                                        The message will be
                                                        permanently deleted from
                                                        our database! This
                                                        cannot be undone!
                                                    </span>
                                                    <div className="w-full flex justify-end pt-4 gap-4">
                                                        <Button
                                                            onClick={
                                                                handleConfirmDeleteMessage
                                                            }
                                                            className="bg-red-600 text-white hover:text-black hover:bg-slate-200 rounded-xl"
                                                        >
                                                            Confirm
                                                        </Button>
                                                        <Button
                                                            onClick={() => {
                                                                setDeletingMessage(
                                                                    [false, ""]
                                                                );
                                                            }}
                                                            className="bg-slate-900 text-white hover:text-black hover:bg-slate-200 rounded-xl"
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </DialogDescription>
                                            </DialogHeader>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            );
                        })}
                    </div>
                    <div ref={messagesRef}></div>
                    <div
                        className="fixed flex items-start justify-start px-6 bottom-0 h-16 w-full pr-[680px] dark:bg-slate-900 bg-slate-200 gap-4 pt-2"
                        style={{ height: `calc(${textareaHeight} + 1.5rem)` }}
                    >
                        <div>
                            <label
                                className={cn(
                                    "inline-block bg-slate-200 dark:bg-slate-900 w-7 h-7 p-1 fill-black dark:fill-white z-10 cursor-",
                                    isIngoingBlocked || isOutgoingBlocked
                                        ? "not-allowed"
                                        : "pointer"
                                )}
                            >
                                <input
                                    type="file"
                                    className="hidden"
                                    disabled={
                                        isOutgoingBlocked || isIngoingBlocked
                                    }
                                    onChange={handleFileChange}
                                />
                                <FaFile
                                    className={cn(
                                        "bg-slate-200 dark:bg-slate-900 w-6 h-6 pt-[1px] fill-black dark:fill-white",
                                        {
                                            "cursor-not-allowed":
                                                isIngoingBlocked ||
                                                isOutgoingBlocked,
                                            "cursor-pointer": !(
                                                isIngoingBlocked ||
                                                isOutgoingBlocked
                                            ),
                                        }
                                    )}
                                />
                            </label>
                        </div>
                        <Popover
                            open={
                                isOutgoingBlocked || isIngoingBlocked
                                    ? false
                                    : emojiOpen
                            }
                            onOpenChange={setEmojiOpen}
                        >
                            <PopoverTrigger>
                                <MdEmojiEmotions
                                    cursor={
                                        isIngoingBlocked || isOutgoingBlocked
                                            ? "not-allowed"
                                            : "pointer"
                                    }
                                    className="bg-slate-200 dark:bg-slate-900 w-9 h-9 p-1 rounded-xl fill-black dark:fill-white"
                                />
                            </PopoverTrigger>
                            <PopoverContent className="bg-slate-300 dark:bg-slate-900 w-96">
                                <EmojiPicker onEmojiClick={onEmojiClick} />
                            </PopoverContent>
                        </Popover>
                        <TextareaAutosize
                            ref={textareaRef}
                            value={inputValue}
                            onHeightChange={() => {
                                if (textareaRef.current) {
                                    setTextareaHeight(
                                        textareaRef.current.scrollHeight + "px"
                                    );
                                }
                            }}
                            onChange={handleInputChange}
                            disabled={isIngoingBlocked || isOutgoingBlocked}
                            placeholder={
                                isIngoingBlocked
                                    ? isOutgoingBlocked
                                        ? "You have blocked this user."
                                        : "This user has blocked you."
                                    : isOutgoingBlocked
                                    ? "You have blocked this user."
                                    : "Type your message here."
                            }
                            rows={1}
                            className="flex-1 min-w-[200px] rounded-2xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-slate-300 dark:bg-slate-700 resize-none no-scrollbar no-scrollbar::-webkit-scrollbar"
                        ></TextareaAutosize>
                        <Button
                            onClick={handleSendMessage}
                            className={cn(
                                "bg-slate-900 text-white hover:text-black hover:bg-white dark:hover:bg-slate-200 rounded-xl cursor-",
                                {
                                    "cursor-not-allowed":
                                        isIngoingBlocked || isOutgoingBlocked,
                                    "cursor-pointer": !(
                                        isIngoingBlocked || isOutgoingBlocked
                                    ),
                                }
                            )}
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

const DashboardInfo = ({
    content,
    inCall,
    setInCall,
    channelName,
    setChannelName,
    users,
    localTracks,
    leaveCall,
}) => {
    const auth = firebase.auth() as unknown as Auth;
    const [user] = useAuthState(auth);

    const [userData, setUserData] = useState(null);
    const [conversationId, setConversationId] = useState<string | null>(null);

    useEffect(() => {
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
                    } else {
                        console.error("Conversation not found");
                    }
                },
                (error) => {
                    console.error("Error fetching conversations:", error);
                }
            );

        return () => unsubscribe();
    }, [content]);

    useEffect(() => {
        if (content[1] !== null) {
            const userDoc = firestore.collection("users").doc(content[1]).get();

            const getUserData = async () => {
                setUserData([
                    (await userDoc).data().username,
                    (await userDoc).data().tag,
                    (await userDoc).data().profilePicture,
                    (await userDoc).data().customStatus,
                ]);
            };

            getUserData();
        } else {
            setUserData(null);
        }
    }, [content]);

    return (
        <div className="z-50 h-full min-w-72 bg-slate-100 dark:bg-slate-700 overflow-scroll no-scrollbar no-scrollbar::-webkit-scrollbar flex-col items-center justify-center pt-2">
            {userData && (
                <>
                    <div className="min-w-40 h-56 mt-10 flex flex-col items-center justify-start pt-2 gap-4">
                        <>
                            <Avatar className="bg-white w-20 h-20">
                                <AvatarImage src={userData[2]} />
                                <AvatarFallback>{}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col justify-center items-center w-full">
                                <span
                                    className={cn(
                                        "dark:text-white text-2xl font-sans font-semibold antialiased max-w-60 overflow-x-scroll no-scrollbar no-scrollbar::-webkit-scrollbar",
                                        fontSans.variable
                                    )}
                                >
                                    {userData[0]}
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
                                    "dark:text-white text-sm font-sans antialiased text-center max-w-64",
                                    fontSans.variable
                                )}
                            >
                                {userData[3]}
                            </span>
                        </>
                    </div>
                    {conversationId && (
                        <div className="w-full flex items-center justify-center gap-4">
                            <div
                                onClick={() => {
                                    setChannelName(conversationId);
                                    setInCall(true);
                                }}
                                className="w-12 h-12 flex items-center justify-center bg-slate-300 dark:bg-slate-800 hover:brightness-150 rounded-3xl shadow-lg hover:rounded-xl transition-all duration-75 cursor-pointer"
                            >
                                <MdCall />
                            </div>
                            <div
                                onClick={leaveCall}
                                className="w-12 h-12 flex items-center justify-center bg-slate-300 dark:bg-slate-800 hover:brightness-150 rounded-3xl shadow-lg hover:rounded-xl transition-all duration-75 cursor-pointer"
                            >
                                <MdCallEnd />
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Dashboard;
