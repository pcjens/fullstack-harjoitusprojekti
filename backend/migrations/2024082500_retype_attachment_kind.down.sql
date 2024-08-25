ALTER TABLE work_attachments ADD COLUMN attachment_kind_str VARCHAR(16) NOT NULL DEFAULT '';
UPDATE work_attachments SET attachment_kind_str =
    CASE
        WHEN attachment_kind = 1 THEN 'DownloadWindows'
        WHEN attachment_kind = 2 THEN 'DownloadLinux'
        WHEN attachment_kind = 3 THEN 'DownloadMac'
        WHEN attachment_kind = 4 THEN 'CoverImage'
        WHEN attachment_kind = 5 THEN 'Trailer'
        WHEN attachment_kind = 6 THEN 'Screenshot'
        ELSE ''
    END;
ALTER TABLE work_attachments DROP COLUMN attachment_kind;
ALTER TABLE work_attachments RENAME COLUMN attachment_kind_str TO attachment_kind;
