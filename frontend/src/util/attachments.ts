import { Work } from "../components/Work";
import { VITE_API_BASE_URL } from "./config";

export function getAttachmentUrl(attachment: Work["attachments"][0]) {
    if (attachment.big_file_uuid) {
        return `${VITE_API_BASE_URL}/work/file/${attachment.big_file_uuid}`;
    } else {
        return `data:${attachment.content_type};base64,${attachment.bytes_base64}`;
    }
}
