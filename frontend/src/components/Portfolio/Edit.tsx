import { Dispatch, FormEventHandler, SetStateAction, useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import InputGroup from "react-bootstrap/InputGroup";

import { Portfolio } from ".";

export interface Props {
    portfolio?: Portfolio,
}

type ValidatedStatus = { valid: true } | { valid: false, errorMessage: string };

const ShortTextInputField = ({ fieldName, value, setter, validation }: {
    fieldName: string,
    value: string,
    setter: Dispatch<SetStateAction<string>>,
    validation: ValidatedStatus | null,
}) => {
    const { t } = useTranslation();

    const inputName = `${fieldName}Input`;
    const helpName = `${fieldName}Help`;
    const errorName = `${fieldName}Error`;

    return (
        <Form.Group controlId={inputName}>
            <Form.Label>{t(`portfolio-editor.${fieldName}`)}</Form.Label>
            <InputGroup hasValidation>
                <Form.Control required aria-describedby={helpName}
                    aria-errormessage={validation?.valid === false ? errorName : undefined}
                    isInvalid={validation?.valid === false}
                    isValid={validation?.valid === true}
                    value={value} onChange={(({ target }) => { setter(target.value); })} />
                {validation?.valid === false && <Form.Control.Feedback type="invalid">
                    {validation.errorMessage}
                </Form.Control.Feedback>}
            </InputGroup>
            <Form.Text id={helpName} muted>
                {t(`portfolio-editor.${fieldName}-help`)}
            </Form.Text>
        </Form.Group>
    );
};

export const PortfolioEditor = ({ portfolio }: Props) => {
    const { t } = useTranslation();

    const [slug, setSlug] = useState(portfolio?.slug ?? "");
    const [slugValidation, setSlugValidation] = useState<ValidatedStatus | null>(null);
    const [title, setTitle] = useState(portfolio?.title ?? "");
    const [titleValidation, setTitleValidation] = useState<ValidatedStatus | null>(null);
    const [subtitle, setSubtitle] = useState(portfolio?.subtitle ?? "");
    const [subtitleValidation, setSubtitleValidation] = useState<ValidatedStatus | null>(null);
    const [author, setAuthor] = useState(portfolio?.author ?? "");
    const [authorValidation, setAuthorValidation] = useState<ValidatedStatus | null>(null);

    const submitHandler: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        const errors = [];
        if (event.currentTarget.checkValidity()) {
            errors.push("form-invalid");
        }
        if (!(2 <= slug.length && slug.length <= 30)) {
            setSlugValidation({ valid: false, errorMessage: t("slug-length", { min: 2, max: 30 }) });
        } else {
            setSlugValidation({ valid: true });
        }
        setTitleValidation({ valid: true });
        setSubtitleValidation({ valid: true });
        setAuthorValidation({ valid: true });
        console.debug("todo: handle submit");
    };

    return (
        <Container>
            <h2>
                {t(portfolio != null ? "edit-portfolio" : "create-portfolio")}
            </h2>
            <Form onSubmit={submitHandler} noValidate>
                <Stack gap={3}>
                    <ShortTextInputField fieldName="slug" value={slug} setter={setSlug} validation={slugValidation} />
                    <ShortTextInputField fieldName="author" value={author} setter={setAuthor} validation={authorValidation} />
                    <ShortTextInputField fieldName="title" value={title} setter={setTitle} validation={titleValidation} />
                    <ShortTextInputField fieldName="subtitle" value={subtitle} setter={setSubtitle} validation={subtitleValidation} />
                    <Form.Group>
                        <Button type="submit">
                            {t(portfolio != null ? "action.edit-portfolio" : "action.create-portfolio")}
                        </Button>
                    </Form.Group>
                </Stack>
            </Form>
        </Container>
    );
};