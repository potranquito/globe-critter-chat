-- Globe Critter Chat: Gamification System - Seed Data
-- Created: 2025-10-10
-- Description: Initial seed data for global_health and example data

-- ============================================================================
-- INITIALIZE GLOBAL HEALTH (Singleton)
-- ============================================================================

INSERT INTO public.global_health (id, current_health, total_lessons_completed, total_users, updated_at)
VALUES (1, 0, 0, 0, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- EXAMPLE ACHIEVEMENTS (For reference - will be earned by users)
-- ============================================================================

-- These are not stored in a table, but documented here for reference
-- Achievement IDs and their meanings:

-- MILESTONE ACHIEVEMENTS
-- - first_lesson: Complete your first lesson
-- - streak_7: Maintain a 7-day learning streak
-- - lessons_10: Complete 10 lessons
-- - lessons_50: Complete 50 lessons
-- - lessons_100: Complete 100 lessons

-- REGION ACHIEVEMENTS
-- - [region_name]_explorer: Complete 50% of locations in a region
-- - [region_name]_master: Complete 100% of locations in a region

-- THREAT ACHIEVEMENTS
-- - fire_spotter: Complete a lesson about wildfire threats
-- - quake_aware: Complete a lesson about earthquake threats
-- - habitat_defender: Complete a lesson about habitat loss

-- SPECIES ACHIEVEMENTS
-- - endangered_champion: Learn about 10 endangered species (CR, EN)
-- - biodiversity_expert: Learn about 50 different species
-- - bird_watcher: Learn about 20 different bird species
-- - plant_enthusiast: Learn about 15 different plant species

-- CONTRIBUTION ACHIEVEMENTS
-- - health_hero_100: Contribute 100 health points
-- - health_hero_500: Contribute 500 health points
-- - health_hero_1000: Contribute 1000 health points

-- ============================================================================
-- EXAMPLE SPECIES (Common wildlife - more added through API calls)
-- ============================================================================

-- Example: Iconic endangered species
INSERT INTO public.species (scientific_name, common_name, species_type, conservation_status, badge_icon, badge_rarity, description)
VALUES
  -- Mammals
  ('Ursus maritimus', 'Polar Bear', 'mammal', 'VU', '🐻‍❄️', 'epic', 'The polar bear is a hypercarnivorous bear whose native range lies largely within the Arctic Circle.'),
  ('Panthera tigris', 'Tiger', 'mammal', 'EN', '🐯', 'legendary', 'The tiger is the largest living cat species and a member of the genus Panthera.'),
  ('Loxodonta africana', 'African Elephant', 'mammal', 'EN', '🐘', 'legendary', 'The African elephant is the largest living terrestrial animal.'),
  ('Pongo abelii', 'Sumatran Orangutan', 'mammal', 'CR', '🦧', 'legendary', 'The Sumatran orangutan is one of the three species of orangutans, critically endangered.'),
  ('Gorilla beringei', 'Eastern Gorilla', 'mammal', 'CR', '🦍', 'legendary', 'The eastern gorilla is a critically endangered species of the genus Gorilla.'),

  -- Birds
  ('Haliaeetus leucocephalus', 'Bald Eagle', 'bird', 'LC', '🦅', 'rare', 'The bald eagle is a bird of prey found in North America, once endangered but now recovered.'),
  ('Aptenodytes forsteri', 'Emperor Penguin', 'bird', 'NT', '🐧', 'epic', 'The emperor penguin is the tallest and heaviest of all living penguin species.'),
  ('Strix occidentalis', 'Spotted Owl', 'bird', 'NT', '🦉', 'rare', 'The spotted owl is a species of owl found in old-growth forests of western North America.'),
  ('Gymnogyps californianus', 'California Condor', 'bird', 'CR', '🦅', 'legendary', 'The California condor is a New World vulture, the largest North American land bird.'),

  -- Reptiles & Amphibians
  ('Gopherus agassizii', 'Desert Tortoise', 'reptile', 'VU', '🐢', 'epic', 'The desert tortoise is a species of tortoise native to the Mojave and Sonoran Deserts.'),
  ('Alligator mississippiensis', 'American Alligator', 'reptile', 'LC', '🐊', 'uncommon', 'The American alligator is a large crocodilian reptile found in the southeastern United States.'),

  -- Marine Life
  ('Balaenoptera musculus', 'Blue Whale', 'mammal', 'EN', '🐋', 'legendary', 'The blue whale is a marine mammal and the largest animal known to have ever existed.'),
  ('Chelonia mydas', 'Green Sea Turtle', 'reptile', 'EN', '🐢', 'epic', 'The green sea turtle is a large sea turtle of the family Cheloniidae.'),

  -- Plants (examples)
  ('Sequoiadendron giganteum', 'Giant Sequoia', 'plant', 'EN', '🌲', 'rare', 'The giant sequoia is the world''s largest tree by volume, native to California.'),
  ('Yucca brevifolia', 'Joshua Tree', 'plant', 'VU', '🌵', 'uncommon', 'The Joshua tree is a plant species native to the Mojave Desert.')
ON CONFLICT (scientific_name) DO NOTHING;

-- ============================================================================
-- EXAMPLE REGIONS & LOCATIONS (Will be dynamically created via API)
-- ============================================================================

-- These are examples - real data will be created when users search/explore

-- Example Region: Las Vegas (Mojave Desert)
INSERT INTO public.regions (name, center_lat, center_lng, country, state_province)
VALUES ('Las Vegas, NV', 36.1699, -115.1398, 'USA', 'Nevada')
ON CONFLICT (name, center_lat, center_lng) DO NOTHING
RETURNING id AS las_vegas_region_id;

-- Example Locations in Las Vegas (will be discovered via API in practice)
-- These are placeholders to show the structure

INSERT INTO public.locations (
  region_id,
  name,
  type,
  center_lat,
  center_lng,
  description,
  health_value,
  difficulty_level
)
SELECT
  id,
  'Desert National Wildlife Refuge',
  'wildlife_refuge',
  36.4652,
  -115.2506,
  'The Desert National Wildlife Refuge is the largest wildlife refuge in the lower 48 states.',
  5,
  'medium'
FROM public.regions WHERE name = 'Las Vegas, NV'
ON CONFLICT (region_id, name) DO NOTHING;

-- ============================================================================
-- CLEANUP JOBS (Scheduled via pg_cron or external cron)
-- ============================================================================

-- Note: These should be run periodically (e.g., daily via cron job)

-- Clean expired cache entries (run daily)
-- SELECT clean_expired_cache();

-- Clean expired lessons (run daily)
-- SELECT clean_expired_lessons();

-- ============================================================================
-- HELPER VIEWS (Optional - for easier querying)
-- ============================================================================

-- View: User leaderboard
CREATE OR REPLACE VIEW public.user_leaderboard AS
SELECT
  u.id,
  u.username,
  u.avatar_url,
  u.health_contributed,
  u.total_lessons_completed,
  COUNT(DISTINCT ub.id) as badge_count,
  RANK() OVER (ORDER BY u.health_contributed DESC) as rank
FROM public.users u
LEFT JOIN public.user_badges ub ON u.id = ub.user_id
GROUP BY u.id, u.username, u.avatar_url, u.health_contributed, u.total_lessons_completed
ORDER BY u.health_contributed DESC
LIMIT 100;

-- View: Region progress summary
CREATE OR REPLACE VIEW public.region_progress AS
SELECT
  r.id,
  r.name,
  r.center_lat,
  r.center_lng,
  r.total_locations,
  r.completed_locations,
  r.completion_percentage,
  COUNT(DISTINCT l.id) as actual_location_count,
  COUNT(DISTINCT uc.id) as total_completions
FROM public.regions r
LEFT JOIN public.locations l ON r.id = l.region_id
LEFT JOIN public.user_completions uc ON l.id = uc.location_id
GROUP BY r.id, r.name, r.center_lat, r.center_lng, r.total_locations, r.completed_locations, r.completion_percentage
ORDER BY r.completion_percentage DESC, r.total_completions DESC;

-- View: Popular species
CREATE OR REPLACE VIEW public.popular_species AS
SELECT
  s.id,
  s.common_name,
  s.scientific_name,
  s.species_type,
  s.conservation_status,
  s.badge_icon,
  s.badge_rarity,
  COUNT(DISTINCT ub.user_id) as times_earned,
  COUNT(DISTINCT ls.location_id) as location_count
FROM public.species s
LEFT JOIN public.user_badges ub ON s.id = ub.species_id
LEFT JOIN public.location_species ls ON s.id = ls.species_id
GROUP BY s.id, s.common_name, s.scientific_name, s.species_type, s.conservation_status, s.badge_icon, s.badge_rarity
ORDER BY times_earned DESC, location_count DESC
LIMIT 50;

-- ============================================================================
-- PERMISSIONS FOR VIEWS
-- ============================================================================

GRANT SELECT ON public.user_leaderboard TO anon, authenticated;
GRANT SELECT ON public.region_progress TO anon, authenticated;
GRANT SELECT ON public.popular_species TO anon, authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Globe Critter Chat database initialized successfully!';
  RAISE NOTICE 'Schema version: 1.0.0';
  RAISE NOTICE 'Total tables: 11';
  RAISE NOTICE 'Total views: 3';
END $$;
