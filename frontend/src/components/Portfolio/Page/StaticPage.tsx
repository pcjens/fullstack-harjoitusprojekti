import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Placeholder from "react-bootstrap/Placeholder";
import Badge from "react-bootstrap/Badge";

import { Portfolio } from "..";
import { useApiFetch } from "../../../hooks/useApiFetch";
import { useCallback } from "react";
import { typecheckWork } from "../../Work";

import "./StaticPage.css";
import { getAttachmentUrl } from "../../../util/attachments";

const Work = ({ portfolioSlug, workSlug }: { portfolioSlug: string, workSlug: string }) => {
    const mapResult = useCallback(typecheckWork, []);
    const { result: workResult, loading } = useApiFetch(`/work/${workSlug}`, mapResult);

    if (loading || workResult == null || "userError" in workResult) {
        return (
            <Card>
                <Card.Img variant="top" height={180} />
                <Card.Body>
                    <Card.Title>
                        <a href={`/p/${portfolioSlug}/${workSlug}`}>
                            <Placeholder xs={4} />
                        </a>
                    </Card.Title>
                    <Card.Text>
                        <Placeholder xs={10} />
                        <Placeholder xs={7} />
                    </Card.Text>
                </Card.Body>
            </Card>
        );
    }

    const work = workResult.value;

    const coverImageAttachment = work.attachments.find(({ attachment_kind }) => attachment_kind == "CoverImage");
    const coverImageUrl = coverImageAttachment != null ? getAttachmentUrl(coverImageAttachment) : null;

    return (
        <Card as="a" href={`/p/${portfolioSlug}/${workSlug}`}
            className="hoverable-card" style={{ textDecoration: "none" }}>
            {coverImageUrl != null && <Card.Img variant="top" src={coverImageUrl} />}
            <Card.Body>
                <Card.Title>
                    {work.title}
                </Card.Title>
                <Card.Text className="mb-2">
                    {work.short_description}
                </Card.Text>
                {work.tags.map((tag) => <Badge key={tag.id} className="me-1">{tag.tag}</Badge>)}
            </Card.Body>
        </Card>
    );
};

export const PortfolioStaticPage = ({ portfolio }: { portfolio: Portfolio }) => {
    return (
        <Container className="p-3">
            <Stack>
                <div>
                    <h1>{portfolio.title}</h1>
                    <p className="pf-subtitle"><em>{portfolio.subtitle}</em></p>
                </div>
                {portfolio.categories.map((category) => (
                    <div key={category.id}>
                        <h2>{category.title}</h2>
                        <Container>
                            <Row xs={1} md={2} lg={3} xl={3} xxl={4}>
                                {category.work_slugs.map((workSlug) => (
                                    <Col key={workSlug} className="p-2">
                                        <Work portfolioSlug={portfolio.slug} workSlug={workSlug} />
                                    </Col>
                                ))}
                            </Row>
                        </Container>
                    </div>
                ))}
            </Stack>
        </Container >
    );
};
