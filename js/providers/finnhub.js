// js/providers/finnhub.js
// Lightweight Finnhub client for browser use. Attaches window.FinnhubProvider.
// Note: Storing API keys in browser localStorage exposes them to the user and any scripts that run on the page.
// For production, prefer a server-side proxy that stores the key securely.

(function(){
  const STORAGE_KEY = 'market_dashboard_finnhub_key_v1';

  // Helper: unix timestamp (seconds)
  function toUnix(date){ return Math.floor(date.getTime()/1000); }

  // Build a range: last N days
  function dateRangeDays(days){
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate()-days);
    return {from: toUnix(from), to: toUnix(to)};
  }

  async function fetchCandles(symbol, resolution='D', days=60){
    const key = localStorage.getItem(STORAGE_KEY);
    if(!key) throw new Error('Finnhub API key not set in localStorage');

    const range = dateRangeDays(days);
    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${range.from}&to=${range.to}&token=${encodeURIComponent(key)}`;
    const resp = await fetch(url);
    if(!resp.ok) throw new Error(`Finnhub returned ${resp.status}`);
    const data = await resp.json();
    if(data.s !== 'ok') throw new Error('No candle data for symbol: '+symbol);
    // map to series (closing prices). Finnhub returns arrays: c (close), t (times)
    const series = data.c.map(v=>parseFloat(v.toFixed(2)));
    return {series, times: data.t};
  }

  async function fetchSymbolData(symbol){
    // Try to fetch recent candles. If symbol is an index style (^GSPC), Finnhub may not return candles for every index — handle errors.
    try{
      const candle = await fetchCandles(symbol, 'D', 120);
      return { series: candle.series, current: candle.series[candle.series.length-1] };
    }catch(e){
      // try quote endpoint as fallback
      try{
        const key = localStorage.getItem(STORAGE_KEY);
        const qurl = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(key)}`;
        const r = await fetch(qurl);
        if(!r.ok) throw new Error('Quote failed');
        const q = await r.json();
        // q.c = current price
        return { series: [q.c], current: q.c };
      }catch(er){
        throw new Error('Finnhub fetch failed for '+symbol+': '+er.message);
      }
    }
  }

  async function fetchIndexData(indexSymbol){
    // indices on Finnhub often use symbols like ^GSPC, ^IXIC, ^DJI, ^RUT — attempt to fetch candles
    return fetchSymbolData(indexSymbol);
  }

  window.FinnhubProvider = {
    fetchSymbolData,
    fetchIndexData
  };
})();
