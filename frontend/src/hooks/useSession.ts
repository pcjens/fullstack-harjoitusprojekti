import { useCallback, useEffect, useState } from "react";
import { ApiError, useApiFetch } from "./useApiFetch";

export enum LoginStatus {
    Unknown,
    LoggedIn,
    LoggedOut,
}

export const useSession = () => {
    const mapMyInfoResult = useCallback((value: unknown) => JSON.stringify(value), []);
    const { result: myInfoResult, refetch } = useApiFetch("/user/me", mapMyInfoResult);
    const [myInfo, setMyInfo] = useState("");
    const [loginStatus, setLoginStatus] = useState(LoginStatus.Unknown);

    useEffect(() => {
        if (myInfoResult === null) {
            setLoginStatus(LoginStatus.Unknown);
            setTimeout(refetch, 1000);
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
    }, [myInfoResult, refetch]);

    return {
        myInfo,
        loginStatus,
    };
};
