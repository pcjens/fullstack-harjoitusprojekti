import { FormEventHandler, useCallback, useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import Spinner from "react-bootstrap/Spinner";
import { useNavigate } from "react-router-dom";

import { Category, typecheckPortfolio } from "..";
import { ValidatedTextInput, ValidatedCheckbox } from "../../Forms";
import { ApiError, useApiFetch } from "../../../hooks/useApiFetch";
import { createTypechekerFromExample } from "../../../util/helpers";
import { CategoryEdit } from "./CategoryEdit";

const typecheckCreatedPortfolio = createTypechekerFromExample({
    slug: "",
}, "portfolio");

export const PortfolioEditor = (props: { slug?: string }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const isEdit = props.slug != null;

    const [serverError, setServerError] = useState("");
    const [slugsInUse, setSlugsInUse] = useState<string[]>([]);

    const [slug, setSlug] = useState("");
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [author, setAuthor] = useState("");
    const [publish, setPublish] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    const mapGetResult = useCallback(typecheckPortfolio, []);
    const {
        result: slugFindResult,
        loading: originalPortfolioLoading,
    } = useApiFetch(`/portfolio/${props.slug ?? ""}`, mapGetResult);
    useEffect(() => {
        if (slugFindResult != null) {
            if ("value" in slugFindResult) {
                setSlug(slugFindResult.value.slug);
                setTitle(slugFindResult.value.title);
                setSubtitle(slugFindResult.value.subtitle);
                setAuthor(slugFindResult.value.author);
                setPublish(!!slugFindResult.value.published_at);
                setCategories(slugFindResult.value.categories);
            } else if (isEdit) {
                setServerError(slugFindResult.userError);
            }
        }
    }, [slugFindResult, isEdit]);

    const createLengthValidator = (min: number, max: number) => {
        return (value: string) => {
            if (value.length < min) {
                return t("input-too-short", { min, max });
            }
            if (value.length > max) {
                return t("input-too-long", { min, max });
            }
            return null;
        };
    };
    const combineValidators = (...validators: ((value: string) => string | null)[]) => {
        return (value: string) => validators
            .map((validate) => validate(value))
            .filter(Boolean)[0];
    };

    const [shouldValidate, setShouldValidate] = useState(false);

    const validateSlug = combineValidators(
        createLengthValidator(1, 100),
        (slug: string) => slug.search(/[^a-z0-9-]/) !== -1 ? t("input-not-alphadashnumeric") : null,
        (slug: string) => slugsInUse.includes(slug) ? t("error.SlugTaken") : null,
    );
    const validateTitle = createLengthValidator(1, 100);
    const validateSubtitle = createLengthValidator(1, 500);
    const validateAuthor = createLengthValidator(1, 100);
    const validatePublish: (value: boolean) => string | null = () => null;

    const mapPostResult = useCallback(typecheckCreatedPortfolio, []);
    const [reqParams, setReqParams] = useState<RequestInit>({});
    const [latestSentReqParams, setLatestSentReqParams] = useState<RequestInit>({});
    const {
        refetch: createPortfolio,
        loading,
    } = useApiFetch(`/portfolio/${props.slug ?? slug}`, mapPostResult, reqParams, true);

    useEffect(() => {
        setReqParams({
            method: isEdit ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                portfolio: { slug, title, subtitle, author, categories },
                publish,
            }),
        });
    }, [slug, title, subtitle, author, categories, publish, isEdit]);

    const submitHandler: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        setShouldValidate(true);
        const validArguments = validateSlug(slug) == null
            && validateTitle(title) == null
            && validateSubtitle(subtitle) == null
            && validateAuthor(author) == null
            && validatePublish(publish) == null;
        if (!validArguments) {
            return;
        }
        const submit = async () => {
            const result = await createPortfolio();

            if ("userError" in result) {
                setLatestSentReqParams({});
                setServerError(result.userError);
                if (result.userError === ApiError.SlugTaken) {
                    setSlugsInUse(slugsInUse.concat(slug));
                    setServerError("");
                }
                return;
            }

            if (isEdit) {
                setShouldValidate(false);
                navigate(`/p/${result.value.slug}/edit`);
            } else {
                setSlug("");
                setTitle("");
                setSubtitle("");
                setAuthor("");
                setPublish(false);
                navigate(`/p/${result.value.slug}`);
            }

            setLatestSentReqParams(reqParams);
            setServerError("");
        };
        void submit();
    };

    return (
        <Container>
            <h2>
                {t(isEdit ? "edit-portfolio" : "create-portfolio")}
            </h2>
            <Stack gap={3} className="mb-3">
                <ValidatedTextInput pfx={"portfolio-editor"} name={"slug"} shouldValidate={shouldValidate}
                    input={slug} setInput={setSlug} validate={validateSlug} showPlaceholder={isEdit && originalPortfolioLoading} />
                <ValidatedTextInput pfx={"portfolio-editor"} name={"author"} shouldValidate={shouldValidate}
                    input={author} setInput={setAuthor} validate={validateAuthor} showPlaceholder={isEdit && originalPortfolioLoading} />
                <ValidatedTextInput pfx={"portfolio-editor"} name={"title"} shouldValidate={shouldValidate}
                    input={title} setInput={setTitle} validate={validateTitle} showPlaceholder={isEdit && originalPortfolioLoading} />
                <ValidatedTextInput pfx={"portfolio-editor"} name={"subtitle"} shouldValidate={shouldValidate}
                    input={subtitle} setInput={setSubtitle} validate={validateSubtitle} showPlaceholder={isEdit && originalPortfolioLoading} />
                <ValidatedCheckbox pfx={"portfolio-editor"} name={"publish"} shouldValidate={shouldValidate}
                    input={publish} setInput={setPublish} validate={validatePublish} showPlaceholder={isEdit && originalPortfolioLoading} />
                {serverError && <p className="text-danger">
                    {t(`error.${serverError}`)}
                </p>}
                <h3>{t("categories")}</h3>
                <div>
                    <CategoryEdit categories={categories} setCategories={setCategories} />
                </div>
            </Stack>
            <Form onSubmit={submitHandler} noValidate>
                <Form.Group>
                    <Button type="submit" disabled={loading || reqParams.body === latestSentReqParams.body}>
                        {loading && <Spinner size="sm" role="status" aria-hidden="true" style={{ marginRight: 6 }} />}
                        {isEdit && reqParams.body === latestSentReqParams.body && t("action.edit-portfolio-saved")}
                        {isEdit && reqParams.body !== latestSentReqParams.body && t("action.edit-portfolio")}
                        {!isEdit && t("action.create-portfolio")}
                    </Button>
                </Form.Group>
            </Form>
        </Container>
    );
};