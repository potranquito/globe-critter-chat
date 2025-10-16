#!/bin/bash

# Apply species classification migration
# This script applies the migration to add species_type, ui_group, and trophic_role columns

echo "🔧 Applying species classification migration..."
echo ""

# Get database URL from .env
DB_URL=$(grep SUPABASE_DB_URL .env | cut -d '=' -f2-)

if [ -z "$DB_URL" ]; then
  echo "❌ Error: SUPABASE_DB_URL not found in .env file"
  exit 1
fi

echo "📊 Database: ${DB_URL:0:30}..."
echo ""

# Apply migration
echo "📝 Applying migration: 20251015000001_add_species_classification.sql"
psql "$DB_URL" -f supabase/migrations/20251015000001_add_species_classification.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migration applied successfully!"
  echo ""
  echo "📈 Checking classification stats..."
  echo ""

  # Show classification stats
  psql "$DB_URL" -c "
    SELECT
      species_type,
      COUNT(*) as count,
      ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
    FROM species
    WHERE species_type IS NOT NULL
    GROUP BY species_type
    ORDER BY count DESC;
  "

  echo ""
  echo "🎭 UI Group distribution:"
  psql "$DB_URL" -c "
    SELECT
      ui_group,
      COUNT(*) as count
    FROM species
    WHERE ui_group IS NOT NULL
    GROUP BY ui_group
    ORDER BY count DESC;
  "

  echo ""
  echo "🍽️ Trophic Role distribution (top 10):"
  psql "$DB_URL" -c "
    SELECT
      trophic_role,
      COUNT(*) as count
    FROM species
    WHERE trophic_role IS NOT NULL
    GROUP BY trophic_role
    ORDER BY count DESC
    LIMIT 10;
  "

  echo ""
  echo "🎉 All done! The backend classification is now active."
  echo ""
  echo "Next steps:"
  echo "  1. Restart your development server: npm run dev"
  echo "  2. Test filtering in the app"
  echo "  3. Frontend will use backend data when available, fall back to frontend classification otherwise"
else
  echo ""
  echo "❌ Migration failed. Please check the error above."
  exit 1
fi
