import useSession from "./useSession";

export default () => {
    const { getSessionId, logout } = useSession();

    const apiFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<{ value: unknown } | { userError: string }> => {
        const sessionId = getSessionId();
        if (sessionId) {
            init = {
                ...(init ?? {}),
                headers: {
                    ...(init?.headers ?? {}),
                    Authorization: `Bearer ${sessionId}`,
                },
            };
        }

        let response;
        try {
            console.debug(input, init);
            response = await fetch(input, init);
        } catch (err) {
            return { userError: "NetworkError" }; // TODO: add to some enum which is handled wherever the errors are localized
        }
        const text: string = await response.text();

        let value: unknown = null;
        try {
            value = text.length > 0 ? JSON.parse(text) : null;
        } catch (error) {
            console.error(`failed to parse api response json - the request is probably malformed. request: ${JSON.stringify(input)}, error: ${JSON.stringify(error)}`);
            return { userError: "InternalServerError" };
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
    return apiFetch;
};
