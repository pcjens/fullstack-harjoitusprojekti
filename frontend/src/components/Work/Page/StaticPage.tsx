import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Stack from "react-bootstrap/Stack";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import ReactMarkdown from "react-markdown";

import { Work } from "..";
import { getAttachmentUrl } from "../../../util/attachments";
import { useTranslation } from "react-i18next";

const DOWNLOADABLE_ATTACHMENT_KINDS = [
    "DownloadWindows",
    "DownloadLinux",
    "DownloadMac",
];

export const WorkStaticPage = ({ work }: { work: Work }) => {
    const { t } = useTranslation();

    const downloadables = work.attachments
        .filter(({ attachment_kind }) => DOWNLOADABLE_ATTACHMENT_KINDS.includes(attachment_kind));
    const videos = work.attachments.filter(({ attachment_kind }) => attachment_kind === "Trailer");
    const screenshots = work.attachments.filter(({ attachment_kind }) => attachment_kind === "Screenshot");

    return (
        <Container className="p-3">
            <Row>
                <Col md={12} lg={7}>
                    <h1>{work.title}</h1>
                    <ReactMarkdown>{work.long_description}</ReactMarkdown>
                </Col>
                <Col md={12} lg={5}>
                    {downloadables.length > 0 && <>
                        <h3>{t("downloads")}</h3>
                        <Stack gap={2} className="mb-3">
                            {downloadables.map((attachment) => (
                                <div key={attachment.id}>
                                    <Button className="me-2" size="sm" as="a"
                                        href={getAttachmentUrl(attachment)} download={attachment.filename}>
                                        {t("action.download")}
                                    </Button>
                                    {attachment.filename}
                                </div>
                            ))}
                        </Stack>
                    </>}
                    <Stack gap={3}>
                        {videos.map((video) => <video key={video.id} controls className="rounded">
                            <source src={getAttachmentUrl(video)} />
                        </video>)}
                        {screenshots.map((screenshot) => <img key={screenshot.id} className="rounded"
                            src={getAttachmentUrl(screenshot)}
                        />)}
                    </Stack>
                </Col>
            </Row>
        </Container>
    );
};
