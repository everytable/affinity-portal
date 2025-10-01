## Affinity Portal

### Environment structure
- **Development (`dev/`)**: All development files live under the `dev/` directory.
  - Examples: `dev/index.html`, `dev/afinity.js`, `dev/afinity.css`, `dev/afinity-footer.js`
- **Production (root)**: Production files live at the repository root.
  - Examples: `index.html`, `afinity.js`, `afinity.css`, `afinity-footer.js`

### Working locally
- **Edit in dev**: Make changes to files under `dev/`.
- **Open dev app**: Use `dev/index.html` while developing and testing.

### Deployment
- **Branch**: All changes intended for deployment must be merged into the `main` branch.
- **Source of truth for deploy**: The production-ready files at the repository root (e.g., `index.html`, `afinity.js`, `afinity.css`, `afinity-footer.js`) are what deploy from `main`.

### Notes
- Avoid editing production files at the root while iterating; develop under `dev/` and ensure the corresponding production files are updated before merging to `main`.

