// app.js — simple dashboard logic with Chart.js and Finnhub integration if API key is provided
// Structure notes:
// - fetchIndexData / fetchSymbolData will attempt to use window.FinnhubProvider (if a key is set), otherwise fall back to mock data
// - Investment models and news feed integration hooks are marked with TODO

const INDEXES = [
  { id: 'SPX', name: 'S&P 500', elVal: 'sp500Value', miniCanvas: 'sp500Mini', finnhubSymbol: '^GSPC' },
  { id: 'NDX', name: 'Nasdaq', elVal: 'nasdaqValue', miniCanvas: 'nasdaqMini', finnhubSymbol: '^IXIC' },
  { id: 'DJI', name: 'Dow Jones', elVal: 'dowValue', miniCanvas: 'dowMini', finnhubSymbol: '^DJI' },
  { id: 'RUT', name: 'Russell 2000', elVal: 'russellValue', miniCanvas: 'russellMini', finnhubSymbol: '^RUT' }
];

const WATCHLIST_KEY = 'market_dashboard_watchlist_v1';
const FINNHUB_KEY_STORAGE = 'market_dashboard_finnhub_key_v1';
let watchlist = [];
let miniCharts = {};
let mainChart = null;
let currentSymbol = null;

// Utility: generate mock timeseries data (30 points)
function generateMockSeries(base=1000, volatility=1.2, points=30){
  const data = [];
  let value = base;
  for(let i=0;i<points;i++){
    const change = (Math.random()-0.5)*volatility;
    value = Math.max(1, value + change);
    data.push(parseFloat(value.toFixed(2)));
  }
  return data;
}

// Wrapper: try FinnhubProvider if available and key present
async function fetchIndexData(indexId, finnhubSymbol){
  const key = localStorage.getItem(FINNHUB_KEY_STORAGE);
  if(window.FinnhubProvider && key){
    try{
      const res = await window.FinnhubProvider.fetchIndexData(finnhubSymbol);
      if(res && res.series && res.series.length) return res;
    }catch(e){
      console.warn('Finnhub index fetch failed, falling back to mock', e);
    }
  }
  // fallback mock
  const base = {
    SPX: 4600,
    NDX: 14800,
    DJI: 37000,
    RUT: 1900
  }[indexId] || 1000;
  const series = generateMockSeries(base, base*0.005);
  return { series, current: series[series.length-1] };
}

// Wrapper: try FinnhubProvider for symbols
async function fetchSymbolData(symbol){
  const key = localStorage.getItem(FINNHUB_KEY_STORAGE);
  if(window.FinnhubProvider && key){
    try{
      const res = await window.FinnhubProvider.fetchSymbolData(symbol);
      if(res && res.series && res.series.length) return res;
    }catch(e){
      console.warn('Finnhub symbol fetch failed, falling back to mock', e);
    }
  }

  // fallback mock
  const base = 100 + (symbol.charCodeAt(0)%50);
  const series = generateMockSeries(base, base*0.02);
  return { series, current: series[series.length-1] };
}

function formatChange(series){
  if(!series || series.length<2) return '—';
  const last = series[series.length-1];
  const prev = series[series.length-2];
  const diff = last - prev;
  const pct = (diff/prev)*100;
  const sign = diff>=0?'+':'';
  return `${sign}${diff.toFixed(2)} (${sign}${pct.toFixed(2)}%)`;
}

async function renderIndexMini(index){
  const elVal = document.getElementById(index.elVal);
  const canvas = document.getElementById(index.miniCanvas);
  const data = await fetchIndexData(index.id, index.finnhubSymbol);
  elVal.textContent = data.current.toLocaleString();

  const ctx = canvas.getContext('2d');
  if(miniCharts[index.id]){
    miniCharts[index.id].data.labels = data.series.map((_,i)=>i);
    miniCharts[index.id].data.datasets[0].data = data.series;
    miniCharts[index.id].update();
    return;
  }

  miniCharts[index.id] = new Chart(ctx,{
    type:'line',
    data:{labels:data.series.map((_,i)=>i),datasets:[{data:data.series,borderColor:'#0ea5a0',borderWidth:1,pointRadius:0}]},
    options:{plugins:{legend:{display:false}},scales:{x:{display:false},y:{display:false}},elements:{line:{tension:0.3}}}
  });
}

