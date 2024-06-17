import { useRouter } from "next/router";

import firebase from "../../firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
import type { Auth } from "firebase/auth";

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

        if(loading === true){
            return <><div className="h-screen w-screen flex items-center justify-center shadow-md text-gray-500 text-3xl">Loading . . .</div></>
        }

        return <Component {...props} />;
    };
}
