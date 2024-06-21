import { useState } from "react";

const Dashboard = () => {
    const [content, setContent] = useState(null);

    return (
        <>
            <div className="flex w-full h-full">
                <DashboardNavigation />
                <DashboardContent content={null} />
            </div>
        </>
    );
};

const DashboardNavigation = () => {
    return (
        <div className="h-full min-w-72 bg-slate-100 dark:bg-slate-700"></div>
    );
};

const DashboardContent = ({ content }) => {
    return <div className="h-full w-full bg-slate-200 dark:bg-slate-800"></div>;
};

export default Dashboard;
