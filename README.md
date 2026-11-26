# Small Acts

A responsive, single-page site for an IGCSE Global Perspectives project about waste pollution.

## Personalise it

- Replace the placeholder paragraph under **Your introduction** in `index.html` with your own introduction.
- The Google questionnaire link is connected in `script.js`.
- The four floating hero images in `index.html` are temporary sample photos. Replace their image URLs with your own clean-up photos when you have them.

## Photo wall

Visitors can choose an image, add a caption, and confirm they have permission to share it. Supabase stores the photos and captions so they appear for other visitors. The browser uses the public publishable key; never put a Supabase secret key in website code.

Before accepting public submissions, run `supabase_setup.sql` once in the Supabase SQL Editor. It creates a public photo bucket, limits uploads to JPG/PNG/WEBP up to 8 MB, and allows visitors to add and view submissions. It does not allow anonymous visitors to edit or delete existing submissions. Public uploads can still include unwanted content, so check the gallery regularly.

## Publish

The connected GitHub repository is currently private. GitHub Pages requires a public repository on the current plan. If you choose to make the repository public, configure Pages to deploy from the `main` branch root. The resulting website is public on the internet, even though visitors do not need GitHub accounts.

Open `index.html` in a browser to view the site. It uses plain HTML, CSS, and JavaScript with no build step.
