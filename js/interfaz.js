// Pantalla de armado. Depende de utilidades.js, datos/datos.js y js/informe.js (se cargan antes).
const $=s=>document.querySelector(s);
let D={areas:{},cargos:{},dinamicas:[]};
const S={area:null,cargo:null,sel:new Set(),n:2,guia:true};
const nombreArea=c=>(D.areas[c.area]&&D.areas[c.area].nombre)||c.area;
const deArea=(c,sigla)=>c.area===sigla||c.area===(D.areas[sigla]&&D.areas[sigla].nombre);
// Bajas lógicas: lo que tiene "activo": false no se muestra (un área o cargo inactivo oculta lo que cuelga de él).
const act=o=>o.activo!==false;
const dinDe=id=>D.dinamicas.filter(d=>d.cargo_id===id&&act(d));

function pintaAreas(){const cnt=k=>Object.values(D.cargos).filter(c=>act(c)&&deArea(c,k)).length;
 $('#areas').innerHTML=Object.entries(D.areas).filter(([,a])=>act(a)).map(([k,a])=>`<button class="area" aria-pressed="${k===S.area}" data-a="${esc(k)}"><strong>${esc(a.nombre)}</strong><small>${cnt(k)} cargo${cnt(k)===1?'':'s'}</small></button>`).join('')}
function pintaCargos(){const el=$('#cargos');
 if(!S.area){el.innerHTML='<div class="vacio-box">Primero elige un área.</div>';return}
 el.innerHTML=Object.entries(D.cargos).filter(([k,c])=>act(c)&&deArea(c,S.area)).map(([k,c])=>`<button class="cargo" aria-pressed="${k===S.cargo}" data-c="${k}"><strong>${esc(c.nombre.toLowerCase())}</strong><small>${dinDe(k).length} dinámicas · ${c.competencias.length} competencias</small><span class="cod">${k}</span></button>`).join('')}
function pintaDin(){const car=D.cargos[S.cargo];
 $('#p2').classList.toggle('off',!S.area);$('#p3').classList.toggle('off',!S.cargo);$('#cab').hidden=!car;
 if(!car){$('#lista').innerHTML=`<div class="vacio-box" style="grid-column:1/-1"><b>${S.area?'Ahora elige un cargo':'Empieza eligiendo un área'}</b><br>Las dinámicas disponibles aparecerán acá.</div>`;return}
 const l=dinDe(S.cargo);
 $('#tCargo').textContent=car.nombre.toLowerCase();$('#sCargo').textContent=`${nombreArea(car)} · ${l.length} dinámicas disponibles`;
 $('#todas').textContent=l.every(d=>S.sel.has(d.id))?'Quitar todas':'Seleccionar todas';
 $('#lista').innerHTML=l.map(d=>`<label class="din ${S.sel.has(d.id)?'on':''}"><input type="checkbox" data-d="${d.id}" ${S.sel.has(d.id)?'checked':''}><span class="tilde">✓</span><h3>${esc(d.titulo)}</h3><p>${esc(limpio(d.desc))}</p><div class="meta"><span class="tag">⏱ ${mins(d)||'—'} min</span><span class="tag id">${d.id.replace('DIN-','')}</span><button class="det" data-v="${d.id}">Ver detalle</button></div></label>`).join('')}
function pintaPanel(){const car=D.cargos[S.cargo],sel=car?dinDe(S.cargo).filter(d=>S.sel.has(d.id)):[];
 $('#pCargo').textContent=car?car.nombre.toLowerCase():'Tu evaluación';
 $('#pSub').textContent=car?`${nombreArea(car)} · tu evaluación`:(S.area?'Ahora elige un cargo.':'Empieza eligiendo un área.');$('#n').textContent=S.n;
 $('#selLista').innerHTML=sel.length?sel.map(d=>`<li><span>${esc(d.titulo)}</span><span>${mins(d)} min</span></li>`).join(''):'<li class="vacio">Aún no elegiste dinámicas.</li>';
 const cubre=new Set(car?sel.flatMap(d=>aplica(d,car)):[]),tot=car?car.competencias.length:0;
 $('#cob').innerHTML=car?car.competencias.map((c,i)=>`<i class="${cubre.has(cod(c,i))?'ok':''}" title="${esc(c.comp)}">${esc(cod(c,i))}</i>`).join(''):'';
 $('#cobTxt').textContent=car?`${cubre.size} de ${tot}`:'';$('#cobBar').style.width=tot?(100*cubre.size/tot)+'%':'0';
 const t=sel.reduce((a,d)=>a+mins(d),0);$('#tiempo').textContent=sel.length?`${t} min`:'—';$('#gen').disabled=!sel.length}
