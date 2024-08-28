ALTER TABLE work_attachments ADD COLUMN
    big_file_uuid VARCHAR(36) REFERENCES big_file_parts ( uuid ) ON DELETE SET NULL ON UPDATE CASCADE;
