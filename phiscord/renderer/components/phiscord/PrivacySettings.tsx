import firebase from "../../../firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
import type { Auth } from "firebase/auth";
import { storage, firestore } from "../../../firebase/clientApp";
import { useEffect, useState } from "react";

const PrivacySettings = () => {
    const auth = firebase.auth() as unknown as Auth;
    const [user] = useAuthState(auth);
    const [allowStrangerComms, setAllowStrangerComms] = useState(null);

    useEffect(() => {
        const unsubscribePrivacy = firestore
            .collection("users")
            .doc(user.uid)
            .onSnapshot((snapshot) => {
                setAllowStrangerComms(snapshot.data().allowStrangerComms);
                console.log(snapshot.data().allowStrangerComms);
                console.log(allowStrangerComms);
            });

        return () => unsubscribePrivacy();
    }, []);

    return (
        <div className="w-full h-full flex items-start justify-start gap-8 p-2">
            {allowStrangerComms}
        </div>
    );
};

export default PrivacySettings;
