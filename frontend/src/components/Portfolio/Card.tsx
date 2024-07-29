import Card from "react-bootstrap/Card";
import Placeholder from "react-bootstrap/Placeholder";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Portfolio } from ".";

export interface Props {
    portfolio: "placeholder" | Portfolio,
}

export const PortfolioCard = ({ portfolio: p }: Props) => {
    const { t } = useTranslation();

    if (p === "placeholder") {
        return (
            <Placeholder as={Card} className="my-2 px-0" animation="wave">
                <Card.Header>
                    <Placeholder xs={6} />
                </Card.Header>
                <Card.Body>
                    <Card.Title><Placeholder xs={4} /></Card.Title>
                    <Card.Subtitle className="mb-2 text-muted"><Placeholder xs={2} /></Card.Subtitle>
                    <Card.Text><Placeholder xs={8} /></Card.Text>
                    <Card.Link><Placeholder xs={1} /></Card.Link>
                    <Card.Link><Placeholder xs={1} /></Card.Link>
                </Card.Body>
            </Placeholder>
        );
    }

    return (
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
    );
};
