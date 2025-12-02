"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
async function applyMigration() {
    console.log('Applying community_members migration...');
    const migrationSQL = `
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
  DROP CONSTRAINT IF EXISTS "community_members_user_id_fkey";
ALTER TABLE "community_members"
  ADD CONSTRAINT "community_members_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "community_members"
  DROP CONSTRAINT IF EXISTS "community_members_community_id_fkey";
ALTER TABLE "community_members"
  ADD CONSTRAINT "community_members_community_id_fkey"
  FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
  `;
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
        if (error) {
            console.error('Migration failed:', error);
            console.log('\nTrying alternative approach...');
            // Try direct query
            const { error: directError } = await supabase
                .from('_prisma_migrations')
                .select('*')
                .limit(1);
            if (directError) {
                console.error('Direct query also failed:', directError);
                console.log('\n⚠️  Please run this SQL manually in Supabase SQL Editor:');
                console.log('https://app.supabase.com/project/ieorilunmzvirhckifei/sql');
                console.log('\n' + migrationSQL);
            }
        }
        else {
            console.log('✅ Migration applied successfully!');
        }
    }
    catch (err) {
        console.error('Unexpected error:', err);
        console.log('\n⚠️  Please run this SQL manually in Supabase SQL Editor:');
        console.log('https://app.supabase.com/project/ieorilunmzvirhckifei/sql');
        console.log('\n' + migrationSQL);
    }
}
applyMigration();
