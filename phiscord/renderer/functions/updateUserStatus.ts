import firebase from "../../firebase/clientApp";
import { firestore, database } from "../../firebase/clientApp";

const monitorUserStatus = (uid: string) => {
    const userStatusDatabaseRef = database.ref(`/status/${uid}`);

    const isOfflineForDatabase = {
        status: "offline",
        last_changed: firebase.database.ServerValue.TIMESTAMP,
    };

    const isOnlineForDatabase = {
        status: "online",
        last_changed: firebase.database.ServerValue.TIMESTAMP,
        isMute: false,
        isDeafen: false,
    };

    database.ref(".info/connected").on("value", async (snapshot) => {
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
    });
};

export { monitorUserStatus };
