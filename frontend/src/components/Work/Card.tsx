import Card from "react-bootstrap/Card";
import Placeholder from "react-bootstrap/Placeholder";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { WorkSummary } from ".";

export interface Props {
    work: "placeholder" | WorkSummary,
}

export const WorkCard = ({ work: w }: Props) => {
    const { t } = useTranslation();

    if (w === "placeholder") {
        return (
            <Placeholder as={Card} className="my-2 px-0" animation="wave">
                <Card.Body>
                    <Card.Title><Placeholder xs={4} /></Card.Title>
                    <Card.Text><Placeholder xs={8} /></Card.Text>
                    <Card.Link><Placeholder xs={1} /></Card.Link>
                </Card.Body>
            </Placeholder>
        );
    }

    return (
        <Card className="my-2 px-0">
            <Card.Body>
                <Card.Title>{w.title}</Card.Title>
                <Card.Text>{w.short_description}</Card.Text>
            </Card.Body>
            <Card.Footer>
                <Card.Link as={Link} to={`/works/${w.slug}/edit`}>{t("action.edit")}</Card.Link>
            </Card.Footer>
        </Card>
    );
};
