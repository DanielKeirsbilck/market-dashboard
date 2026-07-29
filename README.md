Market Dashboard

Simple, mobile-friendly financial market dashboard built with HTML/CSS/JS and Chart.js.

What you'll find:
- Index mini charts for S&P 500, Nasdaq, Dow Jones, Russell 2000
- Customizable watchlist (stored in localStorage)
- Main Chart area using Chart.js

Finnhub integration
- Added a browser-side Finnhub provider (js/providers/finnhub.js).
- To enable live data in the browser, set your Finnhub API key in the dashboard header input and click "Set Key". The key is stored in localStorage under the key "market_dashboard_finnhub_key_v1".
- The app will attempt to use Finnhub candle and quote endpoints to render symbol/index data. If Finnhub calls fail or no key is present, the UI falls back to mock generated data.

Security note
- Storing API keys in localStorage exposes them to the browser. For production, use the included server proxy example (server/proxy_example.js) which keeps the API key on the server.

Server proxy example
- server/proxy_example.js shows a small Express server that proxies /api/candle and /api/quote to Finnhub using an environment variable FINNHUB_API_KEY.
- Run it with: FINNHUB_API_KEY=your_key node server/proxy_example.js
- Update the frontend to call your proxy endpoints instead of hitting Finnhub directly.

How to use:
1. Open index.html in a browser (serve via a static server for best results).
2. Option A (quick, demo): paste your Finnhub API key into the input at top-right and click "Set Key". The site will use Finnhub for live data (subject to Finnhub's rate limits and CORS).
3. Option B (recommended for production): run the proxy server and change js/providers/finnhub.js to call your server endpoints or modify app.js to point to your proxy.

Notes for developers:
- Current data is mock-generated when Finnhub is not enabled.
- To adapt provider selection (other APIs), add another provider module in js/providers/ and extend the wrapper logic in js/app.js.
- Investment models and news feeds should be wired into the hooks marked TODO in js/app.js. Keep model logic separate (e.g., /js/models.js) and feeds in /js/feeds.js for maintainability.

Branch: dashboard-site
