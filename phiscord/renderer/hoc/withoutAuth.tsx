import { useRouter } from "next/router";

import firebase from "../../firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
import type { Auth } from "firebase/auth";

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

        return <Component {...props} />;
    };
}
