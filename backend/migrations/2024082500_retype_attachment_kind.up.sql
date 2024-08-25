ALTER TABLE work_attachments ADD COLUMN attachment_kind_int INTEGER NOT NULL DEFAULT 0;
UPDATE work_attachments SET attachment_kind_int =
    CASE
        WHEN attachment_kind = 'DownloadWindows' THEN 1
        WHEN attachment_kind = 'DownloadLinux' THEN 2
        WHEN attachment_kind = 'DownloadMac' THEN 3
        WHEN attachment_kind = 'CoverImage' THEN 4
        WHEN attachment_kind = 'Trailer' THEN 5
        WHEN attachment_kind = 'Screenshot' THEN 6
        ELSE 0
    END;
ALTER TABLE work_attachments DROP COLUMN attachment_kind;
ALTER TABLE work_attachments RENAME COLUMN attachment_kind_int TO attachment_kind;
