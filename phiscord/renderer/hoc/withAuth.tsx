import { useRouter } from "next/router";

import firebase from "../../firebase/clientApp";
import { firestore } from "../../firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
import type { Auth } from "firebase/auth";
import { useEffect, useState } from "react";

import { AiOutlineLoading } from "react-icons/ai";

export function withAuth(Component) {
    return function WithAuth(props) {
        const router = useRouter();

        // Authentication logic
        // Destructure user, loading and error out of the useAuthState hook
        const auth = firebase.auth() as unknown as Auth;
        const [user, loading, error] = useAuthState(auth);

        const [isCheckingUser, setIsCheckingUser] = useState(true);

        // Redirect to login page if not authenticated
        useEffect(() => {
            if (!loading && !user) {
                router.push("/auth");
            }
        }, [loading, user, router]);

        useEffect(() => {
            if (user) {
                const checkUserExists = async () => {
                    try {
                        const querySnapshot = await firestore
                            .collection("users")
                            .where("uid", "==", user.uid)
                            .get();

                        if (querySnapshot.empty) {
                            setIsCheckingUser(false);
                            router.push("/newuser");
                        } else {
                            setIsCheckingUser(false);
                        }
                    } catch (error) {
                        console.error("Error checking user existence: ", error);
                        setIsCheckingUser(false);
                    }
                };

                checkUserExists();
            } else {
                setIsCheckingUser(false);
            }
        }, [user, router]);

        if (loading || isCheckingUser) {
            return (
                <div className="h-screen w-screen flex items-center justify-center shadow-md bg-slate-950 text-white text-3xl gap-4">
                    <AiOutlineLoading className="animate-spin" size="20" />
                    <span>Loading</span>
                </div>
            );
        }

        return <Component {...props} />;
    };
}
