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

    const logout = () => {
        localStorage.removeItem("sessionId");
        setSessionId("");
        console.log("Logged out.");
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
        throw new Error(`using LoginContext for login("${sessionId}") outside a provider`);
    },
    logout: (): void => {
        throw new Error("using LoginContext for logout outside a provider");
    },
});
