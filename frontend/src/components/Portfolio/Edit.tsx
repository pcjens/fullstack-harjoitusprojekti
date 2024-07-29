import { FormEventHandler, useCallback, useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import Spinner from "react-bootstrap/Spinner";
import { useNavigate } from "react-router-dom";

import { Portfolio } from ".";
import { ValidatedTextInput } from "../Forms";
import { useApiFetch } from "../../hooks/useApiFetch";
import { createTypechekerFromExample } from "../../util/helpers";

export interface Props {
    portfolio?: Portfolio,
}

const typecheckCreatedPortfolio = createTypechekerFromExample({
    slug: "",
}, "portfolio");

export const PortfolioEditor = ({ portfolio }: Props) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

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

    const [slug, setSlug] = useState(portfolio?.slug ?? "");
    const validateSlug = combineValidators(
        createLengthValidator(1, 100),
        (slug: string) => slug.search(/[^a-z0-9-]/) === -1 ? null : t("input-not-alphadashnumeric"),
    );

    const [title, setTitle] = useState(portfolio?.title ?? "");
    const validateTitle = createLengthValidator(1, 100);

    const [subtitle, setSubtitle] = useState(portfolio?.subtitle ?? "");
    const validateSubtitle = createLengthValidator(1, 500);

    const [author, setAuthor] = useState(portfolio?.author ?? "");
    const validateAuthor = createLengthValidator(1, 100);

    const [serverError, setServerError] = useState("");

    const mapResult = useCallback(typecheckCreatedPortfolio, []);
    const [reqParams, setReqParams] = useState<RequestInit>({});
    const {
        refetch: createPortfolio,
        loading,
    } = useApiFetch(`/portfolio/${slug}`, mapResult, reqParams, true);

    useEffect(() => {
        setReqParams({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, subtitle, author }),
        });
    }, [title, subtitle, author]);

    const submitHandler: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        setShouldValidate(true);
        const validArguments = validateSlug(slug) == null
            && validateTitle(title) == null
            && validateSubtitle(subtitle) == null
            && validateAuthor(author) == null;
        if (!validArguments) {
            return;
        }
        const submit = async () => {
            const result = await createPortfolio();
            if ("userError" in result) {
                setServerError(result.userError);
                return;
            }
            navigate(`/p/${result.value.slug}`);

            setSlug("");
            setTitle("");
            setSubtitle("");
            setAuthor("");
            setServerError("");
        };
        void submit();
    };

    return (
        <Container>
            <h2>
                {t(portfolio != null ? "edit-portfolio" : "create-portfolio")}
            </h2>
            <Form onSubmit={submitHandler} noValidate>
                <Stack gap={3}>
                    <ValidatedTextInput pfx={"portfolio-editor"} name={"slug"} shouldValidate={shouldValidate}
                        input={slug} setInput={setSlug} validate={validateSlug} />
                    <ValidatedTextInput pfx={"portfolio-editor"} name={"author"} shouldValidate={shouldValidate}
                        input={author} setInput={setAuthor} validate={validateAuthor} />
                    <ValidatedTextInput pfx={"portfolio-editor"} name={"title"} shouldValidate={shouldValidate}
                        input={title} setInput={setTitle} validate={validateTitle} />
                    <ValidatedTextInput pfx={"portfolio-editor"} name={"subtitle"} shouldValidate={shouldValidate}
                        input={subtitle} setInput={setSubtitle} validate={validateSubtitle} />
                    {serverError && <p className="text-danger">
                        {t(`error.${serverError}`)}
                    </p>}
                    <Form.Group>
                        <Button type="submit" disabled={loading}>
                            {loading && <Spinner size="sm" role="status" aria-hidden="true" style={{ marginRight: 6 }} />}
                            {t(portfolio != null ? "action.edit-portfolio" : "action.create-portfolio")}
                        </Button>
                    </Form.Group>
                </Stack>
            </Form>
        </Container>
    );
};