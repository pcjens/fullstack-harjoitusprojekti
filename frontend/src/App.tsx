import { useEffect, useState } from "react";

import { VITE_BACKEND_BASE_URL } from "./util/config";

const App = () => {
    const [backendResponse, setBackendResponse] = useState("");

    useEffect(() => {
        void fetch(`${VITE_BACKEND_BASE_URL}/api/ping`)
            .then((res) => res.text()
                .then((text) => { setBackendResponse(text); }));
    }, []);

    return (
        <div>
            <h1>Fullstack Harjoitusprojekti</h1>
            <p>Backend says: {backendResponse}</p>
            <p><a href="https://github.com/pcjens/fullstack-harjoitustyo">GitHub/pcjens/fullstack-harjoitustyo</a></p>
        </div>
    );
};

export default App;
