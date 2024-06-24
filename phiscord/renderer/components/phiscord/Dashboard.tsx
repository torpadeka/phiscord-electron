import { useState } from "react";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";

import { LuBox } from "react-icons/lu";
import { FaPlus } from "react-icons/fa6";
import { IoChatboxEllipsesSharp } from "react-icons/io5";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Button } from "../ui/button";

const fontSans = FontSans({
    subsets: ["latin"],
    variable: "--font-sans",
});

const Dashboard = () => {
    const [content, setContent] = useState("welcome");

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
    return (
        <div className="h-full min-w-72 bg-slate-100 dark:bg-slate-700 overflow-scroll no-scrollbar no-scrollbar::-webkit-scrollbar flex-col items-center justify-center pt-2">
            <div className="flex w-full h-14 justify-center items-center p-4 gap-4 cursor-pointer">
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
                    <PopoverContent className="bg-slate-300 dark:bg-slate-900 w-60">
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
                                placeholder="AwesomeUser#0000"
                                className={cn(
                                    "dark:text-white text-sm w-48 h-8 font-sans antialiased p-2 rounded-2xl",
                                    fontSans.variable
                                )}
                                type="text"
                            ></Input>
                            <Button className="bg-slate-400 flex gap-2 items-center justify-center">
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
            </div>
        </div>
    );
};

const DashboardContent = ({ content }) => {
    return (
        <div className="h-full w-full bg-slate-200 dark:bg-slate-900 overflow-scroll no-scrollbar no-scrollbar::-webkit-scrollbar">
            {content === "welcome" && (
                <div className="h-full w-full flex flex-col justify-center items-center gap-10">
                    <LuBox
                        className="hover:scale-105 transition-all duration-150"
                        size={100}
                    ></LuBox>
                    <div className="text-4xl font-bold">
                        Welcome to PHiscord
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
