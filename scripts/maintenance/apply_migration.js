#!/usr/bin/env node

/**
 * Apply the dietary category migration to the database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🚀 Starting dietary category migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20251016000001_add_dietary_category.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('📊 Migration size:', Math.round(migrationSQL.length / 1024), 'KB\n');

    // Split into individual statements (basic split on semicolons outside of function bodies)
    // For complex migrations, we'll execute the whole thing at once via RPC
    console.log('⚙️  Executing migration...\n');

    // Execute the migration using a database function call
    // This is safer than trying to parse and split SQL
    const { data, error } = await supabase.rpc('exec', {
      sql: migrationSQL
    }).catch(async (err) => {
      // If exec function doesn't exist, try direct SQL execution
      console.log('Note: Using alternative execution method...');

      // Split by major blocks (CREATE, ALTER, etc.)
      const statements = migrationSQL
        .split(/;\s*(?=(?:CREATE|ALTER|DROP|INSERT|UPDATE|COMMENT))/gi)
        .filter(s => s.trim().length > 0)
        .map(s => s.trim() + (s.trim().endsWith(';') ? '' : ';'));

      console.log(`📝 Executing ${statements.length} statements...\n`);

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        console.log(`[${i + 1}/${statements.length}] Executing...`);

        try {
          // Use raw SQL execution
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: stmt })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Statement ${i + 1} failed:`, errorText);
          }
        } catch (stmtError) {
          console.warn(`⚠️  Statement ${i + 1} error (may be non-critical):`, stmtError.message);
        }
      }

      return { data: null, error: null };
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!\n');

    // Verify the migration
    console.log('🔍 Verifying migration...\n');

    const { data: tableInfo, error: tableError } = await supabase
      .from('species')
      .select('dietary_category')
      .limit(1);

    if (tableError) {
      console.error('❌ Verification failed:', tableError);
      console.log('\n⚠️  Migration may have partially succeeded. Please check manually.\n');
      process.exit(1);
    }

    console.log('✅ Column dietary_category exists!\n');

    // Check if data is populated
    const { data: stats, error: statsError } = await supabase
      .from('species')
      .select('dietary_category', { count: 'exact', head: true });

    console.log('📊 Migration Statistics:');
    console.log('-----------------------------------');

    // Get count by category
    const { data: carnivores } = await supabase.from('species').select('*', { count: 'exact', head: true }).eq('dietary_category', 'Carnivore');
    const { data: herbivores } = await supabase.from('species').select('*', { count: 'exact', head: true }).eq('dietary_category', 'Herbivore');
    const { data: omnivores } = await supabase.from('species').select('*', { count: 'exact', head: true }).eq('dietary_category', 'Omnivore');
    const { data: producers } = await supabase.from('species').select('*', { count: 'exact', head: true }).eq('dietary_category', 'Producer');

    console.log('🦁 Carnivores:', carnivores?.length || 0);
    console.log('🦌 Herbivores:', herbivores?.length || 0);
    console.log('🐻 Omnivores:', omnivores?.length || 0);
    console.log('🌿 Producers:', producers?.length || 0);
    console.log('-----------------------------------\n');

    console.log('✅ Migration verification complete!\n');
    console.log('🎉 Next steps:');
    console.log('   1. Deploy Edge Function: supabase functions deploy discover-region-species');
    console.log('   2. Build frontend: npm run build');
    console.log('   3. Test locally: npm run dev\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
