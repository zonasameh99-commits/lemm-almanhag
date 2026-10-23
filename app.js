'use strict';
const $=(s,e=document)=>e.querySelector(s),K='lamm-el-manhag-v1';
const DEF=()=>({subjects:[],tasks:[],exams:[],sessions:[],theme:'light',pomo:{focus:25,brk:5}});
let S;try{S=Object.assign(DEF(),JSON.parse(localStorage.getItem(K)))}catch{S=DEF()}
const save=()=>{try{localStorage.setItem(K,JSON.stringify(S))}catch{toast('تعذّر الحفظ: المساحة ممتلئة')}};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ar=n=>Number(n).toLocaleString('ar-EG');
const ymd=d=>{const x=new Date(d);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};
const today=()=>ymd(new Date());
const left=d=>Math.round((new Date(d+'T00:00')-new Date(today()+'T00:00'))/864e5);
const fmt=d=>new Date(d+'T00:00').toLocaleDateString('ar-EG',{weekday:'long',day:'numeric',month:'long'});
const sub=id=>S.subjects.find(s=>s.id==id);
const prog=s=>s.lessons.length?Math.round(s.lessons.filter(l=>l.done).length/s.lessons.length*100):0;
const COLORS=[['#1f4d3a','أخضر غامق'],['#c9a34e','ذهبي'],['#2f7fa8','أزرق'],['#a8432f','طوبي'],['#7b5ea7','بنفسجي'],['#d07a3c','برتقالي']];
let cur='dash',q='',flt='all',tflt='open',tt;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),2200)}
function ask(title,fields,ok){const d=$('#dlg');
d.innerHTML=`<form><h2>${title}</h2>${fields.map(f=>`<label>${f.l}${f.t=='select'?`<select name="${f.n}">${f.o.map(o=>`<option value="${o[0]}"${o[0]==f.v?' selected':''}>${esc(o[1])}</option>`).join('')}</select>`:`<input name="${f.n}" type="${f.t}" value="${esc(f.v??'')}"${f.r?' required':''}${f.t=='number'?' min="1" max="180"':''}>`}</label>`).join('')}<div class="row"><button class="btn p">حفظ</button><button type="button" class="btn" id="cx">إلغاء</button></div></form>`;
$('#cx',d).onclick=()=>d.close();
$('form',d).onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.target));
for(const k in v)v[k]=v[k].trim();
if(fields.some(f=>f.r&&!v[f.n]))return toast('من فضلك املأ الحقول المطلوبة');
ok(v);d.close()};d.showModal();const i=$('input,select',d);i&&i.focus()}
function sure(msg,fn){const d=$('#dlg');d.innerHTML=`<form><h2>تأكيد</h2><p>${msg}</p><div class="row"><button class="btn p">نعم، تأكيد</button><button type="button" class="btn" id="cx">إلغاء</button></div></form>`;
$('#cx',d).onclick=()=>d.close();$('form',d).onsubmit=e=>{e.preventDefault();fn();d.close()};d.showModal()}
const subOpts=()=>[['','— بدون مادة —'],...S.subjects.map(s=>[s.id,s.name])];
const empty=(i,t,b='')=>`<div class="empty"><big>${i}</big><p>${t}</p>${b}</div>`;
const NAV=[['dash','🏠','الرئيسية'],['subjects','📚','المواد'],['tasks','✅','المهام'],['exams','🗓️','الامتحانات'],['focus','⏱️','التركيز'],['stats','📊','الإحصائيات'],['settings','⚙️','الإعدادات']];
function nav(){$('#nav').innerHTML=`<div class="logo">لمّ المنهج<small>نظّم مذاكرتك بهدوء</small></div>`+NAV.map(n=>`<button data-go="${n[0]}" class="${cur==n[0]?'on':''}"${cur==n[0]?' aria-current="page"':''}><span aria-hidden="true">${n[1]}</span>${n[2]}</button>`).join('')}
function mins(day){return S.sessions.filter(x=>x.date==day).reduce((a,b)=>a+b.min,0)}
function taskRow(t){const s=sub(t.sub);return `<div class="item${t.done?' done':''}"><input type="checkbox" data-a="tt" data-id="${t.id}" ${t.done?'checked':''} aria-label="إنجاز المهمة"><span>${esc(t.text)} ${s?`<small class="sub"><i class="dot" style="background:${s.color}"></i> ${esc(s.name)}</small>`:''}${t.date?` <small class="sub">· ${fmt(t.date)}</small>`:''}</span><button class="btn s d" data-a="td" data-id="${t.id}" aria-label="حذف">حذف</button></div>`}
function examRow(e){const d=left(e.date),s=sub(e.sub);return `<div class="item"><span><b>${esc(e.name)}</b> ${s?`<small class="sub">· ${esc(s.name)}</small>`:''}<br><small class="sub">${fmt(e.date)}</small></span><span class="badge${d>=0&&d<=7?' hot':''}" style="flex:0">${d<0?'انتهى':d==0?'اليوم!':'باقي '+ar(d)+' يوم'}</span><button class="btn s d" data-a="ed" data-id="${e.id}">حذف</button></div>`}
const V={
dash(){const all=S.subjects.flatMap(s=>s.lessons),dn=all.filter(l=>l.done).length,pc=all.length?Math.round(dn/all.length*100):0;
const tk=S.tasks.filter(t=>!t.done&&(!t.date||t.date<=today())),ex=S.exams.filter(e=>left(e.date)>=0).sort((a,b)=>a.date<b.date?-1:1);
const h=new Date().getHours(),g=h<12?'صباح الخير':h<18?'نهارك سعيد':'مساء الخير';
return `<div class="top"><div><h1>${g} 🌿</h1><p class="sub">${fmt(today())}</p></div></div>
<div class="grid"><div class="card stat"><span class="sub">إنجاز المنهج</span><b>${ar(pc)}٪</b><div class="bar"><i style="width:${pc}%"></i></div><small class="sub">${ar(dn)} من ${ar(all.length)} درس</small></div>
<div class="card stat"><span class="sub">مهام مستحقة</span><b>${ar(tk.length)}</b></div>
<div class="card stat"><span class="sub">أقرب امتحان</span><b>${ex[0]?(left(ex[0].date)==0?'اليوم':ar(left(ex[0].date))+' يوم'):'—'}</b><small class="sub">${ex[0]?esc(ex[0].name):'لا توجد امتحانات'}</small></div>
<div class="card stat"><span class="sub">دقائق التركيز اليوم</span><b>${ar(mins(today()))}</b></div></div>
<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr))"><div class="card"><h2>مهام اليوم</h2>${tk.length?tk.slice(0,6).map(taskRow).join(''):empty('🎉','لا مهام معلّقة. أضف مهمة جديدة من صفحة المهام.')}</div>
<div class="card"><h2>الامتحانات القادمة</h2>${ex.length?ex.slice(0,4).map(examRow).join(''):empty('🗓️','لم تضف امتحانات بعد.')}</div></div>`},
subjects(){const L=S.subjects.filter(s=>(!q||s.name.includes(q)||s.lessons.some(l=>l.title.includes(q)))&&(flt=='all'||(flt=='done'?prog(s)==100&&s.lessons.length:prog(s)<100)));
return `<div class="top"><h1>المواد والدروس</h1><button class="btn p" data-a="sa">+ مادة جديدة</button></div>
<div class="tools"><input id="q" value="${esc(q)}" placeholder="ابحث عن مادة أو درس…" aria-label="بحث"><select id="f" aria-label="تصفية"><option value="all">الكل</option><option value="open"${flt=='open'?' selected':''}>قيد الدراسة</option><option value="done"${flt=='done'?' selected':''}>مكتملة</option></select></div>
${L.length?L.map(s=>`<div class="card" style="margin-bottom:16px;border-right:6px solid ${s.color}"><div class="row sp"><h2>${esc(s.name)}</h2><div class="row"><button class="btn s" data-a="la" data-id="${s.id}">+ درس</button><button class="btn s" data-a="se" data-id="${s.id}">تعديل</button><button class="btn s d" data-a="sd" data-id="${s.id}">حذف</button></div></div>
<div class="bar"><i style="width:${prog(s)}%"></i></div><small class="sub">${ar(prog(s))}٪ — ${ar(s.lessons.filter(l=>l.done).length)} من ${ar(s.lessons.length)}</small>
${s.lessons.length?s.lessons.filter(l=>!q||s.name.includes(q)||l.title.includes(q)).map(l=>`<div class="item${l.done?' done':''}"><input type="checkbox" data-a="lt" data-id="${s.id}" data-l="${l.id}" ${l.done?'checked':''} aria-label="إنجاز الدرس"><span>${esc(l.title)}</span><button class="btn s d" data-a="ld" data-id="${s.id}" data-l="${l.id}">✕</button></div>`).join(''):'<p class="sub">لا دروس بعد.</p>'}</div>`).join(''):empty('📚',S.subjects.length?'لا نتائج مطابقة.':'ابدأ بإضافة أول مادة دراسية.',S.subjects.length?'':'<button class="btn p" data-a="sa">+ إضافة مادة</button>')}`},
tasks(){const L=S.tasks.filter(t=>tflt=='all'||(tflt=='open'?!t.done:tflt=='done'?t.done:t.date==today()));
return `<div class="top"><h1>المهام اليومية</h1><button class="btn p" data-a="ta">+ مهمة جديدة</button></div>
<div class="tools"><select id="tf" aria-label="تصفية"><option value="open">المفتوحة</option><option value="today"${tflt=='today'?' selected':''}>اليوم</option><option value="done"${tflt=='done'?' selected':''}>المنجزة</option><option value="all"${tflt=='all'?' selected':''}>الكل</option></select></div>
<div class="card">${L.length?L.map(taskRow).join(''):empty('✅','لا مهام هنا.')}</div>`},
exams(){const L=[...S.exams].sort((a,b)=>a.date<b.date?-1:1);
return `<div class="top"><h1>الامتحانات</h1><button class="btn p" data-a="ea">+ امتحان جديد</button></div><div class="card">${L.length?L.map(examRow).join(''):empty('🗓️','أضف موعد امتحانك لتبدأ العدّ التنازلي.')}</div>`},
focus(){return `<div class="top"><h1>مؤقّت التركيز</h1></div><div class="card timer"><div class="row" style="justify-content:center"><button class="btn${tm.mode=='focus'?' p':''}" data-a="pm" data-m="focus">تركيز</button><button class="btn${tm.mode=='brk'?' p':''}" data-a="pm" data-m="brk">استراحة</button></div>
<div class="t" id="td" role="timer">${clock()}</div><div class="row" style="justify-content:center"><button class="btn p" data-a="pp" id="pb">${tm.run?'إيقاف مؤقت':'ابدأ'}</button><button class="btn" data-a="pr">إعادة</button></div>
<p class="sub" style="margin-top:14px">جلسات التركيز المكتملة اليوم: ${ar(S.sessions.filter(x=>x.date==today()).length)}</p></div>`},
stats(){const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return[ymd(d),d.toLocaleDateString('ar-EG',{weekday:'short'})]}),m=days.map(d=>mins(d[0])),mx=Math.max(...m,1),tot=m.reduce((a,b)=>a+b,0),dn=S.tasks.filter(t=>t.done).length;
return `<div class="top"><h1>إحصائيات الأسبوع</h1></div><div class="grid"><div class="card stat"><span class="sub">دقائق التركيز (٧ أيام)</span><b>${ar(tot)}</b></div><div class="card stat"><span class="sub">متوسط يومي</span><b>${ar(Math.round(tot/7))}</b></div><div class="card stat"><span class="sub">مهام منجزة</span><b>${ar(dn)}</b></div></div>
<div class="card"><h2>التركيز اليومي بالدقائق</h2><br><div class="chart">${days.map((d,i)=>`<div><span>${ar(m[i])}</span><i style="height:${m[i]/mx*85}%"></i><span>${d[1]}</span></div>`).join('')}</div></div>
<div class="card" style="margin-top:16px"><h2>تقدّم المواد</h2>${S.subjects.length?S.subjects.map(s=>`<p style="margin-top:10px">${esc(s.name)} — ${ar(prog(s))}٪</p><div class="bar"><i style="width:${prog(s)}%;background:${s.color}"></i></div>`).join(''):empty('📊','أضف مواد لتظهر هنا.')}</div>`},
settings(){return `<div class="top"><h1>الإعدادات</h1></div><div class="grid">
<div class="card"><h2>المظهر</h2><br><button class="btn" data-a="th">${S.theme=='dark'?'☀️ الوضع الفاتح':'🌙 الوضع الداكن'}</button></div>
<div class="card"><h2>مدّة المؤقّت</h2><br><button class="btn" data-a="pc">تعديل (${ar(S.pomo.focus)} / ${ar(S.pomo.brk)} دقيقة)</button></div>
<div class="card"><h2>نسخة احتياطية</h2><br><div class="row"><button class="btn p" data-a="ex">تصدير JSON</button><button class="btn" data-a="im">استيراد</button></div></div>
<div class="card"><h2>مسح كل البيانات</h2><br><button class="btn d" data-a="rs">حذف الكل</button></div></div>`}};
const tm={mode:'focus',left:null,run:false,end:0,id:null};
const dur=()=>(tm.mode=='focus'?S.pomo.focus:S.pomo.brk)*60;
if(tm.left===null)tm.left=dur();
const clock=()=>String(Math.floor(tm.left/60)).padStart(2,'0')+':'+String(tm.left%60).padStart(2,'0');
function beep(){try{const c=new AudioContext(),o=c.createOscillator();o.connect(c.destination);o.frequency.value=660;o.start();o.stop(c.currentTime+.4)}catch{}}
function tick(){tm.left=Math.max(0,Math.round((tm.end-Date.now())/1000));const e=$('#td');e&&(e.textContent=clock());document.title=tm.run?clock()+' — لمّ المنهج':'لمّ المنهج — مخطط المذاكرة';
if(tm.left<=0){clearInterval(tm.id);tm.run=false;beep();if(tm.mode=='focus'){S.sessions.push({date:today(),min:S.pomo.focus});save();toast('أحسنت! جلسة تركيز مكتملة 🎉')}else toast('انتهت الاستراحة');tm.mode=tm.mode=='focus'?'brk':'focus';tm.left=dur();document.title='لمّ المنهج';cur=='focus'&&render()}}
function render(){document.documentElement.dataset.theme=S.theme;nav();$('#main').innerHTML=V[cur]();const i=$('#q');if(i&&q){i.focus();i.setSelectionRange(q.length,q.length)}}
function go(v){cur=v;render();scrollTo(0,0)}
const A={
sa(){ask('مادة جديدة',[{n:'name',l:'اسم المادة',t:'text',r:1},{n:'color',l:'اللون',t:'select',o:COLORS,v:COLORS[0][0]}],v=>{S.subjects.push({id:uid(),name:v.name,color:v.color,lessons:[]});save();render();toast('تمت إضافة المادة')})},
se(id){const s=sub(id);ask('تعديل المادة',[{n:'name',l:'اسم المادة',t:'text',r:1,v:s.name},{n:'color',l:'اللون',t:'select',o:COLORS,v:s.color}],v=>{Object.assign(s,v);save();render()})},
sd(id){sure('سيتم حذف المادة وكل دروسها. هل أنت متأكد؟',()=>{S.subjects=S.subjects.filter(s=>s.id!=id);S.tasks.forEach(t=>t.sub==id&&(t.sub=''));S.exams.forEach(t=>t.sub==id&&(t.sub=''));save();render()})},
la(id){ask('درس جديد',[{n:'title',l:'عنوان الدرس',t:'text',r:1}],v=>{sub(id).lessons.push({id:uid(),title:v.title,done:false});save();render()})},
lt(id,_,el){const l=sub(id).lessons.find(x=>x.id==el.dataset.l);l.done=el.checked;save();render()},
ld(id,_,el){sure('حذف هذا الدرس؟',()=>{const s=sub(id);s.lessons=s.lessons.filter(x=>x.id!=el.dataset.l);save();render()})},
ta(){ask('مهمة جديدة',[{n:'text',l:'المهمة',t:'text',r:1},{n:'date',l:'تاريخ الاستحقاق (اختياري)',t:'date',v:today()},{n:'sub',l:'المادة',t:'select',o:subOpts()}],v=>{S.tasks.push({id:uid(),text:v.text,date:v.date,sub:v.sub,done:false});save();render()})},
tt(id,_,el){S.tasks.find(t=>t.id==id).done=el.checked;save();render()},
td(id){sure('حذف هذه المهمة؟',()=>{S.tasks=S.tasks.filter(t=>t.id!=id);save();render()})},
ea(){ask('امتحان جديد',[{n:'name',l:'اسم الامتحان',t:'text',r:1},{n:'date',l:'التاريخ',t:'date',r:1,v:today()},{n:'sub',l:'المادة',t:'select',o:subOpts()}],v=>{S.exams.push({id:uid(),name:v.name,date:v.date,sub:v.sub});save();render()})},
ed(id){sure('حذف هذا الامتحان؟',()=>{S.exams=S.exams.filter(t=>t.id!=id);save();render()})},
pp(){if(tm.run){clearInterval(tm.id);tm.run=false}else{tm.end=Date.now()+tm.left*1000;tm.run=true;tm.id=setInterval(tick,500)}render()},
pr(){clearInterval(tm.id);tm.run=false;tm.left=dur();document.title='لمّ المنهج';render()},
pm(_,__,el){clearInterval(tm.id);tm.run=false;tm.mode=el.dataset.m;tm.left=dur();render()},
pc(){ask('مدّة المؤقّت (بالدقائق)',[{n:'f',l:'التركيز',t:'number',r:1,v:S.pomo.focus},{n:'b',l:'الاستراحة',t:'number',r:1,v:S.pomo.brk}],v=>{const f=+v.f,b=+v.b;if(!(f>=1&&f<=180&&b>=1&&b<=180))return toast('أدخل قيمًا بين ١ و١٨٠');S.pomo={focus:f,brk:b};save();A.pr()})},
th(){S.theme=S.theme=='dark'?'light':'dark';save();render()},
ex(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,2)],{type:'application/json'}));a.download='lamm-el-manhag-'+today()+'.json';a.click();URL.revokeObjectURL(a.href);toast('تم تصدير النسخة الاحتياطية')},
im(){$('#imp').click()},
rs(){sure('سيتم حذف كل بياناتك نهائيًا. يُفضّل التصدير أولًا. متابعة؟',()=>{S=DEF();save();pr0();render();toast('تم مسح البيانات')})}};
const pr0=()=>{clearInterval(tm.id);tm.run=false;tm.mode='focus';tm.left=dur()};
document.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g)return go(g.dataset.go);
const b=e.target.closest('[data-a]');if(!b||b.type=='checkbox')return;A[b.dataset.a]?.(b.dataset.id,b.dataset.l,b)});
document.addEventListener('change',e=>{const t=e.target;
if(t.dataset.a&&t.type=='checkbox')A[t.dataset.a](t.dataset.id,0,t);
else if(t.id=='f'){flt=t.value;render()}else if(t.id=='tf'){tflt=t.value;render()}});
document.addEventListener('input',e=>{if(e.target.id=='q'){q=e.target.value.trim();render()}});
$('#imp').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const r=new FileReader();
r.onload=()=>{try{const d=JSON.parse(r.result);if(!['subjects','tasks','exams','sessions'].every(k=>Array.isArray(d[k])))throw 0;
sure('سيتم استبدال بياناتك الحالية بالملف المستورد. متابعة؟',()=>{S=Object.assign(DEF(),d);save();pr0();render();toast('تم الاستيراد بنجاح')})}catch{toast('ملف غير صالح')}};r.readAsText(f)};
render();
