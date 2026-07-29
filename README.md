Market Dashboard

Simple, mobile-friendly financial market dashboard built with HTML/CSS/JS and Chart.js.

What you'll find:
- Index mini charts for S&P 500, Nasdaq, Dow Jones, Russell 2000
- Customizable watchlist (stored in localStorage)
- Main Chart area using Chart.js

How to use:
1. Open index.html in a browser.
2. Add symbols to the watchlist. Click symbols or index cards to view the larger chart.

Notes for developers:
- Current data is mock/generated in js/app.js (generateMockSeries, fetchIndexData, fetchSymbolData).
- To add real market data: replace fetchIndexData and fetchSymbolData with calls to a market data API (Finnhub, IEX Cloud, Alpha Vantage, Yahoo, etc.).
- Investment models and news feeds should be wired into the hooks marked TODO in js/app.js. Keep model logic separate (e.g., /js/models.js) and feeds in /js/feeds.js for maintainability.

Branch: dashboard-site
