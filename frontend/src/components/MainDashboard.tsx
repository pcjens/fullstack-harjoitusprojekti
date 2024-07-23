import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export const MainDashboard = () => {
    const { t } = useTranslation();

    const portfolios = [
        {
            slug: "test-1",
            title: "Portfolio",
            subtitle: "Game designer with a specialty in classic RTS games.",
            name: "Jane Doe",
            categories: 3,
            totalWorks: 12,
            versions: 0,
            latestPublish: null,
        },
        {
            slug: "test-2",
            title: "John's Art",
            subtitle: "Traditional artist with a penchant for haunting impressionist landscapes.",
            name: "John Doe",
            categories: 1,
            totalWorks: 50,
            versions: 2,
            latestPublish: 1721722244,
        },
    ];

    return (
        <Container>
            <h2>{t("portfolios")}</h2>
            {portfolios.map((p) => <Row key={p.slug}>
                <Card className="my-2 px-0">
                    <Card.Header>
                        {p.latestPublish
                            ? "Latest version: " + String(p.latestPublish) /* translate to a datetime */
                            : t("no-version-published")}
                    </Card.Header>
                    <Card.Body>
                        <Card.Title>{p.title}</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted">{p.name}</Card.Subtitle>
                        <Card.Text>{p.subtitle}</Card.Text>
                        <Card.Link as={Link} to={`/p/${p.slug}`}>{t("action.open")}</Card.Link>
                        <Card.Link as={Link} to={`/p/${p.slug}/edit`}>{t("action.edit")}</Card.Link>
                    </Card.Body>
                </Card>
            </Row>)}
            {portfolios.length === 0 && <p className="my-3">{t("no-portfolios-found")}</p>}
        </Container>
    );
};
