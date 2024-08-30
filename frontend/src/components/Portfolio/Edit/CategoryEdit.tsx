import { ChangeEvent, Dispatch, FormEvent, SetStateAction, useCallback, useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import CloseButton from "react-bootstrap/CloseButton";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Category } from "..";
import { typecheckWorkSummaryArray, WorkSummary } from "../../Work";
import { useApiFetch } from "../../../hooks/useApiFetch";
import { ValidatedTextInput } from "../../Forms";
import { ReorderableList } from "../../ReorderableList";

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

    const makeWorkRemoverFn = (categoryId: number, workSlug: string) =>
        () => {
            setCategories(categories.map((category) => (categoryId !== category.id ? category : {
                ...category,
                work_slugs: category.work_slugs.filter((slug) => slug !== workSlug),
            })));
        };

    const makeCategoryRemoverFn = (categoryId: number) =>
        () => {
            setCategories(categories.filter((category) => (categoryId !== category.id)));
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
                    <div className="d-flex align-items-center justify-content-between">
                        <h4>{category.title}</h4>
                        <CloseButton style={{ fontSize: 14, marginLeft: 4 }}
                            onClick={makeCategoryRemoverFn(category.id)} />
                    </div>
                    <ReorderableList elements={category.work_slugs}
                        setElements={(newSlugs) => {
                            const work_slugs = Array.isArray(newSlugs) ? newSlugs : newSlugs(category.work_slugs);
                            setCategories(categories.map((c) => c.id !== category.id ? c : { ...c, work_slugs }));
                        }}
                        getKey={(slug) => slug}
                        className="align-items-center row row-cols-xxl-5 row-cols-xl-4 row-cols-lg-3 row-cols-md-2 row-cols-1"
                        elementClassName="col"
                        Render={({ element: work_slug }) => (
                            <Card style={{ flexGrow: 1 }}>
                                <Card.Body>
                                    <Card.Title>
                                        <div className="d-flex align-items-center justify-content-between">
                                            <Link to={"/"}>
                                                {works[work_slug]?.title}
                                            </Link>
                                            <CloseButton style={{ fontSize: 14, marginLeft: 4 }}
                                                onClick={makeWorkRemoverFn(category.id, work_slug)} />
                                        </div>
                                    </Card.Title>
                                    <Card.Text>{works[work_slug]?.short_description ?? ""}</Card.Text>
                                </Card.Body>
                            </Card>
                        )}
                        RenderLast={() => (
                            <Card>
                                {worksError != null && <p className="text-danger p-3">
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
                        )} />
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
