// Business Records: script.js
var S={customers:[],jobs:[],expenses:[]},doc=null,timer=null,where="this browser only";
var $=function(i){return document.getElementById(i)};
var esc=function(s){var d=document.createElement("div");d.textContent=s==null?"":s;return d.innerHTML};
var naira=function(n){return "₦"+Number(n||0).toLocaleString("en-NG",{maximumFractionDigits:2})};
var uid=function(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)};
var today=function(){return new Date().toISOString().slice(0,10)};

var ST=["Received", "In progress", "Ready", "Collected"],Q="";
function hit(a){return !Q||a.join(" ").toLowerCase().indexOf(Q)>-1}
function csv(rows){return "\ufeff"+rows.map(function(r){return r.map(function(v){return '"'+String(v==null?"":v).replace(/"/g,'""')+'"'}).join(",")}).join("\r\n")}
function blobSave(name,data){var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([data],{type:"text/csv;charset=utf-8"}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},1000);status("Downloaded "+name)}
function status(t){$("status").textContent=t}
function persist(){
  try{localStorage.setItem("records",JSON.stringify(S))}catch(e){}
  if(!doc){status("Saved in "+where+".");return}
  clearTimeout(timer);status("Saving…");
  timer=setTimeout(function(){doc.set(JSON.parse(JSON.stringify(S))).then(function(){status("Saved to your account.")},function(){status("Could not save to your account. A copy is kept in this browser.")})},600);
}
function cust(id){return S.customers.find(function(c){return c.id===id})||{name:"(deleted)",phone:""}}
function sure(btn,fn){if(btn.dataset.s){fn();return}btn.dataset.s=1;btn.textContent="Tap again to confirm";setTimeout(function(){delete btn.dataset.s;btn.textContent="Delete"},3000)}

function render(){
  var jobs=S.jobs.filter(function(j){return (!$("sf").value||(j.status||"Received")===$("sf").value)&&hit([j.no,cust(j.customer).name,j.device,j.problem,j.diag,j.work,j.parts])}).sort(function(a,b){return a.date<b.date?1:-1});
  $("tc").innerHTML=S.customers.filter(function(c){return hit([c.name,c.phone,c.email,c.address])}).map(function(c){var cj=S.jobs.filter(function(j){return j.customer===c.id}),ow=0;cj.forEach(function(j){ow+=j.cost-j.pay});return "<tr><td>"+esc(c.name)+"</td><td>"+esc(c.phone)+"</td><td>"+esc(c.email)+"</td><td>"+esc(c.address)+"</td><td>"+cj.length+'</td><td class="'+(ow>0?"owe":"")+'">'+naira(ow)+'</td><td><button class="del" data-k="customers" data-id="'+c.id+'">Delete</button></td></tr>'}).join("");
  $("ec").hidden=S.customers.length>0;
  $("cs").innerHTML=S.customers.map(function(c){return '<option value="'+c.id+'">'+esc(c.name)+"</option>"}).join("");
  $("nocust").hidden=S.customers.length>0;
  $("tj").innerHTML=jobs.map(function(j){var b=j.cost-j.pay;return "<tr><td>"+esc(j.no)+"</td><td>"+esc(j.date)+"</td><td>"+esc(cust(j.customer).name)+"</td><td>"+esc(j.device)+'</td><td><select data-st="'+j.id+'" data-v="'+(j.status||"Received")+'" aria-label="Status of job '+esc(j.no)+'">'+ST.map(function(x){return "<option"+(x===(j.status||"Received")?" selected":"")+">"+x+"</option>"}).join("")+"</select></td><td>"+["problem","diag","work","parts"].map(function(k){return esc(j[k])||"-"}).join(" / ")+"</td><td>"+naira(j.cost)+'</td><td><input type="number" min="0" step="any" value="'+j.pay+'" data-pay="'+j.id+'" aria-label="Payment for job '+esc(j.no)+'"></td><td class="'+(b>0?"owe":"")+'">'+naira(b)+'</td><td><button class="del" data-k="jobs" data-id="'+j.id+'">Delete</button></td></tr>'}).join("");
  $("ej").hidden=S.jobs.length>0;
  $("te").innerHTML=S.expenses.filter(function(x){return hit([x.desc,x.date])}).sort(function(a,b){return a.date<b.date?1:-1}).map(function(x){return "<tr><td>"+esc(x.date)+"</td><td>"+esc(x.desc)+"</td><td>"+naira(x.amt)+'</td><td><button class="del" data-k="expenses" data-id="'+x.id+'">Delete</button></td></tr>'}).join("");
  $("ee").hidden=S.expenses.length>0;
  var inc=0,cost=0,exp=0;S.jobs.forEach(function(j){inc+=j.pay;cost+=j.cost});S.expenses.forEach(function(x){exp+=x.amt});
  $("stats").innerHTML=[["Income",inc],["Expenses",exp],["Profit",inc-exp],["Outstanding payments",cost-inc]].map(function(a){return '<div class="stat"><span>'+a[0]+"</span><b>"+naira(a[1])+"</b></div>"}).join("");
  var mo={};S.jobs.forEach(function(j){var k=(j.date||"").slice(0,7);mo[k]=mo[k]||[0,0];mo[k][0]+=j.pay});S.expenses.forEach(function(x){var k=(x.date||"").slice(0,7);mo[k]=mo[k]||[0,0];mo[k][1]+=x.amt});
  $("tmo").innerHTML=Object.keys(mo).sort().reverse().map(function(k){var m=mo[k];return "<tr><td>"+esc(k)+"</td><td>"+naira(m[0])+"</td><td>"+naira(m[1])+"</td><td>"+naira(m[0]-m[1])+"</td></tr>"}).join("");
  var owed=S.jobs.filter(function(j){return j.cost-j.pay>0});
  $("tm").innerHTML=owed.map(function(j){var c=cust(j.customer);return "<tr><td>"+esc(j.no)+"</td><td>"+esc(c.name)+"</td><td>"+esc(c.phone)+'</td><td class="owe">'+naira(j.cost-j.pay)+"</td></tr>"}).join("");
  $("em").hidden=owed.length>0;
  var f=$("fj").elements.no;if(!f.value){var n=S.jobs.length+1;f.value="J"+String(n).padStart(3,"0")}
}
function nextNo(){$("fj").elements.no.value="J"+String(S.jobs.length+1).padStart(3,"0")}

document.querySelectorAll("nav button").forEach(function(b){b.onclick=function(){
  document.querySelectorAll("nav button").forEach(function(x){x.setAttribute("aria-selected",x===b)});
  ["customers","jobs","expenses","money"].forEach(function(t){$(t).hidden=t!==b.dataset.t})}});

$("fc").onsubmit=function(e){e.preventDefault();var f=e.target.elements;
  S.customers.push({id:uid(),name:f.name.value.trim(),phone:f.phone.value.trim(),email:f.email.value.trim(),address:f.address.value.trim()});
  e.target.reset();persist();render()};
$("fj").onsubmit=function(e){e.preventDefault();if(!S.customers.length)return;var f=e.target.elements;
  S.jobs.push({id:uid(),no:f.no.value.trim(),customer:f.customer.value,device:f.device.value.trim(),problem:f.problem.value.trim(),diag:f.diag.value.trim(),work:f.work.value.trim(),parts:f.parts.value.trim(),status:f.status.value,cost:+f.cost.value||0,pay:+f.pay.value||0,date:f.date.value});
  e.target.reset();f.date.value=today();persist();nextNo();render()};
$("fe").onsubmit=function(e){e.preventDefault();var f=e.target.elements;
  S.expenses.push({id:uid(),date:f.date.value,desc:f.desc.value.trim(),amt:+f.amt.value||0});
  e.target.reset();f.date.value=today();persist();render()};
document.addEventListener("click",function(e){var b=e.target.closest(".del");if(!b||!b.dataset.k)return;
  sure(b,function(){S[b.dataset.k]=S[b.dataset.k].filter(function(r){return r.id!==b.dataset.id});persist();render()})});
document.addEventListener("change",function(e){var sid=e.target.dataset&&e.target.dataset.st;if(sid){var jj=S.jobs.find(function(r){return r.id===sid});if(jj){jj.status=e.target.value;persist();render()}return}
  var id=e.target.dataset&&e.target.dataset.pay;if(!id)return;
  var j=S.jobs.find(function(r){return r.id===id});if(j){j.pay=+e.target.value||0;persist();render()}});

$("q").oninput=function(){Q=this.value.toLowerCase();render()};$("sf").onchange=render;
document.querySelectorAll("[data-x]").forEach(function(b){b.onclick=function(){var k=b.dataset.x,rows;
  if(k==="customers")rows=[["Customer","Phone","Email","Address"]].concat(S.customers.map(function(c){return [c.name,c.phone,c.email,c.address]}));
  else if(k==="jobs")rows=[["Job number","Customer","Phone","Device","Problem","Diagnosis","Work performed","Parts used","Status","Cost","Payment","Balance","Date"]].concat(S.jobs.map(function(j){var c=cust(j.customer);return [j.no,c.name,c.phone,j.device,j.problem,j.diag,j.work,j.parts,j.status||"Received",j.cost,j.pay,j.cost-j.pay,j.date]}));
  else rows=[["Date","Description","Amount"]].concat(S.expenses.map(function(x){return [x.date,x.desc,x.amt]}));
  if(!window.claude||!claude.use){blobSave("records-"+k+".csv",csv(rows));return}
  claude.use("downloads").then(function(d){if(!d){blobSave("records-"+k+".csv",csv(rows));return}return d.save({filename:"records-"+k+".csv",data:csv(rows)}).then(function(){status("Downloaded records-"+k+".csv")},function(){status("Download cancelled or not allowed.")})})}});
$("fj").elements.date.value=today();$("fe").elements.date.value=today();
try{var l=JSON.parse(localStorage.getItem("records")||"null");if(l&&l.jobs)S=l}catch(e){}
render();status("Saved in this browser only.");

(function(){
  if(!window.claude||!claude.use)return;
  Promise.all([claude.use("db"),claude.use("user")]).then(function(r){
    if(!r[0]||!r[1])return;
    return r[1].id().then(function(id){
      if(!id)return;
      var ref=r[0].collection("data/users/"+id).doc("records");
      return ref.get().then(function(s){
        if(s.exists){var d=s.data();S={customers:d.customers||[],jobs:d.jobs||[],expenses:d.expenses||[]}}
        doc=ref;where="your account";render();
        if(!s.exists&&(S.jobs.length||S.customers.length||S.expenses.length))persist();else status("Saved to your account.");
      });
    });
  }).catch(function(){});
})();