function ensureMainChart(){
  const ctx = document.getElementById('mainChart').getContext('2d');
  if(mainChart) return mainChart;
  mainChart = new Chart(ctx,{
    type:'line',
    data:{labels:[],datasets:[{label:'Price',data:[],borderColor:'#0f172a',backgroundColor:'rgba(15,23,42,0.04)',fill:true}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{display:true},y:{display:true}},elements:{line:{tension:0.3}}}
  });
  return mainChart;
}

async function showSymbolOnMain(symbol, label){
  currentSymbol = symbol;
  document.getElementById('chartTitle').textContent = label || symbol;
  const chart = ensureMainChart();
  let data;
  const index = INDEXES.find(i=>i.id===symbol);
  if(index){
    data = await fetchIndexData(index.id, index.finnhubSymbol);
    document.getElementById('chartSubtitle').textContent = 'Index';
  } else {
    data = await fetchSymbolData(symbol);
    document.getElementById('chartSubtitle').textContent = 'Watchlist';
  }
  chart.data.labels = data.series.map((_,i)=>i);
  chart.data.datasets[0].data = data.series;
  chart.update();
}

function loadWatchlist(){
  try{
    const raw = localStorage.getItem(WATCHLIST_KEY);
    watchlist = raw?JSON.parse(raw):['AAPL','MSFT','VTI'];
  }catch(e){
    watchlist = ['AAPL','MSFT','VTI'];
  }
}

function saveWatchlist(){
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
}

function renderWatchlist(){
  const ul = document.getElementById('watchlist');
  ul.innerHTML = '';
  watchlist.forEach(sym=>{
    const li = document.createElement('li');
    const left = document.createElement('div');
    left.style.display='flex';left.style.alignItems='center';left.style.gap='8px';
    const name = document.createElement('div');
    name.textContent = sym;name.className='watch-sym';
    name.style.cursor='pointer';
    name.onclick = ()=> showSymbolOnMain(sym);
    const small = document.createElement('div');
    small.className='muted';small.style.fontSize='0.85rem';small.textContent='Ticker';
    left.appendChild(name);left.appendChild(small);

    const actions = document.createElement('div');actions.className='sym-actions';
    const remove = document.createElement('button');remove.className='sym-btn';remove.textContent='Remove';
    remove.onclick = ()=>{ watchlist = watchlist.filter(s=>s!==sym); saveWatchlist(); renderWatchlist(); };
    actions.appendChild(remove);
    li.appendChild(left);li.appendChild(actions);
    ul.appendChild(li);
  });
}

function wireControls(){
  document.getElementById('addSymbolBtn').onclick = ()=>{
    const input = document.getElementById('symbolInput');
    const sym = input.value.trim().toUpperCase();
    if(!sym) return;
    if(!watchlist.includes(sym)){
      watchlist.unshift(sym);
      if(watchlist.length>20) watchlist.pop();
      saveWatchlist();
      renderWatchlist();
      input.value='';
      showSymbolOnMain(sym);
    }
  };

  // Finnhub key save/load
  const keyInput = document.getElementById('finnhubKey');
  const saveBtn = document.getElementById('saveKeyBtn');
  const stored = localStorage.getItem(FINNHUB_KEY_STORAGE) || '';
  keyInput.value = stored;
  saveBtn.onclick = ()=>{
    const k = keyInput.value.trim();
    if(k){
      localStorage.setItem(FINNHUB_KEY_STORAGE, k);
      alert('Finnhub API key saved to localStorage. Refresh or click an index to load live data.');
    } else {
      localStorage.removeItem(FINNHUB_KEY_STORAGE);
      alert('Finnhub API key removed. Reverted to mock data.');
    }
  };
}

async function init(){
  // load watchlist
  loadWatchlist();
  renderWatchlist();
  wireControls();

  // render index mini charts
  for(const idx of INDEXES){
    renderIndexMini(idx);
  }

  // click handlers to show index on main chart
  document.getElementById('sp500Value').parentNode.parentNode.onclick = ()=>showSymbolOnMain('SPX','S&P 500');
  document.getElementById('nasdaqValue').parentNode.parentNode.onclick = ()=>showSymbolOnMain('NDX','Nasdaq');
  document.getElementById('dowValue').parentNode.parentNode.onclick = ()=>showSymbolOnMain('DJI','Dow Jones');
  document.getElementById('russellValue').parentNode.parentNode.onclick = ()=>showSymbolOnMain('RUT','Russell 2000');

  // show default chart
  showSymbolOnMain(watchlist[0]);

  // TODO: Add polling / websocket to refresh data live
  // TODO: Add hooks here to call investment models and news feed processing after data loads
}

window.addEventListener('DOMContentLoaded', init);
