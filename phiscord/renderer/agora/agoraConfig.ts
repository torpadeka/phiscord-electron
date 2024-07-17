import AgoraRTC from "agora-rtc-sdk-ng";

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

const fetchToken = async (channelName: string): Promise<string> => {
    const response = await fetch(
        `http://localhost:3000/rtcToken?channelName=${channelName}`
    );
    const data = await response.json();
    return data.token;
};

const listVideoDevices = async () => {
    const devices = await AgoraRTC.getCameras();
    devices.forEach((device) => {
        console.log(`Device ID: ${device.deviceId}, Label: ${device.label}`);
    });
    return devices;
};

const createTracks = async () => {

    try {
        const devices = await listVideoDevices();
        const cameraId = devices[0].deviceId; // Select the first device or a specific one if needed
        const cameraTrack = await AgoraRTC.createCameraVideoTrack({ cameraId });
        const microphoneTrack = await AgoraRTC.createMicrophoneAudioTrack();
        console.log("Camera track created successfully");
        cameraTrack.setMuted(true);
        return { microphoneTrack, cameraTrack };
    } catch (error) {
        console.error(
            "Error creating camera track: ",
            error.name,
            error.message
        );
        throw error;
    }
};

export { client, fetchToken, createTracks };