# Aramide Bankole-Balogun - Portfolio Website

This is a personal portfolio website for Aramide Bankole-Balogun, showcasing skills, experience, and education in Data Analytics & AI/ML.

Live dashboard: https://jesunahmadushno.github.io/AramideLanding/ (an engineering case study of this site: live responsive preview, source audit and WCAG contrast checks computed from these files). The site itself is served unchanged at https://jesunahmadushno.github.io/AramideLanding/landing/.

## How to View

Simply open the `index.html` file in any modern web browser.

## Customization

- **Content**: Edit `index.html` to update text, links, or add new sections.
- **Styles**: Edit `style.css` to change colors, fonts, or layout.
- **Behavior**: Edit `script.js` to modify the mobile menu or add interactive features.

## Checks

The dashboard lives in `site/`. Its build copies `index.html`, `style.css` and `script.js` into `landing/` byte for byte and runs a known-answer check that doubles as this repo's smoke test:

```bash
cd site && npm ci && npm test        # audit + contrast + structure checks on index.html and style.css
npm run build                        # extract stats, run the check, build site/dist
```

Open findings that need the site's owner (not guessed): the contact email is a placeholder on `example.com`, and the copy says both "over 10 years" and "Over 9 years". See `docs/research-review.md`.

## Deployment

`.github/workflows/pages.yml` builds and publishes the dashboard and the site once GitHub Pages is enabled with "GitHub Actions" as the source.


You can deploy this site for free using services like:
- **GitHub Pages**: Push this code to a GitHub repository and enable GitHub Pages.
- **Netlify**: Drag and drop the folder to Netlify.
- **Vercel**: Import your GitHub repository to Vercel.

## Credits

- Icons by [Font Awesome](https://fontawesome.com/)
- Fonts by [Google Fonts](https://fonts.google.com/)
