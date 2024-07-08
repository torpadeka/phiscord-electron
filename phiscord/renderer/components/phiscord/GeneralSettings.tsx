import firebase from "../../../firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
import type { Auth } from "firebase/auth";
import { storage, firestore } from "../../../firebase/clientApp";
import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "../ui/button";

const GeneralSettings = () => {
    const auth = firebase.auth() as unknown as Auth;
    const [user] = useAuthState(auth);

    const [file, setFile] = useState<File | null>(null);
    const [profilePicture, setProfilePicture] = useState(null);

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

            // Re-fetch the user's profile picture after upload
            getUserProfilePicture();
        }
    };

    return (
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
                    ></Input>
                    <Button
                        className="w-44 bg-slate-900 text-white hover:text-black hover:bg-white dark:hover:bg-slate-200 rounded-3xl cursor-pointer shadow-md"
                        onClick={handleProfileImageUpload}
                    >
                        Upload Profile Image
                    </Button>
                </div>
            </div>
            <div></div>
        </div>
    );
};

export default GeneralSettings;
