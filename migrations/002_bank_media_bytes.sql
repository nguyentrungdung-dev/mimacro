-- Small, private bank illustrations for remote/serverless test deployments.
-- Student uploads remain a separate, unimplemented storage concern.
ALTER TABLE media ADD COLUMN data bytea;
