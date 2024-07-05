import AgoraRTC from "agora-rtc-sdk-ng";

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

const fetchToken = async (channelName: string): Promise<string> => {
    const response = await fetch(
        `http://localhost:3000/rtcToken?channelName=${channelName}`
    );
    const data = await response.json();
    return data.token;
};

const createTracks = async () => {
    const [microphoneTrack, cameraTrack] =
        await AgoraRTC.createMicrophoneAndCameraTracks(
            {},
            {
                encoderConfig: "1080p_1", // Use desired video profile, e.g., "1080p_1" for 1080p resolution
            }
        );
    return { microphoneTrack, cameraTrack };
};

export { client, fetchToken, createTracks };
