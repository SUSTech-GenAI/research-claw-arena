<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Research Claw Arena

一个基于 Vite + React 的静态前端页面，可以直接部署到 GitHub Pages。

## Local Development

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Build

`npm run build`

## Deploy to GitHub Pages

仓库已经支持通过 GitHub Actions 自动部署到 GitHub Pages。

1. Push this repository to GitHub.
2. In GitHub, open `Settings > Pages`.
3. Set the source to `GitHub Actions`.
4. Push to `main` and the workflow will publish the `dist/` output automatically.

### Base Path

项目在 GitHub Actions 中会自动根据 `owner/repo` 推导 Vite 的 `base` 路径。

- If deployed as `https://<user>.github.io/<repo>/`, no extra config is needed.
- If deployed at the site root, set `VITE_BASE_PATH=/` when building.
