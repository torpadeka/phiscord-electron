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

            try {
                await fileRef.put(file);
                const fileUrl = await fileRef.getDownloadURL();

                await firestore.collection("users").doc(user.uid).update({
                    profilePicture: fileUrl,
                });

                // Re-fetch the user's profile picture after upload
                getUserProfilePicture();
            } catch (error) {
                console.error("Error uploading file:", error);
            }
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-start gap-8 mt-10">
            <div className="flex flex-col items-center justify-center gap-8">
                <Avatar className="bg-white w-40 h-40">
                    <AvatarImage src={profilePicture} />
                    <AvatarFallback>{`:(`}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-center justify-center gap-4">
                    <Label className="text-white text-2xl">
                        Set Profile Picture
                    </Label>
                    <Input
                        className="w-56 bg-slate-200 rounded-3xl cursor-pointer hover:scale-105 transition-all"
                        onChange={handleFileChange}
                        type="file"
                    ></Input>
                    <Button
                        className="w-40 rounded-3xl text-sm"
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
