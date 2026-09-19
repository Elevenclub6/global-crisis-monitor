const data=window.STOCK_DATA;
const statusColors={Watch:"#F59E0B",Owned:"#22C55E",Researching:"#3B82F6",Passed:"#EF4444"};
const sectorColors={"Technology":"#3B82F6","Industrials":"#D97706","Consumer Discretionary":"#8B5CF6","Communication Services":"#22C55E","Financials":"#F59E0B","Healthcare":"#EF4444","Energy":"#65A30D"};
const q=s=>document.querySelector(s);
const search=q("#stockSearch"),sectorFilter=q("#sectorFilter"),statusFilter=q("#statusFilter"),investorFilter=q("#investorFilter");
let editingId=null;
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
const uniq=k=>[...new Set(data.map(d=>d[k]).filter(Boolean))].sort();
function syncFilterOptions(){
 const cs=sectorFilter.value,ct=statusFilter.value,ci=investorFilter.value;
 sectorFilter.innerHTML='<option value="">All sectors</option>';uniq("sector").forEach(v=>sectorFilter.insertAdjacentHTML("beforeend","<option>"+esc(v)+"</option>"));
 statusFilter.innerHTML='<option value="">All statuses</option>';uniq("status").forEach(v=>statusFilter.insertAdjacentHTML("beforeend","<option>"+esc(v)+"</option>"));
 investorFilter.innerHTML='<option value="">All investor trends</option>';uniq("investorTrend").forEach(v=>investorFilter.insertAdjacentHTML("beforeend","<option>"+esc(v)+"</option>"));
 if([...sectorFilter.options].some(o=>o.value===cs))sectorFilter.value=cs;
 if([...statusFilter.options].some(o=>o.value===ct))statusFilter.value=ct;
 if([...investorFilter.options].some(o=>o.value===ci))investorFilter.value=ci;
}
function filtered(){const s=search.value.trim().toLowerCase();return data.filter(d=>(!s||[d.ticker,d.company,d.sector].some(x=>String(x).toLowerCase().includes(s)))&&(!sectorFilter.value||d.sector===sectorFilter.value)&&(!statusFilter.value||d.status===statusFilter.value)&&(!investorFilter.value||d.investorTrend===investorFilter.value))}
function roi(price,target){return price>0&&target>0?((target-price)/price)*100:null}
function avgRoi(d){return roi(Number(d.price)||0,Number(d.analystAvg)||0)}
function renderKpis(rows){
 const valid=rows.map(avgRoi).filter(v=>v!==null);
 const avg=valid.length?(valid.reduce((a,b)=>a+b,0)/valid.length).toFixed(1):"—";
 const strong=rows.filter(d=>(avgRoi(d)||-999)>=20).length;
 const owned=rows.filter(d=>d.status==="Owned").length;
 const portfolio=rows.reduce((a,d)=>a+(Number(d.currentValue)||0),0);
 q("#stockKpis").innerHTML=
 '<div class="kpi"><div class="kpi-label">Visible ideas</div><div class="kpi-value">'+rows.length+'</div><div class="kpi-sub">Current filtered universe</div></div>'+
 '<div class="kpi"><div class="kpi-label">Avg est. ROI</div><div class="kpi-value">'+(avg==="—"?"—":avg+"%")+'</div><div class="kpi-sub">Using analyst average targets</div></div>'+
 '<div class="kpi"><div class="kpi-label">Strong ROI setups</div><div class="kpi-value">'+strong+'</div><div class="kpi-sub">Average target implies 20%+ upside</div></div>'+
 '<div class="kpi"><div class="kpi-label">Portfolio value</div><div class="kpi-value">$'+portfolio.toLocaleString(undefined,{maximumFractionDigits:0})+'</div><div class="kpi-sub">'+owned+' owned stocks</div></div>';
}
function renderChart(rows){
 const svg=q("#stockChart"),W=900,H=620,p={l:92,r:40,t:42,b:72};
 const validPrices=rows.map(d=>Number(d.price)||0).filter(v=>v>0);
 const maxPrice=Math.max(100,...validPrices);
 const xMax=Math.ceil(maxPrice/100)*100;
 const roiValues=[];
 rows.forEach(d=>[d.analystLow,d.analystAvg,d.analystHigh].forEach(t=>{const v=roi(Number(d.price)||0,Number(t)||0);if(v!==null)roiValues.push(v)}));
 const yMin=Math.min(-20,...roiValues),yMax=Math.max(50,...roiValues);
 const yLo=Math.floor(yMin/10)*10,yHi=Math.ceil(yMax/10)*10;
 const xScale=v=>p.l+(Math.max(0,Math.min(xMax,v))/xMax)*(W-p.l-p.r);
 const yScale=v=>H-p.b-((v-yLo)/(yHi-yLo))*(H-p.t-p.b);
 let out='<rect class="chart-bg" x="0" y="0" width="'+W+'" height="'+H+'" rx="16"/>';
 for(let i=0;i<=5;i++){const val=xMax*i/5,x=xScale(val);out+='<line class="grid-line" x1="'+x+'" y1="'+p.t+'" x2="'+x+'" y2="'+(H-p.b)+'"/><text class="axis-label" x="'+x+'" y="'+(H-38)+'" text-anchor="middle">$'+Math.round(val)+'</text>'}
 for(let i=0;i<=6;i++){const val=yLo+(yHi-yLo)*i/6,y=yScale(val);out+='<line class="grid-line" x1="'+p.l+'" y1="'+y+'" x2="'+(W-p.r)+'" y2="'+y+'"/><text class="axis-label" x="75" y="'+(y+4)+'" text-anchor="end">'+Math.round(val)+'%</text>'}
 if(yLo<0&&yHi>0){const y0=yScale(0);out+='<line x1="'+p.l+'" y1="'+y0+'" x2="'+(W-p.r)+'" y2="'+y0+'" stroke="#EF4444" stroke-width="1.4" stroke-dasharray="6 6"/>'}
 out+='<text class="axis-label" x="'+(W/2)+'" y="'+(H-10)+'" text-anchor="middle">CURRENT PRICE →</text>';
 out+='<text class="axis-label" transform="translate(20 '+(H/2)+') rotate(-90)" text-anchor="middle">ESTIMATED 12M ROI →</text>';
 rows.forEach(d=>{
   const price=Number(d.price)||0;if(price<=0)return;
   const low=roi(price,Number(d.analystLow)||0),avg=roi(price,Number(d.analystAvg)||0),high=roi(price,Number(d.analystHigh)||0);
   if(avg===null)return;
   const x=xScale(price),y=yScale(avg),r=d.hedgeFund==="Positive"?27:19;
   if(low!==null&&high!==null){out+='<line x1="'+x+'" y1="'+yScale(low)+'" x2="'+x+'" y2="'+yScale(high)+'" stroke="'+(statusColors[d.status]||"#3B82F6")+'" stroke-width="5" stroke-linecap="round" opacity=".35"/>'}
   out+='<g class="stock-node" data-id="'+d.id+'"><circle class="bubble" cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+(statusColors[d.status]||"#3B82F6")+'" fill-opacity=".82"></circle><text class="bubble-label" x="'+x+'" y="'+y+'">'+esc(d.ticker)+'</text></g>';
 });
 svg.innerHTML=out;svg.querySelectorAll(".stock-node").forEach(n=>n.addEventListener("click",()=>renderDetail(data.find(d=>d.id===n.dataset.id))));
}
function renderTable(rows){
 q("#stockTable").innerHTML=rows.map(d=>'<tr data-id="'+d.id+'"><td><strong>'+esc(d.ticker)+'</strong></td><td>'+esc(d.company)+'</td><td>'+esc(d.sector)+'</td><td>'+d.smartScore+'/10</td><td>'+esc(d.investorTrend)+'</td><td>'+esc(d.hedgeFund)+'</td><td>'+(d.sharesOwned?Number(d.sharesOwned).toLocaleString(undefined,{maximumFractionDigits:4}):'—')+'</td><td>'+(d.currentValue?'$'+Number(d.currentValue).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}):'—')+'</td><td style="color:'+(statusColors[d.status]||"#fff")+'">'+esc(d.status)+'</td><td><div class="action-group"><button type="button" class="mini-btn edit" data-edit="'+d.id+'">Edit</button><button type="button" class="mini-btn delete" data-delete="'+d.id+'">Delete</button></div></td></tr>').join("");
 q("#stockTable").querySelectorAll("tr").forEach(r=>r.addEventListener("click",e=>{if(e.target.closest("button"))return;renderDetail(data.find(d=>d.id===r.dataset.id))}));
 q("#stockTable").querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>beginEdit(b.dataset.edit)));
 q("#stockTable").querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>deleteStock(b.dataset.delete)));
 q("#stockCount").textContent=rows.length+" stocks";
}
function renderBars(rows){const c={};rows.forEach(d=>c[d.sector]=(c[d.sector]||0)+1);const max=Math.max(1,...Object.values(c));q("#sectorBars").innerHTML=Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([k,v])=>'<div class="bar-row"><div class="bar-label">'+esc(k)+'</div><div class="bar-track"><div class="bar-fill" style="width:'+(v/max*100)+'%;background:'+(sectorColors[k]||"#3B82F6")+'"></div></div><div class="bar-value">'+v+'</div></div>').join("")}
function renderDetail(d){
 if(!d){q("#stockDetailTitle").textContent="Choose a stock";q("#stockDetailContent").innerHTML='<div class="detail-empty">Click a bubble or stock row to inspect your thesis.</div>';return}
 const low=roi(Number(d.price)||0,Number(d.analystLow)||0),avg=roi(Number(d.price)||0,Number(d.analystAvg)||0),high=roi(Number(d.price)||0,Number(d.analystHigh)||0);
 q("#stockDetailTitle").textContent=d.ticker+" · "+d.company;
 q("#stockDetailContent").innerHTML='<div class="detail"><div class="badge-row"><span class="badge" style="color:'+(statusColors[d.status]||"#fff")+'">'+esc(d.status.toUpperCase())+'</span><span class="badge">'+esc(d.sector.toUpperCase())+'</span><span class="badge">'+esc(d.investorTrend.toUpperCase())+'</span></div><p class="description">'+esc(d.thesis)+'</p><div class="detail-grid"><div class="metric"><div class="metric-label">Price</div><div class="metric-value">'+(d.price?'$'+Number(d.price).toFixed(2):'—')+'</div></div><div class="metric"><div class="metric-label">Smart Score</div><div class="metric-value">'+d.smartScore+'/10</div></div><div class="metric"><div class="metric-label">Investor Trend</div><div class="metric-value">'+esc(d.investorTrend)+'</div></div><div class="metric"><div class="metric-label">Hedge Fund Trend</div><div class="metric-value">'+esc(d.hedgeFund)+'</div></div><div class="metric"><div class="metric-label">Shares Owned</div><div class="metric-value">'+(d.sharesOwned?Number(d.sharesOwned).toLocaleString(undefined,{maximumFractionDigits:4}):'—')+'</div></div><div class="metric"><div class="metric-label">Current Value</div><div class="metric-value">'+(d.currentValue?'$'+Number(d.currentValue).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}):'—')+'</div></div></div><div class="research-section"><h3>12-Month Return Scenarios</h3><div class="forecast-range"><div class="forecast-item">Low Target<strong>'+(d.analystLow?'$'+Number(d.analystLow).toFixed(2):'—')+'</strong><small>'+(low===null?'—':low.toFixed(1)+'% ROI')+'</small></div><div class="forecast-item">Average Target<strong>'+(d.analystAvg?'$'+Number(d.analystAvg).toFixed(2):'—')+'</strong><small>'+(avg===null?'—':avg.toFixed(1)+'% ROI')+'</small></div><div class="forecast-item">High Target<strong>'+(d.analystHigh?'$'+Number(d.analystHigh).toFixed(2):'—')+'</strong><small>'+(high===null?'—':high.toFixed(1)+'% ROI')+'</small></div></div></div><div class="research-section"><h3>Research Signals</h3><div class="signal-grid"><div class="signal-card"><div class="signal-label">Smart Score</div><div class="signal-value">'+d.smartScore+'/10</div></div><div class="signal-card"><div class="signal-label">Hedge Fund Trend</div><div class="signal-value">'+esc(d.hedgeFund||"—")+'</div></div><div class="signal-card"><div class="signal-label">Insider Trend</div><div class="signal-value">'+esc(d.insider||"—")+'</div></div><div class="signal-card"><div class="signal-label">Investor Trend</div><div class="signal-value">'+esc(d.investorTrend||"—")+'</div></div><div class="signal-card"><div class="signal-label">News Trend</div><div class="signal-value">'+esc(d.newsTrend||"—")+'</div></div></div></div><p class="description"><strong>Catalyst / Notes:</strong><br>'+esc(d.catalyst||"—")+'</p><div class="detail-actions"><button type="button" class="mini-btn edit" id="detailEdit">Edit Stock</button><button type="button" class="mini-btn delete" id="detailDelete">Delete Stock</button></div></div>';
 q("#detailEdit").addEventListener("click",()=>beginEdit(d.id));q("#detailDelete").addEventListener("click",()=>deleteStock(d.id));
}
function render(){const rows=filtered();renderKpis(rows);renderChart(rows);renderTable(rows);renderBars(rows)}
function formValues(){return{ticker:q("#sTicker").value.trim().toUpperCase(),company:q("#sCompany").value.trim(),sector:q("#sSector").value.trim(),status:q("#sStatus").value,smartScore:Number(q("#sSmartScorePrimary").value),investorTrend:q("#sInvestorPrimary").value,hedgeFund:q("#sHedgePrimary").value,price:Number(q("#sPrice").value)||0,sharesOwned:Number(q("#sShares").value)||0,currentValue:Number(q("#sCurrentValue").value)||0,insider:q("#sInsider").value,newsTrend:q("#sNewsTrend").value,analystHigh:Number(q("#sAnalystHigh").value)||0,analystAvg:Number(q("#sAnalystAvg").value)||0,analystLow:Number(q("#sAnalystLow").value)||0,thesis:q("#sThesis").value.trim(),catalyst:q("#sCatalyst").value.trim()}}
function beginEdit(id){const d=data.find(x=>x.id===id);if(!d)return;editingId=id;q("#stockForm").classList.add("editing");q("#stockFormTitle").textContent="Edit Stock Idea";q("#stockSubmitBtn").textContent="Save Changes";q("#sTicker").value=d.ticker;q("#sCompany").value=d.company;q("#sSector").value=d.sector;q("#sStatus").value=d.status;q("#sSmartScorePrimary").value=d.smartScore||5;q("#sInvestorPrimary").value=d.investorTrend||"Negative";q("#sHedgePrimary").value=d.hedgeFund||"Negative";q("#sPrice").value=d.price||"";q("#sShares").value=d.sharesOwned||"";q("#sCurrentValue").value=d.currentValue||"";q("#sInsider").value=d.insider||"Neutral";q("#sNewsTrend").value=d.newsTrend||"Neutral";q("#sAnalystHigh").value=d.analystHigh||"";q("#sAnalystAvg").value=d.analystAvg||"";q("#sAnalystLow").value=d.analystLow||"";q("#sThesis").value=d.thesis;q("#sCatalyst").value=d.catalyst||"";q("#stockMessage").textContent="Editing "+d.ticker+". Save changes to replace this entry.";q("#stockForm").scrollIntoView({behavior:"smooth",block:"start"})}
function cancelEdit(){editingId=null;q("#stockForm").reset();q("#stockForm").classList.remove("editing");q("#stockFormTitle").textContent="Add Stock Idea";q("#stockSubmitBtn").textContent="Add to Universe";q("#stockMessage").textContent=""}
function deleteStock(id){const idx=data.findIndex(d=>d.id===id);if(idx<0)return;const removed=data[idx];if(!confirm("Delete "+removed.ticker+" from the stock universe?"))return;data.splice(idx,1);if(editingId===id)cancelEdit();syncFilterOptions();render();renderDetail(data[0]||null);q("#stockMessage").textContent=removed.ticker+" deleted from this session."}
[search,sectorFilter,statusFilter,investorFilter].forEach(el=>el.addEventListener("input",render));
q("#stockReset").addEventListener("click",()=>{search.value="";sectorFilter.value="";statusFilter.value="";investorFilter.value="";render()});
q("#cancelEditBtn").addEventListener("click",cancelEdit);
q("#stockForm").addEventListener("reset",()=>setTimeout(()=>{if(!editingId)q("#stockMessage").textContent=""},0));
q("#stockForm").addEventListener("submit",e=>{e.preventDefault();const values=formValues();if(editingId){const d=data.find(x=>x.id===editingId);Object.assign(d,values);const selected={...d};cancelEdit();syncFilterOptions();render();renderDetail(selected);q("#stockMessage").textContent=selected.ticker+" updated for this session."}else{const entry={id:"USR-"+Date.now(),...values};data.unshift(entry);syncFilterOptions();q("#stockForm").reset();q("#stockMessage").textContent="Added to your stock universe for this session.";search.value="";sectorFilter.value="";statusFilter.value="";investorFilter.value="";render();renderDetail(entry)}});
syncFilterOptions();render();renderDetail(data[0]);