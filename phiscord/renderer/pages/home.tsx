import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import firebase from "../../firebase/clientApp";
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

    const [channelName, setChannelName] = useState(null);
    const [inCall, setInCall] = useState(false);
    const [users, setUsers] = useState([]);
    const [localTracks, setLocalTracks] = useState({
        microphoneTrack: null,
        cameraTrack: null,
    });
    const [start, setStart] = useState(false);

    // Function for components to initiate leaving the current call
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

    useEffect(() => {
        if (typeof window !== "undefined") {
            const initAgora = async () => {
                const { client, fetchToken, createTracks } = await import(
                    "../agora/agoraConfig"
                );

                const leaveCall = async () => {
                    await client.leave();
                    localTracks.microphoneTrack?.close();
                    localTracks.cameraTrack?.close();
                    setLocalTracks({
                        microphoneTrack: null,
                        cameraTrack: null,
                    });
                    setUsers([]);
                    setStart(false);
                    setInCall(false);
                };

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
            <SideBar setActivePage={setActivePage} />
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
                    />
                )}
                {activePage[0] === "server" && (
                    <ServerDashboard serverId={activePage[1]} />
                )}
                <UserProfileBox />
            </div>
        </div>
    );
};

export default withAuth(HomePage);
