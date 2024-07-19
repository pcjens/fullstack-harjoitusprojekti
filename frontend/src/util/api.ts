export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<{ value: unknown } | { userError: string }> {
    let response;
    try {
        response = await fetch(input, init);
    } catch (err) {
        return { userError: "NetworkError" }; // TODO: add to some enum which is handled wherever the errors are localized
    }
    const text: string = await response.text();

    let value: unknown = null;
    try {
        value = JSON.parse(text);
    } catch (error) {
        throw new Error(`failed to parse api response json - the request is probably malformed. request: ${JSON.stringify(input)}, error: ${JSON.stringify(error)}`);
    }

    if (value != null && typeof value === "object" && "error" in value) {
        if (typeof value.error === "string" && response.status >= 400 && response.status < 500) {
            return { userError: value.error };
        } else {
            throw new Error(`non-user-facing error from the backend: ${JSON.stringify(value.error, undefined, 2)}`);
        }
    }

    return { value: value };
}
