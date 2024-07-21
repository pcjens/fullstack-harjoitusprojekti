import { useEffect, useState } from "react";

export const useTimeout = (timeoutMillis: number) => {
    const [timedOut, setTimedOut] = useState(false);
    useEffect(() => {
        setTimeout(() => { setTimedOut(true); }, timeoutMillis);
    });
    return { timedOut };
};
