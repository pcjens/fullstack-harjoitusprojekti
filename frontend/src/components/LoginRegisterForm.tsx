import { FormEventHandler, useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";

import { VITE_API_BASE_URL } from "../util/config";
import { apiFetch } from "../util/api";

interface Props {
    isRegister?: boolean,
}

export const LoginRegisterForm = ({ isRegister }: Props) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const login: FormEventHandler = (event) => {
        event.preventDefault();
        const asyncBody = async () => {
            setLoading(true);
            const response = await apiFetch(`${VITE_API_BASE_URL}/user/${isRegister ? "register" : "login"}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username, password, password2,
                }),
            });
            setLoading(false);
            if ("userError" in response) {
                setError(response.userError);
                return;
            }

            console.log(response.value);
            // TODO: Save the token somewhere
            // TODO: Navigate to the management UI

            setUsername("");
            setPassword("");
            setPassword2("");
            setError("");
        };
        void asyncBody();
    };

    return (
        <Form onSubmit={login}>
            <Form.Group>
                <Form.Label htmlFor="inputUsername">Username</Form.Label>
                <Form.Control minLength={3} maxLength={30} required
                    id="inputUsername"
                    aria-describedby="usernameHelp"
                    value={username}
                    onChange={({ target }) => { setUsername(target.value); }} />
                {isRegister && <Form.Text id="usernameHelp" muted>
                    The username must be between 3 and 30 characters long.
                </Form.Text>}
            </Form.Group>
            <Form.Group className="my-3">
                <Form.Label htmlFor="inputPassword">Password</Form.Label>
                <Form.Control minLength={10} maxLength={100} required
                    type="password"
                    id="inputPassword"
                    aria-describedby="passwordHelp"
                    value={password}
                    onChange={({ target }) => { setPassword(target.value); }} />
                {isRegister && <Form.Text id="passwordHelp" muted>
                    The password must be between 10 and 100 characters long, and ideally, hard to guess.
                </Form.Text>}
            </Form.Group>
            {isRegister && <Form.Group className="my-3">
                <Form.Label htmlFor="inputPassword2">Confirm password</Form.Label>
                <Form.Control minLength={10} maxLength={100} required
                    type="password"
                    id="inputPassword2"
                    aria-describedby="password2Help"
                    value={password2}
                    onChange={({ target }) => { setPassword2(target.value); }} />
                <Form.Text id="password2Help" muted>
                    Same as above.
                </Form.Text>
            </Form.Group>}
            {error && <p className="text-danger">
                {error /* TODO: localize this */}
            </p>}
            <Button variant="primary" type="submit" disabled={loading}>
                {loading && <Spinner size="sm" role="status" aria-hidden="true" style={{ marginRight: 6 }} />}
                {(isRegister ? "Register" : "Log in")}
            </Button>
        </Form >
    );
};
