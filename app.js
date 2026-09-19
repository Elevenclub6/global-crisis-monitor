const data=window.CRISIS_DATA;
const severityColors={1:"#2dd4a7",2:"#63d471",3:"#ffd166",4:"#ff9f43",5:"#ff4d6d"};
const categoryColors={"Conflict":"#ff4d6d","Infrastructure & Trade":"#36d1ff","Political & Security":"#b388ff","Geopolitical":"#4688ff","Security":"#ff7b72","Humanitarian":"#ffd166","Natural Disaster":"#2dd4a7","Energy":"#ff9f43"};
const map=L.map("map",{worldCopyJump:true,minZoom:2}).setView([18,10],2.25);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:7,attribution:"&copy; OpenStreetMap contributors"}).addTo(map);
const markerLayer=L.layerGroup().addTo(map);
const search=document.getElementById("search"),categoryFilter=document.getElementById("categoryFilter"),severityFilter=document.getElementById("severityFilter"),statusFilter=document.getElementById("statusFilter");
const unique=k=>[...new Set(data.map(d=>d[k]))].sort();
unique("category").forEach(v=>categoryFilter.insertAdjacentHTML("beforeend","<option>"+v+"</option>"));
[1,2,3,4,5].forEach(v=>severityFilter.insertAdjacentHTML("beforeend",'<option value="'+v+'">Severity '+v+"</option>"));
unique("status").forEach(v=>statusFilter.insertAdjacentHTML("beforeend","<option>"+v+"</option>"));
document.getElementById("legend").innerHTML=[1,2,3,4,5].map(s=>'<span class="legend-item"><span class="legend-dot" style="background:'+severityColors[s]+'"></span>S'+s+"</span>").join("");
function filtered(){const q=search.value.trim().toLowerCase();return data.filter(d=>(!q||[d.name,d.country,d.region,d.category].some(x=>x.toLowerCase().includes(q)))&&(!categoryFilter.value||d.category===categoryFilter.value)&&(!severityFilter.value||d.severity===Number(severityFilter.value))&&(!statusFilter.value||d.status===statusFilter.value))}
function renderKPIs(rows){const active=rows.filter(d=>d.status==="Active").length,critical=rows.filter(d=>d.severity===5).length,watch=rows.filter(d=>d.status==="Watch").length,regions=new Set(rows.map(d=>d.region)).size;document.getElementById("kpis").innerHTML='<div class="kpi"><div class="kpi-label">Visible crises</div><div class="kpi-value">'+rows.length+'</div><div class="kpi-sub">Current filtered view</div></div><div class="kpi"><div class="kpi-label">Active</div><div class="kpi-value">'+active+'</div><div class="kpi-sub">Operationally active events</div></div><div class="kpi"><div class="kpi-label">Critical</div><div class="kpi-value">'+critical+'</div><div class="kpi-sub">Severity 5 events</div></div><div class="kpi"><div class="kpi-label">Regions</div><div class="kpi-value">'+regions+'</div><div class="kpi-sub">'+watch+' additional watch events</div></div>'}
function markerIcon(d){const size=14+d.severity*4;return L.divIcon({className:"",html:'<div class="custom-marker" style="width:'+size+'px;height:'+size+'px;background:'+severityColors[d.severity]+';"></div>',iconSize:[size,size],iconAnchor:[size/2,size/2]})}
function renderMap(rows){markerLayer.clearLayers();rows.forEach(d=>{const m=L.marker([d.lat,d.lng],{icon:markerIcon(d)}).addTo(markerLayer);m.bindPopup("<strong>"+escapeHtml(d.name)+"</strong><br>"+escapeHtml(d.country)+"<br>Severity "+d.severity+" · "+escapeHtml(d.status));m.on("click",()=>renderDetail(d))})}
function trendIcon(t){return t==="Worsening"?"↑":t==="Improving"?"↓":"→"}
function renderTable(rows){const tbody=document.getElementById("crisisTable");tbody.innerHTML=rows.map(d=>'<tr data-id="'+d.id+'"><td><strong>'+escapeHtml(d.name)+'</strong><br><span style="color:#6f8aa5">'+escapeHtml(d.country)+'</span></td><td>'+escapeHtml(d.region)+'</td><td>'+escapeHtml(d.category)+'</td><td><strong style="color:'+severityColors[d.severity]+'">S'+d.severity+'</strong></td><td>'+trendIcon(d.trend)+" "+escapeHtml(d.trend)+"</td><td>"+escapeHtml(d.status)+"</td></tr>").join("");tbody.querySelectorAll("tr").forEach(tr=>tr.addEventListener("click",()=>{const d=data.find(x=>x.id===tr.dataset.id);renderDetail(d);map.flyTo([d.lat,d.lng],4,{duration:.7})}));document.getElementById("feedCount").textContent=rows.length+" records"}
function renderDetail(d){document.getElementById("detailTitle").textContent=d.name;document.getElementById("detailContent").innerHTML='<div class="detail"><div class="badge-row"><span class="badge" style="background:'+severityColors[d.severity]+'22;color:'+severityColors[d.severity]+'">SEVERITY '+d.severity+'</span><span class="badge" style="color:'+(categoryColors[d.category]||"#4688ff")+'">'+escapeHtml(d.category.toUpperCase())+'</span><span class="badge">'+escapeHtml(d.status.toUpperCase())+'</span></div><p class="description">'+escapeHtml(d.description)+'</p><div class="detail-grid"><div class="metric"><div class="metric-label">Country / Area</div><div class="metric-value">'+escapeHtml(d.country)+'</div></div><div class="metric"><div class="metric-label">Region</div><div class="metric-value">'+escapeHtml(d.region)+'</div></div><div class="metric"><div class="metric-label">Trend</div><div class="metric-value">'+trendIcon(d.trend)+" "+escapeHtml(d.trend)+'</div></div><div class="metric"><div class="metric-label">Start date</div><div class="metric-value">'+escapeHtml(d.start)+'</div></div><div class="metric"><div class="metric-label">Latitude</div><div class="metric-value">'+d.lat+'</div></div><div class="metric"><div class="metric-label">Longitude</div><div class="metric-value">'+d.lng+'</div></div></div><div class="source">Source: '+escapeHtml(d.source||"Manual entry")+"</div></div>"}
function renderBars(rows){const counts={};rows.forEach(d=>counts[d.category]=(counts[d.category]||0)+1);const max=Math.max(1,...Object.values(counts));document.getElementById("categoryBars").innerHTML=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>'<div class="bar-row"><div class="bar-label">'+escapeHtml(k)+'</div><div class="bar-track"><div class="bar-fill" style="width:'+(v/max*100)+'%;background:'+(categoryColors[k]||"#4688ff")+'"></div></div><div class="bar-value">'+v+"</div></div>").join("")||'<div style="color:#8ca7c2">No matching records.</div>'}
function render(){const rows=filtered();renderKPIs(rows);renderMap(rows);renderTable(rows);renderBars(rows)}
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
[search,categoryFilter,severityFilter,statusFilter].forEach(el=>el.addEventListener("input",render));
document.getElementById("resetBtn").addEventListener("click",()=>{search.value="";categoryFilter.value="";severityFilter.value="";statusFilter.value="";render()});

