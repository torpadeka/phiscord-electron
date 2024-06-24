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
        const auth = firebase.auth() as unknown as Auth;
        const [user, loading, error] = useAuthState(auth);

        // State to check if we are still verifying the user in Firestore
        const [isCheckingUser, setIsCheckingUser] = useState(true);

        // State to track if the user exists in Firestore
        const [userExists, setUserExists] = useState(false);

        // Effect to handle redirection to login if user is not authenticated
        useEffect(() => {
            if (!loading && !user) {
                router.push("/auth");
            }
        }, [loading, user, router]);

        // Effect to check if the user exists in Firestore
        useEffect(() => {
            const checkUserExists = async () => {
                if (user) {
                    try {
                        const userDoc = await firestore
                            .collection("users")
                            .doc(user.uid)
                            .get();

                        if (userDoc.exists) {
                            setUserExists(true);
                        } else {
                            router.push("/newuser");
                        }
                    } catch (error) {
                        console.error(
                            "Error checking user data in database!",
                            error
                        );
                    } finally {
                        setIsCheckingUser(false);
                    }
                } else {
                    setIsCheckingUser(false);
                }
            };

            checkUserExists();
        }, [user, router]);

        // If still loading or checking user, show the loading screen
        if (loading || isCheckingUser || (!user && !loading)) {
            return (
                <div className="h-screen w-screen flex items-center justify-center shadow-md bg-slate-950 text-white text-3xl gap-4">
                    <AiOutlineLoading className="animate-spin" size="20" />
                    <span>Loading</span>
                </div>
            );
        }

        // If not loading and user is checked, render the original component
        if(!loading && user){
            return <Component {...props} />;
        }
    };
}
