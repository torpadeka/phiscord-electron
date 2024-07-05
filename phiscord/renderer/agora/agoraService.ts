// import AgoraRTC, {
//     IAgoraRTCClient,
//     ICameraVideoTrack,
//     ILocalAudioTrack,
//     ILocalVideoTrack,
//     IMicrophoneAudioTrack,
// } from "agora-rtc-sdk-ng";

// const APP_ID = "97053747cb414a02bb27de8e55549466";

// AgoraRTC.setLogLevel(0);

// const agoraClient: IAgoraRTCClient = AgoraRTC.createClient({
//     mode: "rtc",
//     codec: "vp8",
// });

// const fetchToken = async (channelName: string): Promise<string> => {
//     console.log("Fetching token for channel:", channelName);
//     const response = await fetch(
//         `http://localhost:3000/rtcToken?channelName=${channelName}`
//     );
//     const data = await response.json();
//     console.log("Token fetched:", data.token);
//     return data.token;
// };

// const joinCall = async (
//     channelName: string
// ): Promise<{
//     localAudioTrack: IMicrophoneAudioTrack;
//     localVideoTrack: ICameraVideoTrack;
// }> => {
//     const token = await fetchToken(channelName);
//     const [localAudioTrack, localVideoTrack] =
//         await AgoraRTC.createMicrophoneAndCameraTracks();
//     console.log("Local tracks created:", localAudioTrack, localVideoTrack);
//     await agoraClient.join(APP_ID, channelName, token, null);
//     console.log("Joined channel:", channelName);
//     await agoraClient.publish([localAudioTrack, localVideoTrack]);
//     console.log("Published local tracks");
//     return { localAudioTrack, localVideoTrack };
// };

// const leaveCall = async () => {
//     await agoraClient.leave();
//     console.log("Left the channel");
// };

// export { joinCall, leaveCall, agoraClient };
