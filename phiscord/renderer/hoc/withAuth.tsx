import { useRouter } from "next/router";

import firebase from "../../firebase/clientApp";
import { firestore } from "../../firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
import type { Auth } from "firebase/auth";
import { useEffect } from "react";

export function withAuth(Component) {
    return function WithAuth(props) {
        const router = useRouter();

        // Authentication logic
        // Destructure user, loading and error out of the useAuthState hook
        const auth = firebase.auth() as unknown as Auth;
        const [user, loading, error] = useAuthState(auth);

        // Redirect to login page if not authenticated
        if (user === null && loading === false) {
            router.push("/auth");
            return null;
        }

        if (loading === true) {
            return (
                <>
                    <div className="h-screen w-screen flex items-center justify-center shadow-md bg-slate-950 text-white text-3xl">
                        Loading . . .
                    </div>
                </>
            );
        }

        // Check the 'users' collection if the user already exists or not
        useEffect(() => {
            firestore
            .collection("users")
            .where("uid", "==", user.uid)
            .get()
            .then((querySnapshot) => {
                if (querySnapshot.empty) {
                    router.push("/newuser");
                    return null;
                }
            });
        }, [user, router]);

        return <Component {...props} />;
    };
}
