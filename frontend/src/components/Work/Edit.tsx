import { Dispatch, FormEventHandler, SetStateAction, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import Spinner from "react-bootstrap/Spinner";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import CloseButton from "react-bootstrap/CloseButton";

import { typecheckWork } from ".";
import { ValidatedTextInput } from "../Forms";
import { useApiFetch } from "../../hooks/useApiFetch";
import { assert, createTypechekerFromExample } from "../../util/helpers";
import { TFunction } from "i18next";

const typecheckCreatedWork = createTypechekerFromExample({
    slug: "",
}, "work");

const validateAttachmentTitle = (attachment: Attachment, t: TFunction) => {
    if (attachment.title == null) {
        return null;
    }
    if (attachment.title.length < 1) {
        return t("input-too-short", { min: 1, max: 50 });
    }
    if (attachment.title.length > 50) {
        return t("input-too-long", { min: 1, max: 50 });
    }
    return null;
};

const validateAttachmentFile = (attachment: Attachment, t: TFunction) => {
    if (attachment.content_type === "") {
        return t("input-file-missing");
    }
    return null;
};

enum AttachmentKind {
    DownloadWindows = "DownloadWindows",
    DownloadLinux = "DownloadLinux",
    DownloadMac = "DownloadMac",
}

interface Attachment {
    attachment_kind: string,
    content_type: string,
    bytes_base64: string,
    filename: string,
    title?: string,
}
interface AttachmentInputProps {
    attachments: [Attachment[], Dispatch<SetStateAction<Attachment[]>>],
    index: number,
    showPlaceholder?: boolean,
    shouldValidate: boolean,
}
const AttachmentInput = (props: AttachmentInputProps) => {
    const { t } = useTranslation();
    const [attachments, setAttachments] = props.attachments;
    const attachment = attachments[props.index];

    const [title, setTitle] = useState("");
    const [editedAttachment, setEditedAttachment] = useState(attachment);

    const removeThisAttachment = () => {
        setAttachments(attachments.filter((_a, i) => i !== props.index));
    };

    useEffect(() => {
        if (editedAttachment.title != null) {
            setEditedAttachment({
                ...editedAttachment,
                title,
            });
        }
    }, [editedAttachment, setEditedAttachment, title]);

    useEffect(() => {
        attachments[props.index] = editedAttachment;
        console.log("updated attachment:", attachments[props.index]);
        setAttachments(attachments);
    }, [attachments, setAttachments, props.index, editedAttachment]);

    const fileInputId = `${attachment.attachment_kind}-${attachment.title ?? ""}FileInput`;
    useEffect(() => {
        if (attachment.content_type === "") {
            return;
        }
        const fileInput = document.getElementById(fileInputId);
        if (fileInput != null && "files" in fileInput && fileInput.files instanceof FileList && fileInput.files.length === 0) {
            const asyncOp = async () => {
                const attachmentBlob = await (await fetch(`data:${attachment.content_type};base64,${attachment.bytes_base64}`)).blob();
                const transfer = new DataTransfer();
                console.log("foo");
                transfer.items.add(new File([attachmentBlob], attachment.filename, { type: attachment.content_type }));
                fileInput.files = transfer.files;
            };
            void asyncOp();
        }
    }, [fileInputId, attachment]);

    const updateFile = (target: EventTarget) => {
        if (!("files" in target && target.files instanceof FileList)) {
            return;
        }
        const { files } = target;
        for (const file of files) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                const bytes_base64 = dataUrl.split(",", 2)[1];
                setEditedAttachment({
                    ...editedAttachment,
                    content_type: file.type,
                    bytes_base64,
                    filename: file.name,
                });
            };
            reader.readAsDataURL(file);
            break;
        }
    };

    const errorTitle: string | null = props.shouldValidate ? validateAttachmentTitle(attachment, t) : null;
    const errorFile: string | null = props.shouldValidate ? validateAttachmentFile(attachment, t) : null;

    const pfx = "work-editor";
    return (
        <Form.Group>
            <CloseButton style={{ float: "right" }} className="pe-3 pt-2" onClick={removeThisAttachment} />
            <Form.Label>{t(`${pfx}.${attachment.attachment_kind}.name`)} </Form.Label>
            <InputGroup hasValidation>
                <Row xs={1} sm={attachment.title != null ? 2 : 1}>
                    {attachment.title != null && <Col className="mb-1">
                        <Form.Control required
                            disabled={!!props.showPlaceholder}
                            placeholder={props.showPlaceholder ? t("input-loading") : undefined}
                            isInvalid={props.shouldValidate && errorTitle != null}
                            isValid={props.shouldValidate && errorTitle == null}
                            value={title} onChange={(({ target }) => { setTitle(target.value); })} />
                        {props.shouldValidate && errorTitle != null && <Form.Control.Feedback type="invalid">
                            {errorTitle}
                        </Form.Control.Feedback>}
                    </Col>}
                    <Col className="mb-1">
                        <Form.Control type="file" id={fileInputId}
                            disabled={!!props.showPlaceholder}
                            isInvalid={props.shouldValidate && errorFile != null}
                            isValid={props.shouldValidate && errorFile == null}
                            onChange={({ target }) => { updateFile(target); }} />
                        {props.shouldValidate && errorFile != null && <Form.Control.Feedback type="invalid">
                            {errorFile}
                        </Form.Control.Feedback>}
                    </Col>
                </Row>
            </InputGroup>
            <Form.Text muted>
                {t(`${pfx}.${attachment.attachment_kind}.help`)}
            </Form.Text>
        </Form.Group>
    );
};

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
    // TODO: list of links (InputList with LinkInput, init the array state here)
    // TODO: list of tags (probably doable with a single component, not an InputList)

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
                setShortDesc(slugFindResult.value.short_description);
                setLongDesc(slugFindResult.value.long_description);
                setFiles(slugFindResult.value.attachments);
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
            }),
        });
    }, [isEdit, slug, title, shortDesc, longDesc, files]);

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
            <Form onSubmit={submitHandler} noValidate>
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
                    {serverError && <p className="text-danger">
                        {t(`error.${serverError}`)}
                    </p>}
                    <Form.Group className="py-3">
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