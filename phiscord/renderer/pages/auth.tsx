import StyledFirebaseAuth from "@/components/firebase/StyledFirebaseAuth";
import firebase from "../../firebase/clientApp";
import { withoutAuth } from "@/hoc/withoutAuth";

const uiConfig = {
    // Popup signin flow rather than redirect flow.
    signInFlow: "popup",
    // Redirect to /home after sign in is successful. Alternatively you can provide a callbacks.signInSuccess function.
    signInSuccessUrl: "/home",
    signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID],
};

export default withoutAuth(function AuthPage() {
    return (
        <>
            <div>
                <h1>PHiscord</h1>
                <p>Please sign-in:</p>
                <StyledFirebaseAuth
                    uiConfig={uiConfig}
                    firebaseAuth={firebase.auth()}
                />
            </div>
        </>
    );
});
