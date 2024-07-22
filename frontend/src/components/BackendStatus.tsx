import { useApiFetch } from "../hooks/useApiFetch";
import { useCallback } from "react";

export const BackendStatus = () => {
    const parseBackendStatus = useCallback((value: unknown) => {
        return typeof value === "string" ? value : JSON.stringify(value);
    }, []);
    const { result: backendStatus } = useApiFetch("/health", parseBackendStatus);

    const backendStatusText = backendStatus && "value" in backendStatus
        ? backendStatus.value
        : backendStatus?.userError;

    return (<>{backendStatusText}</>);
};
