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
import { PortfolioListing, PortfolioEditor, PortfolioPage } from "./components/Portfolio";
import { WorkListing, WorkEditor, WorkPage } from "./components/Work";

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

const PortfolioPageFromPath = () => {
    const params = useParams();
    return <PortfolioPage slug={params.slug ?? ""} />;
};

const WorkPageFromPath = () => {
    const params = useParams();
    return <WorkPage portfolioSlug={params.portfolioSlug ?? ""} workSlug={params.workSlug ?? ""} />;
};

const WorkEditorFromPath = () => {
    const params = useParams();
    return <WorkEditor slug={params.slug} />;
};

const NavWrapper = (props: { element: JSX.Element, hideNavIfLoggedOut?: boolean }) => {
    const { loginStatus, slow: showLoadingText } = useSession();
    const { logout } = useContext(LoginContext);
    const { t, i18n } = useTranslation();

    // Only show spinner after 400ms (seems like an appropriate timeout for the backend to respond)
    const { timedOut: showLoading } = useTimeout(400);

    if (props.hideNavIfLoggedOut && loginStatus !== LoginStatus.LoggedIn) {
        return props.element;
    }

    if (loginStatus === LoginStatus.Unknown) {
        if (!showLoading) {
            return <></>;
        }
        return (
            <Container className="d-flex vh-100 justify-content-center align-items-center">
                <div>
                    {showLoadingText || <Spinner title="Loading..."></Spinner>}
                    {showLoadingText && <p style={{ textAlign: "center" }}>
                        {t("cantConnectInfo")}
                    </p>}
                </div>
            </Container>
        );
    }

    return (
        <>
            <Navbar expand="sm">
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
                            {loginStatus === LoginStatus.LoggedIn && <Nav.Link as={Link} to="/">{t("nav.portfolios")}</Nav.Link>}
                            {loginStatus === LoginStatus.LoggedIn && <Nav.Link as={Link} to="/works">{t("nav.works")}</Nav.Link>}
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
            </Navbar>

            {loginStatus === LoginStatus.LoggedIn ? props.element : <LoggedOutIndex />}

            <footer className="my-5" style={{ textAlign: "center" }}>
                {import.meta.env.DEV && <p>Backend status: {<BackendStatus />}</p>}
                <p>
                    {t("footer.licenseNote")} {" "}
                    <a href="https://github.com/pcjens/fullstack-harjoitustyo">{t("footer.sourceCode")}</a>
                </p>
            </footer>
        </>
    );
};

const IndexContent = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<NavWrapper element={<PortfolioListing />} />} />
                <Route path="/works" element={<NavWrapper element={<WorkListing />} />} />
                <Route path="/works/:slug/edit" element={<NavWrapper element={<WorkEditorFromPath />} />} />
                <Route path="/works/new" element={<NavWrapper element={<WorkEditor />} />} />
                <Route path="/portfolio/new" element={<NavWrapper element={<PortfolioEditor />} />} />
                <Route path="/p/:slug/edit" element={<NavWrapper element={<PortfolioEditorFromPath />} />} />
                <Route path="/p/:slug" element={<NavWrapper hideNavIfLoggedOut={true} element={<PortfolioPageFromPath />} />} />
                <Route path="/p/:portfolioSlug/:workSlug" element={<NavWrapper hideNavIfLoggedOut={true} element={<WorkPageFromPath />} />} />
                <Route path="*" element={<NavWrapper element={<NotFound />} />} />
            </Routes>
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
