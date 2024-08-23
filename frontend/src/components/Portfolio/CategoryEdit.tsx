import { FormEventHandler, useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const NewCategoryForm = () => {
    const { t } = useTranslation();
    const [title, setTitle] = useState("");

    const submitHandler: FormEventHandler = (event) => {
        event.preventDefault();
        alert("todo: this should add a new category container here");
    };

    return (
        <Form onSubmit={submitHandler} noValidate className="d-flex mx-3 my-3 flex-row justify-content-between">
            <div className="me-3" style={{ flexGrow: 1 }}>
                <Form.Control required
                    placeholder={t("portfolio-editor.category-title.name")}
                    value={title} onChange={(({ target }) => { setTitle(target.value); })} />
            </div>
            <Button type="submit" variant="primary">
                {t("action.create-new-category")}
            </Button>
        </Form>
    );
};

export const CategoryEdit = () => {
    const { t } = useTranslation();

    const categories = [
        {
            id: 0,
            title: "Arts",
            works: [{
                id: 0,
                title: "The Name of a Piece of Art",
                shortDescription: "A short description of The Name of a Piece of Art, which still might contain this much text.",
            }]
        },
    ];

    // Frontend-related todos:
    // TODO: Implement new category creation submit
    // TODO: Implement add work creation submit

    // Backend-related todos:
    // TODO: Get categories from the backend
    // TODO: Get works from the backend
    // TODO: Send categories to the backend on submit

    return (
        <>
            {categories.length === 0 && <div className="mx-auto">
                <em>{t("no-categories-found")}</em>
            </div>}
            {categories.map((category) => (
                <Container key={category.id}>
                    <h4>{category.title}</h4>
                    <Row xs={1} md={2} lg={3} xl={4} xxl={5} className="align-items-center">
                        {category.works.map((work) => (
                            <Col key={work.id} className="p-2">
                                <Card>
                                    <Card.Body>
                                        <Card.Title>
                                            <Link to={"/"}>
                                                {work.title}
                                            </Link>
                                        </Card.Title>
                                        <Card.Text>{work.shortDescription}</Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                        <Col className="p-2">
                            <Card>
                                <Card.Body>
                                    <Card.Title>{t("category-editor.add-work-title")}</Card.Title>
                                    <Form onSubmit={(event) => { event.preventDefault(); alert("todo"); }}>
                                        <div className="d-flex flex-column align-items-start gap-2 py-2">
                                            <Form.Select defaultValue="">
                                                <option value="">{t("category-editor.select-existing-work")}</option>
                                                <option value="example-1">Example 1</option>
                                                <option value="example-2">Example 2</option>
                                            </Form.Select>
                                            <Button type="submit">{t("category-editor.add-work-button")}</Button>
                                        </div>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            ))}
            <NewCategoryForm />
        </>
    );
};
