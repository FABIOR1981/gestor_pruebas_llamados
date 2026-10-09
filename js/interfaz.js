// Pantalla de armado. Depende de utilidades.js, datos/datos.js y js/informe.js (se cargan antes).
const $=s=>document.querySelector(s);
let D={areas:{},cargos:{},dinamicas:[]};
const S={area:null,cargo:null,sel:new Set(),n:2,guia:true,tManual:null,firma:'',nombreInf:'',fechaInf:null,clave:''};
const nombreArea=c=>(D.areas[c.area]&&D.areas[c.area].nombre)||c.area;
const deArea=(c,sigla)=>c.area===sigla||c.area===(D.areas[sigla]&&D.areas[sigla].nombre);
// Bajas lógicas: lo que tiene "activo": false no se muestra (un área o cargo inactivo oculta lo que cuelga de él).
const act=o=>o.activo!==false;
const dinDe=id=>D.dinamicas.filter(d=>d.cargo_id===id&&act(d));

function pintaAreas(){const cnt=k=>Object.values(D.cargos).filter(c=>act(c)&&deArea(c,k)).length;
 $('#areas').innerHTML=Object.entries(D.areas).filter(([,a])=>act(a)).map(([k,a])=>`<button class="area" aria-pressed="${k===S.area}" data-a="${esc(k)}"><strong>${esc(a.nombre)}</strong><small>${cnt(k)} cargo${cnt(k)===1?'':'s'}</small></button>`).join('')}
function pintaCargos(){const el=$('#cargos');
 if(!S.area){el.innerHTML='<div class="vacio-box">Primero elige un área.</div>';return}
 el.innerHTML=Object.entries(D.cargos).filter(([k,c])=>act(c)&&deArea(c,S.area)).map(([k,c])=>`<button class="cargo" aria-pressed="${k===S.cargo}" data-c="${k}"><strong>${esc(bonito(c.nombre))}</strong><small>${dinDe(k).length} dinámicas · ${c.competencias.length} competencias</small><span class="cod">${k}</span></button>`).join('')||'<div class="vacio-box">Esta área no tiene cargos activos.</div>'}
function pintaDin(){const car=D.cargos[S.cargo];
 $('#p2').classList.toggle('off',!S.area);$('#p3').classList.toggle('off',!S.cargo);$('#cab').hidden=!car;
 if(!car){$('#lista').innerHTML=`<div class="vacio-box" style="grid-column:1/-1"><b>${S.area?'Ahora elige un cargo':'Empieza eligiendo un área'}</b><br>Las dinámicas disponibles aparecerán acá.</div>`;return}
 const l=dinDe(S.cargo);
 $('#tCargo').textContent=bonito(car.nombre);$('#sCargo').textContent=`${nombreArea(car)} · ${l.length} dinámicas disponibles`;
 $('#todas').textContent=l.every(d=>S.sel.has(d.id))?'Quitar todas':'Seleccionar todas';
 $('#lista').innerHTML=l.map(d=>`<label class="din ${S.sel.has(d.id)?'on':''}"><input type="checkbox" data-d="${d.id}" ${S.sel.has(d.id)?'checked':''}><span class="tilde">✓</span><h3>${esc(d.titulo)}</h3><p>${esc(limpio(d.desc))}</p><div class="meta">${mins(d)?`<span class="tag">⏱ ${mins(d)} min</span>`:''}<span class="tag id">${d.id.replace('DIN-','')}</span><button class="det" data-v="${d.id}">Ver detalle</button></div></label>`).join('')||'<div class="vacio-box" style="grid-column:1/-1">Este cargo todavía no tiene dinámicas activas.</div>'}
