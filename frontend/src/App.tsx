import "bootstrap/dist/css/bootstrap.min.css";
import Container from "react-bootstrap/Container";
import Spinner from "react-bootstrap/Spinner";
import { LoggedOutIndex } from "./components/LoggedOutIndex";
import { LoginStatus, useSession } from "./hooks/useSession";
import { useTimeout } from "./hooks/useTimeout";
import { LoginContext, useLogin } from "./hooks/useLogin";
import { BackendStatus } from "./components/BackendStatus";

const IndexContent = () => {
    const { myInfo, loginStatus } = useSession();

    // Only show spinner after 400ms (seems like an appropriate timeout for the backend to respond)
    const { timedOut: showLoading } = useTimeout(400);
    // If it really takes a while, show more info
    const { timedOut: showLoadingText } = useTimeout(4000);

    return (
        <>
            {loginStatus === LoginStatus.LoggedOut && <LoggedOutIndex />}
            {loginStatus === LoginStatus.LoggedIn && <center>
                You are logged in: {myInfo}
            </center>}
            {loginStatus === LoginStatus.Unknown && showLoading &&
                <Container className="d-flex vh-100 justify-content-center align-items-center">
                    <div>
                        {showLoadingText || <Spinner title="Loading..."></Spinner>}
                        {showLoadingText && <p style={{ textAlign: "center" }}>
                            Reaching the backend server is taking longer than expected.
                            This service is probably unavailable, possibly for maintenance, or
                            there could be an issue with your internet connectivity.
                            In any case, sorry about this, you may want to try again later.
                        </p>}
                    </div>
                </Container>
            }
            {loginStatus !== LoginStatus.Unknown && <footer style={{ display: "fixed", bottom: 0, textAlign: "center" }}>
                {import.meta.env.DEV && <p>Backend status: {<BackendStatus />}</p>}
                <p>This web software is available under the  GNU AGPL 3.0 license. <a href="https://github.com/pcjens/fullstack-harjoitustyo">Source code</a></p>
            </footer>}
        </>
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
