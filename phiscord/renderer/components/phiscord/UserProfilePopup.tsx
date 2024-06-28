import { firestore } from "../../../firebase/clientApp";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { AiOutlineLoading } from "react-icons/ai";

import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";

const fontSans = FontSans({
    subsets: ["latin"],
    variable: "--font-sans",
});

const UserProfilePopup = ({ serverId, userUid }) => {
    const [userData, setUserData] = useState(null);

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

    return (
        <div className="min-w-40 h-56 bg-slate-300 dark:bg-slate-900 flex flex-col items-center justify-start pt-2 gap-4">
            {userData && (
                <>
                    <Avatar className="bg-white w-20 h-20">
                        <AvatarImage src={userData[2]} />
                        <AvatarFallback>{`:(`}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col justify-center items-center w-full">
                        <span
                            className={cn(
                                "dark:text-white text-2xl font-sans font-semibold antialiased",
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
                            "dark:text-white text-sm font-sans antialiased",
                            fontSans.variable
                        )}
                    >
                        {userData[3]}
                    </span>
                    {serverId}
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
    );
};

export default UserProfilePopup;
