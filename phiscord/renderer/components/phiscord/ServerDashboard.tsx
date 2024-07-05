const ServerDashboard = ({ serverId }) => {
    return (
        <div className="flex w-full h-screen pl-20 pt-14">
            <ServerDashboardNavigation></ServerDashboardNavigation>
        </div>
    );
};

const ServerDashboardNavigation = () => {
    return (
        <div className="h-full min-w-72 bg-slate-100 dark:bg-slate-700 overflow-scroll no-scrollbar no-scrollbar::-webkit-scrollbar flex-col items-center justify-center pt-2"></div>
    );
};

export default ServerDashboard;
