import firebase from "../../../firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
import type { Auth } from "firebase/auth";
import { storage, firestore } from "../../../firebase/clientApp";
import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "../ui/button";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const fontSans = FontSans({
    subsets: ["latin"],
    variable: "--font-sans",
});

const GeneralSettings = () => {
    const auth = firebase.auth() as unknown as Auth;
    const [user] = useAuthState(auth);
    const { toast } = useToast();
    const [toastMessage, setToastMessage] = useState("");

    const [file, setFile] = useState<File | null>(null);
    const [profilePicture, setProfilePicture] = useState(null);
    const [username, setUsername] = useState("");
    const [tag, setTag] = useState("");
    const [updateUsernameTagError, setUpdateUsernameTagError] = useState("");

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
        firestore
            .collection("users")
            .doc(user.uid)
            .get()
            .then((doc) => {
                setUsername(doc.data().username);
                setTag(doc.data().tag);
            });
    }, []);

    const getUserProfilePicture = async () => {
        const usersRef = firestore.collection("users");
        const userDoc = await usersRef.doc(user.uid).get();

        setProfilePicture(userDoc.data().profilePicture);
    };

    // Fetch the profile picture when the component mounts and when the user changes
    getUserProfilePicture();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleProfileImageUpload = async () => {
        if (file && user) {
            const storageRef = storage.ref();
            const fileRef = storageRef.child(
                `profilePictures/${user.uid}/${file.name}`
            );

            if (
                profilePicture !=
                (await storage
                    .ref()
                    .child("phiscord_default_pfp.PNG")
                    .getDownloadURL())
            ) {
                const prevFileRef = storage.refFromURL(profilePicture);
                await prevFileRef.delete();
            }

            await fileRef.put(file);
            const fileUrl = await fileRef.getDownloadURL();

            await firestore.collection("users").doc(user.uid).update({
                profilePicture: fileUrl,
            });

            setFile(null);
            // Re-fetch the user's profile picture after upload
            getUserProfilePicture();
            setToastMessage("Updated profile picture!");
        }
    };

    const handleUpdateUsernameTag = async () => {
        if (username.length < 2 || username.length > 20) {
            setUpdateUsernameTagError("Username must be 2-20 characters!");
        }

        if (tag.length < 4 || tag.length > 5) {
            setUpdateUsernameTagError("Tag must be 4-5 characters!");
        }

        const checkUnique = await firestore
            .collection("users")
            .where("username", "==", username)
            .where("tag", "==", tag)
            .get();

        if (!checkUnique.empty) {
            setUpdateUsernameTagError("This username and tag has been taken!");
            return;
        }

        if (!/^(?!\s)(.*?)(?<!\s)$/.test(username)) {
            setUpdateUsernameTagError(
                "No spaces in the in front or behind the username is allowed!"
            );
            return;
        }

        await firestore.collection("users").doc(user.uid).update({
            username: username,
            tag: tag,
        });

        setUpdateUsernameTagError("");
        setToastMessage("Updated username and tag!");
    };

    return (
        <>
            <div className="w-full h-full flex items-center justify-start gap-8">
                <div className="flex flex-col items-center justify-center gap-8">
                    <Avatar className="bg-white w-40 h-40">
                        <AvatarImage src={profilePicture} />
                        <AvatarFallback>{`:(`}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-center justify-center gap-4">
                        <Label className="text-black dark:text-white text-xl">
                            Set Profile Picture
                        </Label>
                        <Input
                            className="flex w-56 h-10 justify-center items-center gap-2 rounded-3xl bg-slate-300 dark:bg-slate-600
                                        hover:scale-105 hover:brightness-125 transition-all shadow-md cursor-pointer"
                            onChange={handleFileChange}
                            type="file"
                            accept="image/*"
                        ></Input>
                        <Button
                            className="w-44 bg-slate-900 text-white hover:text-black hover:bg-white dark:hover:bg-slate-200 rounded-3xl cursor-pointer shadow-md"
                            onClick={handleProfileImageUpload}
                        >
                            Upload Profile Image
                        </Button>
                    </div>
                </div>
                <div className="h-full flex flex-col items-center justify-center gap-1">
                    <div className="max-w-56 flex flex-col items-center justify-center gap-2 pt-4">
                        <Label className="text-black dark:text-white text-base">
                            Username and Tag
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-300 dark:bg-slate-700 rounded-2xl p-4"
                            ></Input>
                            <Input
                                type="text"
                                placeholder="Tag"
                                value={tag}
                                onChange={(e) => setTag(e.target.value)}
                                className="w-20 bg-slate-300 dark:bg-slate-700 rounded-2xl p-4"
                            ></Input>
                        </div>

                        <Label
                            className={cn(
                                "text-red-500 text-sm font-sans antialiased my-1 text-center",
                                fontSans.variable
                            )}
                        >
                            {updateUsernameTagError}
                        </Label>
                        <Button
                            onClick={handleUpdateUsernameTag}
                            className="bg-slate-900 text-white hover:text-black hover:bg-slate-200 rounded-xl gap-2 fill-white hover:fill-black"
                        >
                            Update Username and Tag
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default GeneralSettings;