const form=document.getElementById("crisisForm");
const startInput=document.getElementById("fStart");
startInput.value=new Date().toISOString().slice(0,10);
form.addEventListener("submit",e=>{
  e.preventDefault();
  const lat=Number(document.getElementById("fLat").value),lng=Number(document.getElementById("fLng").value);
  const msg=document.getElementById("formMessage");
  if(!Number.isFinite(lat)||lat<-90||lat>90||!Number.isFinite(lng)||lng<-180||lng>180){msg.textContent="Check latitude/longitude.";return}
  const entry={
    id:"MAN-"+Date.now(),
    name:document.getElementById("fName").value.trim(),
    country:document.getElementById("fCountry").value.trim(),
    region:document.getElementById("fRegion").value.trim(),
    lat,lng,
    category:document.getElementById("fCategory").value,
    severity:Number(document.getElementById("fSeverity").value),
    status:document.getElementById("fStatus").value,
    trend:document.getElementById("fTrend").value,
    start:startInput.value,
    description:document.getElementById("fDescription").value.trim(),
    source:document.getElementById("fSource").value.trim()||"Manual entry"
  };
  data.unshift(entry);
  if(![...categoryFilter.options].some(o=>o.value===entry.category))categoryFilter.insertAdjacentHTML("beforeend","<option>"+escapeHtml(entry.category)+"</option>");
  if(![...statusFilter.options].some(o=>o.value===entry.status))statusFilter.insertAdjacentHTML("beforeend","<option>"+escapeHtml(entry.status)+"</option>");
  search.value="";categoryFilter.value="";severityFilter.value="";statusFilter.value="";
  render();renderDetail(entry);map.flyTo([entry.lat,entry.lng],5,{duration:.8});
  msg.textContent="Added to the monitor for this session.";
  form.reset();startInput.value=new Date().toISOString().slice(0,10);
});

render();renderDetail(data[0]);