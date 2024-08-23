import { useCallback } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useApiFetch } from "../../hooks/useApiFetch";
import { useTimeout } from "../../hooks/useTimeout";
import { typecheckWorkSummaryArray } from ".";
import { WorkCard } from ".";

export const WorkListing = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const mapResult = useCallback(typecheckWorkSummaryArray, []);
    const { result, loading } = useApiFetch("/work", mapResult);
    const { timedOut } = useTimeout(200);

    const portfolios = (result && "value" in result) ? result.value : null;

    return (
        <Container>
            <h2>{t("works")}</h2>
            {(loading || !portfolios)
                ? <>
                    <Stack gap={2}>
                        {timedOut && <WorkCard work={"placeholder"} />}
                    </Stack>
                </>
                : <>
                    {portfolios.map((w) => <Row key={w.id}>
                        <Col><WorkCard work={w} /></Col>
                    </Row>)}
                    {portfolios.length === 0 && <p className="my-3">
                        {t("no-works-found")}
                    </p>}
                </>}
            {(!loading || timedOut) && <Stack className="my-2">
                <Button className="mx-auto col-sm-6" variant="primary"
                    onClick={() => { navigate("/works/new"); }}>
                    {t("action.create-new-work")}
                </Button>
            </Stack>}
        </Container>
    );
};
