import { LuBox } from "react-icons/lu";

const SideBar = ({ onIconClick }) => {
    return (
        <>
            <div
                className="flex flex-col items-center fixed top-0 left-0 w-20 m-0 h-screen
                        dark:bg-slate-800 bg-slate-200 dark:text-white overflow-scroll no-scrollbar::-webkit-scrollbar no-scrollbar"
            >
                <SideBarIcon
                    icon={<LuBox size="30" />}
                    onClick={() => onIconClick("dashboard")}
                />
            </div>
        </>
    );
};

const SideBarIcon = ({ icon, onClick }) => {
    return (
        <>
            <div
                onClick={onClick}
                className="flex items-center justify-center min-h-14 w-14 my-2 shadow-lg bg-white dark:bg-slate-500 rounded-3xl hover:rounded-xl
                dark:hover:bg-slate-500 transition-all ease-in-out cursor-pointer"
            >
                {icon}
            </div>
        </>
    );
};

export default SideBar;
