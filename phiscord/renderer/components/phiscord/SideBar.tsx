import { LuBox } from "react-icons/lu";
import firebase, { firestore, storage } from "../../../firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
import { Auth } from "firebase/auth";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { Inter as FontSans } from "next/font/google";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { FaPlus } from "react-icons/fa6";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { IoPrismSharp } from "react-icons/io5";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const fontSans = FontSans({
    subsets: ["latin"],
    variable: "--font-sans",
});

interface ServerShortDetail {
    serverPicture: string;
    serverId: string;
}

const SideBar = ({ setActivePage }) => {
    const auth = firebase.auth() as unknown as Auth;
    const [user, loading, error] = useAuthState(auth);
    const [servers, setServers] = useState<ServerShortDetail[]>([]);
    const [isAddingNewServer, setIsAddingNewServer] = useState(false);
    const [createNewServerError, setCreateNewServerError] = useState("");
    const [joinServerError, setJoinServerError] = useState("");

    const [newServerName, setNewServerName] = useState("");
    const [joinServerCode, setJoinServerCode] = useState("");

    useEffect(() => {
        if (user) {
            const getUserServers = async () => {
                const unsubscribe = await firestore
                    .collection("servers")
                    .where("memberList", "array-contains", user.uid)
                    .onSnapshot((snapshot) => {
                        let servers = [];
                        snapshot.forEach((doc) => {
                            const newServer: ServerShortDetail = {
                                serverId: doc.id,
                                serverPicture: doc.data().serverPicture,
                            };
                            servers.push(newServer);
                        });
                        setServers(servers);
                    });
            };

            getUserServers();
        }
    }, []);

    const handleNewServerInputChange = (e) => {
        setNewServerName(e.target.value);
    };

    const handleJoinServerInputChange = (e) => {
        setJoinServerCode(e.target.value);
    };

    const handleCreateNewServer = async () => {
        if (newServerName === "") {
            setCreateNewServerError("The server's name can't be empty :(");
            return;
        }

        if (newServerName.length > 30) {
            setCreateNewServerError(
                "The server's name can't be longer than 30 characters"
            );
            return;
        }

        setCreateNewServerError("");

        const newServerRef = await firestore.collection("servers").add({
            serverPicture: null,
            serverCode: null,
            serverName: newServerName,
            ownerUid: user.uid,
            adminList: [],
            memberList: [user.uid],
        });

        await newServerRef.update({
            serverCode: newServerRef.id,
        });

        await newServerRef.collection("textChannels").add({
            channelName: "general-chat",
        });

        await newServerRef.collection("voiceChannels").add({
            channelName: "General Voice",
        });

        setIsAddingNewServer(false);
        setNewServerName("");
    };

    const handleJoinServer = async () => {
        if (joinServerCode === "") {
            setJoinServerError("The code can't be empty :(");
            return;
        }

        const serverRef = await firestore
            .collection("servers")
            .where("serverCode", "==", joinServerCode)
            .get();

        if (serverRef.empty) {
            setJoinServerError("Server not found!");
            return;
        }

        const serverId = serverRef.docs[0].id;

        const memberList = (
            await firestore.collection("servers").doc(serverId).get()
        ).data().memberList;

        await firestore
            .collection("servers")
            .doc(serverId)
            .update({
                memberList: [...memberList, user.uid],
            });

        setIsAddingNewServer(false);
        setJoinServerCode("");
    };

    return (
        <>
            <Dialog
                open={isAddingNewServer}
                onOpenChange={setIsAddingNewServer}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle
                            className={cn(
                                "dark:text-white text-xl font-sans antialiased",
                                fontSans.variable
                            )}
                        >
                            Add a Server
                        </DialogTitle>
                        <DialogDescription
                            className={cn(
                                "dark:text-white text-xl font-sans antialiased",
                                fontSans.variable
                            )}
                        >
                            <Tabs
                                defaultValue="create"
                                className="flex flex-col items-center justify-center"
                            >
                                <TabsList className="gap-4 dark:text-slate-500 text-black">
                                    <TabsTrigger value="create">
                                        Create a Server
                                    </TabsTrigger>
                                    <TabsTrigger value="join">
                                        Join a Server
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent
                                    className="fade-in-faster h-48 w-full"
                                    value="create"
                                >
                                    <div className="flex flex-col items-center justify-center gap-3 pt-4">
                                        <Label>Enter a Cool Server Name</Label>
                                        <Input
                                            type="text"
                                            placeholder="My Awesome Server"
                                            onChange={
                                                handleNewServerInputChange
                                            }
                                            className="w-full bg-slate-300 dark:bg-slate-700 rounded-2xl mt-4 p-4"
                                        ></Input>
                                        <Label
                                            className={cn(
                                                "text-red-500 text-sm font-sans antialiased mt-1",
                                                fontSans.variable
                                            )}
                                        >
                                            {createNewServerError}
                                        </Label>
                                        <Button
                                            onClick={handleCreateNewServer}
                                            className="mt-1 bg-slate-900 text-white hover:text-black hover:bg-slate-200 rounded-xl gap-2 fill-white hover:fill-black"
                                        >
                                            Create Server
                                        </Button>
                                    </div>
                                </TabsContent>
                                <TabsContent
                                    className="fade-in-faster h-48 w-full"
                                    value="join"
                                >
                                    <div className="flex flex-col items-center justify-center gap-3 pt-4">
                                        <Label>Enter Server Join Code</Label>
                                        <Input
                                            type="text"
                                            placeholder="SERVERCODE"
                                            onChange={
                                                handleJoinServerInputChange
                                            }
                                            className="w-full bg-slate-300 dark:bg-slate-700 rounded-2xl mt-4 p-4"
                                        ></Input>
                                        <Label
                                            className={cn(
                                                "text-red-500 text-sm font-sans antialiased mt-1",
                                                fontSans.variable
                                            )}
                                        >
                                            {joinServerError}
                                        </Label>
                                        <Button
                                            onClick={handleJoinServer}
                                            className="mt-1 bg-slate-900 text-white hover:text-black hover:bg-slate-200 rounded-xl gap-2 fill-white hover:fill-black"
                                        >
                                            Join Server
                                        </Button>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
            <div
                className="flex flex-col items-center fixed top-0 left-0 w-20 m-0 h-screen
                        dark:bg-slate-900 bg-slate-200 dark:text-white overflow-scroll no-scrollbar::-webkit-scrollbar no-scrollbar"
            >
                <SideBarIcon
                    icon={<LuBox size={30} />}
                    serverPicture={null}
                    onClick={() => setActivePage(["dashboard", null])}
                />
                {servers.map((server, index) => {
                    return (
                        <SideBarIcon
                            key={index}
                            icon={null}
                            serverPicture={server.serverPicture}
                            onClick={() =>
                                setActivePage(["server", server.serverId])
                            }
                        ></SideBarIcon>
                    );
                })}
                <SideBarIcon
                    icon={<FaPlus size={30} />}
                    serverPicture={null}
                    onClick={() => setIsAddingNewServer(true)}
                />
            </div>
        </>
    );
};

