# 新品追蹤 Fashion Radar

## 本地開發

```bash
npm install
npm start
```

## 設定 API Key

編輯 `.env` 檔案，填入你的 Anthropic API Key：

```
REACT_APP_ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
```

## 部署到 Cloudflare Pages

1. 把這個資料夾推到 GitHub（.env 不會被上傳，已加入 .gitignore）
2. 登入 Cloudflare Pages → Connect to Git → 選你的 repo
3. Build settings：
   - Build command: `npm run build`
   - Build output directory: `build`
4. **Environment Variables（重要）**：
   - 在 Cloudflare Pages 的 Settings → Environment Variables 加入：
   - `REACT_APP_ANTHROPIC_API_KEY` = 你的 API Key
5. 部署完成！
