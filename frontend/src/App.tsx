import { useContext } from "react";
import { BrowserRouter, Link, Route, Routes, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Container from "react-bootstrap/Container";
import Spinner from "react-bootstrap/Spinner";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import NavDropdown from "react-bootstrap/NavDropdown";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";

import { LoggedOutIndex } from "./components/LoggedOutIndex";
import { LoginStatus, useSession } from "./hooks/useSession";
import { useTimeout } from "./hooks/useTimeout";
import { LoginContext, useLogin } from "./hooks/useLogin";
import { BackendStatus } from "./components/BackendStatus";
import { MainDashboard } from "./components/MainDashboard";
import { PortfolioEditor } from "./components/Portfolio/Edit";

const NotFound = () => {
    const { t } = useTranslation();

    return (
        <Container>
            <h2>{t("not-found-title")}</h2>
            <p>
                {t("not-found-description")}
            </p>
            <Button onClick={() => { history.back(); }}>{t("action.go-back")}</Button>
        </Container>
    );
};

const PortfolioEditorFromPath = () => {
    const params = useParams();
    return <PortfolioEditor slug={params.slug} />;
};

const IndexContent = () => {
    const { loginStatus, slow: showLoadingText } = useSession();
    const { logout } = useContext(LoginContext);
    const { t, i18n } = useTranslation();

    // Only show spinner after 400ms (seems like an appropriate timeout for the backend to respond)
    const { timedOut: showLoading } = useTimeout(400);

    return (
        <BrowserRouter>
            {loginStatus !== LoginStatus.Unknown && <Navbar expand="sm">
                <Container>
                    <Navbar.Brand as={Link} to="/">
                        <img
                            src="/public/icon.svg"
                            width="30"
                            height="30"
                            className="d-inline-block align-top"
                            alt="Portfolio logo"
                        />
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="navbar-nav" />
                    <Navbar.Collapse id="navbar-nav">
                        <Nav className="me-auto">
                            {loginStatus === LoginStatus.LoggedIn && <Nav.Link as={Link} to="/">{t("nav.dashboard")}</Nav.Link>}
                            {loginStatus === LoginStatus.LoggedIn && <Nav.Link onClick={() => { logout(null); }}>{t("logout")}</Nav.Link>}
                            <NavDropdown title={t("nav.language")} id="navbar-language-selector">
                                <NavDropdown.Item onClick={() => { void i18n.changeLanguage("en"); }} disabled={i18n.language === "en"}>
                                    English
                                </NavDropdown.Item>
                                <NavDropdown.Item onClick={() => { void i18n.changeLanguage("fi"); }} disabled={i18n.language === "fi"}>
                                    Suomi
                                </NavDropdown.Item>
                            </NavDropdown>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar >}

            {loginStatus === LoginStatus.LoggedOut && <LoggedOutIndex />}

            {
                loginStatus === LoginStatus.LoggedIn && <Routes>
                    <Route path="/" element={<MainDashboard />} />
                    <Route path="/portfolio/new" element={<PortfolioEditor />} />
                    <Route path="/p/:slug/edit" element={<PortfolioEditorFromPath />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            }

            {
                loginStatus === LoginStatus.Unknown && showLoading &&
                <Container className="d-flex vh-100 justify-content-center align-items-center">
                    <div>
                        {showLoadingText || <Spinner title="Loading..."></Spinner>}
                        {showLoadingText && <p style={{ textAlign: "center" }}>
                            {t("cantConnectInfo")}
                        </p>}
                    </div>
                </Container>
            }

            {
                loginStatus !== LoginStatus.Unknown && <footer className="my-5" style={{ textAlign: "center" }}>
                    {import.meta.env.DEV && <p>Backend status: {<BackendStatus />}</p>}
                    <p>
                        {t("footer.licenseNote")} {" "}
                        <a href="https://github.com/pcjens/fullstack-harjoitustyo">{t("footer.sourceCode")}</a>
                    </p>
                </footer>
            }
        </BrowserRouter>
    );
};

const App = () => {
    const { contextObject } = useLogin();
    return (
        <LoginContext.Provider value={contextObject}>
            <IndexContent />
        </LoginContext.Provider>
    );
};

export default App;