const SideBarIcon = ({ icon, serverPicture, onClick }) => {
    return (
        <>
            {icon && (
                <div
                    onClick={onClick}
                    className="relative flex items-center justify-center min-h-14 w-14 my-2 shadow-lg bg-white dark:bg-slate-500 rounded-3xl hover:rounded-xl
            dark:hover:bg-slate-500 transition-all ease-in-out cursor-pointer"
                >
                    {/* <span className="absolute top-0 right-0 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                    </span> */}
                    {icon}
                </div>
            )}
            {!icon &&
                (serverPicture !== null ? (
                    <img
                        onClick={onClick}
                        className="flex items-center justify-center min-h-14 w-14 my-2 shadow-lg bg-white dark:bg-slate-500 rounded-3xl hover:rounded-xl
                                    dark:hover:bg-slate-500 transition-all ease-in-out cursor-pointer"
                        src={serverPicture}
                        alt=""
                    />
                ) : (
                    <div
                        onClick={onClick}
                        className="flex items-center justify-center min-h-14 w-14 my-2 shadow-lg bg-white dark:bg-slate-500 rounded-3xl hover:rounded-xl
                                    dark:hover:bg-slate-500 transition-all ease-in-out cursor-pointer"
                    >
                        <IoPrismSharp size={30} />
                    </div>
                ))}
        </>
    );
};

export default SideBar;
