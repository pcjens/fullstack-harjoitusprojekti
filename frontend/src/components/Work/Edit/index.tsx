import { FormEventHandler, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import Spinner from "react-bootstrap/Spinner";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import CloseButton from "react-bootstrap/CloseButton";

import { typecheckWork } from "..";
import { ValidatedTextInput } from "../../Forms";
import { useApiFetch } from "../../../hooks/useApiFetch";
import { assert, createTypechekerFromExample } from "../../../util/helpers";
import { Attachment, AttachmentInput, validateAttachmentFile, validateAttachmentTitle } from "./AttachmentInput";

const typecheckCreatedWork = createTypechekerFromExample({
    slug: "",
}, "work");

enum AttachmentKind {
    DownloadWindows = "DownloadWindows",
    DownloadLinux = "DownloadLinux",
    DownloadMac = "DownloadMac",
}

export const WorkEditor = (props: { slug?: string }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const isEdit = props.slug != null;

    const [serverError, setServerError] = useState("");

    const [slug, setSlug] = useState("");
    const [title, setTitle] = useState("");
    const [shortDesc, setShortDesc] = useState("");
    const [longDesc, setLongDesc] = useState("");
    const [newAttachmentKind, setNewAttachmentKind] = useState<AttachmentKind | "unset">("unset");
    const [files, setFiles] = useState<Attachment[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState<string>("");
    // TODO: list of links (InputList with LinkInput, init the array state here)

    const isAttachmentKindTaken = (kind: AttachmentKind) => {
        return !files.every(({ attachment_kind }) => attachment_kind !== kind.toString());
    };
    const addNewAttachment = () => {
        assert(newAttachmentKind != "unset", "should not be able to add new attachment with null kind");
        setFiles(files.concat({
            attachment_kind: newAttachmentKind,
            content_type: "",
            bytes_base64: "",
            filename: "",
        }));
        setNewAttachmentKind("unset");
    };

    const addNewTag = () => {
        if (newTag === "" || tags.find((tag) => tag.toLowerCase() === newTag.toLowerCase())) {
            return;
        }
        setTags(tags.concat(newTag));
        setNewTag("");
    };
    const makeTagRemoverFn = (tagToRemove: string) => () => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    const mapGetResult = useCallback(typecheckWork, []);
    const {
        result: slugFindResult,
        loading: originalWorkLoading,
    } = useApiFetch(`/work/${props.slug ?? ""}`, mapGetResult);
    useEffect(() => {
        if (slugFindResult != null) {
            if ("value" in slugFindResult) {
                setSlug(slugFindResult.value.slug);
                setTitle(slugFindResult.value.title);
                setShortDesc(slugFindResult.value.short_description);
                setLongDesc(slugFindResult.value.long_description);
                setFiles(slugFindResult.value.attachments);
                setTags(slugFindResult.value.tags.map(({ tag }) => tag));
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
    const validateShortDesc = createLengthValidator(1, 80);
    const validateLongDesc = createLengthValidator(1, 10000);

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
            body: JSON.stringify({
                slug,
                title,
                short_description: shortDesc,
                long_description: longDesc,
                attachments: [
                    ...files,
                ],
                links: [],
                tags: tags.map((tag) => ({ tag })),
            }),
        });
    }, [isEdit, slug, title, shortDesc, longDesc, files, tags]);

    const submitHandler: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        setShouldValidate(true);
        const validArguments = validateSlug(slug) == null
            && validateTitle(title) == null
            && validateShortDesc(shortDesc) == null
            && validateLongDesc(longDesc) == null
            && files.every((a) => validateAttachmentTitle(a, t) == null && validateAttachmentFile(a, t) == null);
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
            <Stack gap={3}>
                <ValidatedTextInput pfx={"work-editor"} name={"slug"} shouldValidate={shouldValidate}
                    input={slug} setInput={setSlug} validate={validateSlug} showPlaceholder={isEdit && originalWorkLoading} />
                <ValidatedTextInput pfx={"work-editor"} name={"title"} shouldValidate={shouldValidate}
                    input={title} setInput={setTitle} validate={validateTitle} showPlaceholder={isEdit && originalWorkLoading} />
                <ValidatedTextInput pfx={"work-editor"} name={"short-description"} shouldValidate={shouldValidate}
                    input={shortDesc} setInput={setShortDesc} validate={validateShortDesc} showPlaceholder={isEdit && originalWorkLoading} />
                <ValidatedTextInput textarea pfx={"work-editor"} name={"long-description"} shouldValidate={shouldValidate}
                    input={longDesc} setInput={setLongDesc} validate={validateLongDesc} showPlaceholder={isEdit && originalWorkLoading} />

                <h3>{t("attachments")}</h3>
                <Row xs={1} lg={2} xl={3}>
                    {files.map((a, index) => <Col key={`${a.attachment_kind}.${a.title ?? ""}`} className="p-2">
                        <AttachmentInput shouldValidate={shouldValidate}
                            showPlaceholder={isEdit && originalWorkLoading} attachments={[files, setFiles]} index={index} />
                    </Col>)}
                    <Col className="d-flex justify-content-around align-items-center p-2">
                        <Stack gap={2} className="align-self-center">
                            <Form.Select
                                isInvalid={newAttachmentKind !== "unset" && isAttachmentKindTaken(newAttachmentKind)}
                                value={newAttachmentKind} onChange={(({ target }) => { setNewAttachmentKind(target.value as AttachmentKind); })}>
                                <option value="unset">{t("work-editor.attachment-kind-unset")}</option>
                                {Object.values(AttachmentKind)
                                    .filter((kind) => !isAttachmentKindTaken(kind))
                                    .map((kind) => <option key={kind} value={kind}>{t(`work-editor.${kind.toString()}.name`)}</option>)}
                            </Form.Select>
                            <Button onClick={addNewAttachment} disabled={newAttachmentKind === "unset" || isAttachmentKindTaken(newAttachmentKind)}>
                                {t("work-editor.add-attachment")}
                            </Button>
                        </Stack>
                    </Col>
                </Row>

                <h3>{t("tags")}</h3>
                <div className="d-flex flex-row">
                    {tags.map((tag) => <div key={tag} className="me-1 bg-primary text-light px-2 py-1 d-flex align-items-center" style={{ fontWeight: 600, borderRadius: 5 }}>
                        {tag}
                        <CloseButton style={{ fontSize: 14, marginLeft: 4 }} onClick={makeTagRemoverFn(tag)} />
                    </div>)}
                </div>
                <Form onSubmit={(event) => {
                    event.preventDefault();
                    addNewTag();
                }}>
                    <ValidatedTextInput name={"tag"} pfx={"work-editor"} shouldValidate={false} validate={() => null} input={newTag} setInput={setNewTag}
                        attachedButton={{ type: "submit", text: t("action.add-new-tag") }} />
                </Form>

                {serverError && <p className="text-danger">
                    {t(`error.${serverError}`)}
                </p>}

                <Form onSubmit={submitHandler} noValidate>
                    <Form.Group className="py-3">
                        <Button type="submit" disabled={loading || reqParams.body === latestSentReqParams.body}>
                            {loading && <Spinner size="sm" role="status" aria-hidden="true" style={{ marginRight: 6 }} />}
                            {isEdit && reqParams.body === latestSentReqParams.body && t("action.edit-work-saved")}
                            {isEdit && reqParams.body !== latestSentReqParams.body && t("action.edit-work")}
                            {!isEdit && t("action.create-work")}
                        </Button>
                    </Form.Group>
                </Form>
            </Stack>
        </Container>
    );
};