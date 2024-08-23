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
    NotFound = "NotFound",
    UsernameTooShort = "UsernameTooShort",
    PasswordTooShort = "PasswordTooShort",
    PasswordsDontMatch = "PasswordsDontMatch",
    InvalidCredentials = "InvalidCredentials",
    UsernameTaken = "UsernameTaken",
    MissingSession = "MissingSession",
    InvalidSession = "InvalidSession",
    NoSuchSlug = "NoSuchSlug",
    SlugTaken = "SlugTaken",
    OwnedDocumentNotFound = "OwnedDocumentNotFound",
}

type ApiResponse<T> = { value: T } | { userError: ApiError };

const apiFetch = async (
    apiPath: string,
    logout: (fromSessionId: string | null) => void,
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
        if (import.meta.env.DEV) {
            console.debug("request from useApiFetch:", apiPath, url, init);
        }
        response = await fetch(url, init);
    } catch (err) {
        return { userError: ApiError.NetworkError };
    }
    const text: string = await response.text();

    // For debugging loading effects
    if (import.meta.env.DEV) {
        await new Promise((r) => setTimeout(r, 0));
    }

    let value: unknown = null;
    try {
        value = text.length > 0 ? JSON.parse(text) : null;
    } catch (error) {
        if (response.status === 404) {
            return { userError: ApiError.NotFound };
        }
        console.error(`failed to parse api response json - the request is probably malformed. request: ${JSON.stringify(apiPath)}, error: ${JSON.stringify(error)}, response: ${text}`);
        return { userError: ApiError.UnrecognizedResponse };
    }

    if (value != null && typeof value === "object" && "error" in value) {
        if (typeof value.error === "string" && response.status >= 400 && response.status < 500) {
            if (value.error === "InvalidSession") {
                console.error("invalid session; logging out");
                logout(sessionId);
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

interface CacheSlot {
    latestParams: string,
    latestTime: number,
    latestResponse: Promise<ApiResponse<unknown>> | null,
}
const cacheSlots: Record<string, CacheSlot> = {};
const cachedApiFetch = async (
    apiPath: string,
    logout: (fromSessionId: string | null) => void,
    sessionId: string | null,
    reqParams?: RequestInit,
): Promise<ApiResponse<unknown>> => {
    const now = performance.now();
    const params = JSON.stringify({ apiPath, sessionId, reqParams });

    if (!(apiPath in cacheSlots)) {
        cacheSlots[apiPath] = { latestResponse: null, latestTime: 0, latestParams: "" };
    }
    const cache = cacheSlots[apiPath];

    if (cache.latestResponse == null
        || now - cache.latestTime > (import.meta.env.VITE_API_CACHE_IDENTICAL_REQUESTS_FOR_MILLIS ?? 500)
        || cache.latestParams !== params) {
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
    const [slow, setSlow] = useState(false);
    const [result, setResult] = useState<ApiResponse<T> | null>(null);

    const refetch: () => Promise<ApiResponse<T>> = useCallback(async () => {
        setSlow(false);
        setLoading(true);

        const slowTimeoutHandle = setTimeout(() => {
            setSlow(true);
        }, import.meta.env.VITE_API_SLOW_RESPONSE_THRESHOLD_MILLIS ?? 5000);

        const rawResult = await cachedApiFetch(apiPath, logout, sessionId, reqParams);

        clearTimeout(slowTimeoutHandle);

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

    return { loading, slow, result, refetch };
};
