import { LuBox } from "react-icons/lu";
import firebase from "../../../firebase/clientApp";

const WelcomePrompt = () => {
    return (
        <>
            <div className="flex flex-col items-center justify-center h-full w-full gap-10 bg-white dark:bg-slate-700">
                <div className="flex flex-col items-center justify-center">
                    <LuBox size="100" />
                    <div className="text-6xl font-bold text-center">
                        Welcome to Phiscord
                    </div>
                </div>
                <button
                    className="h-10 w-40 rounded-3xl flex bg-slate-400 dark:bg-slate-800 shadow-md items-center justify-center hover:brightness-125"
                    onClick={() => {
                        firebase.auth().signOut();
                    }}
                >
                    Sign Out
                </button>
            </div>
        </>
    );
};

export default WelcomePrompt;
