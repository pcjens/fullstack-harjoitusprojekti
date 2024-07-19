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
        value = text.length > 0 ? JSON.parse(text) : null;
    } catch (error) {
        console.error(`failed to parse api response json - the request is probably malformed. request: ${JSON.stringify(input)}, error: ${JSON.stringify(error)}`);
        return { userError: "InternalServerError" };
    }

    if (value != null && typeof value === "object" && "error" in value) {
        if (typeof value.error === "string" && response.status >= 400 && response.status < 500) {
            return { userError: value.error };
        } else {
            console.error("non-user-facing error from the backend:", value.error);
            return { userError: "InternalServerError" };
        }
    }

    return { value };
}
