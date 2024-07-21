import { Container, Row, Col, Card } from "react-bootstrap";
import { LoginRegisterForm } from "./LoginRegisterForm";

export const LoggedOutIndex = () => {
    return (
        <Container className="d-flex justify-content-center">
            <Row className="align-items-center mt-3 mb-5">
                <Col md="6" className="my-2">
                    <Card>
                        <Card.Header>Log in</Card.Header>
                        <Card.Body>
                            <LoginRegisterForm />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md="6" className="my-2">
                    <Card>
                        <Card.Header>Register</Card.Header>
                        <Card.Body>
                            <LoginRegisterForm isRegister />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};
