import firebase from "../../firebase/clientApp";
import { database } from "../../firebase/clientApp";

// Debounce utility function
const debounce = (func: (...args: any[]) => void, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

const monitorUserStatus = (uid: string) => {
    const userStatusDatabaseRef = database.ref(`/userState/${uid}`);

    const isOfflineForDatabase = {
        status: "offline",
        lastChanged: firebase.database.ServerValue.TIMESTAMP,
    };

    const isOnlineForDatabase = {
        status: "online",
        lastChanged: firebase.database.ServerValue.TIMESTAMP,
        isMute: false,
        isDeafen: false,
    };

    database.ref(".info/connected").on(
        "value",
        debounce(async (snapshot) => {
            if (snapshot.val() == false) {
                await userStatusDatabaseRef.set(isOfflineForDatabase);
                return;
            }

            userStatusDatabaseRef
                .onDisconnect()
                .set(isOfflineForDatabase)
                .then(async () => {
                    await userStatusDatabaseRef.set(isOnlineForDatabase);
                });
        }, 1000)
    ); // Debounce with 1 second delay
};

export { monitorUserStatus };
