export default () => {
    const login = (newSessionId: string) => {
        localStorage.setItem("sessionId", newSessionId);
        console.log("Logged in.");
    };

    const logout = () => {
        localStorage.clear();
        console.log("Logged out.");
    };

    const getSessionId = () => {
        return localStorage.getItem("sessionId");
    };

    return { getSessionId, login, logout };
};
