import { Container, Row, Col, Card } from "react-bootstrap";
import { LoginRegisterForm } from "./LoginRegisterForm";
import { useTranslation } from "react-i18next";

export const LoggedOutIndex = () => {
    const { t } = useTranslation();

    return (
        <Container className="d-flex justify-content-center">
            <Row className="align-items-center mt-3 mb-5">
                <Col md="6" className="my-2">
                    <Card>
                        <Card.Header>{t("login")}</Card.Header>
                        <Card.Body>
                            <LoginRegisterForm />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md="6" className="my-2">
                    <Card>
                        <Card.Header>{t("register")}</Card.Header>
                        <Card.Body>
                            <LoginRegisterForm isRegister />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};
