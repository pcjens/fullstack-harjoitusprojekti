import { useCallback } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import { useTranslation } from "react-i18next";

import { useApiFetch } from "../hooks/useApiFetch";
import { createArrayTypecheckerFromExample, OptionalField } from "../util/helpers";
import { PortfolioCard } from "./Portfolio";
import { useTimeout } from "../hooks/useTimeout";

const typecheckPortfolios = createArrayTypecheckerFromExample({
    id: 0,
    created_at: 0,
    published_at: new OptionalField(0),
    slug: "",
    title: "",
    subtitle: "",
    author: "",
}, "portfolios");

export const MainDashboard = () => {
    const { t } = useTranslation();
    const mapResult = useCallback(typecheckPortfolios, []);
    const { result, loading } = useApiFetch("/portfolio", mapResult);
    const { timedOut } = useTimeout(200);

    const portfolios = (result && "value" in result) ? result.value : null;

    return (
        <Container>
            <h2>{t("portfolios")}</h2>
            {(loading || !portfolios)
                ? <>
                    <Row>
                        {timedOut && <PortfolioCard portfolio={"placeholder"} />}
                    </Row>
                </>
                : <>
                    {portfolios.map((p) => <Row key={p.id}>
                        <PortfolioCard portfolio={p} />
                    </Row>)}
                    {portfolios.length === 0 && <p className="my-3">
                        {t("no-portfolios-found")}
                    </p>}
                </>}
        </Container>
    );
};
