import { useCallback } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useApiFetch } from "../hooks/useApiFetch";
import { PortfolioCard, typecheckPortfolioArray } from "./Portfolio";
import { useTimeout } from "../hooks/useTimeout";

export const MainDashboard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const mapResult = useCallback(typecheckPortfolioArray, []);
    const { result, loading } = useApiFetch("/portfolio", mapResult);
    const { timedOut } = useTimeout(200);

    const portfolios = (result && "value" in result) ? result.value : null;

    return (
        <Container>
            <h2>{t("portfolios")}</h2>
            {(loading || !portfolios)
                ? <>
                    <Stack gap={2}>
                        {timedOut && <PortfolioCard portfolio={"placeholder"} />}
                    </Stack>
                </>
                : <>
                    {portfolios.map((p) => <Row key={p.id}>
                        <Col><PortfolioCard portfolio={p} /></Col>
                    </Row>)}
                    {portfolios.length === 0 && <p className="my-3">
                        {t("no-portfolios-found")}
                    </p>}
                </>}
            <Stack className="my-2">
                <Button className="mx-auto col-sm-6" variant="primary"
                    onClick={() => { navigate("/portfolio/new"); }}>
                    {t("action.create-new-portfolio")}
                </Button>
            </Stack>
        </Container >
    );
};
