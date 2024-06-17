import { LuBox } from "react-icons/lu";

const SideBar = ({ onIconClick }) => {
    return (
        <div
            className="flex flex-col items-center fixed top-0 left-0 w-20 m-0 h-screen
                        bg-slate-700 text-white shadow-lg"
        >
            <SideBarIcon
                icon={<LuBox size="30" />}
                onClick={() => onIconClick("dashboard")}
            />
        </div>
    );
};

const SideBarIcon = ({ icon, onClick }) => {
    return (
        <div
            onClick={onClick}
            className="flex items-center justify-center h-14 w-14 my-2 shadow-lg bg-slate-500 rounded-xl"
        >
            {icon}
        </div>
    );
};

export default SideBar;
