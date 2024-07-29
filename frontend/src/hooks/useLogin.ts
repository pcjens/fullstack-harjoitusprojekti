import { createContext, useState } from "react";

/**
 * The top level login hook, used when you want to set up a different
 * LoginContext. General components should just use `useContext(LoginContext)`.
 */
export const useLogin = () => {
    const [sessionId, setSessionId] = useState(localStorage.getItem("sessionId") ?? "");

    const login = (newSessionId: string) => {
        localStorage.setItem("sessionId", newSessionId);
        setSessionId(newSessionId);
        console.log("Logged in.");
    };

    const logout = (fromSessionId: string | null) => {
        // This sequence of "get, compare, remove" should not introduce a race
        // condition since there's no awaits in between, and we're not
        // multithreading with web workers (afaik).
        const current = localStorage.getItem("sessionId");
        if (fromSessionId == null || current === fromSessionId) {
            localStorage.removeItem("sessionId");
            setSessionId("");
            console.log("Logged out.");
        } else {
            console.log("Already logged out from this session, not doing anything.");
        }
    };

    return {
        contextObject: {
            sessionId,
            login,
            logout,
        },
    };
};

export const LoginContext = createContext({
    sessionId: "",
    login: (sessionId: string): void => {
        throw new Error(`using LoginContext for login(${sessionId}) outside a provider`);
    },
    logout: (fromSessionId: string | null): void => {
        throw new Error(`using LoginContext for logout(${fromSessionId ?? "null"}) outside a provider`);
    },
});
