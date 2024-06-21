const UserProfileBox = ({ username, tag }) => {
    return (
        <div className="flex justify-center items-center fixed min-w-72 left-0 bottom-0 h-16 ml-20 bg-slate-300 dark:bg-slate-600">
            {username} # {tag}
        </div>
    )
}

export default UserProfileBox;