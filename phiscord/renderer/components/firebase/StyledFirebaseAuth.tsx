import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import "firebaseui/dist/firebaseui.css";

interface Props {
    // The Firebase UI Web UI Config object.
    // See: https://github.com/firebase/firebaseui-web#configuration
    uiConfig: firebaseui.auth.Config;
    // Callback that will be passed the FirebaseUi instance before it is
    // started. This allows access to certain configuration options such as
    // disableAutoSignIn().
    uiCallback?(ui: firebaseui.auth.AuthUI): void;
    // The Firebase App auth instance to use.
    firebaseAuth: any; // As firebaseui-web
    className?: string;
}

const StyledFirebaseAuth = ({   
    uiConfig,
    firebaseAuth,
    className,
    uiCallback,
}: Props) => {
    const [userSignedIn, setUserSignedIn] = useState(false);
    const [firebaseUiWidget, setFirebaseUiWidget] = useState<any>(null);
    const elementRef = useRef(null);

    useEffect(() => {
        let firebaseUiInstance: any;

        const loadFirebaseUI = async () => {
            const firebaseui = await import('firebaseui');
            firebaseUiInstance =
                firebaseui.auth.AuthUI.getInstance() ||
                new firebaseui.auth.AuthUI(firebaseAuth);

            if (uiConfig.signInFlow === "popup") firebaseUiInstance.reset();

            const unregisterAuthObserver = onAuthStateChanged(
                firebaseAuth,
                (user) => {
                    if (!user && firebaseUiWidget) firebaseUiWidget.reset();
                    setUserSignedIn(!!user);
                }
            );

            if (uiCallback) uiCallback(firebaseUiInstance);

            firebaseUiInstance.start(elementRef.current, uiConfig);

            setFirebaseUiWidget(firebaseUiInstance);

            return () => {
                unregisterAuthObserver();
                firebaseUiInstance.reset();
            };
        };

        if (typeof window !== "undefined") {
            loadFirebaseUI();
        }
    }, [uiConfig]);

    return <div className={className} ref={elementRef} />;
};

export default StyledFirebaseAuth;
