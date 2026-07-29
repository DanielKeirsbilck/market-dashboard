// server/proxy_example.js
// Example Node/Express proxy to securely call Finnhub from server side.
// Usage: set FINNHUB_API_KEY environment variable and run: node proxy_example.js
// This proxy exposes two endpoints used by the frontend: /api/candle and /api/quote

const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.FINNHUB_API_KEY;
if(!API_KEY){
  console.warn('Warning: FINNHUB_API_KEY not set. Proxy will not function without it.');
}

app.use((req,res,next)=>{
  // basic CORS for local development
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  next();
});

app.get('/api/candle', async (req,res)=>{
  const {symbol, resolution='D', from, to} = req.query;
  if(!API_KEY) return res.status(500).json({error:'API key not configured on server'});
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${to}&token=${encodeURIComponent(API_KEY)}`;
  try{
    const r = await fetch(url);
    const data = await r.json();
    res.json(data);
  }catch(e){
    res.status(502).json({error:e.message});
  }
});

app.get('/api/quote', async (req,res)=>{
  const {symbol} = req.query;
  if(!API_KEY) return res.status(500).json({error:'API key not configured on server'});
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(API_KEY)}`;
  try{
    const r = await fetch(url);
    const data = await r.json();
    res.json(data);
  }catch(e){
    res.status(502).json({error:e.message});
  }
});

app.listen(PORT, ()=>console.log(`Finnhub proxy running on http://localhost:${PORT}`));
