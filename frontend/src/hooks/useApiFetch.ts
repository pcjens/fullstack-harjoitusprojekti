import { useCallback, useContext, useEffect, useState } from "react";
import { VITE_API_BASE_URL } from "../util/config";
import { LoginContext } from "./useLogin";

/**
 * All the expected errors from the backend + a few ones internal to useApiFetch.
 */
export enum ApiError {
    NetworkError = "NetworkError",
    UnrecognizedResponse = "UnrecognizedResponse",
    InternalServerError = "InternalServerError",
    UsernameTooShort = "UsernameTooShort",
    PasswordTooShort = "PasswordTooShort",
    PasswordsDontMatch = "PasswordsDontMatch",
    InvalidCredentials = "InvalidCredentials",
    UsernameTaken = "UsernameTaken",
    MissingSession = "MissingSession",
    InvalidSession = "InvalidSession",
}

type ApiResponse<T> = { value: T } | { userError: ApiError };

const apiFetch = async (
    apiPath: string,
    logout: () => void,
    sessionId: string | null,
    reqParams?: RequestInit,
): Promise<ApiResponse<unknown>> => {
    const init = { ...reqParams };
    if (sessionId) {
        init.headers = {
            ...(reqParams?.headers ?? {}),
            Authorization: `Bearer ${sessionId}`,
        };
    }

    let response;
    try {
        const url = `${VITE_API_BASE_URL}${apiPath}`;
        console.debug(apiPath, url, init);
        response = await fetch(url, init);
    } catch (err) {
        return { userError: ApiError.NetworkError };
    }
    const text: string = await response.text();

    let value: unknown = null;
    try {
        value = text.length > 0 ? JSON.parse(text) : null;
    } catch (error) {
        console.error(`failed to parse api response json - the request is probably malformed. request: ${JSON.stringify(apiPath)}, error: ${JSON.stringify(error)}, response: ${text}`);
        return { userError: ApiError.UnrecognizedResponse };
    }

    if (value != null && typeof value === "object" && "error" in value) {
        if (typeof value.error === "string" && response.status >= 400 && response.status < 500) {
            if (value.error === "InvalidSession") {
                console.error("invalid session; logging out");
                logout();
            }
            if (!Object.values(ApiError).includes(value.error as ApiError)) {
                console.error(`successfully parsed response, but got an unrecognized error: ${value.error}`);
                return { userError: ApiError.UnrecognizedResponse };
            }
            return { userError: value.error as ApiError };
        } else {
            console.error("non-user-facing error from the backend:", value.error);
            return { userError: ApiError.InternalServerError };
        }
    }

    return { value };
};

const cache: { latestParams: string, latestTime: number, latestResponse: Promise<ApiResponse<unknown>> | null } = {
    latestParams: "",
    latestTime: performance.now(),
    latestResponse: null,
};
const cachedApiFetch = async (
    apiPath: string,
    logout: () => void,
    sessionId: string | null,
    reqParams?: RequestInit,
): Promise<ApiResponse<unknown>> => {
    const now = performance.now();
    const params = JSON.stringify({ apiPath, sessionId, reqParams });
    if (cache.latestResponse == null || now - cache.latestTime > 500 || cache.latestParams !== params) {
        cache.latestTime = now;
        cache.latestParams = params;
        cache.latestResponse = apiFetch(apiPath, logout, sessionId, reqParams);
    }
    return await cache.latestResponse;
};

/**
 * Makes a request to the backend API, re-fetching when the request would change
 * (e.g. due to the session status updating). Server-side changes are not
 * detected, use the refetch method for that.
 *
 * @param apiPath Use the API path as the URL, this function adds the base url
 * of the api in the beginning. For example, just use "/user/me", not
 * "https://example.com/api/user/me".
 * @param reqParams Method, headers, etc. for the request. Authorization headers
 * and such are added by this hook.
 * @param manualFetch If true, the fetch is only done when refetch is called.
 * Otherwise, it's called always when the parameters change.
 */
export const useApiFetch = <T>(
    apiPath: string,
    mapResult: (value: unknown) => T,
    reqParams?: RequestInit,
    manualFetch = false,
) => {
    const { sessionId, logout } = useContext(LoginContext);
    const [loading, setLoading] = useState(!manualFetch);
    const [result, setResult] = useState<ApiResponse<T> | null>(null);

    const refetch: () => Promise<ApiResponse<T>> = useCallback(async () => {
        setLoading(true);
        const rawResult = await cachedApiFetch(apiPath, logout, sessionId, reqParams);
        let result;
        if ("value" in rawResult) {
            result = { value: mapResult(rawResult.value) };
        } else {
            result = { userError: rawResult.userError };
        }
        setResult(result);
        setLoading(false);
        return result;
    }, [apiPath, logout, sessionId, mapResult, reqParams]);

    useEffect(() => {
        if (!manualFetch) {
            void refetch();
        }
    }, [manualFetch, refetch]);

    return { loading, result, refetch };
};
