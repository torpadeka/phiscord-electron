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
import { HiDotsVertical } from "react-icons/hi";
import { PiCrownSimpleFill } from "react-icons/pi";
import { RiAdminFill } from "react-icons/ri";

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
    DialogTrigger,
} from "../ui/dialog";
import { MdEmojiEmotions } from "react-icons/md";
import EmojiPicker from "emoji-picker-react";
import { Button } from "../ui/button";
import { IoPrismSharp } from "react-icons/io5";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "../ui/toaster";

const fontSans = FontSans({
    subsets: ["latin"],
    variable: "--font-sans",
});

const ServerDashboard = ({ setActivePage, serverId }) => {
    const auth = firebase.auth() as unknown as Auth;
    const [user] = useAuthState(auth);
    const [serverContent, setServerContent] = useState([null, null]);

    useEffect(() => {
        const checkMembership = firestore
            .collection("servers")
            .doc(serverId)
            .onSnapshot((snapshot) => {
                const memberList: Array<String> = snapshot.data().memberList;
                if (!memberList.includes(user.uid)) {
                    setActivePage(["dashboard", null]);
                }
            });
        setServerContent([null, null]);
    }, [serverId]);

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
        serverPicture: string;
        serverCode: string;
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
        memberList: Array<string>;
    }

    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [selectedChannel, setSelectedChannel] = useState([null, null]);
    const [serverNavigationData, setServerNavigationData] =
        useState<ServerNavigationData>(null);
    const [openServerSettings, setOpenServerSettings] = useState(false);
    const [serverNameError, setServerNameError] = useState("");
    const [serverCodeError, setServerCodeError] = useState("");
    const [serverPicture, setServerPicture] = useState(null);
    const [serverName, setServerName] = useState(null);
    const [serverCode, setServerCode] = useState(null);
    const [toastMessage, setToastMessage] = useState("");
    const [promotedMember, setPromotedMember] = useState(null);
    const [isPromotingMember, setIsPromotingMember] = useState(false);
    const [addingTextChannel, setAddingTextChannel] = useState(false);
    const [addingVoiceChannel, setAddingVoiceChannel] = useState(false);
    const [addNewTextChannelError, setAddNewTextChannelError] = useState("");
    const [newTextChannelInput, setNewTextChannelInput] = useState("");
    const [newVoiceChannelInput, setNewVoiceChannelInput] = useState("");

    useEffect(() => {
        setSelectedChannel([null, null]);
    }, [serverId]);

    // Show toast message
    useEffect(() => {
        if (toastMessage) {
            toast({
                title: toastMessage,
            });
            setToastMessage(""); // Clear the message after showing the toast
        }
    }, [toastMessage, toast]);

    useEffect(() => {
        setServerCodeError("");
        setServerNameError("");
    }, [openServerSettings]);

    useEffect(() => {
        const getServerNavigationData = () => {
            let data: ServerNavigationData = {
                serverName: "",
                serverPicture: null,
                serverCode: null,
                textChannels: [],
                voiceChannels: [],
                ownerUid: "",
                adminList: [],
                memberList: [],
            };

            const serverRef = firestore.collection("servers").doc(serverId);

            const unsubscribeServerData = serverRef.onSnapshot((snapshot) => {
                data.serverName = snapshot.data().serverName;
                data.serverCode = snapshot.data().serverCode;
                data.ownerUid = snapshot.data().ownerUid;
                data.serverPicture = snapshot.data().serverPicture;
                const admins = [];
                const members = [];

                snapshot.data().adminList.forEach((admin) => {
                    admins.push(admin);
                });

                snapshot.data().memberList.forEach((member) => {
                    members.push(member);
                });

                data.adminList = admins;
                data.memberList = members;

                setServerNavigationData({ ...data });
                setServerName(data.serverName);
                setServerCode(data.serverCode);
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

    const handleServerPictureInputChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        if (e.target.files) {
            setServerPicture(e.target.files[0]);
        }
    };

    const handleServerPictureUpload = async () => {
        if (serverPicture && user) {
            const storageRef = storage.ref();
            const fileRef = storageRef.child(
                `servers/pictures/${serverId}/${serverPicture.name}`
            );

            if (serverNavigationData.serverPicture !== null) {
                const prevFileRef = storage.refFromURL(
                    serverNavigationData.serverPicture
                );
                await prevFileRef.delete();
            }

            await fileRef.put(serverPicture);
            const fileUrl = await fileRef.getDownloadURL();

            await firestore.collection("servers").doc(serverId).update({
                serverPicture: fileUrl,
            });

            setToastMessage("Server picture changed successfully!");
        }
    };

    const handleServerNameInputChange = (e) => {
        setServerName(e.target.value);
    };

    const handleUpdateServerName = async () => {
        if (serverName === null) {
            setServerNameError("Fatal error! Please try again!");
            return;
        }

        if (serverName === "") {
            setServerNameError("Server name cannot be empty!");
            return;
        }

        if (serverName.length > 30) {
            setServerNameError(
                "The server's name can't be longer than 30 characters"
            );
            return;
        }

        if (serverName === serverNavigationData.serverName) {
            setServerNameError("The server name is the same!");
            return;
        }

        await firestore.collection("servers").doc(serverId).update({
            serverName: serverName,
        });

        setServerNameError("");
        setToastMessage("Server name changed successfully!");
    };

    const handleServerCodeInputChange = (e) => {
        setServerCode(e.target.value);
    };

    const handleUpdateServerCode = async () => {
        if (serverCode === null) {
            setServerCodeError("Fatal error! Please try again!");
            return;
        }

        if (serverCode === serverNavigationData.serverCode) {
            setServerCodeError("The server code is the same!");
            return;
        }

        if (serverCode === "") {
            setServerCodeError("The server code can't be empty!");
            return;
        }

        const checkSameCode = await firestore
            .collection("servers")
            .where("serverCode", "==", serverCode)
            .get();

        if (!checkSameCode.empty) {
            setServerCodeError(
                "Server code is taken! Please choose a different one!"
            );
            return;
        }

        setServerCodeError("");
        setToastMessage("Server join code changed successfully!");

        await firestore.collection("servers").doc(serverId).update({
            serverCode: serverCode,
        });
    };

    const handleDemoteAdmin = async (userUid) => {
        const index = serverNavigationData.adminList.indexOf(userUid, 0);
        if (index > -1) {
            serverNavigationData.adminList.splice(index, 1);
        }

        await firestore.collection("servers").doc(serverId).update({
            adminList: serverNavigationData.adminList,
        });

        setToastMessage("Demotion successful!");
    };

    const handlePromoteAdmin = async (userUid) => {
        serverNavigationData.adminList.push(userUid);

        await firestore.collection("servers").doc(serverId).update({
            adminList: serverNavigationData.adminList,
        });

        setToastMessage("Promotion successful!");
    };

    const handleKickMember = async (userUid) => {
        const index = serverNavigationData.memberList.indexOf(userUid, 0);
        if (index > -1) {
            serverNavigationData.memberList.splice(index, 1);
        }

        await firestore.collection("servers").doc(serverId).update({
            memberList: serverNavigationData.memberList,
        });

        setToastMessage("Kicked user successfully!");
    };

    const handleNewTextChannelInputChange = async () => {};

    const handleCreateNewTextChannel = async () => {};

    const handleNewVoiceChannelInputChange = async () => {};

    const handleCreateNewVoiceChannel = async () => {};

    return !loading ? (
        <>
            <Toaster />
            <Dialog
                open={addingTextChannel}
                onOpenChange={setAddingTextChannel}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle
                            className={cn(
                                "dark:text-white text-xl font-sans antialiased",
                                fontSans.variable
                            )}
                        >
                            Add a Text Channel
                        </DialogTitle>
                        <DialogDescription
                            className={cn(
                                "dark:text-white text-xl font-sans antialiased",
                                fontSans.variable
                            )}
                        >
                            <div className="flex flex-col items-center justify-center gap-3 pt-4">
                                <Label>Enter Text Channel Name</Label>
                                <Input
                                    type="text"
                                    placeholder="epic-channel"
                                    onChange={handleNewTextChannelInputChange}
                                    className="w-full bg-slate-300 dark:bg-slate-700 rounded-2xl mt-4 p-4"
                                ></Input>
                                <Label
                                    className={cn(
                                        "text-red-500 text-sm font-sans antialiased mt-1",
                                        fontSans.variable
                                    )}
                                >
                                    {addNewTextChannelError}
                                </Label>
                                <Button
                                    onClick={handleCreateNewTextChannel}
                                    className="mt-1 bg-slate-900 text-white hover:text-black hover:bg-slate-200 rounded-xl gap-2 fill-white hover:fill-black"
                                >
                                    Add Text Channel
                                </Button>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
            <Dialog
                open={openServerSettings}
                onOpenChange={setOpenServerSettings}
            >
                <DialogContent className="min-w-[1100px] h-[450px]">
                    <DialogHeader>
                        <DialogTitle
                            className={cn(
                                "dark:text-white text-xl font-sans antialiased",
                                fontSans.variable
                            )}
                        >
                            Server Settings
                        </DialogTitle>
                        <DialogDescription
                            className={cn(
                                "dark:text-white text-xl font-sans antialiased w-full h-full",
                                fontSans.variable
                            )}
                        >
                            <div className="fade-in w-full h-full flex items-center justify-center gap-4">
                                <div className="flex flex-col items-center justify-center">
                                    {serverNavigationData.serverPicture !==
                                    null ? (
                                        <img
                                            className="flex items-center justify-center min-h-32 w-32 my-2 shadow-lg bg-white dark:bg-slate-500 rounded-3xl hover:rounded-xl
                                                    dark:hover:bg-slate-500 transition-all ease-in-out cursor-pointer"
                                            src={
                                                serverNavigationData.serverPicture
                                            }
                                            alt=""
                                        />
                                    ) : (
                                        <div
                                            className="flex items-center justify-center min-h-32 w-32 my-2 shadow-lg bg-white dark:bg-slate-500 rounded-[48px] hover:rounded-xl
                                    dark:hover:bg-slate-500 transition-all ease-in-out cursor-pointer"
                                        >
                                            <IoPrismSharp
                                                className="fill-black dark:fill-white"
                                                size={68}
                                            />
                                        </div>
                                    )}
                                    <div className="flex flex-col items-center justify-center gap-4">
                                        <Label className="text-black dark:text-white text-base mt-1">
                                            Set Server Picture
                                        </Label>
                                        <Input
                                            className="flex w-56 h-10 justify-center items-center gap-2 rounded-3xl bg-slate-300 dark:bg-slate-600
                                        hover:scale-105 hover:brightness-125 transition-all shadow-md cursor-pointer"
                                            onChange={
                                                handleServerPictureInputChange
                                            }
                                            type="file"
                                            accept="image/*"
                                        ></Input>
                                        <Button
                                            className="w-44 bg-slate-900 text-white hover:text-black hover:bg-slate-300 rounded-3xl cursor-pointer shadow-md"
                                            onClick={handleServerPictureUpload}
                                        >
                                            Upload Profile Image
                                        </Button>
                                    </div>
                                </div>
                                <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                                    <div className="max-w-56 flex flex-col items-center justify-center gap-1 pt-4">
                                        <Label className="text-black dark:text-white text-base">
                                            Set Server Name
                                        </Label>
                                        <Input
                                            type="text"
                                            placeholder="My Awesome Server"
                                            value={serverName}
                                            onChange={
                                                handleServerNameInputChange
                                            }
                                            className="w-full bg-slate-300 dark:bg-slate-700 rounded-2xl p-4"
                                        ></Input>
                                        <Label
                                            className={cn(
                                                "text-red-500 text-sm font-sans antialiased my-1 text-center",
                                                fontSans.variable
                                            )}
                                        >
                                            {serverNameError}
                                        </Label>
                                        <Button
                                            onClick={handleUpdateServerName}
                                            className="bg-slate-900 text-white hover:text-black hover:bg-slate-200 rounded-xl gap-2 fill-white hover:fill-black"
                                        >
                                            Update Server Name
                                        </Button>
                                    </div>
                                    <div className="max-w-56 flex flex-col items-center justify-center gap-1 pt-4">
                                        <Label className="text-black dark:text-white text-base">
                                            Set Server Join Code
                                        </Label>
                                        <Input
                                            type="text"
                                            placeholder="SERVERCODE"
                                            value={serverCode}
                                            onChange={
                                                handleServerCodeInputChange
                                            }
                                            className="w-full bg-slate-300 dark:bg-slate-700 rounded-2xl p-4"
                                        ></Input>
                                        <Label
                                            className={cn(
                                                "text-red-500 text-sm font-sans antialiased my-1 text-center",
                                                fontSans.variable
                                            )}
                                        >
                                            {serverCodeError}
                                        </Label>
                                        <Button
                                            onClick={handleUpdateServerCode}
                                            className="bg-slate-900 text-white hover:text-black hover:bg-slate-200 rounded-xl gap-2 fill-white hover:fill-black"
                                        >
                                            Update Server Join Code
                                        </Button>
                                    </div>
                                </div>
                                <div className="w-full h-full flex justify-center items-center bg-slate-100 dark:bg-slate-700 px-4 pl-4 gap-3 rounded-xl">
                                    <div className="w-full flex flex-col items-center justify-center gap-2">
                                        <Label className="w-full text-center flex items-center justify-center text-base">
                                            All Members
                                        </Label>
                                        <Dialog
                                            open={isPromotingMember}
                                            onOpenChange={setIsPromotingMember}
                                        >
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle
                                                        className={cn(
                                                            "dark:text-white text-xl font-sans antialiased",
                                                            fontSans.variable
                                                        )}
                                                    >
                                                        Are you sure?
                                                    </DialogTitle>
                                                    <DialogDescription
                                                        className={cn(
                                                            "dark:text-white text-[16px] font-sans antialiased flex flex-col gap-4",
                                                            fontSans.variable
                                                        )}
                                                    >
                                                        <div>
                                                            Promoting a member
                                                            to admin gives them
                                                            some special
                                                            permissions that
                                                            will allow them to
                                                            change your server
                                                            significantly!
                                                        </div>
                                                        <div className="flex items-center justify-end w-full gap-4">
                                                            <Button
                                                                className="bg-red-600 text-white hover:text-black hover:bg-slate-200 rounded-xl"
                                                                onClick={() => {
                                                                    handlePromoteAdmin(
                                                                        promotedMember
                                                                    );
                                                                    setIsPromotingMember(
                                                                        false
                                                                    );
                                                                }}
                                                            >
                                                                Confirm
                                                                Promotion
                                                            </Button>
                                                            <Button
                                                                onClick={() =>
                                                                    setIsPromotingMember(
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
                                        <ScrollArea className="w-56 h-72">
                                            {serverNavigationData.memberList.map(
                                                (member) =>
                                                    user.uid === member ||
                                                    (!(
                                                        user.uid ===
                                                        serverNavigationData.ownerUid
                                                    ) &&
                                                        (member ===
                                                            serverNavigationData.ownerUid ||
                                                            serverNavigationData.adminList.includes(
                                                                member
                                                            ))) ? (
                                                        <div>
                                                            <UserInfo
                                                                userUid={member}
                                                                isOwner={
                                                                    member ===
                                                                    serverNavigationData.ownerUid
                                                                }
                                                                isAdmin={serverNavigationData.adminList.includes(
                                                                    member
                                                                )}
                                                                serverId={
                                                                    serverId
                                                                }
                                                            ></UserInfo>
                                                        </div>
                                                    ) : (
                                                        <Popover>
                                                            <PopoverTrigger>
                                                                <div>
                                                                    <UserInfo
                                                                        userUid={
                                                                            member
                                                                        }
                                                                        isOwner={
                                                                            member ===
                                                                            serverNavigationData.ownerUid
                                                                        }
                                                                        isAdmin={serverNavigationData.adminList.includes(
                                                                            member
                                                                        )}
                                                                        serverId={
                                                                            serverId
                                                                        }
                                                                    ></UserInfo>
                                                                </div>
                                                            </PopoverTrigger>
                                                            <PopoverContent
                                                                className={cn(
                                                                    "dark:text-white text-sm font-sans antialiased w-48",
                                                                    fontSans.variable
                                                                )}
                                                            >
                                                                {serverNavigationData.adminList.includes(
                                                                    member
                                                                ) ? (
                                                                    <span
                                                                        onClick={() =>
                                                                            handleDemoteAdmin(
                                                                                member
                                                                            )
                                                                        }
                                                                        className={cn(
                                                                            "cursor-pointer w-full p-1 flex justify-start items-center text-red-500 font-bold text-sm font-sans antialiased hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm ",
                                                                            fontSans.variable
                                                                        )}
                                                                    >
                                                                        Demote
                                                                        from
                                                                        Admin
                                                                    </span>
                                                                ) : (
                                                                    <span
                                                                        onClick={() => {
                                                                            setPromotedMember(
                                                                                member
                                                                            );
                                                                            setIsPromotingMember(
                                                                                true
                                                                            );
                                                                        }}
                                                                        className={cn(
                                                                            "cursor-pointer w-full p-1 flex justify-start items-center text-black dark:text-white text-sm font-sans antialiased hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm ",
                                                                            fontSans.variable
                                                                        )}
                                                                    >
                                                                        Promote
                                                                        to Admin
                                                                    </span>
                                                                )}

                                                                <span
                                                                    onClick={() =>
                                                                        handleKickMember(
                                                                            member
                                                                        )
                                                                    }
                                                                    className={cn(
                                                                        "cursor-pointer w-full p-1 flex justify-start items-center text-red-500 font-bold text-sm font-sans antialiased hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm ",
                                                                        fontSans.variable
                                                                    )}
                                                                >
                                                                    Kick From
                                                                    Server
                                                                </span>
                                                            </PopoverContent>
                                                        </Popover>
                                                    )
                                            )}
                                        </ScrollArea>
                                    </div>
                                    <div className="w-full flex flex-col items-center justify-center gap-2">
                                        <Label className="w-full text-center flex items-center justify-center text-base">
                                            Admins
                                        </Label>
                                        <ScrollArea className="w-56 h-72">
                                            {serverNavigationData.adminList.map(
                                                (admin) =>
                                                    user.uid === admin ||
                                                    (!(
                                                        user.uid ===
                                                        serverNavigationData.ownerUid
                                                    ) &&
                                                        (admin ===
                                                            serverNavigationData.ownerUid ||
                                                            serverNavigationData.adminList.includes(
                                                                admin
                                                            ))) ? (
                                                        <div>
                                                            <UserInfo
                                                                userUid={admin}
                                                                isOwner={
                                                                    admin ===
                                                                    serverNavigationData.ownerUid
                                                                }
                                                                isAdmin={serverNavigationData.adminList.includes(
                                                                    admin
                                                                )}
                                                                serverId={
                                                                    serverId
                                                                }
                                                            ></UserInfo>
                                                        </div>
                                                    ) : (
                                                        <Popover>
                                                            <PopoverTrigger>
                                                                <div>
                                                                    <UserInfo
                                                                        userUid={
                                                                            admin
                                                                        }
                                                                        isOwner={
                                                                            admin ===
                                                                            serverNavigationData.ownerUid
                                                                        }
                                                                        isAdmin={serverNavigationData.adminList.includes(
                                                                            admin
                                                                        )}
                                                                        serverId={
                                                                            serverId
                                                                        }
                                                                    ></UserInfo>
                                                                </div>
                                                            </PopoverTrigger>
                                                            <PopoverContent
                                                                className={cn(
                                                                    "dark:text-white text-sm font-sans antialiased w-48",
                                                                    fontSans.variable
                                                                )}
                                                            >
                                                                {serverNavigationData.adminList.includes(
                                                                    admin
                                                                ) ? (
                                                                    <span
                                                                        onClick={() =>
                                                                            handleDemoteAdmin(
                                                                                admin
                                                                            )
                                                                        }
                                                                        className={cn(
                                                                            "cursor-pointer w-full p-1 flex justify-start items-center text-red-500 font-bold text-sm font-sans antialiased hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm ",
                                                                            fontSans.variable
                                                                        )}
                                                                    >
                                                                        Demote
                                                                        from
                                                                        Admin
                                                                    </span>
                                                                ) : (
                                                                    <span
                                                                        onClick={() => {
                                                                            setPromotedMember(
                                                                                admin
                                                                            );
                                                                            setIsPromotingMember(
                                                                                true
                                                                            );
                                                                        }}
                                                                        className={cn(
                                                                            "cursor-pointer w-full p-1 flex justify-start items-center text-black dark:text-white text-sm font-sans antialiased hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm ",
                                                                            fontSans.variable
                                                                        )}
                                                                    >
                                                                        Promote
                                                                        to Admin
                                                                    </span>
                                                                )}

                                                                <span
                                                                    onClick={() =>
                                                                        handleKickMember(
                                                                            admin
                                                                        )
                                                                    }
                                                                    className={cn(
                                                                        "cursor-pointer w-full p-1 flex justify-start items-center text-red-500 font-bold text-sm font-sans antialiased hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm ",
                                                                        fontSans.variable
                                                                    )}
                                                                >
                                                                    Kick From
                                                                    Server
                                                                </span>
                                                            </PopoverContent>
                                                        </Popover>
                                                    )
                                            )}
                                        </ScrollArea>
                                    </div>
                                </div>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
            <div className="h-full min-w-72 bg-slate-100 dark:bg-slate-700 overflow-y-auto no-scrollbar no-scrollbar::-webkit-scrollbar flex-col items-center justify-start px-4">
                <div className="flex items-center justify-between sticky top-0 text-black dark:text-white text-xl bg-slate-100 dark:bg-slate-700 w-full h-12 pt-3 border-b font-bold">
                    <span>{serverNavigationData.serverName}</span>
                    <div>
                        {(user.uid === serverNavigationData.ownerUid ||
                            serverNavigationData.adminList.includes(
                                user.uid
                            )) && (
                            <IoMdSettings
                                onClick={() => setOpenServerSettings(true)}
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
                                    onClick={() => setAddingTextChannel(true)}
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
                                            className={cn(
                                                "flex w-full h-8 cursor-pointer items-center justify-between px-2 rounded-xl dark:hover:bg-slate-800 hover:bg-slate-300",
                                                selectedChannel[0] ===
                                                    "textchannel" &&
                                                    selectedChannel[1] ===
                                                        textChannel.textChannelId
                                                    ? "dark:bg-slate-800 bg-slate-300"
                                                    : null
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent event bubbling
                                                console.log(
                                                    "TEXT CHANNEL CLICK!"
                                                );
                                                setSelectedChannel([
                                                    "textchannel",
                                                    textChannel.textChannelId,
                                                ]);
                                                setServerContent([
                                                    "textchannel",
                                                    textChannel.textChannelId,
                                                ]);
                                            }}
                                        >
                                            <div className="w-full flex items-center gap-1 justify-start">
                                                <FaHashtag size={15} />
                                                <span>
                                                    {
                                                        textChannel.textChannelName
                                                    }
                                                </span>
                                            </div>
                                            <HiDotsVertical
                                                size={15}
                                                className="hover:text-slate-400 dark:hover:brightness-90 cursor-pointer"
                                            />
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
                                    onClick={() => setAddingVoiceChannel(true)}
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
                                            className={cn(
                                                "flex w-full h-8 cursor-pointer items-center justify-between px-2 rounded-xl dark:hover:bg-slate-800 hover:bg-slate-300",
                                                selectedChannel[0] ===
                                                    "voicechannel" &&
                                                    selectedChannel[1] ===
                                                        voiceChannel.voiceChannelId
                                                    ? "dark:bg-slate-800 bg-slate-300"
                                                    : null
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent event bubbling
                                                console.log(
                                                    "VOICE CHANNEL CLICK!"
                                                );
                                                setSelectedChannel([
                                                    "voicechannel",
                                                    voiceChannel.voiceChannelId,
                                                ]);
                                                setServerContent([
                                                    "voicechannel",
                                                    voiceChannel.voiceChannelId,
                                                ]);
                                            }}
                                        >
                                            <div className="w-full flex items-center gap-1 justify-start">
                                                <HiSpeakerWave size={15} />
                                                {voiceChannel.voiceChannelName}
                                            </div>
                                            <HiDotsVertical
                                                size={15}
                                                className="hover:text-slate-400 dark:hover:brightness-90 cursor-pointer"
                                            />
                                        </div>
                                    )
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </>
    ) : (
        <div className="h-full min-w-72 flex items-center justify-center shadow-md text-white text-3xl gap-4 bg-slate-100 dark:bg-slate-700">
            <AiOutlineLoading
                className="animate-spin fill-black dark:fill-white"
                size="20"
            />
        </div>
    );
};

const UserInfo = ({ isOwner, isAdmin, userUid, serverId }) => {
    const [userData, setUserData] = useState(null);
    const [userRealtimeStatus, setUserRealtimeStatus] = useState(null);
    const [nickname, setNickname] = useState(null);
    const nameRef = useRef(null);
    const statusRef = useRef(null);

    let scrollInterval;
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const startScrolling = (element) => {
        scrollInterval = setInterval(async () => {
            if (
                element.scrollLeft <
                element.scrollWidth - element.clientWidth
            ) {
                await delay(2000);
                element.scrollLeft += 1;
            } else {
                await delay(2000);
                element.scrollLeft = 0;
            }
        }, 50);
    };

    const stopScrolling = () => {
        clearInterval(scrollInterval);
    };

    useEffect(() => {
        if (nameRef.current) {
            startScrolling(nameRef.current);
        }

        if (statusRef.current) {
            startScrolling(statusRef.current);
        }

        return () => {
            stopScrolling();
        };
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

        const usersRef = firestore.collection("users");

        const getUserData = async () => {
            const userDoc = usersRef.doc(userUid).onSnapshot((snapshot) => {
                setUserData([
                    snapshot.data().username,
                    snapshot.data().tag,
                    snapshot.data().customStatus,
                    snapshot.data().profilePicture,
                ]);
            });

            const nicknameDoc = await firestore
                        .collection("users")
                        .doc(userUid)
                        .collection("nicknames")
                        .doc(serverId)
                        .get();

            let nickname;

            if (nicknameDoc.exists) {
                console.log("NICKNAME EXISTS");
                nickname = nicknameDoc.data().nickname;
            } else {
                console.log("NICKNAME DOESN'T EXIST");
                nickname = null;
            }

            setNickname(nickname);
            console.log(nickname);
        };

        getUserData();
        getUserRealTimeStatus();
    }, []);

    return (
        userData && (
            <div className="flex w-56 min-h-12 items-center justify-start">
                <div className="w-56 h-16 flex items-center justify-start gap-3 dark:hover:bg-slate-800 hover:bg-slate-300 rounded-xl px-2">
                    <Avatar className="bg-white">
                        <AvatarImage src={userData[3]} />
                        <AvatarFallback>{}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col justify-center items-start text-black dark:text-white">
                        <span
                            ref={nameRef}
                            className={cn(
                                "font-semibold max-w-28 overflow-x-scroll no-scrollbar no-scrollbar::-webkit-scrollbar text-base",
                                isOwner
                                    ? "text-red-600"
                                    : isAdmin
                                    ? "text-orange-400"
                                    : ""
                            )}
                            onMouseEnter={() => clearInterval(scrollInterval)}
                            onMouseLeave={() => {
                                if (nameRef.current) {
                                    startScrolling(nameRef.current);
                                }
                            }}
                        >
                            {nickname || userData[0]}
                        </span>
                        <span
                            ref={statusRef}
                            className="text-sm text-slate-600 dark:text-slate-400 max-w-28 overflow-x-auto no-scrollbar no-scrollbar::-webkit-scrollbar whitespace-nowrap"
                            onMouseEnter={() => clearInterval(scrollInterval)}
                            onMouseLeave={() => {
                                if (statusRef.current) {
                                    startScrolling(statusRef.current);
                                }
                            }}
                        >
                            {userRealtimeStatus === "Offline"
                                ? userRealtimeStatus
                                : userData[2] || userRealtimeStatus}
                        </span>
                    </div>
                    {isOwner && (
                        <PiCrownSimpleFill
                            className="absolute right-3"
                            size={20}
                        />
                    )}
                    {isAdmin && (
                        <RiAdminFill className="absolute right-3" size={20} />
                    )}
                </div>
            </div>
        )
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
        mentions: Array<string>;
    }

    interface ServerContentData {
        memberList: Array<string>;
        ownerUid: string;
        adminList: Array<string>;
    }

    const auth = firebase.auth() as unknown as Auth;
    const [user] = useAuthState(auth);
    const [messages, setMessages] = useState<Message[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<Record<string, any>>({});
    const [serverContentData, setServerContentData] =
        useState<ServerContentData>(null);
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
    const [mentionOpen, setMentionOpen] = useState(false);
    const [currentMentionIndex, setCurrentMentionIndex] = useState(null);
    const [mentionedUids, setMentionedUids] = useState([]);

    useEffect(() => {
        setMentionOpen(false);
        setMentionedUids([]);
        setInputValue("");
    }, [serverId, serverContent]);

    useEffect(() => {
        if (serverContent[0] === null) {
            setLoading(false);
            return;
        }

        const getUserData = async (uid: string) => {
            console.log("GET USER DATA");
            if (!userData[uid]) {
                const userDoc = await firestore
                    .collection("users")
                    .doc(uid)
                    .get();
                if (userDoc.exists) {
                    const userData = userDoc.data();

                    const nicknameDoc = await firestore
                        .collection("users")
                        .doc(uid)
                        .collection("nicknames")
                        .doc(serverId)
                        .get();

                    let nickname;

                    if (nicknameDoc.exists) {
                        console.log("NICKNAME EXISTS");
                        nickname = nicknameDoc.data().nickname;
                    } else {
                        console.log("NICKNAME DOESN'T EXIST");
                        nickname = null;
                    }

                    userData.nickname = nickname;

                    console.log("NICKNAME", nickname);

                    setUserData((prevData) => ({
                        ...prevData,
                        [uid]: userData,
                    }));
                }
            }
        };

        const getServerContentData = () => {
            const unsubscribeServer = firestore
                .collection("servers")
                .doc(serverId)
                .onSnapshot((snapshot) => {
                    const data = snapshot.data();
                    if (data) {
                        const currentMembers = data.memberList || [];
                        currentMembers.forEach((memberUid) => {
                            getUserData(memberUid);
                        });

                        setServerContentData({
                            memberList: currentMembers,
                            ownerUid: data.ownerUid || [],
                            adminList: data.adminList || [],
                        });
                    }
                    setLoading(false);
                });

            return unsubscribeServer;
        };

        setLoading(true);
        const unsubscribeServerData = getServerContentData();

        if (serverContent[0] === "textchannel") {
            const unsubscribeMessages = firestore
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
                                    mentions: messageData.mentions,
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

            console.log(userData);

            return () => {
                unsubscribeServerData();
                unsubscribeMessages();
            };
        } else if (serverContent[0] === "voicechannel") {
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
                `servers/messages/${serverId}/${serverContent[1]}/${file.name}`
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
            setMentionOpen(false);
            const verifiedMentions = validateMentions(inputValue);

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
                mentions: verifiedMentions,
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
            setMentionedUids([]);
            scrollToBottom();
        }
    };

    const handleInputChange = (e) => {
        const input = e.target.value;
        setInputValue(input);

        const cursorPosition = e.target.selectionStart;
        const mentionIndex = findClosestAtSymbol(input, cursorPosition);

        if (
            mentionIndex !== -1 &&
            (mentionIndex === input.length - 1 ||
                input[mentionIndex + 1] === " " ||
                input[cursorPosition - 1] === "@")
        ) {
            setMentionOpen(true);
            setCurrentMentionIndex(mentionIndex);
        } else {
            setMentionOpen(false);
        }
    };

    const findClosestAtSymbol = (input, cursorPosition) => {
        let closestIndex = -1;
        for (let i = cursorPosition - 1; i >= 0; i--) {
            if (input[i] === "@") {
                closestIndex = i;
                break;
            }
        }
        return closestIndex;
    };

    const handleMentionClick = (username, uid) => {
        const value = inputValue;
        const mentionIndex = currentMentionIndex;
        const newValue =
            value.slice(0, mentionIndex + 1) +
            username +
            " " +
            value.slice(mentionIndex + 1);
        setInputValue(newValue);

        setMentionedUids((prevUids) => [...prevUids, uid]);

        setMentionOpen(false);
        textareaRef.current.focus();
    };

    const validateMentions = (text) => {
        const mentionRegex = /@(\w+)/g;
        const mentions = [];
        const verifiedMentions = [];
        let match;
    
        while ((match = mentionRegex.exec(text)) !== null) {
            const mentionText = match[1];
            let user;
    
            // Check if the mention matches any user's nickname first
            user = Object.values(userData).find(
                (user) => user.nickname === mentionText
            );
    
            // If no nickname matches, check the username
            if (!user) {
                user = Object.values(userData).find(
                    (user) => !user.nickname && user.username === mentionText
                );
            }
    
            if (user) {
                mentions.push({ mentionText, uid: user.uid });
                verifiedMentions.push(user.uid);
            } else {
                console.error(`Invalid mention: @${mentionText}`);
            }
        }
    
        // Add manually typed mentions that match the userData
        mentionedUids.forEach((uid) => {
            const user = userData[uid];
            if (user && !verifiedMentions.includes(uid)) {
                const mentionText = user.nickname || user.username;
                if (text.includes(`@${mentionText}`)) {
                    verifiedMentions.push(uid);
                    mentions.push({ mentionText, uid });
                }
            }
        });
    
        return verifiedMentions;
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

    const renderMessageWithMentions = (message) => {
        const mentionRegex = /@(\w+)/g;
        const parts = message.text.split(mentionRegex);
        const validMentions = message.mentions; // List of valid mentioned UIDs from the message
        
        return parts.map((part, index) => {
            // Check if part matches any username or nickname corresponding to a valid mention UID
            const isValidMention = validMentions.some(uid => {
                const user = userData[uid];
                return user && (user.nickname === part || user.username === part);
            });
    
            if (mentionRegex.test(`@${part}`)) {
                if (isValidMention) {
                    return <span key={index} className="shadow-md px-2 rounded-xl bg-indigo-500 font-bold text-white">@{part}</span>;
                } else {
                    return <span key={index}>@{part}</span>;
                }
            } else {
                return <span key={index}>{part}</span>;
            }
        });
    };

    return (
        <div className="relative h-full w-full bg-slate-200 dark:bg-slate-900 overflow-y-auto no-scrollbar no-scrollbar::-webkit-scrollbar">
            {mentionOpen && (
                <div className="rounded-xl shadow-md fixed left-[490px] bottom-16 flex flex-col items-start justify-center bg-slate-100 w-min max-h-96 z-20 overflow-y-auto no-scrollbar no-scrollbar::-webkit-scrollbar">
                    {serverContentData?.memberList?.map((uid) => {
                        const user = userData[uid];
                        return (
                            user && (
                                <div
                                    key={uid}
                                    className="cursor-pointer p-1"
                                    onClick={() =>
                                        handleMentionClick(
                                            user.nickname || user.username,
                                            user.uid
                                        )
                                    }
                                >
                                    <UserInfo
                                        isAdmin={false}
                                        isOwner={false}
                                        userUid={uid}
                                        serverId={serverId}
                                    ></UserInfo>
                                </div>
                            )
                        );
                    })}
                </div>
            )}
            {serverContent[0] === "textchannel" && messages && (
                <>
                    <div
                        className="relative min-h-full w-full flex flex-col items-start justify-end p-4 overflow-y-auto no-scrollbar no-scrollbar::-webkit-scrollbar"
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
                                                    ? senderData.nickname ||
                                                      senderData.username
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
                                                        .getMinutes()
                                                         < 10 ? 0 + message.createdAt
                                                         .toDate()
                                                         .getMinutes().toString() : message.createdAt
                                                         .toDate()
                                                         .getMinutes().toString())}
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
                                                <div className="message-body">
                                                    {renderMessageWithMentions(message)}
                                                </div>
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
                                                )) ||
                                                    (user.uid ===
                                                        serverContentData.ownerUid ||
                                                    serverContentData.adminList.includes(
                                                        user.uid
                                                    ) ? (
                                                        <ContextMenuItem
                                                            onClick={() => {
                                                                handleDeleteMessageClick(
                                                                    message.messageId
                                                                );
                                                            }}
                                                        >
                                                            Delete Message
                                                        </ContextMenuItem>
                                                    ) : (
                                                        <span className="text-red-600">
                                                            You can't modify
                                                            this message!
                                                        </span>
                                                    ))}
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
                            onClick={handleInputChange}
                            onChange={handleInputChange}
                            placeholder="Type your message here."
                            rows={1}
                            className="flex-1 min-w-[200px] rounded-2xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-slate-300 dark:bg-slate-700 resize-none no-scrollbar no-scrollbar::-webkit-scrollbar"
                        />
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
