# APA 7 for Google Docs (Vercel)

Small internal web app that:

1. Accepts a webpage URL.
2. Calls MyBib search API to get candidate records.
3. Lets you click a result.
4. Calls MyBib reference API to return APA 7 formatted output.

## Deploy (Vercel)

```bash
npx vercel
```

## Local dev

```bash
npm install
npm run dev
```

Open: `http://localhost:3000` (via `vercel dev`)

## Internal endpoints

- `POST /api/mybib/search`
  - body: `{ "query": "https://example.com/article", "sourceId": "webpage" }`
  - sourceId options used in UI: `webpage`, `book`, `article_journal`, `video`
- `POST /api/mybib/reference`
  - body: `{ "metadata": { ... }, "sourceId": "webpage", "styleId": "apa-7th-edition" }`
- `POST /api/mybib/apa-from-url`
  - convenience endpoint to run both steps
  - body: `{ "url": "https://example.com/article", "index": 0 }`

## Project structure

- `public/` static frontend
- `api/mybib/*.js` Vercel serverless backend functions

## Notes

- This is for internal use.
- Upstream API behavior, limits, and terms are controlled by MyBib.
