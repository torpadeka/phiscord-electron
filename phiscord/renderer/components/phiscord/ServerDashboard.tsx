import { firestore, storage } from "../../../firebase/clientApp";
import firebase, { database } from "../../../firebase/clientApp";
import type { Auth } from "firebase/auth";
import { useEffect, useRef, useState } from "react";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

import { FaFile, FaHashtag, FaPlus } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { useAuthState } from "react-firebase-hooks/auth";

import { AiOutlineLoading } from "react-icons/ai";
import { HiSpeakerWave } from "react-icons/hi2";
import { IoMdSettings } from "react-icons/io";

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import UserProfilePopup from "./UserProfilePopup";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "../ui/context-menu";
import TextareaAutosize from "react-textarea-autosize";

import { Inter as FontSans } from "next/font/google";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { MdEmojiEmotions } from "react-icons/md";
import EmojiPicker from "emoji-picker-react";
import { Button } from "../ui/button";

const fontSans = FontSans({
    subsets: ["latin"],
    variable: "--font-sans",
});

const ServerDashboard = ({ serverId }) => {
    const [serverContent, setServerContent] = useState([null, null]);

    return (
        <div className="flex w-full h-screen pl-20 pt-14">
            <ServerDashboardNavigation
                serverId={serverId}
                setServerContent={setServerContent}
            ></ServerDashboardNavigation>
            <ServerDashboardContent
                serverId={serverId}
                serverContent={serverContent}
            ></ServerDashboardContent>
            <ServerDashboardInfo serverId={serverId}></ServerDashboardInfo>
        </div>
    );
};

