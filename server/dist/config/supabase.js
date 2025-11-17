"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabaseClient = getSupabaseClient;
exports.getSupabaseAdminClient = getSupabaseAdminClient;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}
function getSupabaseClient() {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase URL and Anon Key must be defined');
    }
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
}
function getSupabaseAdminClient() {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error('Supabase URL and Service Role Key must be defined for admin operations');
    }
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceRoleKey);
}
