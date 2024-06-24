import { useRouter } from "next/router";

import firebase from "../../firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
import type { Auth } from "firebase/auth";
import { AiOutlineLoading } from "react-icons/ai";

export function withoutAuth(Component) {
    return function WithoutAuth(props) {
        const router = useRouter();

        // Authentication logic
        // Destructure user, loading and error out of the useAuthState hook
        const auth = firebase.auth() as unknown as Auth;
        const [user, loading, error] = useAuthState(auth);

        // Redirect to login page if not authenticated
        if (user !== null) {
            router.push("/home");
            return null;
        }

        if (loading) {
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
