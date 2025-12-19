-- Update ecoregion names to match WWF/CSV naming convention

UPDATE ecoregions SET name = 'Amazon and Guianas' WHERE ecoregion_id = '203';
UPDATE ecoregions SET name = 'Madagascar' WHERE ecoregion_id = '204';
UPDATE ecoregions SET name = 'Borneo' WHERE ecoregion_id = '205';

-- Verify the updates
SELECT ecoregion_id, name, realm FROM ecoregions ORDER BY name;
