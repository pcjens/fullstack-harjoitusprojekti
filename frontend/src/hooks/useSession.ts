import { useCallback, useContext, useEffect, useState } from "react";
import { ApiError, useApiFetch } from "./useApiFetch";
import { LoginContext } from "./useLogin";

export enum LoginStatus {
    Unknown = "Unknown",
    LoggedIn = "Logged in",
    LoggedOut = "Logged out",
}

export const useSession = () => {
    const { sessionId } = useContext(LoginContext);

    const mapMyInfoResult = useCallback((value: unknown) => JSON.stringify(value), []);
    const { result: myInfoResult, loading, refetch, slow } = useApiFetch("/user/me", mapMyInfoResult);
    const [myInfo, setMyInfo] = useState("");
    const [loginStatus, setLoginStatus] = useState(LoginStatus.Unknown);

    useEffect(() => {
        if (sessionId === "") {
            setLoginStatus(LoginStatus.LoggedOut);
        } else if (myInfoResult === null || loading) {
            setLoginStatus(LoginStatus.Unknown);
        } else if ("value" in myInfoResult) {
            setMyInfo(myInfoResult.value);
            setLoginStatus(LoginStatus.LoggedIn);
        } else {
            const { userError } = myInfoResult;
            switch (userError) {
            default:
                setLoginStatus(LoginStatus.Unknown);
                setTimeout(refetch, 1000);
                break;
            case ApiError.MissingSession:
            case ApiError.InvalidSession:
                setLoginStatus(LoginStatus.LoggedOut);
                break;
            }
        }
    }, [myInfoResult, refetch, loading, sessionId]);

    return {
        myInfo,
        loginStatus,
        slow,
    };
};
