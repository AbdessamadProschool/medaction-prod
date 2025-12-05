-- 1. Clean existing data (Optional: remove if you want to keep existing data)
TRUNCATE TABLE "Etablissement", "Annexe", "Commune" RESTART IDENTITY CASCADE;

-- 2. Insert 5 Communes
INSERT INTO "Commune" ("code", "nom", "region", "province", "updatedAt")
VALUES 
('COM01', 'Médiouna', 'Casablanca-Settat', 'Médiouna', NOW()),
('COM02', 'Tit Mellil', 'Casablanca-Settat', 'Médiouna', NOW()),
('COM03', 'Laajajra', 'Casablanca-Settat', 'Médiouna', NOW()),
('COM04', 'Sidi Hajjaj', 'Casablanca-Settat', 'Médiouna', NOW()),
('COM05', 'Mejjatia Ouled Taleb', 'Casablanca-Settat', 'Médiouna', NOW());

-- 3. Insert 15 Annexes (Distributed among the 5 communes)
INSERT INTO "Annexe" ("code", "nom", "communeId", "updatedAt")
SELECT 
  'ANX' || LPAD(i::text, 3, '0'),       -- Generates ANX001, ANX002...
  'Annexe ' || i, 
  (i % 5) + 1,                          -- Assigns to commune IDs 1-5 cyclically
  NOW()
FROM generate_series(1, 15) AS i;

-- 4. Insert 60 Etablissements
INSERT INTO "Etablissement" (
  "code", 
  "nom", 
  "secteur", 
  "communeId", 
  "annexeId", 
  "latitude", 
  "longitude", 
  "donneesSpecifiques", 
  "updatedAt",
  "isPublie",
  "isValide"
)
SELECT 
  'ETS' || LPAD(i::text, 3, '0'),        -- Generates ETS001, ETS002...
  'Etablissement ' || i,
  -- Rotates through the Secteur ENUM types [cite: 3]
  (ARRAY['EDUCATION', 'SANTE', 'SPORT', 'SOCIAL', 'CULTUREL', 'AUTRE'])[((i - 1) % 6) + 1]::"Secteur",
  (i % 5) + 1,                           -- Cycles through Communes 1-5
  (i % 15) + 1,                          -- Cycles through Annexes 1-15
  33.0 + (random() * 0.5),               -- Random Latitude
  -7.0 - (random() * 0.5),               -- Random Longitude
  '{}'::json,                            -- Empty JSON for required field
  NOW(),
  true,                                  -- isPublie
  true                                   -- isValide
FROM generate_series(1, 60) AS i;
