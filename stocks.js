const data=window.STOCK_DATA;
const statusColors={Watch:"#ffd166",Owned:"#2dd4a7",Researching:"#36d1ff",Passed:"#ff4d6d"};
const sectorColors={"Technology":"#36d1ff","Industrials":"#ff9f43","Consumer Discretionary":"#b388ff","Communication Services":"#2dd4a7","Financials":"#ffd166","Healthcare":"#ff7b72","Energy":"#63d471"};
const q=s=>document.querySelector(s);
const search=q("#stockSearch"),sectorFilter=q("#sectorFilter"),statusFilter=q("#statusFilter"),horizonFilter=q("#horizonFilter");
let editingId=null;
const uniq=k=>[...new Set(data.map(d=>d[k]))].sort();
uniq("sector").forEach(v=>sectorFilter.insertAdjacentHTML("beforeend","<option>"+v+"</option>"));
uniq("status").forEach(v=>statusFilter.insertAdjacentHTML("beforeend","<option>"+v+"</option>"));
uniq("horizon").forEach(v=>horizonFilter.insertAdjacentHTML("beforeend","<option>"+v+"</option>"));
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function filtered(){const s=search.value.trim().toLowerCase();return data.filter(d=>(!s||[d.ticker,d.company,d.sector].some(x=>x.toLowerCase().includes(s)))&&(!sectorFilter.value||d.sector===sectorFilter.value)&&(!statusFilter.value||d.status===statusFilter.value)&&(!horizonFilter.value||d.horizon===horizonFilter.value))}
function renderKpis(rows){const avgUpside=rows.length?Math.round(rows.reduce((a,b)=>a+b.upside,0)/rows.length):0;const highConv=rows.filter(d=>d.conviction>=8).length;const owned=rows.filter(d=>d.status==="Owned").length;q("#stockKpis").innerHTML='<div class="kpi"><div class="kpi-label">Visible ideas</div><div class="kpi-value">'+rows.length+'</div><div class="kpi-sub">Current filtered universe</div></div><div class="kpi"><div class="kpi-label">High conviction</div><div class="kpi-value">'+highConv+'</div><div class="kpi-sub">Conviction 8-10</div></div><div class="kpi"><div class="kpi-label">Avg upside</div><div class="kpi-value">'+avgUpside+'%</div><div class="kpi-sub">Your expected upside</div></div><div class="kpi"><div class="kpi-label">Owned</div><div class="kpi-value">'+owned+'</div><div class="kpi-sub">Portfolio-status ideas</div></div>'}
function renderChart(rows){
 const svg=q("#stockChart"),W=900,H=620,p={l:72,r:32,t:32,b:66};
 let out='<rect class="chart-bg" x="0" y="0" width="'+W+'" height="'+H+'" rx="16"/>';
 for(let i=1;i<=10;i++){const x=p.l+(i-1)/9*(W-p.l-p.r);out+='<line class="grid-line" x1="'+x+'" y1="'+p.t+'" x2="'+x+'" y2="'+(H-p.b)+'"/><text class="axis-label" x="'+x+'" y="'+(H-34)+'" text-anchor="middle">'+i+'</text>'}
 [0,20,40,60,80].forEach(v=>{const y=H-p.b-(v/80)*(H-p.t-p.b);out+='<line class="grid-line" x1="'+p.l+'" y1="'+y+'" x2="'+(W-p.r)+'" y2="'+y+'"/><text class="axis-label" x="54" y="'+(y+4)+'" text-anchor="end">'+v+'%</text>'});
 out+='<line class="axis-line" x1="'+p.l+'" y1="'+(H-p.b)+'" x2="'+(W-p.r)+'" y2="'+(H-p.b)+'"/><line class="axis-line" x1="'+p.l+'" y1="'+p.t+'" x2="'+p.l+'" y2="'+(H-p.b)+'"/><text class="axis-label" x="'+(W/2)+'" y="'+(H-8)+'" text-anchor="middle">RISK →</text><text class="axis-label" transform="translate(18 '+(H/2)+') rotate(-90)" text-anchor="middle">EXPECTED UPSIDE →</text>';
 out+='<text class="quadrant" x="150" y="72" fill="#2dd4a7">LOWER RISK / HIGHER REWARD</text><text class="quadrant" x="620" y="72" fill="#ffd166">HIGHER RISK / HIGHER REWARD</text>';
 rows.forEach(d=>{const x=p.l+(d.risk-1)/9*(W-p.l-p.r);const capped=Math.max(0,Math.min(80,d.upside));const y=H-p.b-(capped/80)*(H-p.t-p.b);const r=10+d.conviction*2.2;out+='<g class="stock-node" data-id="'+d.id+'"><circle class="bubble" cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+(statusColors[d.status]||"#36d1ff")+'" fill-opacity=".78"></circle><text class="bubble-label" x="'+x+'" y="'+y+'">'+esc(d.ticker)+'</text></g>'});
 svg.innerHTML=out;svg.querySelectorAll(".stock-node").forEach(n=>n.addEventListener("click",()=>renderDetail(data.find(d=>d.id===n.dataset.id))));
}
function renderTable(rows){
 q("#stockTable").innerHTML=rows.map(d=>'<tr data-id="'+d.id+'"><td><strong>'+esc(d.ticker)+'</strong></td><td>'+esc(d.company)+'</td><td>'+esc(d.sector)+'</td><td>'+d.risk+'/10</td><td>'+d.upside+'%</td><td>'+d.conviction+'/10</td><td style="color:'+(statusColors[d.status]||"#fff")+'">'+esc(d.status)+'</td><td><div class="action-group"><button type="button" class="mini-btn edit" data-edit="'+d.id+'">Edit</button><button type="button" class="mini-btn delete" data-delete="'+d.id+'">Delete</button></div></td></tr>').join("");
 q("#stockTable").querySelectorAll("tr").forEach(r=>r.addEventListener("click",e=>{if(e.target.closest("button"))return;renderDetail(data.find(d=>d.id===r.dataset.id))}));
 q("#stockTable").querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>beginEdit(b.dataset.edit)));
 q("#stockTable").querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>deleteStock(b.dataset.delete)));
 q("#stockCount").textContent=rows.length+" stocks"
}
function renderBars(rows){const c={};rows.forEach(d=>c[d.sector]=(c[d.sector]||0)+1);const max=Math.max(1,...Object.values(c));q("#sectorBars").innerHTML=Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([k,v])=>'<div class="bar-row"><div class="bar-label">'+esc(k)+'</div><div class="bar-track"><div class="bar-fill" style="width:'+(v/max*100)+'%;background:'+(sectorColors[k]||"#36d1ff")+'"></div></div><div class="bar-value">'+v+'</div></div>').join("")}
function renderDetail(d){
 if(!d){q("#stockDetailTitle").textContent="Choose a stock";q("#stockDetailContent").innerHTML='<div class="detail-empty">Click a bubble or stock row to inspect your thesis.</div>';return}
 q("#stockDetailTitle").textContent=d.ticker+" · "+d.company;
 q("#stockDetailContent").innerHTML='<div class="detail"><div class="badge-row"><span class="badge" style="color:'+(statusColors[d.status]||"#fff")+'">'+esc(d.status.toUpperCase())+'</span><span class="badge">'+esc(d.sector.toUpperCase())+'</span><span class="badge">'+esc(d.horizon.toUpperCase())+'</span></div><p class="description">'+esc(d.thesis)+'</p><div class="detail-grid"><div class="metric"><div class="metric-label">Risk</div><div class="metric-value">'+d.risk+'/10</div></div><div class="metric"><div class="metric-label">Expected upside</div><div class="metric-value">'+d.upside+'%</div></div><div class="metric"><div class="metric-label">Conviction</div><div class="metric-value">'+d.conviction+'/10</div></div><div class="metric"><div class="metric-label">Horizon</div><div class="metric-value">'+esc(d.horizon)+'</div></div><div class="metric"><div class="metric-label">Price</div><div class="metric-value">'+(d.price?'$'+d.price.toFixed(2):'—')+'</div></div><div class="metric"><div class="metric-label">Target</div><div class="metric-value">'+(d.target?'$'+d.target.toFixed(2):'—')+'</div></div></div><p class="description"><strong>Catalyst / Notes:</strong><br>'+esc(d.catalyst||"—")+'</p><div class="detail-actions"><button type="button" class="mini-btn edit" id="detailEdit">Edit Stock</button><button type="button" class="mini-btn delete" id="detailDelete">Delete Stock</button></div></div>';
 q("#detailEdit").addEventListener("click",()=>beginEdit(d.id));
 q("#detailDelete").addEventListener("click",()=>deleteStock(d.id));
}
function syncFilterOptions(){
 const currentSector=sectorFilter.value,currentStatus=statusFilter.value,currentHorizon=horizonFilter.value;
 sectorFilter.innerHTML='<option value="">All sectors</option>';uniq("sector").forEach(v=>sectorFilter.insertAdjacentHTML("beforeend","<option>"+esc(v)+"</option>"));
 statusFilter.innerHTML='<option value="">All statuses</option>';uniq("status").forEach(v=>statusFilter.insertAdjacentHTML("beforeend","<option>"+esc(v)+"</option>"));
 horizonFilter.innerHTML='<option value="">All horizons</option>';uniq("horizon").forEach(v=>horizonFilter.insertAdjacentHTML("beforeend","<option>"+esc(v)+"</option>"));
 if([...sectorFilter.options].some(o=>o.value===currentSector))sectorFilter.value=currentSector;
 if([...statusFilter.options].some(o=>o.value===currentStatus))statusFilter.value=currentStatus;
 if([...horizonFilter.options].some(o=>o.value===currentHorizon))horizonFilter.value=currentHorizon;
}
function render(){const rows=filtered();renderKpis(rows);renderChart(rows);renderTable(rows);renderBars(rows)}
function formValues(){return{ticker:q("#sTicker").value.trim().toUpperCase(),company:q("#sCompany").value.trim(),sector:q("#sSector").value.trim(),status:q("#sStatus").value,risk:Number(q("#sRisk").value),upside:Number(q("#sUpside").value),conviction:Number(q("#sConviction").value),horizon:q("#sHorizon").value,price:Number(q("#sPrice").value)||0,target:Number(q("#sTarget").value)||0,thesis:q("#sThesis").value.trim(),catalyst:q("#sCatalyst").value.trim()}}
function beginEdit(id){
 const d=data.find(x=>x.id===id);if(!d)return;
 editingId=id;
 q("#stockForm").classList.add("editing");q("#stockFormTitle").textContent="Edit Stock Idea";q("#stockSubmitBtn").textContent="Save Changes";
 q("#sTicker").value=d.ticker;q("#sCompany").value=d.company;q("#sSector").value=d.sector;q("#sStatus").value=d.status;q("#sRisk").value=d.risk;q("#sUpside").value=d.upside;q("#sConviction").value=d.conviction;q("#sHorizon").value=d.horizon;q("#sPrice").value=d.price||"";q("#sTarget").value=d.target||"";q("#sThesis").value=d.thesis;q("#sCatalyst").value=d.catalyst||"";
 q("#stockMessage").textContent="Editing "+d.ticker+". Save changes to replace this entry.";q("#stockForm").scrollIntoView({behavior:"smooth",block:"start"});
}
function cancelEdit(){
 editingId=null;q("#stockForm").reset();q("#stockForm").classList.remove("editing");q("#stockFormTitle").textContent="Add Stock Idea";q("#stockSubmitBtn").textContent="Add to Universe";q("#stockMessage").textContent="";
}
function deleteStock(id){
 const idx=data.findIndex(d=>d.id===id);if(idx<0)return;
 const removed=data[idx];if(!confirm("Delete "+removed.ticker+" from the stock universe?"))return;
 data.splice(idx,1);if(editingId===id)cancelEdit();syncFilterOptions();render();renderDetail(data[0]||null);q("#stockMessage").textContent=removed.ticker+" deleted from this session.";
}
[search,sectorFilter,statusFilter,horizonFilter].forEach(el=>el.addEventListener("input",render));
q("#stockReset").addEventListener("click",()=>{search.value="";sectorFilter.value="";statusFilter.value="";horizonFilter.value="";render()});
q("#cancelEditBtn").addEventListener("click",cancelEdit);
q("#stockForm").addEventListener("reset",()=>setTimeout(()=>{if(!editingId)q("#stockMessage").textContent=""},0));
q("#stockForm").addEventListener("submit",e=>{
 e.preventDefault();const values=formValues();
 if(editingId){
   const d=data.find(x=>x.id===editingId);Object.assign(d,values);
   q("#stockMessage").textContent=d.ticker+" updated for this session.";
   const selected={...d};cancelEdit();syncFilterOptions();render();renderDetail(selected);
 }else{
   const entry={id:"USR-"+Date.now(),...values};data.unshift(entry);syncFilterOptions();q("#stockForm").reset();q("#stockMessage").textContent="Added to your stock universe for this session.";search.value="";sectorFilter.value="";statusFilter.value="";horizonFilter.value="";render();renderDetail(entry)
 }
});
render();renderDetail(data[0]);