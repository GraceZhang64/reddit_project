"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const tests = [];
// Test 1: Prisma Client Connection (DATABASE_URL - should use pooler)
tests.push({
    name: 'Prisma Client (DATABASE_URL - Pooler)',
    test: async () => {
        try {
            const prisma = new client_1.PrismaClient();
            const result = await prisma.$queryRaw `SELECT version(), current_database(), current_user`;
            await prisma.$disconnect();
            return {
                success: true,
                message: 'Prisma connection successful',
                details: result
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Prisma connection failed: ${error.message}`,
                details: error
            };
        }
    }
});
// Test 2: Direct PostgreSQL Connection (DIRECT_URL) - using Prisma with direct URL
tests.push({
    name: 'Direct PostgreSQL (DIRECT_URL)',
    test: async () => {
        try {
            const directUrl = process.env.DIRECT_URL;
            if (!directUrl) {
                return {
                    success: false,
                    message: 'DIRECT_URL environment variable not set'
                };
            }
            // Create a Prisma client with the direct URL for testing
            const directPrisma = new client_1.PrismaClient({
                datasources: {
                    db: {
                        url: directUrl
                    }
                }
            });
            const result = await directPrisma.$queryRaw `SELECT version(), current_database(), current_user`;
            await directPrisma.$disconnect();
            return {
                success: true,
                message: 'Direct connection successful',
                details: result
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Direct connection failed: ${error.message}`,
                details: error
            };
        }
    }
});
// Test 3: Supabase Client Connection
tests.push({
    name: 'Supabase Client',
    test: async () => {
        try {
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
            if (!supabaseUrl || !supabaseAnonKey) {
                return {
                    success: false,
                    message: 'SUPABASE_URL or SUPABASE_ANON_KEY not set'
                };
            }
            const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
            const { data, error } = await supabase.from('users').select('count').limit(1);
            if (error) {
                return {
                    success: false,
                    message: `Supabase query failed: ${error.message}`,
                    details: error
                };
            }
            return {
                success: true,
                message: 'Supabase client connection successful',
                details: { tableAccess: 'users table accessible' }
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Supabase connection failed: ${error.message}`,
                details: error
            };
        }
    }
});
// Test 4: Environment Variables Check
tests.push({
    name: 'Environment Variables',
    test: async () => {
        const envVars = {
            DATABASE_URL: process.env.DATABASE_URL ? '✓ Set' : '✗ Missing',
            DIRECT_URL: process.env.DIRECT_URL ? '✓ Set' : '✗ Missing',
            SUPABASE_URL: process.env.SUPABASE_URL ? '✓ Set' : '✗ Missing',
            SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing'
        };
        const allSet = Object.values(envVars).every(v => v.includes('✓'));
        return {
            success: allSet,
            message: allSet ? 'All required environment variables are set' : 'Some environment variables are missing',
            details: envVars
        };
    }
});
// Test 5: Connection String Format Validation
tests.push({
    name: 'Connection String Format',
    test: async () => {
        const issues = [];
        const recommendations = [];
        const dbUrl = process.env.DATABASE_URL;
        const directUrl = process.env.DIRECT_URL;
        if (dbUrl) {
            // Check if DATABASE_URL uses pooler (port 6543) or direct (port 5432)
            if (dbUrl.includes(':6543/')) {
                recommendations.push('DATABASE_URL uses pooler port (6543) - Good for production');
            }
            else if (dbUrl.includes(':5432/')) {
                recommendations.push('DATABASE_URL uses direct port (5432) - Consider using pooler (6543) for better connection management');
            }
            // Check for Supabase pattern
            if (dbUrl.includes('.supabase.co')) {
                recommendations.push('DATABASE_URL appears to be Supabase connection');
            }
        }
        if (directUrl) {
            // DIRECT_URL should use port 5432
            if (directUrl.includes(':6543/')) {
                issues.push('DIRECT_URL should use port 5432, not 6543 (pooler port)');
            }
            else if (directUrl.includes(':5432/')) {
                recommendations.push('DIRECT_URL correctly uses direct port (5432)');
            }
            if (directUrl.includes('.supabase.co')) {
                recommendations.push('DIRECT_URL appears to be Supabase connection');
            }
        }
        // Check if both URLs point to same database
        if (dbUrl && directUrl) {
            const dbHost = dbUrl.match(/@([^:]+)/)?.[1];
            const directHost = directUrl.match(/@([^:]+)/)?.[1];
            if (dbHost && directHost && dbHost === directHost) {
                recommendations.push('Both connection strings point to the same host');
            }
        }
        return {
            success: issues.length === 0,
            message: issues.length === 0
                ? 'Connection string formats look good'
                : `Found ${issues.length} issue(s)`,
            details: {
                issues,
                recommendations
            }
        };
    }
});
// Run all tests
async function runTests() {
    console.log('\n🔍 Testing Supabase Database Connections...\n');
    console.log('='.repeat(60));
    const results = await Promise.all(tests.map(async (test) => {
        const result = await test.test();
        return { name: test.name, ...result };
    }));
    let allPassed = true;
    results.forEach((result, index) => {
        const icon = result.success ? '✅' : '❌';
        console.log(`\n${index + 1}. ${icon} ${result.name}`);
        console.log(`   ${result.message}`);
        if (result.details && !result.success) {
            console.log(`   Details:`, JSON.stringify(result.details, null, 2));
        }
        else if (result.details && result.success && result.name === 'Environment Variables') {
            console.log(`   Details:`, result.details);
        }
        if (!result.success) {
            allPassed = false;
        }
    });
    console.log('\n' + '='.repeat(60));
    if (allPassed) {
        console.log('\n✅ All connection tests passed!\n');
    }
    else {
        console.log('\n❌ Some tests failed. Please check the errors above.\n');
        console.log('\n📋 Supabase Connection Setup Guide:');
        console.log('\nFor Supabase with connection pooling, you need:');
        console.log('\n1. DATABASE_URL (Pooler - for Prisma queries):');
        console.log('   Format: postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres?pgbouncer=true');
        console.log('   OR: postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres');
        console.log('\n2. DIRECT_URL (Direct - for migrations):');
        console.log('   Format: postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres');
        console.log('\n3. SUPABASE_URL:');
        console.log('   Format: https://[PROJECT].supabase.co');
        console.log('\n4. SUPABASE_ANON_KEY:');
        console.log('   Get from: Project Settings > API > anon/public key');
        console.log('\n💡 Tips:');
        console.log('   - Use pooler (port 6543) for DATABASE_URL to handle more concurrent connections');
        console.log('   - Use direct (port 5432) for DIRECT_URL for migrations and schema operations');
        console.log('   - Both should point to the same Supabase project\n');
    }
    process.exit(allPassed ? 0 : 1);
}
runTests().catch(console.error);
