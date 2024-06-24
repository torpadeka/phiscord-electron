import { firestore } from "./clientApp";

export interface UserData {
    uid: string;
    username: string;
    tag: string;
    status: string | null;
}

// Function to get the current user's data (one-time read)
export async function getCurrentUserData(
    uid: string
): Promise<UserData | null> {
    try {
        const userDoc = await firestore.collection("users").doc(uid).get();
        if (userDoc.exists) {
            return userDoc.data() as UserData;
        } else {
            console.log("No such user!");
            return null;
        }
    } catch (error) {
        console.error("Error getting user data:", error);
        return null;
    }
}

// Function to listen for real-time updates to the current user's data
export function onUserDataChange(
    uid: string,
    callback: (userData: UserData | null) => void
) {
    const userDocRef = firestore.collection("users").doc(uid);
    return userDocRef.onSnapshot(
        (doc) => {
            if (doc.exists) {
                callback(doc.data() as UserData);
            } else {
                callback(null);
            }
        },
        (error) => {
            console.error("Error listening to user data:", error);
            callback(null);
        }
    );
}

// Example function to add a user
export async function addUser(uid: string, username: string, tag: string) {
    try {
        await firestore.collection("users").doc(uid).set({
            uid: uid,
            username: username,
            tag: tag,
            status: null,
        });
        console.log("User added successfully");
    } catch (error) {
        console.error("Error adding user:", error);
    }
}

// Function to add a friend
export async function addFriend(
    userUid: string,
    friendUid: string,
    friendUsername: string,
    friendTag: string
) {
    const friendsRef = firestore
        .collection("users")
        .doc(userUid)
        .collection("friends");
    await friendsRef.doc(friendUid).set({
        friendUid: friendUid,
        username: friendUsername,
        tag: friendTag,
        status: "Offline",
    });
    console.log("Friend added successfully");
}

// Function to get friends
export async function getFriends(userUid: string) {
    const friendsRef = firestore
        .collection("users")
        .doc(userUid)
        .collection("friends");
    const snapshot = await friendsRef.get();
    const friends = snapshot.docs.map((doc) => doc.data());
    return friends;
}
