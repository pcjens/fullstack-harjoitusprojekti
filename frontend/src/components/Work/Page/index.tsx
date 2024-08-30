import { useCallback, useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import Spinner from "react-bootstrap/Spinner";

import { useApiFetch } from "../../../hooks/useApiFetch";
import { Work, typecheckWork } from "..";
import { useTranslation } from "react-i18next";
import { WorkStaticPage } from "./StaticPage";

export const WorkPage = ({ portfolioSlug, workSlug }: { portfolioSlug: string, workSlug: string }) => {
    const { t } = useTranslation();

    const mapGetResult = useCallback(typecheckWork, []);
    const {
        result: slugFindResult,
        loading,
    } = useApiFetch(`/work/${workSlug}`, mapGetResult);
    const [work, setWork] = useState<Work | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (slugFindResult != null) {
            if ("value" in slugFindResult) {
                setWork(slugFindResult.value);
                setError("");
            } else {
                setError(slugFindResult.userError);
            }
        }
    }, [slugFindResult]);

    if (loading) {
        return (
            <Container className="d-flex vh-100 justify-content-center align-items-center">
                <Spinner title="Loading..."></Spinner>
            </Container>
        );
    }

    if (error || work == null) {
        return (
            <Container>
                {t(`error.${error || "NotFound"}`)}
            </Container>
        );
    }

    return (
        <WorkStaticPage portfolioSlug={portfolioSlug} work={work} />
    );
};
