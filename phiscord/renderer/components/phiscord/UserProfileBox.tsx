import firebase, { firestore } from "../../../firebase/clientApp";
import type { Auth } from "firebase/auth";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { AiOutlineLoading } from "react-icons/ai";

const UserProfileBox = () => {
    const auth = firebase.auth() as unknown as Auth;
    const [user, loading, error] = useAuthState(auth);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const getUserData = async () => {
            const usersRef = firestore.collection("users");
            const snapshot = await usersRef.where("uid", "==", user.uid).get();
            snapshot.forEach((doc) => {
                setUserData([doc.data().username, doc.data().tag]);
            });
        };

        getUserData();
    }, []);

    return (
        <div className="flex justify-center items-center fixed min-w-72 left-0 bottom-0 h-16 ml-20 bg-slate-300 dark:bg-slate-600">
            {userData !== null && (
                <>
                    {userData[0]} # {userData[1]}
                </>
            )}
            {userData === null && (
                <div className="h-full w-full flex items-center justify-center shadow-md text-white text-3xl gap-4">
                    <AiOutlineLoading className="animate-spin" size="20" />
                </div>
            )}
        </div>
    );
};

export default UserProfileBox;
