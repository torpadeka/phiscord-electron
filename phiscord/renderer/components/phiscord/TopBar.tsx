import { useState } from "react";
import { MdOutlineDarkMode } from "react-icons/md";

const TopBar = () => {
    const [darkTheme, setDarkTheme] = useState(true);
    
    if (darkTheme) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    return (
        <>
            <div className="fixed top-0 h-14 w-full flex items-center justify-end px-2 bg-slate-300 dark:bg-slate-600">
                <TopBarIcon
                    setTheme={() => {
                        setDarkTheme(!darkTheme);
                    }}
                    icon={<MdOutlineDarkMode size={30} />}
                />
            </div>
        </>
    );
};

const TopBarIcon = ({ icon, setTheme }) => {
    return (
        <>
            <div
                onClick={setTheme}
                className="w-10 h-10 flex items-center justify-center bg-slate-200 dark:bg-slate-700 hover:brightness-150
            rounded-3xl shadow-lg hover:rounded-xl transition-all duration-75 cursor-pointer"
            >
                {icon}
            </div>
        </>
    );
};

export default TopBar;
