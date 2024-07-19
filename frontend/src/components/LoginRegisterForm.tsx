import { FormEventHandler, useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

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

    const login: FormEventHandler = (event) => {
        event.preventDefault();
        const asyncBody = async () => {
            const response = await apiFetch(`${VITE_API_BASE_URL}/user/${isRegister ? "register" : "login"}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username, password, password2,
                }),
            });
            if ("userError" in response) {
                console.warn("User error:", response.userError);
                setError(response.userError);
                return;
            }
            console.log(response.value);
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
            <Button variant="primary" type="submit">
                {isRegister ? "Register" : "Log in"}
            </Button>
        </Form >
    );
};
