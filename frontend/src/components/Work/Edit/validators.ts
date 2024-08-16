import { TFunction } from "i18next";

import { Attachment } from "./AttachmentInput";

export const validateAttachmentTitle = (attachment: Attachment, t: TFunction) => {
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

export const validateAttachmentFile = (attachment: Attachment, t: TFunction) => {
    if (attachment.content_type === "") {
        return t("input-file-missing");
    }
    return null;
};
