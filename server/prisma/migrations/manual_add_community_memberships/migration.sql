-- CreateTable: CommunityMember
CREATE TABLE IF NOT EXISTS "community_members" (
  "user_id" UUID NOT NULL,
  "community_id" INTEGER NOT NULL,
  "joined_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "community_members_pkey" PRIMARY KEY ("user_id", "community_id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_members_user" ON "community_members" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_members_community" ON "community_members" ("community_id");

-- FKs
ALTER TABLE "community_members"
  ADD CONSTRAINT "community_members_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "community_members"
  ADD CONSTRAINT "community_members_community_id_fkey"
  FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
