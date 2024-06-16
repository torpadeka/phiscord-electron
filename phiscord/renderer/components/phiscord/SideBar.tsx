import { LuBox } from "react-icons/lu";

const SideBar = () => {
    return (
        <div
            className="flex flex-col items-center fixed top-0 left-0 w-20 m-0 h-screen
                        bg-blue-900 text-white shadow-md"
        >
            <SideBarIcon icon={<LuBox size="30" />}></SideBarIcon>
            <SideBarIcon icon={<LuBox size="30" />}></SideBarIcon>
            <SideBarIcon icon={<LuBox size="30" />}></SideBarIcon>
        </div>
    );
};

const SideBarIcon = ({ icon }) => {
    return <div className="sidebar-icon">{icon}</div>;
};

export default SideBar;
