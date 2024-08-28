import { Dispatch, SetStateAction, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import CloseButton from "react-bootstrap/CloseButton";
import ProgressBar from "react-bootstrap/ProgressBar";

import { validateAttachmentFile, validateAttachmentTitle } from "./validators";
import { readBlobToBase64 } from "../../../util/fileReader";
import { BIG_FILE_CHUNK_SIZE } from ".";

export interface Attachment {
    attachment_kind: string,
    content_type: string,
    filename: string,
    title?: string,
    /** The base64 bytes stored in the attachment, if the file is small enough, or a file that'll get uploaded. */
    bytes_base64: string | File,
    /** The uuid of the uploaded file (for bigger files that aren't stored in bytes_base64) */
    big_file_uuid?: string,

    uploadProgress?: number,
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

    // Update the file <input> with  the current attachment's files with the
    // proper filenames if it's already been populated (i.e. when editing a
    // work) but the <input> is unset.
    const fileInputId = `${attachment.attachment_kind}-${attachment.title ?? ""}FileInput`;
    useEffect(() => {
        if (attachment.content_type === "") {
            return;
        }
        const fileInput = document.getElementById(fileInputId);
        if (fileInput != null && "files" in fileInput && fileInput.files instanceof FileList && fileInput.files.length === 0) {
            const transfer = new DataTransfer();
            transfer.items.add(new File([new Blob()], attachment.filename, { type: attachment.content_type }));
            fileInput.files = transfer.files;
        }
    }, [fileInputId, attachment]);

    const updateFile = (target: EventTarget) => {
        if (!("files" in target && target.files instanceof FileList)) {
            return;
        }
        console.log("updating attachment based on <input> with id", fileInputId);
        const { files } = target;
        for (const file of files) {
            if (file.size > BIG_FILE_CHUNK_SIZE) {
                setAttachment({
                    ...attachment,
                    content_type: file.type,
                    bytes_base64: file,
                    filename: file.name,
                });
            } else {
                void readBlobToBase64(file)
                    .then((bytes_base64) => {
                        setAttachment({
                            ...attachment,
                            content_type: file.type,
                            bytes_base64,
                            filename: file.name,
                        });
                    });
            }
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
                        {attachment.uploadProgress != null &&
                            <ProgressBar animated now={attachment.uploadProgress * 100} className="my-1" />}
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
