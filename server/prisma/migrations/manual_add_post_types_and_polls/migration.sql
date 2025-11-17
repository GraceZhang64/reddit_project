-- CreateEnum
CREATE TYPE "post_type" AS ENUM ('text', 'link', 'image', 'video', 'poll', 'crosspost');

-- AlterTable: Add new columns to posts
ALTER TABLE "posts" 
  ADD COLUMN "post_type" "post_type" NOT NULL DEFAULT 'text',
  ADD COLUMN "link_url" TEXT,
  ADD COLUMN "video_url" TEXT,
  ADD COLUMN "media_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "crosspost_id" INTEGER;

-- CreateTable: Poll
CREATE TABLE "polls" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PollOption
CREATE TABLE "poll_options" (
    "id" SERIAL NOT NULL,
    "poll_id" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "poll_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PollVote
CREATE TABLE "poll_votes" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "option_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_posts_type" ON "posts"("post_type");

-- CreateIndex
CREATE INDEX "idx_posts_crosspost" ON "posts"("crosspost_id");

-- CreateIndex
CREATE INDEX "idx_polls_post" ON "polls"("post_id");

-- CreateIndex
CREATE INDEX "idx_poll_options_poll" ON "poll_options"("poll_id");

-- CreateIndex
CREATE INDEX "idx_poll_votes_user" ON "poll_votes"("user_id");

-- CreateIndex
CREATE INDEX "idx_poll_votes_option" ON "poll_votes"("option_id");

-- CreateIndex (Unique constraint for poll votes)
CREATE UNIQUE INDEX "poll_votes_user_id_option_id_key" ON "poll_votes"("user_id", "option_id");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_crosspost_id_fkey" FOREIGN KEY ("crosspost_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "poll_options"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

