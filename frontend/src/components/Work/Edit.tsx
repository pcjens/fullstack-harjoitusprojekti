import { Dispatch, FormEventHandler, SetStateAction, useCallback, useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import Spinner from "react-bootstrap/Spinner";
import { useNavigate } from "react-router-dom";

import { typecheckWork } from ".";
import { ValidatedTextInput } from "../Forms";
import { useApiFetch } from "../../hooks/useApiFetch";
import { createTypechekerFromExample } from "../../util/helpers";

const typecheckCreatedWork = createTypechekerFromExample({
    slug: "",
}, "work");

interface InputListElementProps<T> {
    state: T | null, setState: Dispatch<SetStateAction<T | null>>,
}
interface InputListProps<T> {
    state: T[], setState: Dispatch<SetStateAction<T[]>>,
    editorElement: (props: InputListElementProps<T>) => JSX.Element,
}
function InputList<T>(props: InputListProps<T>) {
    const [state, setState] = useState<T | null>(null);
    return (<div>
        TODO: Actually present an editable list of the below editors here
        <br />
        {<props.editorElement state={state} setState={setState} />}
        <br />
        {<props.editorElement state={state} setState={setState} />}
    </div>);
}

const AttachmentInput = (props: InputListElementProps<string>) => {
    // TODO: attachment kind (dropdown of specific options which should have icons as well)
    // TODO: content type (figure out from file?)
    // TODO: title (only non-null for attachment kind "other"?)
    // TODO: file upload
    return (<>TODO: attachment editor (got state: {JSON.stringify(props.state)})</>);
};

const LinkInput = (props: InputListElementProps<string>) => {
    // TODO: title
    // TODO: href
    return (<>TODO: link editor (got state: {JSON.stringify(props.state)})</>);
};

export const WorkEditor = (props: { slug?: string }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const isEdit = props.slug != null;

    const [serverError, setServerError] = useState("");

    const [slug, setSlug] = useState("");
    const [title, setTitle] = useState("");
    // TODO: short description
    // TODO: long description
    // TODO: list of attachments (InputList with AttachmentInput, init the array state here)
    // TODO: list of links (InputList with LinkInput, init the array state here)
    // TODO: list of tags (probably doable with a single component, not an InputList)

    const mapGetResult = useCallback(typecheckWork, []);
    const {
        result: slugFindResult,
        loading: originalWorkLoading,
    } = useApiFetch(`/work/${props.slug ?? ""}`, mapGetResult);
    useEffect(() => {
        console.log("work status", slugFindResult);
        if (slugFindResult != null) {
            if ("value" in slugFindResult) {
                setSlug(slugFindResult.value.slug);
                setTitle(slugFindResult.value.title);
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
        (slug: string) => slug.search(/[^a-z0-9-]/) === -1 ? null : t("input-not-alphadashnumeric"),
    );
    const validateTitle = createLengthValidator(1, 100);

    const mapPostResult = useCallback(typecheckCreatedWork, []);
    const [reqParams, setReqParams] = useState<RequestInit>({});
    const [latestSentReqParams, setLatestSentReqParams] = useState<RequestInit>({});
    const {
        refetch: createWork,
        loading,
    } = useApiFetch(`/work/${props.slug ?? slug}`, mapPostResult, reqParams, true);

    useEffect(() => {
        setReqParams({
            method: isEdit ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug, title }),
        });
    }, [slug, title, isEdit]);

    const submitHandler: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        setShouldValidate(true);
        const validArguments = validateSlug(slug) == null
            && validateTitle(title) == null;
        if (!validArguments) {
            return;
        }
        const submit = async () => {
            const result = await createWork();
            if ("userError" in result) {
                setServerError(result.userError);
                return;
            }

            if (isEdit) {
                setLatestSentReqParams(reqParams);
                setShouldValidate(false);
            } else {
                navigate(`/works/${result.value.slug}/edit`);
            }

            setServerError("");
        };
        void submit();
    };

    return (
        <Container>
            <h2>
                {t(isEdit ? "edit-work" : "create-work")}
            </h2>
            <Form onSubmit={submitHandler} noValidate>
                <Stack gap={3}>
                    <ValidatedTextInput pfx={"work-editor"} name={"slug"} shouldValidate={shouldValidate}
                        input={slug} setInput={setSlug} validate={validateSlug} showPlaceholder={isEdit && originalWorkLoading} />
                    <ValidatedTextInput pfx={"work-editor"} name={"title"} shouldValidate={shouldValidate}
                        input={title} setInput={setTitle} validate={validateTitle} showPlaceholder={isEdit && originalWorkLoading} />
                    <InputList editorElement={AttachmentInput} />
                    <InputList editorElement={LinkInput} />
                    {serverError && <p className="text-danger">
                        {t(`error.${serverError}`)}
                    </p>}
                    <Form.Group>
                        <Button type="submit" disabled={loading || reqParams.body === latestSentReqParams.body}>
                            {loading && <Spinner size="sm" role="status" aria-hidden="true" style={{ marginRight: 6 }} />}
                            {isEdit && reqParams.body === latestSentReqParams.body && t("action.edit-work-saved")}
                            {isEdit && reqParams.body !== latestSentReqParams.body && t("action.edit-work")}
                            {!isEdit && t("action.create-work")}
                        </Button>
                    </Form.Group>
                </Stack>
            </Form>
        </Container>
    );
};