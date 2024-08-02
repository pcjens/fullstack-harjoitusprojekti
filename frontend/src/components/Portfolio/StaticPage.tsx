// The idea is to not import as few things here as possible, since this will be
// used to render the portfolio, and ideally those pages should be light,
// relatively JS-free, and renderable ahead of time for static serving.

import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Link } from "react-router-dom";

import { Portfolio } from ".";

export interface Props {
    portfolio: Portfolio,
}

export const PortfolioStaticPage = ({ portfolio }: Props) => {
    return (
        <Container className="p-3">
            <Stack>
                <div>
                    <h1>{portfolio.title}</h1>
                    <p className="pf-subtitle"><em>{portfolio.subtitle}</em></p>
                </div>
                {[1, 2].map((key) => (
                    <div key={key}>
                        <h2>Some category name</h2>
                        <Container>
                            <Row xs={1} md={2} lg={3} xl={4} xxl={5}>
                                {[1, 2, 3, 4, 5, 6].map((key) => (
                                    <Col key={key} className="p-2">
                                        <Card>
                                            <Card.Img variant="top" height={180} />
                                            <Card.Body>
                                                <Card.Title>
                                                    <Link to={`/p/${portfolio.slug}/todo-work-slug`}>
                                                        The Name of a Piece of Art
                                                    </Link>
                                                </Card.Title>
                                                <Card.Text>
                                                    A short description of The Name of a Piece of Art, which still might contain this much text.
                                                </Card.Text>
                                            </Card.Body>
                                        </Card>
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
