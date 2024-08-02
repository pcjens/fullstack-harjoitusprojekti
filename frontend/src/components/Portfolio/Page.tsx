import { useCallback, useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import Spinner from "react-bootstrap/Spinner";

import { useApiFetch } from "../../hooks/useApiFetch";
import { Portfolio, typecheckPortfolio } from ".";
import { useTranslation } from "react-i18next";
import { PortfolioStaticPage } from "./StaticPage";

export const PortfolioPage = (props: { slug: string }) => {
    const { t } = useTranslation();

    const mapGetResult = useCallback(typecheckPortfolio, []);
    const {
        result: slugFindResult,
        loading,
    } = useApiFetch(`/portfolio/${props.slug}`, mapGetResult);
    const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (slugFindResult != null) {
            if ("value" in slugFindResult) {
                setPortfolio(slugFindResult.value);
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

    if (error || portfolio == null) {
        return (
            <Container>
                {t(`error.${error || "NotFound"}`)}
            </Container>
        );
    }

    return (
        <PortfolioStaticPage portfolio={portfolio} />
    );
};
