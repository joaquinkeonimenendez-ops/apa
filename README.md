# APA Wrapper (MyBib Internal Proxy)

Small internal web app that:

1. Accepts a webpage URL.
2. Calls MyBib search API to get candidate records.
3. Lets you click a result.
4. Calls MyBib reference API to return APA 7 formatted output.

## Run

```bash
npm install
npm start
```

Open: `http://localhost:3000`

## Internal endpoints

- `POST /api/mybib/search`
  - body: `{ "url": "https://example.com/article", "sourceId": "webpage" }`
- `POST /api/mybib/reference`
  - body: `{ "metadata": { ... }, "sourceId": "webpage", "styleId": "apa-7th-edition" }`
- `POST /api/mybib/apa-from-url`
  - convenience endpoint to run both steps
  - body: `{ "url": "https://example.com/article", "index": 0 }`

## Notes

- This is for internal use.
- Upstream API behavior, limits, and terms are controlled by MyBib.
