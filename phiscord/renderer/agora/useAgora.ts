// import { useState, useEffect } from "react";
// import { joinCall, leaveCall, agoraClient } from "./agoraService";
// import {
//     IAgoraRTCRemoteUser,
//     IRemoteVideoTrack,
//     IRemoteAudioTrack,
//     IMicrophoneAudioTrack,
//     ICameraVideoTrack,
// } from "agora-rtc-sdk-ng";

// interface RemoteTracks {
//     [uid: string]: {
//         video: IRemoteVideoTrack | null;
//         audio: IRemoteAudioTrack | null;
//     };
// }

// const useAgora = () => {
//     const [isInCall, setIsInCall] = useState(false);
//     const [localAudioTrack, setLocalAudioTrack] =
//         useState<IMicrophoneAudioTrack | null>(null);
//     const [localVideoTrack, setLocalVideoTrack] =
//         useState<ICameraVideoTrack | null>(null);
//     const [remoteTracks, setRemoteTracks] = useState<RemoteTracks>({});

//     useEffect(() => {
//         const handleUserPublished = async (
//             user: IAgoraRTCRemoteUser,
//             mediaType: "audio" | "video"
//         ) => {
//             console.log("User published:", user, mediaType);
//             await agoraClient.subscribe(user, mediaType);
//             setRemoteTracks((prevTracks) => ({
//                 ...prevTracks,
//                 [user.uid]: {
//                     video:
//                         mediaType === "video"
//                             ? user.videoTrack
//                             : prevTracks[user.uid]?.video || null,
//                     audio:
//                         mediaType === "audio"
//                             ? user.audioTrack
//                             : prevTracks[user.uid]?.audio || null,
//                 },
//             }));
//         };

//         const handleUserUnpublished = (user: IAgoraRTCRemoteUser) => {
//             console.log("User unpublished:", user);
//             setRemoteTracks((prevTracks) => {
//                 const { [user.uid]: _, ...rest } = prevTracks;
//                 return rest;
//             });
//         };

//         agoraClient.on("user-published", handleUserPublished);
//         agoraClient.on("user-unpublished", handleUserUnpublished);

//         return () => {
//             agoraClient.off("user-published", handleUserPublished);
//             agoraClient.off("user-unpublished", handleUserUnpublished);
//         };
//     }, []);

//     const handleJoinCall = async (channelName: string) => {
//         console.log("Joining call...");
//         try {
//             const { localAudioTrack, localVideoTrack } = await joinCall(
//                 channelName
//             );
//             console.log(
//                 "Joined call with tracks:",
//                 localAudioTrack,
//                 localVideoTrack
//             );
//             setLocalAudioTrack(localAudioTrack);
//             setLocalVideoTrack(localVideoTrack);
//             setIsInCall(true);
//             console.log("ISINCALL STATE:", isInCall);
//         } catch (error) {
//             console.error("Error joining call:", error);
//         }
//     };

//     const handleLeaveCall = async () => {
//         console.log("Leaving call...");
//         try {
//             await leaveCall();
//             setIsInCall(false);
//             setLocalAudioTrack(null);
//             setLocalVideoTrack(null);
//             setRemoteTracks({});
//         } catch (error) {
//             console.error("Error leaving call:", error);
//         }
//     };

//     return {
//         isInCall,
//         localAudioTrack,
//         localVideoTrack,
//         remoteTracks,
//         handleJoinCall,
//         handleLeaveCall,
//     };
// };

// export default useAgora;
