import { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import "bootstrap/dist/css/bootstrap.min.css";

import { VITE_API_BASE_URL } from "./util/config";
import { LoginRegisterForm } from "./components/LoginRegisterForm";

const App = () => {
    const [backendResponse, setBackendResponse] = useState("");

    useEffect(() => {
        let ignore = false;
        void fetch(`${VITE_API_BASE_URL}/health`)
            .then((res) => res.text()
                .then((text) => { if (!ignore) { setBackendResponse(text); } }))
            .catch(() => { if (!ignore) { setBackendResponse("not reachable"); } });
        return () => { ignore = true; };
    }, []);

    return (
        <>
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
            <footer style={{ display: "fixed", bottom: 0, textAlign: "center" }}>
                {import.meta.env.DEV && <p>Backend status: {backendResponse}</p>}
                <p>This web software is available under the  GNU AGPL 3.0 license. <a href="https://github.com/pcjens/fullstack-harjoitustyo">Source code</a></p>
            </footer>
        </>
    );
};

export default App;