const ServerDashboardNavigation = ({ serverId, setServerContent }) => {
    const auth = firebase.auth() as unknown as Auth;
    const [user] = useAuthState(auth);

    interface ServerNavigationData {
        serverName: string;
        textChannels: Array<{
            textChannelId: string;
            textChannelName: string;
        }>;
        voiceChannels: Array<{
            voiceChannelId: string;
            voiceChannelName: string;
        }>;
        ownerUid: string;
        adminList: Array<string>;
    }

    const [loading, setLoading] = useState(true);
    const [selectedChannel, setSelectedChannel] = useState([null, null]);
    const [serverNavigationData, setServerNavigationData] =
        useState<ServerNavigationData>(null);

    useEffect(() => {
        const getServerNavigationData = () => {
            let data: ServerNavigationData = {
                serverName: "",
                textChannels: [],
                voiceChannels: [],
                ownerUid: "",
                adminList: [],
            };

            const serverRef = firestore.collection("servers").doc(serverId);

            const unsubscribeServerData = serverRef.onSnapshot((snapshot) => {
                data.serverName = snapshot.data().serverName;
                data.ownerUid = snapshot.data().ownerUid;
                const admins = [];
                snapshot.data().adminList.forEach((admin) => {
                    admins.push(admin);
                });
                data.adminList = admins;

                setServerNavigationData({ ...data });
                setLoading(false);
            });

            const unsubscribeServerTextChannels = serverRef
                .collection("textChannels")
                .onSnapshot((snapshot) => {
                    const textChannels = [];
                    snapshot.forEach((textChannel) => {
                        textChannels.push({
                            textChannelId: textChannel.id,
                            textChannelName: textChannel.data().channelName,
                        });
                    });
                    data.textChannels = textChannels;
                    setServerNavigationData({ ...data });
                });

            const unsubscribeServerVoiceChannels = serverRef
                .collection("voiceChannels")
                .onSnapshot((snapshot) => {
                    const voiceChannels = [];
                    snapshot.forEach((voiceChannel) => {
                        voiceChannels.push({
                            voiceChannelId: voiceChannel.id,
                            voiceChannelName: voiceChannel.data().channelName,
                        });
                    });
                    data.voiceChannels = voiceChannels;
                    setServerNavigationData({ ...data });
                });

            return () => {
                unsubscribeServerData();
                unsubscribeServerTextChannels();
                unsubscribeServerVoiceChannels();
            };
        };

        const unsubscribe = getServerNavigationData();

        return () => {
            unsubscribe();
            console.log(serverNavigationData);
        };
    }, [serverId]);

    return !loading ? (
        <div className="h-full min-w-72 bg-slate-100 dark:bg-slate-700 overflow-y-auto no-scrollbar no-scrollbar::-webkit-scrollbar flex-col items-center justify-start px-4">
            <div className="flex items-center justify-between sticky top-0 text-black dark:text-white text-xl bg-slate-100 dark:bg-slate-700 w-full h-12 pt-3 border-b font-bold">
                <span>{serverNavigationData.serverName}</span>
                <div>
                    {(user.uid === serverNavigationData.ownerUid ||
                        serverNavigationData.adminList.includes(user.uid)) && (
                        <IoMdSettings
                            className="cursor-pointer hover:text-slate-400 dark:hover:brightness-90"
                            size={20}
                        ></IoMdSettings>
                    )}
                </div>
            </div>
            <Accordion
                type="multiple"
                defaultValue={["text-channels", "voice-channels"]}
                className="w-full"
            >
                <AccordionItem value="text-channels" className="border-b">
                    <div className="w-full flex items-center justify-between text-sm">
                        <AccordionTrigger className="w-60 hover:text-slate-400 dark:hover:brightness-90">
                            TEXT CHANNELS
                        </AccordionTrigger>
                        {(user.uid === serverNavigationData.ownerUid ||
                            serverNavigationData.adminList.includes(
                                user.uid
                            )) && (
                            <FaPlus
                                size={12}
                                onClick={() => console.log("ADD")}
                                className="cursor-pointer hover:text-slate-400 dark:hover:brightness-90"
                            />
                        )}
                    </div>
                    <AccordionContent className="flex flex-col items-start justify-center gap-1 w-full">
                        {serverNavigationData.textChannels.map(
                            (textChannel) =>
                                textChannel && (
                                    <div
                                        key={textChannel.textChannelId}
                                        onClick={() => {
                                            setSelectedChannel([
                                                "textchannel",
                                                textChannel.textChannelId,
                                            ]);
                                            setServerContent([
                                                "textchannel",
                                                textChannel.textChannelId,
                                            ]);
                                        }}
                                        className={cn(
                                            "flex w-full h-8 cursor-pointer items-center justify-start gap-1 px-2 rounded-xl dark:hover:bg-slate-800 hover:bg-slate-300",
                                            selectedChannel[0] ===
                                                "textchannel" &&
                                                selectedChannel[1] ===
                                                    textChannel.textChannelId
                                                ? "dark:bg-slate-800 bg-slate-300"
                                                : null
                                        )}
                                    >
                                        <FaHashtag size={15} />
                                        {textChannel.textChannelName}
                                    </div>
                                )
                        )}
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="voice-channels">
                    <div className="w-full flex items-center justify-between text-sm">
                        <AccordionTrigger className="w-60 hover:text-slate-400 dark:hover:brightness-90">
                            VOICE CHANNELS
                        </AccordionTrigger>
                        {(user.uid === serverNavigationData.ownerUid ||
                            serverNavigationData.adminList.includes(
                                user.uid
                            )) && (
                            <FaPlus
                                size={12}
                                onClick={() => console.log("ADD")}
                                className="cursor-pointer hover:text-slate-400 dark:hover:brightness-90"
                            />
                        )}
                    </div>
                    <AccordionContent className="flex flex-col items-start justify-center gap-1 w-full">
                        {serverNavigationData.voiceChannels.map(
                            (voiceChannel) =>
                                voiceChannel && (
                                    <div
                                        key={voiceChannel.voiceChannelId}
                                        onClick={() => {
                                            setSelectedChannel([
                                                "voicechannel",
                                                voiceChannel.voiceChannelId,
                                            ]);
                                            setServerContent([
                                                "voicechannel",
                                                voiceChannel.voiceChannelId,
                                            ]);
                                        }}
                                        className={cn(
                                            "flex w-full h-8 cursor-pointer items-center justify-start gap-1 px-2 rounded-xl dark:hover:bg-slate-800 hover:bg-slate-300",
                                            selectedChannel[0] ===
                                                "voicechannel" &&
                                                selectedChannel[1] ===
                                                    voiceChannel.voiceChannelId
                                                ? "dark:bg-slate-800 bg-slate-300"
                                                : null
                                        )}
                                    >
                                        <HiSpeakerWave size={15} />
                                        {voiceChannel.voiceChannelName}
                                    </div>
                                )
                        )}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    ) : (
        <div className="h-full min-w-72 flex items-center justify-center shadow-md text-white text-3xl gap-4 bg-slate-100 dark:bg-slate-700">
            <AiOutlineLoading
                className="animate-spin fill-black dark:fill-white"
                size="20"
            />
        </div>
    );
};

