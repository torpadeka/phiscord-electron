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
    const [isCreatingNewServer, setIsCreatingNewServer] = useState(false);
    const [createNewServerError, setCreateNewServerError] = useState("");

    const [newServerName, setNewServerName] = useState("");

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

    const handleCreateNewServer = async () => {
        if (newServerName === "") {
            setCreateNewServerError("The server's name can't be empty :(");
            return;
        }

        setCreateNewServerError("");

        const newServerRef = await firestore.collection("servers").add({
            serverPicture: null,
            serverName: newServerName,
            ownerUid: user.uid,
            adminList: [],
            memberList: [user.uid],
        });

        newServerRef.collection("textChannels").add({
            channelName: "general-chat",
        });

        setIsCreatingNewServer(false);
        setNewServerName("");
    };

    return (
        <>
            <Dialog
                open={isCreatingNewServer}
                onOpenChange={setIsCreatingNewServer}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle
                            className={cn(
                                "dark:text-white text-xl font-sans antialiased",
                                fontSans.variable
                            )}
                        >
                            Create New Server
                        </DialogTitle>
                        <DialogDescription
                            className={cn(
                                "dark:text-white text-xl font-sans antialiased",
                                fontSans.variable
                            )}
                        >
                            <div className="flex flex-col items-center justify-center gap-3">
                                <Input
                                    type="text"
                                    placeholder="My Awesome Server"
                                    onChange={handleNewServerInputChange}
                                    className="w-full bg-slate-300 dark:bg-slate-700 rounded-2xl mt-4 p-4"
                                ></Input>
                                <Label
                                    className={cn(
                                        "text-red-500 text-sm font-sans antialiased",
                                        fontSans.variable
                                    )}
                                >
                                    {createNewServerError}
                                </Label>
                                <Button
                                    onClick={handleCreateNewServer}
                                    className="bg-slate-900 text-white hover:text-black hover:bg-slate-200 rounded-xl gap-2 fill-white hover:fill-black"
                                >
                                    Create Server
                                </Button>
                            </div>
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
                    onClick={() => setIsCreatingNewServer(true)}
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
                    className="flex items-center justify-center min-h-14 w-14 my-2 shadow-lg bg-white dark:bg-slate-500 rounded-3xl hover:rounded-xl
            dark:hover:bg-slate-500 transition-all ease-in-out cursor-pointer"
                >
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
