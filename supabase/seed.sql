-- Seed data for development and testing
-- This file contains sample categories that can be used during development

-- Insert sample categories (only if they don't exist)
INSERT INTO public.categories (name, description, created_by)
SELECT * FROM (VALUES
    ('Rock', 'Rock music from all eras', (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)),
    ('Pop', 'Popular music and chart toppers', (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)),
    ('Country', 'Country and western music', (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)),
    ('Hip-Hop', 'Hip-hop and rap music', (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)),
    ('Electronic', 'Electronic, EDM, and dance music', (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)),
    ('Classical', 'Classical and orchestral music', (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)),
    ('Jazz', 'Jazz and blues music', (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)),
    ('80s', 'Music from the 1980s', (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)),
    ('90s', 'Music from the 1990s', (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)),
    ('2000s', 'Music from the 2000s', (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)),
    ('Love Songs', 'Romantic and love-themed music', (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)),
    ('Party Hits', 'Upbeat party and dance music', (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)),
    ('Workout', 'High-energy music for exercise', (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)),
    ('Chill', 'Relaxing and mellow music', (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1))
) AS v(name, description, created_by)
WHERE NOT EXISTS (
    SELECT 1 FROM public.categories WHERE categories.name = v.name
) AND EXISTS (
    SELECT 1 FROM public.users WHERE role = 'admin'
);