const ServerDashboardContent = ({ serverId, serverContent }) => {
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

    useEffect(() => {
        if (serverContent[0] === null) {
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

        if (serverContent[0] === "textchannel") {
            const unsubscribe = firestore
                .collection("servers")
                .doc(serverId)
                .collection("textChannels")
                .doc(serverContent[1])
                .collection("messages")
                .orderBy("createdAt", "asc")
                .onSnapshot(
                    (snapshot) => {
                        const messagesList: Message[] = snapshot.docs.map(
                            (messageDoc) => {
                                const messageData = messageDoc.data();
                                getUserData(messageData.senderUid);
                                return {
                                    senderUid: messageData.senderUid,
                                    isFileType: messageData.isFileType,
                                    isImageType: messageData.isImageType,
                                    isVideoType: messageData.isVideoType,
                                    fileName: messageData.fileName,
                                    text: messageData.text,
                                    createdAt: messageData.createdAt,
                                    file: messageData.file,
                                    messageId: messageDoc.id,
                                    edited: messageData.edited,
                                };
                            }
                        );
                        setMessages(messagesList);
                        setLoading(false);
                        console.log("Messages loaded:", messagesList);
                    },
                    (error) => {
                        console.error("Error fetching messages:", error);
                        setLoading(false);
                    }
                );

            return () => unsubscribe();
        } else if (serverContent[1] === "voicechannel") {
            // Get Voice Channel data here
        }
    }, [serverContent, serverId]);

    const scrollToBottom = () => {
        messagesRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const storageRef = storage.ref();
            const fileRef = storageRef.child(
                `messages/servers/${serverId}/${serverContent[1]}/${file.name}`
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
                .collection("servers")
                .doc(serverId)
                .collection("textChannels")
                .doc(serverContent[1])
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

            // Add the new message to the conversation's "messages" collection
            const newMessageDocRef = await firestore
                .collection("servers")
                .doc(serverId)
                .collection("textChannels")
                .doc(serverContent[1])
                .collection("messages")
                .add(newMessage);

            newMessageDocRef.update({
                messageId: newMessageDocRef.id,
            });

            setInputValue("");

            scrollToBottom();
        }
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleEditMessageClick = (messageId, messageText) => {
        setEditingMessage([true, messageId, messageText]);
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
                .collection("servers")
                .doc(serverId)
                .collection("textChannels")
                .doc(serverContent[1])
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
            .collection("servers")
            .doc(serverId)
            .collection("textChannels")
            .doc(serverContent[1])
            .collection("messages")
            .doc(deletingMessage[1])
            .get();

        const isFileType = messageRef.data().isFileType;
        const file = messageRef.data().file;

        await firestore
            .collection("servers")
            .doc(serverId)
            .collection("textChannels")
            .doc(serverContent[1])
            .collection("messages")
            .doc(deletingMessage[1])
            .delete();

        if (isFileType) {
            const messageFileRef = storage.refFromURL(file);
            await messageFileRef.delete();
        }

        setDeletingMessage([false, ""]);
    };

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
            {serverContent[0] === "textchannel" && messages && (
                <>
                    <div
                        className="min-h-full w-full flex flex-col items-start justify-end p-4 overflow-scroll no-scrollbar no-scrollbar::-webkit-scrollbar"
                        style={{
                            paddingBottom: `calc(${textareaHeight} + 2rem)`,
                        }}
                    >
                        <span className="flex w-full text-sm items-center justify-center py-10 dark:text-slate-300 text-slate-700">
                            Herein begins the great history of the renowned chat
                        </span>
                        {messages.map((message, index) => {
                            const senderData = userData[message.senderUid];
                            return (
                                <div
                                    key={index}
                                    className="flex items-start justify-start gap-4 w-full min-h-16 p-1"
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
                                                <AvatarFallback>{`:(`}</AvatarFallback>
                                            </Avatar>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            sideOffset={10}
                                            className="w-min h-min bg-slate-300 dark:bg-slate-900 border-slate-500"
                                        >
                                            <UserProfilePopup
                                                serverId={null}
                                                userUid={message.senderUid}
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
                                                    message.createdAt
                                                        .toDate()
                                                        .getMonth()
                                                        .toString()}
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
                                                    message.createdAt
                                                        .toDate()
                                                        .getMinutes()
                                                        .toString()}
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
                                                <span>{message.text}</span>
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
                                                ) && (
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
                                                            Delete Message
                                                        </ContextMenuItem>
                                                    </>
                                                )) || (
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
                        style={{
                            height: `calc(${textareaHeight} + 1.5rem)`,
                        }}
                    >
                        <div>
                            <label className="inline-block bg-slate-200 dark:bg-slate-900 w-7 h-7 p-1 fill-black dark:fill-white z-10 cursor-pointer">
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <FaFile className="bg-slate-200 dark:bg-slate-900 w-6 h-6 pt-[1px] fill-black dark:fill-white cursor-pointer" />
                            </label>
                        </div>
                        <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                            <PopoverTrigger>
                                <MdEmojiEmotions
                                    cursor="pointer"
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
                            placeholder="Type your message here."
                            rows={1}
                            className="flex-1 min-w-[200px] rounded-2xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-slate-300 dark:bg-slate-700 resize-none no-scrollbar no-scrollbar::-webkit-scrollbar"
                        ></TextareaAutosize>
                        <Button
                            onClick={handleSendMessage}
                            className="bg-slate-900 text-white hover:text-black hover:bg-white dark:hover:bg-slate-200 rounded-xl cursor-pointer"
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

const ServerDashboardInfo = ({ serverId }) => {
    return (
        <div className="z-10 h-full min-w-72 bg-slate-100 dark:bg-slate-700 overflow-scroll no-scrollbar no-scrollbar::-webkit-scrollbar flex-col items-center justify-center pt-2"></div>
    );
};

export default ServerDashboard;
