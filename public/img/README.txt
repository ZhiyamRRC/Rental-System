DEFAULT IMAGE BUNDLE — INCLUDE THIS WHOLE FOLDER IN EVERY DEPLOYMENT

Homepage defaults:
  hero.jpg
  about.jpg
  permit.jpg
  cta.jpg

Fresh-database fleet defaults (img/bikes/):
  pcx.jpg
  trail.jpg
  scrambler.jpg
  adv.jpg
  tuktuk.jpg
  suv.jpg

These paths are referenced by src/lib/settings-types.ts and src/lib/seed.ts.
Admin uploads do NOT replace this bundle; they are stored in public/uploads/.
The build and server startup validate that all required default files exist.
