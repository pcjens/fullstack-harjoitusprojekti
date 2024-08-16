import { Dispatch, SetStateAction, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import CloseButton from "react-bootstrap/CloseButton";

import { validateAttachmentFile, validateAttachmentTitle } from "./validators";

export interface Attachment {
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
    accept?: string,
}

export const AttachmentInput = (props: AttachmentInputProps) => {
    const { t } = useTranslation();
    const [attachments, setAttachments] = props.attachments;

    const attachment = attachments[props.index];
    const setAttachment = (attachment: Attachment) => {
        console.log("updating attachment", props.index, "with", attachment);
        setAttachments(attachments.map((original, i) => i === props.index ? attachment : original));
    };
    const removeAttachment = () => {
        setAttachments(attachments.filter((_a, i) => i !== props.index));
    };

    // Update the file <input> with  the current attachment's file if it's been
    // populated (i.e. when editing a work) and the <input> is unset.
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
        console.log("updating attachment based on <input> with id", fileInputId);
        const { files } = target;
        for (const file of files) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                const bytes_base64 = dataUrl.split(",", 2)[1];
                setAttachment({
                    ...attachment,
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
            <CloseButton style={{ float: "right" }} className="pe-3 pt-2" onClick={removeAttachment} />
            <Form.Label>{t(`${pfx}.${attachment.attachment_kind}.name`)} </Form.Label>
            <InputGroup hasValidation>
                <Row xs={1} sm={attachment.title != null ? 2 : 1}>
                    {attachment.title != null && <Col className="mb-1">
                        <Form.Control required
                            disabled={!!props.showPlaceholder}
                            placeholder={props.showPlaceholder ? t("input-loading") : undefined}
                            isInvalid={props.shouldValidate && errorTitle != null}
                            isValid={props.shouldValidate && errorTitle == null}
                            value={attachment.title}
                            onChange={(({ target }) => { setAttachment({ ...attachment, title: target.value }); })} />
                        {props.shouldValidate && errorTitle != null && <Form.Control.Feedback type="invalid">
                            {errorTitle}
                        </Form.Control.Feedback>}
                    </Col>}
                    <Col className="mb-1">
                        <Form.Control type="file" accept={props.accept} id={fileInputId}
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
