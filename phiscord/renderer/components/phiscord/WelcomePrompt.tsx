import { LuBox } from "react-icons/lu";
import firebase from "../../../firebase/clientApp";
import { Button } from "../ui/button";

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
                <Button
                    onClick={() => {
                        firebase.auth().signOut();
                    }}
                >
                    Sign Out
                </Button>
            </div>
        </>
    );
};

export default WelcomePrompt;
