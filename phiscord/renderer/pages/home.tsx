import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import firebase, { firestore } from "../../firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
import type { Auth } from "firebase/auth";

import SideBar from "@/components/phiscord/SideBar";
import { withAuth } from "@/hoc/withAuth";
import TopBar from "@/components/phiscord/TopBar";
import UserProfileBox from "@/components/phiscord/UserProfileBox";
import ServerDashboard from "@/components/phiscord/ServerDashboard";
import Dashboard from "@/components/phiscord/Dashboard";

const HomePage = () => {

    const appId = "97053747cb414a02bb27de8e55549466";
    const auth = firebase.auth() as unknown as Auth;
    const [firebaseUser] = useAuthState(auth);
    const [activePage, setActivePage] = useState(["dashboard", null]);
    const [dashboardContent, setDashboardContent] = useState(["welcome", null]);

    const [channelName, setChannelName] = useState(null);
    const [inCall, setInCall] = useState(false);
    const [users, setUsers] = useState([]);
    const [localTracks, setLocalTracks] = useState({
        microphoneTrack: null,
        cameraTrack: null,
    });
    const [start, setStart] = useState(false);

    useEffect(() => {
        const unsubscribe = firestore
            .collection("users")
            .doc(firebaseUser.uid)
            .collection("notifications")
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        const notificationData = change.doc.data();
                        showNotification(notificationData);
                        firestore
                        .collection("users")
                        .doc(firebaseUser.uid)
                        .collection("notifications")
                        .doc(change.doc.id).delete();
                    }
                });
            });
    
        return () => unsubscribe();
    }, [firebaseUser]);

    const showNotification = (data) => {
        const notification = {
            title: data.title,
            body: data.body,
            icon: data.icon,
            silent: false,
        };
        new Notification(notification.title, notification);
    };

    const leaveCall = async () => {
        if (typeof window !== "undefined") {
            const { client } = await import("../agora/agoraConfig");
            await client.leave();
            localTracks.microphoneTrack?.close();
            localTracks.cameraTrack?.close();
            setLocalTracks({ microphoneTrack: null, cameraTrack: null });
            setUsers([]);
            setStart(false);
            setInCall(false);
        }
    };

    const muteAudio = () => {
        if (localTracks.microphoneTrack) {
            localTracks.microphoneTrack.setMuted(true);
        }
    };

    const unmuteAudio = () => {
        if (localTracks.microphoneTrack) {
            localTracks.microphoneTrack.setMuted(false);
        }
    };

    const muteVideo = () => {
        if (localTracks.cameraTrack) {
            localTracks.cameraTrack.setMuted(true);
        }
    };

    const unmuteVideo = () => {
        if (localTracks.cameraTrack) {
            localTracks.cameraTrack.setMuted(false);
        }
    };

    const deafenAudio = (users) => {
        users.forEach((user) => {
            if (user.audioTrack) {
                user.audioTrack.setEnabled(false); // Mute the remote audio track
            }
        });
    };

    // Function to Unmute Remote Audio Tracks
    const undeafenAudio = (users) => {
        users.forEach((user) => {
            if (user.audioTrack) {
                user.audioTrack.setEnabled(true); // Unmute the remote audio track
            }
        });
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            const initAgora = async () => {
                const { client, fetchToken, createTracks } = await import(
                    "../agora/agoraConfig"
                );

                const handleUserPublished = async (user, mediaType) => {
                    await client.subscribe(user, mediaType);
                    if (mediaType === "video") {
                        setUsers((prevUsers) => [
                            ...prevUsers,
                            {
                                ...user,
                                firebaseUid: firebaseUser.uid, // Add Firebase UID here
                                videoTrack: user.videoTrack, // Ensure videoTrack is stored
                            },
                        ]);
                    }
                    if (mediaType === "audio") {
                        user.audioTrack.play();
                    }
                };

                const handleUserUnpublished = (user, mediaType) => {
                    if (mediaType === "audio") {
                        if (user.audioTrack) user.audioTrack.stop();
                    }
                    if (mediaType === "video") {
                        setUsers((prevUsers) =>
                            prevUsers.filter((User) => User.uid !== user.uid)
                        );
                    }
                };

                const handleUserLeft = (user) => {
                    setUsers((prevUsers) =>
                        prevUsers.filter((User) => User.uid !== user.uid)
                    );
                };

                const init = async (name) => {
                    client.on("user-published", handleUserPublished);
                    client.on("user-unpublished", handleUserUnpublished);
                    client.on("user-left", handleUserLeft);

                    const token = await fetchToken(name); // Fetch the token dynamically

                    await client.join(appId, name, token, null);
                    const tracks = await createTracks();
                    setLocalTracks(tracks);

                    if (tracks.microphoneTrack && tracks.cameraTrack) {
                        await client.publish([
                            tracks.microphoneTrack,
                            tracks.cameraTrack,
                        ]);
                        setStart(true);
                    }
                };

                if (inCall) {
                    init(channelName);
                }

                return () => {
                    leaveCall();
                };
            };

            initAgora();
        }
    }, [inCall, channelName]);

    return (
        <div className="fade-in">
            <TopBar />
            <SideBar activePage={activePage} setActivePage={setActivePage} />
            <div className="content">
                {activePage[0] === "dashboard" && (
                    <Dashboard
                        inCall={inCall}
                        setInCall={setInCall}
                        channelName={channelName}
                        setChannelName={setChannelName}
                        users={users}
                        localTracks={localTracks}
                        leaveCall={leaveCall}
                        muteAudio={muteAudio}
                        unmuteAudio={unmuteAudio}
                        muteVideo={muteVideo}
                        unmuteVideo={unmuteVideo}
                        deafenAudio={deafenAudio}
                        undeafenAudio={undeafenAudio}
                        setActivePage={setActivePage}
                        setContent={setDashboardContent}
                        content={dashboardContent}
                    />
                )}
                {activePage[0] === "server" && (
                    <ServerDashboard
                        setActivePage={setActivePage}
                        serverId={activePage[1]}
                        setDashboardContent={setDashboardContent}
                        dashboardContent={dashboardContent}
                    />
                )}
                <UserProfileBox />
            </div>
        </div>
    );
};

export default withAuth(HomePage);
