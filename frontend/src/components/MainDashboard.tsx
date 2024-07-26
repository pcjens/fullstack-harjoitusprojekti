import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useApiFetch } from "../hooks/useApiFetch";
import { useCallback } from "react";
import { createArrayTypecheckerFromExample, OptionalField } from "../util/helpers";

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

    const portfolios = (result && "value" in result) ? result.value : null;

    return (
        <Container>
            <h2>{t("portfolios")}</h2>
            {(loading || !portfolios)
                ? <></>
                : <>
                    {portfolios.map((p) => <Row key={p.id}>
                        <Card className="my-2 px-0">
                            <Card.Header>
                                {p.published_at
                                    ? t("latest-publish", {
                                        published: new Date(p.published_at * 1000),
                                        formatParams: {
                                            published: {
                                                year: "numeric",
                                                month: "numeric",
                                                day: "numeric",
                                                hour: "numeric",
                                                minute: "numeric",
                                            },
                                        },
                                    })
                                    : t("no-version-published")}
                            </Card.Header>
                            <Card.Body>
                                <Card.Title>{p.title}</Card.Title>
                                <Card.Subtitle className="mb-2 text-muted">{p.author}</Card.Subtitle>
                                <Card.Text>{p.subtitle}</Card.Text>
                                <Card.Link as={Link} to={`/p/${p.slug}`}>{t("action.open")}</Card.Link>
                                <Card.Link as={Link} to={`/p/${p.slug}/edit`}>{t("action.edit")}</Card.Link>
                            </Card.Body>
                        </Card>
                    </Row>)}
                    {portfolios.length === 0 && <p className="my-3">{t("no-portfolios-found")}</p>}
                </>}
        </Container>
    );
};
