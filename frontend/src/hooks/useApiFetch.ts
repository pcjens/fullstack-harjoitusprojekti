import { useCallback, useContext, useEffect, useState } from "react";
import { VITE_API_BASE_URL } from "../util/config";
import { LoginContext } from "./useLogin";

const apiFetch = async (
    apiPath: string,
    logout: () => void,
    sessionId: string | null,
    reqParams?: RequestInit,
): Promise<{ value: unknown } | { userError: string }> => {
    // TODO: Add response caching, react state changes call this pretty eagerly

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
        return { userError: "NetworkError" }; // TODO: add to some enum which is handled wherever the errors are localized
    }
    const text: string = await response.text();

    let value: unknown = null;
    try {
        value = text.length > 0 ? JSON.parse(text) : null;
    } catch (error) {
        console.error(`failed to parse api response json - the request is probably malformed. request: ${JSON.stringify(apiPath)}, error: ${JSON.stringify(error)}, response: ${text}`);
        return { userError: "UnrecognizedResponse" };
    }

    if (value != null && typeof value === "object" && "error" in value) {
        if (typeof value.error === "string" && response.status >= 400 && response.status < 500) {
            if (value.error === "InvalidSession") {
                console.error("invalid session; logging out");
                logout();
            }
            return { userError: value.error };
        } else {
            console.error("non-user-facing error from the backend:", value.error);
            return { userError: "InternalServerError" };
        }
    }

    return { value };
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
    const [result, setResult] = useState<{ value: T } | { userError: string } | null>(null);

    const refetch: () => Promise<{ value: T } | { userError: string }> = useCallback(async () => {
        setLoading(true);
        const rawResult = await apiFetch(apiPath, logout, sessionId, reqParams);
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
