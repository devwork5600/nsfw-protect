-- Merge any duplicate usage rows for the same (apiKeyId, periodStart, periodEnd) that
-- may exist from before the API's check-then-increment race was fixed, keeping the
-- oldest row and summing counts into it, before the unique index below can be added.
WITH duplicates AS (
  SELECT
    "id",
    "apiKeyId",
    "periodStart",
    "periodEnd",
    "requestCount",
    "imageCount",
    "nsfwDetections",
    ROW_NUMBER() OVER (
      PARTITION BY "apiKeyId", "periodStart", "periodEnd"
      ORDER BY "createdAt", "id"
    ) AS rn
  FROM "usage_record"
  WHERE "apiKeyId" IS NOT NULL
),
totals AS (
  SELECT "apiKeyId", "periodStart", "periodEnd",
    SUM("requestCount") AS total_request_count,
    SUM("imageCount") AS total_image_count,
    SUM("nsfwDetections") AS total_nsfw_detections
  FROM duplicates
  GROUP BY "apiKeyId", "periodStart", "periodEnd"
  HAVING COUNT(*) > 1
)
UPDATE "usage_record" u
SET "requestCount" = t.total_request_count,
    "imageCount" = t.total_image_count,
    "nsfwDetections" = t.total_nsfw_detections
FROM duplicates d
JOIN totals t
  ON t."apiKeyId" = d."apiKeyId"
  AND t."periodStart" = d."periodStart"
  AND t."periodEnd" = d."periodEnd"
WHERE u."id" = d."id" AND d.rn = 1;

DELETE FROM "usage_record" u
USING (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "apiKeyId", "periodStart", "periodEnd"
      ORDER BY "createdAt", "id"
    ) AS rn
  FROM "usage_record"
  WHERE "apiKeyId" IS NOT NULL
) d
WHERE u."id" = d."id" AND d.rn > 1;

-- CreateIndex
CREATE UNIQUE INDEX "usage_record_apiKeyId_periodStart_periodEnd_key" ON "usage_record"("apiKeyId", "periodStart", "periodEnd");
