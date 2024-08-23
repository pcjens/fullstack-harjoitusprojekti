import { ChangeEvent, Dispatch, FormEvent, SetStateAction, useCallback, useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Category } from ".";
import { typecheckWorkSummaryArray, WorkSummary } from "../Work";
import { useApiFetch } from "../../hooks/useApiFetch";
import { ValidatedTextInput } from "../Forms";

interface Props {
    categories: Category[],
    setCategories: Dispatch<SetStateAction<Category[]>>,
}

export const CategoryEdit = ({ categories, setCategories }: Props) => {
    const { t } = useTranslation();

    const [newCategory, setNewCategory] = useState("");
    const addNewCategory = () => {
        if (newCategory.length === 0) {
            return;
        }

        // Just set the id values to something sensical and non-overlapping so
        // that they can be used as keys, the server will ignore them anyway
        const portfolio_id = categories.length === 0 ? 0 : categories[0].portfolio_id;
        let id = categories.length === 0 ? 0 : categories[0].id + 1;
        for (const { id: existingId } of categories) {
            const newId = existingId + 1;
            id = Math.max(id, newId);
        }

        setCategories(categories.concat({ id, portfolio_id, title: newCategory, work_slugs: [] }));
        setNewCategory("");
    };

    const [newWorks, setNewWorks] = useState<{ categoryId: number, workSlug: string }[]>([]);
    const newWorkFor = (categoryId: number) =>
        newWorks.find(({ categoryId: other }) => categoryId === other)?.workSlug ?? "";
    const setNewWorkFor = (categoryId: number) =>
        (event: ChangeEvent<HTMLSelectElement>) => {
            const { target: { value: workSlug } } = event;
            const newWork = newWorks.find(({ categoryId: other }) => categoryId === other);
            if (newWork != null) {
                newWork.workSlug = workSlug;
            } else {
                newWorks.push({ categoryId, workSlug });
            }
            setNewWorks([...newWorks]);
        };
    const addNewWorkFor = (categoryId: number) =>
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const newWork = newWorkFor(categoryId);
            if (newWork.length === 0) {
                return;
            }
            setNewWorks(newWorks.filter(({ categoryId: other }) => categoryId !== other));
            setCategories(categories.map((category) => (category.id !== categoryId ? category : {
                ...category,
                work_slugs: category.work_slugs.concat(newWork),
            })));
        };

    const mapWorksResult = useCallback(typecheckWorkSummaryArray, []);
    const { result: worksResult, loading } = useApiFetch("/work", mapWorksResult);

    const [worksError, setWorksError] = useState<string | null>(null);
    const [works, setWorks] = useState<Record<string, WorkSummary | undefined>>({});
    useEffect(() => {
        if (!loading && worksResult != null) {
            if ("userError" in worksResult) {
                setWorksError(worksResult.userError);
            } else {
                const newWorks: Record<string, WorkSummary | undefined> = {};
                for (const work of worksResult.value) {
                    newWorks[work.slug] = work;
                }
                setWorks(newWorks);
                setWorksError(null);
            }
        }
    }, [loading, worksResult]);

    return (
        <>
            {categories.length === 0 && <div className="mx-auto">
                <em>{t("no-categories-found")}</em>
            </div>}

            {categories.map((category) => (
                <Container key={category.id}>
                    <h4>{category.title}</h4>
                    <Row xs={1} md={2} lg={3} xl={4} xxl={5} className="align-items-center">
                        {category.work_slugs
                            .map((slug) => works[slug])
                            .filter((work) => work != null)
                            .map((work) => (
                                <Col key={work.id} className="p-2">
                                    <Card>
                                        <Card.Body>
                                            <Card.Title>
                                                <Link to={"/"}>
                                                    {work.title}
                                                </Link>
                                            </Card.Title>
                                            <Card.Text>{work.short_description}</Card.Text>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}

                        <Col className="p-2">
                            <Card>
                                {worksError != null && <p className="text-danger">
                                    {t(`error.${worksError}`)}
                                </p>}
                                {worksError == null && <Card.Body>
                                    <Card.Title>{t("category-editor.add-work-title")}</Card.Title>
                                    <Form onSubmit={addNewWorkFor(category.id)}>
                                        <div className="d-flex flex-column align-items-start gap-2 py-2">
                                            <Form.Select value={newWorkFor(category.id)} onChange={setNewWorkFor(category.id)}>
                                                <option value="">{t("category-editor.select-existing-work")}</option>
                                                {Object.values(works)
                                                    .filter((work) => work != null)
                                                    .filter((work) => !category.work_slugs.includes(work.slug))
                                                    .map((work) => <option key={work.slug} value={work.slug}>{work.title}</option>)}
                                            </Form.Select>
                                            <Button type="submit" disabled={newWorkFor(category.id).length === 0}>
                                                {t("category-editor.add-work-button")}
                                            </Button>
                                        </div>
                                    </Form>
                                </Card.Body>}
                            </Card>
                        </Col>
                    </Row>
                </Container>
            ))}

            <Form className="mt-3" onSubmit={(event) => {
                event.preventDefault();
                addNewCategory();
            }}>
                <ValidatedTextInput name={"category"} pfx={"portfolio-editor"} shouldValidate={false} validate={() => null} input={newCategory} setInput={setNewCategory}
                    attachedButton={{ type: "submit", text: t("action.create-new-category") }} />
            </Form>
        </>
    );
};