function pintaPanel(){const car=D.cargos[S.cargo],sel=car?dinDe(S.cargo).filter(d=>S.sel.has(d.id)):[];
 $('#pCargo').textContent=car?bonito(car.nombre):'Tu evaluación';
 $('#pSub').textContent=car?`${nombreArea(car)} · tu evaluación`:(S.area?'Ahora elige un cargo.':'Empieza eligiendo un área.');$('#n').textContent=S.n;
 $('#selLista').innerHTML=sel.length?sel.map(d=>`<li><span>${esc(d.titulo)}</span><span>${mins(d)?mins(d)+' min':''}</span></li>`).join(''):'<li class="vacio">Aún no elegiste dinámicas.</li>';
 const cubre=new Set(car?sel.flatMap(d=>aplica(d,car)):[]),tot=car?car.competencias.length:0;
 $('#cob').innerHTML=car?car.competencias.map((c,i)=>`<i class="${cubre.has(cod(c,i))?'ok':''}" title="${esc(c.comp)}">${esc(cod(c,i))}</i>`).join(''):'';
 $('#cobTxt').textContent=car?`${cubre.size} de ${tot}`:'';$('#cobBar').style.width=tot?(100*cubre.size/tot)+'%':'0';
 // Tiempo estimado: se ofrece la suma de las dinámicas, pero se puede editar. Al cambiar la selección vuelve a ofrecerse el valor calculado.
 const firma=[...S.sel].sort().join();if(firma!==S.firma){S.firma=firma;S.tManual=null}
 const t=sel.reduce((a,d)=>a+mins(d),0),inp=$('#tiempoIn');inp.disabled=!sel.length;
 if(!sel.length){inp.value='';S.tManual=null}else if(S.tManual===null)inp.value=t;
 $('#tReset').hidden=!sel.length||S.tManual===null||S.tManual===t;$('#tReset').title=`Volver al valor calculado (${t} min)`;
 $('#gen').disabled=!sel.length}
const tiempoEfectivo=()=>{const sel=dinDe(S.cargo).filter(d=>S.sel.has(d.id));return S.tManual===null?sel.reduce((a,d)=>a+mins(d),0):S.tManual};
const todo=()=>{pintaAreas();pintaCargos();pintaDin();pintaPanel()};

