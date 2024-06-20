import StyledFirebaseAuth from "@/components/firebase/StyledFirebaseAuth";
import firebase from "../../firebase/clientApp";
import { withoutAuth } from "@/hoc/withoutAuth";
import { LuBox } from "react-icons/lu";

const uiConfig = {
    // Popup signin flow rather than redirect flow.
    signInFlow: "popup",
    // Redirect to /home after sign in is successful. Alternatively you can provide a callbacks.signInSuccess function.
    signInSuccessUrl: "/home",
    signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
    ],
};

export default withoutAuth(function AuthPage() {
    // Set to dark mode (default theme)
    document.documentElement.classList.add("dark");

    return (
        <>
            <div className="dark flex flex-col items-center justify-center gap-10 h-screen w-screen">
                <LuBox
                    className="hover:scale-105 transition-all duration-150"
                    size={100}
                ></LuBox>
                <div className="text-4xl font-bold">Welcome to PHiscord!</div>
                <div className="text-xl">Sign-in to Continue</div>
                <StyledFirebaseAuth
                    uiConfig={uiConfig}
                    firebaseAuth={firebase.auth()}
                />
            </div>
        </>
    );
});
