import { useState } from "react";

export default () => {
    const [sessionId, setSessionId] = useState(localStorage.getItem("sessionId"));

    const login = (newSessionId: string) => {
        localStorage.setItem("sessionId", newSessionId);
        setSessionId(newSessionId);
    };

    const logout = () => {
        localStorage.clear();
        setSessionId(null);
    };

    return { sessionId, login, logout };
};