$('#areas').onclick=e=>{const b=e.target.closest('[data-a]');if(!b)return;S.area=b.dataset.a;S.cargo=null;S.sel=new Set();todo()};
$('#cargos').onclick=e=>{const b=e.target.closest('[data-c]');if(!b)return;S.cargo=b.dataset.c;S.sel=new Set();todo()};
$('#lista').onclick=e=>{const v=e.target.closest('[data-v]');if(v){e.preventDefault();abre(v.dataset.v)}};
$('#lista').onchange=e=>{const id=e.target.dataset.d;e.target.checked?S.sel.add(id):S.sel.delete(id);pintaDin();pintaPanel()};
$('#todas').onclick=()=>{const l=dinDe(S.cargo),t=l.every(d=>S.sel.has(d.id));l.forEach(d=>t?S.sel.delete(d.id):S.sel.add(d.id));pintaDin();pintaPanel()};
$('#tiempoIn').oninput=e=>{const v=e.target.value;S.tManual=v===''?null:Math.min(999,Math.max(0,parseInt(v,10)||0));const sel=dinDe(S.cargo).filter(d=>S.sel.has(d.id)),t=sel.reduce((a,d)=>a+mins(d),0);$('#tReset').hidden=S.tManual===null||S.tManual===t};
$('#tiempoIn').onblur=()=>{if($('#tiempoIn').value===''){S.tManual=null;pintaPanel()}};
$('#tReset').onclick=()=>{S.tManual=null;pintaPanel()};
$('#menos').onclick=()=>{S.n=Math.max(1,S.n-1);pintaPanel()};$('#mas').onclick=()=>{S.n=Math.min(10,S.n+1);pintaPanel()};
const sincGuia=v=>{S.guia=v;$('#guia').checked=v;$('#guia2').checked=v;$('#hoja').classList.toggle('ocultar-guia',!v)};
$('#guia').onchange=e=>sincGuia(e.target.checked);$('#guia2').onchange=e=>sincGuia(e.target.checked);
document.querySelectorAll('[data-cerrar]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));
$('#tema').onclick=()=>{const r=document.documentElement,os=matchMedia('(prefers-color-scheme: dark)').matches;
 r.dataset.theme=(r.dataset.theme||(os?'dark':'light'))==='dark'?'light':'dark'};

function abre(id){const d=D.dinamicas.find(x=>x.id===id),en=S.sel.has(id);
 $('#dId').textContent=d.id;$('#dTit').textContent=d.titulo;
 $('#dCuerpo').innerHTML=`<p style="color:var(--suave);margin:0 0 4px">${esc(limpio(d.desc))} ${sinTiempo(d)?'':`<b>⏱ ${esc(d.tiempo_limite)}</b>`}</p>
 <div class="bq"><b>Objetivo de la prueba</b>${esc(limpio(d.caso_o_consigna))}</div>
 <div class="bq"><b>Guía de observación</b>${esc(limpio(d.guia_evaluacion))}</div>
 <div class="bq av"><b>Corrector · toca para ver</b><span class="cor" onclick="this.classList.toggle('ver')">${esc(limpio(d.respuesta_esperada))}</span></div>`;
 const b=$('#dAdd');b.textContent=en?'Quitar de la evaluación':'Agregar a la evaluación';
 b.onclick=()=>{en?S.sel.delete(id):S.sel.add(id);pintaDin();pintaPanel();$('#dDet').close()};$('#dDet').showModal()}

// Al imprimir (botón o Ctrl+P) el informe se copia fuera del modal: imprimir desde el diálogo dejaba una hoja en blanco y perdía el informe.
const preparaImpresion=()=>{const z=$('#zonaImpresion');z.className='print-container'+(S.guia?'':' ocultar-guia');z.innerHTML=$('#hoja').innerHTML};
window.addEventListener('beforeprint',()=>{if($('#dInf').open)preparaImpresion()});
window.addEventListener('afterprint',()=>{$('#zonaImpresion').innerHTML=''});
// ---------- Guardar el informe (instantánea completa) y reabrirlo por código ----------
const norm=t=>String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const hoy=()=>new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
const fecha=f=>fmtFecha(f)||'';
const snapshot=()=>{const car=D.cargos[S.cargo],ar=D.areas[S.area]||{nombre:car.area},sel=dinDe(S.cargo).filter(d=>S.sel.has(d.id));
 return JSON.parse(JSON.stringify({nombre:S.nombreInf,fecha_evaluacion:S.fechaInf,postulantes:S.n,tiempo_total:tiempoEfectivo(),guia:S.guia,area:{sigla:S.area,nombre:ar.nombre},cargo:{codigo:S.cargo,...car},dinamicas:sel}))};
function mostrarInforme(snap,est={}){
 $('#hoja').innerHTML=construirInforme(snap.cargo.codigo,snap.cargo,snap.dinamicas,snap.postulantes,snap.tiempo_total,{codigo:est.codigo,nombre:snap.nombre,fecha:snap.fecha_evaluacion});sincGuia(snap.guia);
 $('#subInf').innerHTML=est.codigo?(est.reabierto?`Informe guardado <b class="cod-g">${esc(est.codigo)}</b>, tal como se generó. Así saldrá en hoja A4.`:`Guardado como <b class="cod-g">${esc(est.codigo)}</b>${est.actualizado?' (se actualizó el informe existente)':''}. Así saldrá en hoja A4.`)
  :`<span class="av-txt">⚠ No se pudo guardar: ${esc(est.error||'error desconocido')}.</span> <button type="button" class="link" id="reintGuardar">Reintentar</button>`;
 const b=$('#reintGuardar');if(b)b.onclick=()=>reintentar(snap);
 if(!$('#dInf').open)$('#dInf').showModal()}
async function reintentar(snap){const b=$('#reintGuardar');b.disabled=true;b.textContent='Guardando…';
 try{const r=await Datos.guardarInforme(snap,{clave:S.clave});mostrarInforme(snap,{codigo:r.codigo,actualizado:r.actualizado})}
 catch(x){if(x.status===401||x.status===409){$('#dInf').close();abreGuardar()}else mostrarInforme(snap,{error:x.message})}}
const dg=$('#dGuardar'),fg=$('#fGuardar');
function abreGuardar(){fg.nombre.value=S.nombreInf;fg.fecha.value=S.fechaInf||hoy();fg.clave.value='';$('#gClave').hidden=true;$('#gDup').hidden=true;$('#gErr').textContent='';dg.showModal();fg.nombre.focus()}
async function enviar(reemplazar){
 S.nombreInf=fg.nombre.value.trim();S.fechaInf=fg.fecha.value;if(!S.nombreInf||!S.fechaInf)return;
 if(!$('#gClave').hidden)S.clave=fg.clave.value;
 const snap=snapshot(),ok=$('#gOk');ok.disabled=true;ok.textContent='Guardando…';$('#gErr').textContent='';$('#gDup').hidden=true;
 try{const r=await Datos.guardarInforme(snap,{clave:S.clave,reemplazar});dg.close();mostrarInforme(snap,{codigo:r.codigo,actualizado:r.actualizado})}
 catch(x){
  if(x.status===409&&x.detalle&&x.detalle.error==='nombre_existe'){const g=$('#gDup');
   g.innerHTML=`Ya existe el informe <b>${esc(x.detalle.nombre)}</b> (<span class="cod-g">${esc(x.detalle.codigo)}</span>). Si lo actualizas, conserva su código y se reemplaza su contenido.<br><button type="button" class="btn" id="gAct">Actualizar ${esc(x.detalle.codigo)}</button><button type="button" class="btn sec" id="gCamb">Cambiar el nombre</button>`;g.hidden=false;
   $('#gAct').onclick=()=>enviar(true);$('#gCamb').onclick=()=>{g.hidden=true;fg.nombre.focus();fg.nombre.select()}}
  else if(x.status===401){$('#gClave').hidden=false;$('#gErr').textContent=S.clave?'La contraseña no es correcta.':'Para guardar hace falta la contraseña.';fg.clave.focus()}
  else{dg.close();mostrarInforme(snap,{error:x.message})}}
 finally{ok.disabled=false;ok.textContent='Generar y guardar'}}
fg.onsubmit=e=>{e.preventDefault();enviar(false)};
$('#gen').onclick=()=>{const car=D.cargos[S.cargo],sel=dinDe(S.cargo).filter(d=>S.sel.has(d.id));if(!car||!sel.length)return;abreGuardar()};

let INFS=[];
function pintaInfs(){const q=norm($('#infBus').value),l=INFS.filter(x=>!q||norm([x.nombre,x.codigo,x.cargo_nombre,x.area_nombre].join(' ')).includes(q));
 $('#infLista').innerHTML=l.map(x=>`<button type="button" class="inf-item" data-c="${esc(x.codigo)}"><span><strong>${esc(x.nombre)}</strong><small>${esc(x.cargo_nombre)} · ${esc(x.area_nombre)} · ${esc(fecha(x.fecha_evaluacion))} · ${x.postulantes} postulante${x.postulantes>1?'s':''}</small></span><span class="idm-s">${esc(x.codigo)}</span></button>`).join('')||`<div class="vacio-box">${INFS.length?'Ningún informe coincide con la búsqueda.':'Todavía no hay informes guardados.'}</div>`}
async function abreInformes(){$('#infErr').textContent='';$('#infCod').value='';$('#infBus').value='';$('#infLista').innerHTML='<div class="vacio-box">Cargando…</div>';$('#dInfs').showModal();
 try{INFS=(await Datos.listarInformes()).slice().sort((a,b)=>String(b.actualizado).localeCompare(String(a.actualizado)));pintaInfs()}catch(x){$('#infLista').innerHTML='';$('#infErr').textContent=x.message}}
async function abreGuardado(codigo){const c=String(codigo).trim().toUpperCase();if(!c)return;$('#infErr').textContent='';
 try{const r=await Datos.leerInforme(c);$('#dInfs').close();mostrarInforme(r,{codigo:r.codigo,reabierto:true})}
 catch(x){$('#infErr').textContent=x.status===404?`No existe el informe ${c}.`:x.message}}
$('#bInformes').onclick=abreInformes;$('#infBus').oninput=pintaInfs;
$('#infAbrir').onclick=()=>abreGuardado($('#infCod').value);$('#infCod').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();abreGuardado(e.target.value)}};
$('#infLista').onclick=e=>{const b=e.target.closest('[data-c]');if(b)abreGuardado(b.dataset.c)};

async function iniciar(){
 $('#areas').innerHTML='<div class="vacio-box" style="grid-column:1/-1">Cargando catálogo…</div>';
 try{D=await Datos.cargar();todo()}
 catch(e){$('#areas').innerHTML=`<div class="vacio-box" style="grid-column:1/-1"><b>No se pudo cargar el catálogo</b><br>${esc(e.message)}<br><button class="btn sec" id="reintentar" style="margin-top:12px">Reintentar</button></div>`;$('#reintentar').onclick=iniciar}}
iniciar();