const todo=()=>{pintaAreas();pintaCargos();pintaDin();pintaPanel()};

$('#areas').onclick=e=>{const b=e.target.closest('[data-a]');if(!b)return;S.area=b.dataset.a;S.cargo=null;S.sel=new Set();todo()};
$('#cargos').onclick=e=>{const b=e.target.closest('[data-c]');if(!b)return;S.cargo=b.dataset.c;S.sel=new Set();todo()};
$('#lista').onclick=e=>{const v=e.target.closest('[data-v]');if(v){e.preventDefault();abre(v.dataset.v)}};
$('#lista').onchange=e=>{const id=e.target.dataset.d;e.target.checked?S.sel.add(id):S.sel.delete(id);pintaDin();pintaPanel()};
$('#todas').onclick=()=>{const l=dinDe(S.cargo),t=l.every(d=>S.sel.has(d.id));l.forEach(d=>t?S.sel.delete(d.id):S.sel.add(d.id));pintaDin();pintaPanel()};
$('#menos').onclick=()=>{S.n=Math.max(1,S.n-1);pintaPanel()};$('#mas').onclick=()=>{S.n=Math.min(10,S.n+1);pintaPanel()};
const sincGuia=v=>{S.guia=v;$('#guia').checked=v;$('#guia2').checked=v;$('#hoja').classList.toggle('ocultar-guia',!v)};
$('#guia').onchange=e=>sincGuia(e.target.checked);$('#guia2').onchange=e=>sincGuia(e.target.checked);
document.querySelectorAll('[data-cerrar]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));
$('#tema').onclick=()=>{const r=document.documentElement,os=matchMedia('(prefers-color-scheme: dark)').matches;
 r.dataset.theme=(r.dataset.theme||(os?'dark':'light'))==='dark'?'light':'dark'};

function abre(id){const d=D.dinamicas.find(x=>x.id===id),en=S.sel.has(id);
 $('#dId').textContent=d.id;$('#dTit').textContent=d.titulo;
 $('#dCuerpo').innerHTML=`<p style="color:var(--suave);margin:0 0 4px">${esc(limpio(d.desc))} <b>⏱ ${esc(d.tiempo_limite||'sin límite')}</b></p>
 <div class="bq"><b>Objetivo de la prueba</b>${esc(limpio(d.caso_o_consigna))}</div>
 <div class="bq"><b>Guía de observación</b>${esc(limpio(d.guia_evaluacion))}</div>
 <div class="bq av"><b>Corrector · toca para ver</b><span class="cor" onclick="this.classList.toggle('ver')">${esc(limpio(d.respuesta_esperada))}</span></div>`;
 const b=$('#dAdd');b.textContent=en?'Quitar de la evaluación':'Agregar a la evaluación';
 b.onclick=()=>{en?S.sel.delete(id):S.sel.add(id);pintaDin();pintaPanel();$('#dDet').close()};$('#dDet').showModal()}

$('#gen').onclick=()=>{const car=D.cargos[S.cargo],sel=dinDe(S.cargo).filter(d=>S.sel.has(d.id));if(!car||!sel.length)return;
 $('#hoja').innerHTML=construirInforme(S.cargo,car,sel,S.n);sincGuia(S.guia);$('#dInf').showModal()};

async function iniciar(){
 $('#areas').innerHTML='<div class="vacio-box" style="grid-column:1/-1">Cargando catálogo…</div>';
 try{D=await Datos.cargar();todo()}
 catch(e){$('#areas').innerHTML=`<div class="vacio-box" style="grid-column:1/-1"><b>No se pudo cargar el catálogo</b><br>${esc(e.message)}<br><button class="btn sec" id="reintentar" style="margin-top:12px">Reintentar</button></div>`;$('#reintentar').onclick=iniciar}}
iniciar();
