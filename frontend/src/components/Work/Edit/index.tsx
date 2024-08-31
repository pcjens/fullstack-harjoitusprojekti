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
import { ApiError, useApiFetch } from "../../../hooks/useApiFetch";
import { assert, createTypechekerFromExample } from "../../../util/helpers";
import { Attachment, AttachmentInput } from "./AttachmentInput";
import { validateAttachmentFile, validateAttachmentTitle } from "./validators";
import { readBlobToBase64 } from "../../../util/fileReader";
import { ReorderableList } from "../../ReorderableList";

const typecheckCreatedWork = createTypechekerFromExample({
    slug: "",
    attachments: [{
        id: 0,
    }],
}, "work");

const typecheckCreatedFile = createTypechekerFromExample({
    uuid: "",
}, "file");

export const BIG_FILE_CHUNK_SIZE = 15000;

enum AttachmentKind {
    DownloadWindows = "DownloadWindows",
    DownloadLinux = "DownloadLinux",
    DownloadMac = "DownloadMac",
    CoverImage = "CoverImage",
    Trailer = "Trailer",
    Screenshot = "Screenshot",
}

const attachmentAccepts = (kind: string) => {
    switch (kind) {
    case AttachmentKind.CoverImage as string:
    case AttachmentKind.Screenshot as string:
        return "image/*";
    case AttachmentKind.Trailer as string:
        return "video/*";
    default:
        return undefined;
    }
};

export const WorkEditor = (props: { slug?: string }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const isEdit = props.slug != null;

    const [serverError, setServerError] = useState("");
    const [slugsInUse, setSlugsInUse] = useState<string[]>([]);

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
        (slug: string) => slug.search(/[^a-z0-9-]/) !== -1 ? t("input-not-alphadashnumeric") : null,
        (slug: string) => slugsInUse.includes(slug) ? t("error.SlugTaken") : null,
    );
    const validateTitle = createLengthValidator(1, 100);
    const validateShortDesc = createLengthValidator(1, 80);
    const validateLongDesc = createLengthValidator(1, 10000);

    const mapPostResult = useCallback(typecheckCreatedWork, []);
    const [reqParams, setReqParams] = useState<RequestInit>({});
    const [latestSentReqParams, setLatestSentReqParams] = useState<RequestInit>({});
    const {
        refetch: createWork,
        loading: workSubmitLoading,
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
                    ...files.map(({ bytes_base64: bytes, ...file }) => ({
                        attachment_kind: file.attachment_kind,
                        filename: file.filename,
                        title: file.title,
                        content_type: file.content_type,
                        bytes_base64: typeof bytes === "string" ? bytes : "",
                        big_file_uuid: file.big_file_uuid,
                    })),
                ],
                links: [],
                tags: tags.map((tag) => ({ tag })),
            }),
        });
    }, [isEdit, slug, title, shortDesc, longDesc, files, tags]);

    const mapFilePostResult = useCallback(typecheckCreatedFile, []);
    const { refetch: createFile } = useApiFetch("/work/file", mapFilePostResult, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
    }, true);

    const [attachmentUploadsLoading, setAttachmentUploadsLoading] = useState(false);

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
            setAttachmentUploadsLoading(true);
            const result = await createWork();

            if ("userError" in result) {
                setLatestSentReqParams({});
                setServerError(result.userError);
                if (result.userError === ApiError.SlugTaken) {
                    setSlugsInUse(slugsInUse.concat(slug));
                    setServerError("");
                }
                return;
            }

            // Upload any big attachments using the file upload API (which uploads files in many parts)
            try {
                for (let i = 0; i < files.length; i++) {
                    const attachmentId = result.value.attachments[i].id;
                    const file = files[i].bytes_base64;
                    if (typeof file !== "string") {
                        const { size: fileSize } = file;
                        let previousPartUuid = null;
                        files[i].uploadProgress = 0;
                        for (let offset = 0; offset < fileSize; offset += BIG_FILE_CHUNK_SIZE) {
                            const slice = file.slice(offset, Math.min(offset + BIG_FILE_CHUNK_SIZE, fileSize), file.type);
                            const sliceBytesBase64 = await readBlobToBase64(slice);
                            const uploadResult = await createFile({
                                body: JSON.stringify({
                                    work_attachment_id: attachmentId,
                                    previous_uuid: previousPartUuid,
                                    part_bytes_base64: sliceBytesBase64,
                                }),
                            });
                            if ("userError" in uploadResult) {
                                throw new Error(uploadResult.userError);
                            }
                            previousPartUuid = uploadResult.value.uuid;
                            if (offset === 0) {
                                // The big_file_uuid of the attachment is
                                // set to the first part's uuid on the
                                // server side, replicate here for consistency
                                files[i].big_file_uuid = uploadResult.value.uuid;
                            }
                            files[i].uploadProgress = (offset + slice.size) / fileSize;
                            console.log("Part", previousPartUuid, "uploaded (", sliceBytesBase64.length, " base64 characters)");
                        }
                        files[i].uploadProgress = undefined;
                        files[i].bytes_base64 = "";
                        console.log("Finished file upload, big_file_uuid:", files[i].big_file_uuid);
                    }
                }
                setAttachmentUploadsLoading(false);
            } catch (err) {
                console.error("File upload error:", err);
                setLatestSentReqParams({});
                setServerError(ApiError.FileUpload);
                setAttachmentUploadsLoading(false);
                return;
            }

            if (isEdit) {
                setShouldValidate(false);
            }

            navigate(`/works/${result.value.slug}/edit`);
            setLatestSentReqParams(reqParams);
            setServerError("");
        };
        void submit();
    };

    const newFilesToUpload = files.find((file) => typeof file.bytes_base64 !== "string") != null;
    const changesInForm = reqParams.body !== latestSentReqParams.body || newFilesToUpload;
    const uploading = workSubmitLoading || attachmentUploadsLoading;

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
                <ValidatedTextInput textarea rows={10} pfx={"work-editor"} name={"long-description"} shouldValidate={shouldValidate}
                    input={longDesc} setInput={setLongDesc} validate={validateLongDesc} showPlaceholder={isEdit && originalWorkLoading} />

                <h3>{t("attachments")}</h3>
                <Row xs={1} lg={2} xl={3}>
                    {files.map((a, index) => <Col key={`${a.attachment_kind}.${a.title ?? ""}`} className="p-2">
                        <AttachmentInput accept={attachmentAccepts(a.attachment_kind)} shouldValidate={shouldValidate}
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
                <ReorderableList className="d-flex flex-row flex-wrap"
                    elements={tags} setElements={setTags} getKey={(tag) => tag}
                    Render={({ element: tag }) => {
                        return (
                            <div className="me-1 bg-primary text-light px-2 py-1 d-flex align-items-center" style={{ fontWeight: 600, borderRadius: 5 }}>
                                {tag}
                                <CloseButton style={{ fontSize: 14, marginLeft: 4 }} onClick={makeTagRemoverFn(tag)} />
                            </div>
                        );
                    }}
                />
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
                        <Button type="submit" disabled={uploading || !changesInForm}>
                            {uploading && <Spinner size="sm" role="status" aria-hidden="true" style={{ marginRight: 6 }} />}
                            {isEdit && !changesInForm && t("action.edit-work-saved")}
                            {isEdit && changesInForm && t("action.edit-work")}
                            {!isEdit && t("action.create-work")}
                        </Button>
                    </Form.Group>
                </Form>
            </Stack>
        </Container>
    );
};
