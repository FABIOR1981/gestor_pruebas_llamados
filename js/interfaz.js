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
 const sinC=car?sel.filter(d=>competenciasDeDinamica(d,car).length===0):[],av=$('#avRel');
 av.innerHTML=sinC.length?`<p>⚠ Sin competencia relacionada: <b>${sinC.map(d=>esc(d.titulo)).join(', ')}</b>.</p>`:'';av.hidden=!sinC.length;
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
// Clic fuera cierra el diálogo, salvo los marcados data-fijo (formularios largos: se perdería lo cargado).
document.querySelectorAll('dialog:not([data-fijo])').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));
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
 return JSON.parse(JSON.stringify({nombre:S.nombreInf||bonito(car.nombre),fecha_evaluacion:S.fechaInf,postulantes:S.n,tiempo_total:tiempoEfectivo(),guia:S.guia,area:{sigla:S.area,nombre:ar.nombre},cargo:{codigo:S.cargo,...car},dinamicas:sel}))};
// Informe en pantalla y modo de impresión: 'cor' = con los datos de la corrección, 'blanco' = formulario vacío.
let VISTA={snap:null,est:{},modo:'cor'};
function pintaHoja(){const {snap,est,modo}=VISTA,cor=snap.correccion&&modo==='cor'?snap.correccion:null;
 $('#hoja').innerHTML=construirInforme(snap.cargo.codigo,snap.cargo,snap.dinamicas,snap.postulantes,snap.tiempo_total,{codigo:est.codigo,nombre:snap.nombre,fecha:snap.fecha_evaluacion,correccion:cor});sincGuia(snap.guia);
 const sg=$('#segCor');sg.hidden=!snap.correccion;sg.querySelectorAll('[data-m]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===modo))}
function mostrarInforme(snap,est={},modo){VISTA={snap,est,modo:modo||(snap.correccion?'cor':'blanco')};pintaHoja();
 const c=snap.correccion,estado=c?(c.estado==='final'?' · <b>corrección finalizada</b>: ya no admite cambios.':' · corrección en borrador.'):'';
 $('#subInf').innerHTML=est.codigo?(est.reabierto?`Informe guardado <b class="cod-g">${esc(est.codigo)}</b>${estado||', tal como se generó.'} Así saldrá en hoja A4.`:`Guardado como <b class="cod-g">${esc(est.codigo)}</b>${est.actualizado?' (se actualizó el informe existente)':''}. Así saldrá en hoja A4.`)
  :`<span class="av-txt">⚠ No se pudo guardar: ${esc(est.error||'error desconocido')}.</span> <button type="button" class="link" id="reintGuardar">Reintentar</button>`;
 const b=$('#reintGuardar');if(b)b.onclick=()=>reintentar(snap);
 const bc=$('#bCorInf');bc.hidden=!est.codigo;bc.textContent=c&&c.estado==='final'?'Ver corrección':'✎ Corrección';
 if(!$('#dInf').open)$('#dInf').showModal()}
$('#segCor').onclick=e=>{const b=e.target.closest('[data-m]');if(!b)return;VISTA.modo=b.dataset.m;pintaHoja()};
$('#bCorInf').onclick=()=>abreCorreccionDe(VISTA.est.codigo,$('#bCorInf'));
async function reintentar(snap){const b=$('#reintGuardar');b.disabled=true;b.textContent='Guardando…';
 try{const r=await Datos.guardarInforme(snap,{clave:S.clave});mostrarInforme(snap,{codigo:r.codigo,actualizado:r.actualizado})}
 catch(x){if(x.status===401||x.status===409){$('#dInf').close();abreGuardar()}else mostrarInforme(snap,{error:x.message})}}
const dg=$('#dGuardar'),fg=$('#fGuardar');
function abreGuardar(){fg.nombre.value=S.nombreInf;fg.nombre.placeholder=`Si lo dejas vacío: ${bonito(D.cargos[S.cargo].nombre)}`;fg.fecha.value=S.fechaInf||hoy();fg.clave.value='';$('#gClave').hidden=true;$('#gDup').hidden=true;$('#gErr').textContent='';
 const av=avisosRelaciones(D.cargos[S.cargo],dinDe(S.cargo).filter(d=>S.sel.has(d.id))),gr=$('#gRel');
 gr.innerHTML=av.length?av.map(t=>`<p style="margin:0 0 6px">⚠ ${t}</p>`).join('')+'<p style="margin:0">Puedes generar el informe igual.</p>':'';gr.hidden=!av.length;
 dg.showModal();fg.nombre.focus()}
async function enviar(reemplazar){
 S.nombreInf=fg.nombre.value.trim();S.fechaInf=fg.fecha.value;if(!S.fechaInf)return;
 if(!$('#gClave').hidden)S.clave=fg.clave.value;
 const snap=snapshot(),ok=$('#gOk');ok.disabled=true;ok.textContent='Guardando…';$('#gErr').textContent='';$('#gDup').hidden=true;
 try{const r=await Datos.guardarInforme(snap,{clave:S.clave,reemplazar});dg.close();mostrarInforme(snap,{codigo:r.codigo,actualizado:r.actualizado})}
 catch(x){
  if(x.status===409&&x.detalle&&x.detalle.error==='informe_corregido'){const g=$('#gDup');
   g.innerHTML=`El informe <b>${esc(x.detalle.nombre)}</b> (<span class="cod-g">${esc(x.detalle.codigo)}</span>) ya tiene corrección cargada y no se puede modificar. Guárdalo con otro nombre para crear un informe nuevo.<br><button type="button" class="btn sec" id="gCamb">Cambiar el nombre</button>`;g.hidden=false;
   $('#gCamb').onclick=()=>{g.hidden=true;fg.nombre.focus();fg.nombre.select()}}
  else if(x.status===409&&x.detalle&&x.detalle.error==='nombre_existe'){const g=$('#gDup');
   g.innerHTML=`Ya existe el informe <b>${esc(x.detalle.nombre)}</b> (<span class="cod-g">${esc(x.detalle.codigo)}</span>). Si lo actualizas, conserva su código y se reemplaza su contenido.<br><button type="button" class="btn" id="gAct">Actualizar ${esc(x.detalle.codigo)}</button><button type="button" class="btn sec" id="gCamb">Cambiar el nombre</button>`;g.hidden=false;
   $('#gAct').onclick=()=>enviar(true);$('#gCamb').onclick=()=>{g.hidden=true;fg.nombre.focus();fg.nombre.select()}}
  else if(x.status===401){$('#gClave').hidden=false;$('#gErr').textContent=S.clave?'La contraseña no es correcta.':'Para guardar hace falta la contraseña.';fg.clave.focus()}
  else{dg.close();mostrarInforme(snap,{error:x.message})}}
 finally{ok.disabled=false;ok.textContent='Generar y guardar'}}
fg.onsubmit=e=>{e.preventDefault();enviar(false)};
$('#gen').onclick=()=>{const car=D.cargos[S.cargo],sel=dinDe(S.cargo).filter(d=>S.sel.has(d.id));if(!car||!sel.length)return;abreGuardar()};

let INFS=[];
function pintaInfs(){const q=norm($('#infBus').value),l=INFS.filter(x=>!q||norm([x.nombre,x.codigo,x.cargo_nombre,x.area_nombre].join(' ')).includes(q));
 const estado=x=>x.correccion==='final'?'<span class="est-cor fin">🔒 Corregido</span>':x.correccion==='borrador'?'<span class="est-cor">Corrección en borrador</span>':'';
 $('#infLista').innerHTML=l.map(x=>`<div class="inf-item"><button type="button" class="inf-abrir" data-c="${esc(x.codigo)}"><span><strong>${esc(x.nombre)}</strong><small>${esc(x.cargo_nombre)} · ${esc(x.area_nombre)} · ${esc(fecha(x.fecha_evaluacion))} · ${x.postulantes} postulante${x.postulantes>1?'s':''}</small>${estado(x)}</span><span class="idm-s">${esc(x.codigo)}</span></button><button type="button" class="btn sec inf-cor" data-cor="${esc(x.codigo)}">${x.correccion==='final'?'Ver corrección':'✎ Corrección'}</button></div>`).join('')||`<div class="vacio-box">${INFS.length?'Ningún informe coincide con la búsqueda.':'Todavía no hay informes guardados.'}</div>`}
async function abreInformes(){$('#infErr').textContent='';$('#infCod').value='';$('#infBus').value='';$('#infLista').innerHTML='<div class="vacio-box">Cargando…</div>';$('#dInfs').showModal();
 try{INFS=(await Datos.listarInformes()).slice().sort((a,b)=>String(b.actualizado).localeCompare(String(a.actualizado)));pintaInfs()}catch(x){$('#infLista').innerHTML='';$('#infErr').textContent=x.message}}
async function abreGuardado(codigo){const c=String(codigo).trim().toUpperCase();if(!c)return;$('#infErr').textContent='';
 try{const r=await Datos.leerInforme(c);$('#dInfs').close();mostrarInforme(r,{codigo:r.codigo,reabierto:true})}
 catch(x){$('#infErr').textContent=x.status===404?`No existe el informe ${c}.`:x.message}}
$('#bInformes').onclick=abreInformes;$('#infBus').oninput=pintaInfs;
$('#infAbrir').onclick=()=>abreGuardado($('#infCod').value);$('#infCod').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();abreGuardado(e.target.value)}};
$('#infLista').onclick=e=>{const k=e.target.closest('[data-cor]');if(k){abreCorreccionDe(k.dataset.cor,k);return}const b=e.target.closest('[data-c]');if(b)abreGuardado(b.dataset.c)};

// ---------- Corrección de un informe guardado ----------
// Se carga el puntaje de cada postulante en cada cruce dinámica × competencia. "Guardar borrador" permite seguir después;
// "Finalizar" la cierra: desde ese momento el informe no admite más cambios (lo garantiza el servidor).
let COR=null,corSucio=false;
const dc=$('#dCor');
// "3,5" o "3.5" → 3.5; vacío → null; texto inválido → NaN.
const leeNum=t=>{const s=String(t||'').trim().replace(',','.');return s===''?null:/^\d+(\.\d+)?$/.test(s)?Number(s):NaN};
async function abreCorreccionDe(codigo,boton){if(!codigo)return;const txt0=boton&&boton.textContent;if(boton){boton.disabled=true;boton.textContent='Abriendo…'}$('#infErr').textContent='';
 try{const inf=await Datos.leerInforme(codigo);abreCorreccion(inf)}
 catch(x){const m=x.status===404?`No existe el informe ${codigo}.`:x.message;if($('#dInfs').open)$('#infErr').textContent=m;else alert(m)}
 finally{if(boton){boton.disabled=false;boton.textContent=txt0}}}
function abreCorreccion(inf){COR=inf;corSucio=false;
 const c=inf.correccion||{},fin=c.estado==='final',sel=inf.dinamicas,car=inf.cargo,E=esquemaPuntaje(car,sel),comps=car.competencias;
 $('#cTit').textContent=`Corrección · ${inf.nombre}`;
 $('#cSub').innerHTML=`<span class="cod-g">${esc(inf.codigo)}</span> · ${esc(bonito(car.nombre))} · ${esc(fecha(inf.fecha_evaluacion))}`;
 $('#cFinal').hidden=!fin;$('#cFinal').innerHTML=fin?`🔒 Corrección finalizada${c.finalizada?` (${esc(new Date(c.finalizada).toLocaleString('es-UY',{dateStyle:'short',timeStyle:'short'}))})`:''}. El informe ya no admite cambios; puedes verlo e imprimirlo en blanco o con estos datos.`:'';
 $('#cEval').value=c.evaluador||'';$('#cCom').value=c.comentarios||'';
 const ps=c.postulantes||[];
 $('#cPost').innerHTML=Array.from({length:inf.postulantes},(_,i)=>{const p=ps[i]||{},v=(d,k)=>{const x=p.puntajes&&p.puntajes[d.id]&&p.puntajes[d.id][k];return typeof x==='number'?fmtPuntaje(x):''};
  return `<section class="cor-p" data-p="${i}"><div class="cor-ph"><b>Postulante #${i+1}</b><input class="cor-nom" data-nom maxlength="80" autocomplete="off" placeholder="Nombre del postulante" aria-label="Nombre del postulante #${i+1}" value="${esc(p.nombre||'')}"></div>
  <div class="cor-tw"><table class="cor-t"><thead><tr><th>Dinámica</th>${comps.map((k,j)=>`<th title="${esc(k.comp)}">${esc(cod(k,j))}</th>`).join('')}<th>Sub total</th></tr></thead><tbody>
  ${sel.map((d,a)=>`<tr><td class="cor-din"><span class="badge-d">D${a+1}</span>${esc(d.titulo)}</td>${comps.map((k,j)=>{const cc=cod(k,j);return E.aplicables[a].has(cc)?`<td><input class="cor-in" data-d="${esc(d.id)}" data-k="${esc(cc)}" data-max="${E.pm[a]}" inputmode="decimal" autocomplete="off" placeholder="/ ${E.pm[a]}" aria-label="${esc(d.titulo)}, ${esc(cc)} (0 a ${E.pm[a]})" value="${v(d,cc)}"></td>`:'<td class="na" aria-label="No aplica"></td>'}).join('')}<td class="cor-st" data-st="${a}">${E.maxD[a]?`— / ${E.maxD[a]}`:'No aplica'}</td></tr>`).join('')}
  <tr class="cor-tot"><td>Total</td>${E.maxC.map((m,j)=>`<td data-ct="${j}">${m?`— / ${m}`:''}</td>`).join('')}<td data-tt>— / ${E.maxT}</td></tr></tbody></table></div>
  <div class="cor-res"><span>Puntaje final: <b data-fin>—</b> / ${PUNTAJE_FINAL_MAX}</span><span class="cor-cnt" data-cnt></span></div>
  <div class="cor-2"><label class="campo">Observaciones y notas de conducta<textarea data-obs maxlength="3000" rows="2">${esc(p.observaciones||'')}</textarea></label>
  <label class="campo">Dictamen<select data-dic><option value="">—</option>${DICTAMENES.map(o=>`<option${p.dictamen===o?' selected':''}>${esc(o)}</option>`).join('')}</select></label></div></section>`}).join('');
 dc.querySelectorAll('#cCuerpo input,#cCuerpo textarea,#cCuerpo select').forEach(el=>el.disabled=fin);
 $('#cBorr').hidden=fin;$('#cFin').hidden=fin;$('#cVer').hidden=!fin;$('#cConf').hidden=true;$('#cErr').textContent='';
 $('#cMsg').textContent=c.estado==='borrador'&&c.actualizada?`Borrador guardado el ${new Date(c.actualizada).toLocaleString('es-UY',{dateStyle:'short',timeStyle:'short'})}`:'';
 dc.querySelectorAll('.cor-p').forEach(recalcula);
 if($('#dInfs').open)$('#dInfs').close();
 if($('#dInf').open)$('#dInf').close();
 dc.showModal();$('#cCuerpo').scrollTop=0}
// Totales en vivo de un postulante; marca las celdas con valores inválidos.
function recalcula(sec){const sel=COR.dinamicas,car=COR.cargo,pt={};
 sec.querySelectorAll('.cor-in').forEach(el=>{const n=leeNum(el.value),mal=Number.isNaN(n)||(n!==null&&n>Number(el.dataset.max));el.classList.toggle('mal',mal);el.setAttribute('aria-invalid',mal);if(n!==null&&!mal)(pt[el.dataset.d]=pt[el.dataset.d]||{})[el.dataset.k]=n});
 const r=calcularPuntajes(car,sel,pt),E=r.esquema,f=(v,m)=>`${v===null?'—':`<b>${fmtPuntaje(v)}</b>`} / ${m}`;
 sec.querySelectorAll('[data-st]').forEach(td=>{const a=+td.dataset.st;if(E.maxD[a])td.innerHTML=f(r.sub[a],E.maxD[a])});
 sec.querySelectorAll('[data-ct]').forEach(td=>{const j=+td.dataset.ct;if(E.maxC[j])td.innerHTML=f(r.col[j],E.maxC[j])});
 sec.querySelector('[data-tt]').innerHTML=f(r.total,E.maxT);
 sec.querySelector('[data-fin]').textContent=r.final===null?'—':fmtPuntaje(r.final);
 sec.querySelector('[data-cnt]').textContent=`${r.cargadas} de ${r.totalCeldas} puntajes cargados`;
 return pt}
dc.addEventListener('input',e=>{if(e.target.closest('#cCuerpo')){corSucio=true;$('#cConf').hidden=true;const s=e.target.closest('.cor-p');if(s)recalcula(s)}});
dc.addEventListener('change',e=>{if(e.target.matches('select'))corSucio=true});
// Lee el formulario. Devuelve {error} si hay celdas inválidas.
function leeCorreccion(){const ps=[];let error='';
 dc.querySelectorAll('.cor-p').forEach((s,i)=>{const pt=recalcula(s);if(!error&&s.querySelector('.cor-in.mal'))error=`Postulante #${i+1}: hay puntajes inválidos (marcados en rojo). Usa números entre 0 y el máximo de la celda.`;
  ps.push({nombre:s.querySelector('[data-nom]').value.trim(),observaciones:s.querySelector('[data-obs]').value.trim(),dictamen:s.querySelector('[data-dic]').value,puntajes:pt})});
 return {error,correccion:{evaluador:$('#cEval').value.trim(),comentarios:$('#cCom').value.trim(),postulantes:ps}}}
// Para finalizar: cada postulante queda completo (nombre y todos los puntajes) o totalmente vacío; al menos uno completo.
function faltasParaFinalizar(cor){const faltas=[];
 cor.postulantes.forEach((p,i)=>{const r=calcularPuntajes(COR.cargo,COR.dinamicas,p.puntajes),usado=p.nombre||r.cargadas;
  if(usado&&!p.nombre)faltas.push(`Postulante #${i+1}: falta el nombre.`);
  if(usado&&!r.completo)faltas.push(`Postulante #${i+1}: faltan ${r.totalCeldas-r.cargadas} puntaje${r.totalCeldas-r.cargadas>1?'s':''}.`)});
 if(!cor.postulantes.some(p=>p.nombre))faltas.push('Carga al menos un postulante.');
 return faltas}
async function guardaCorreccion(finalizar){const {error,correccion}=leeCorreccion();$('#cErr').textContent=error;if(error)return;
 const b=finalizar?$('#cFin'):$('#cBorr'),t0=b.textContent;b.disabled=true;b.textContent='Guardando…';
 try{const r=await Datos.guardarCorreccion(COR.codigo,correccion,finalizar);COR.correccion=r.correccion;corSucio=false;
  const it=INFS.find(x=>x.codigo===COR.codigo);if(it)it.correccion=r.correccion.estado;
  if(finalizar){dc.close();mostrarInforme(COR,{codigo:COR.codigo,reabierto:true},'cor')}
  else $('#cMsg').textContent=`Borrador guardado ${new Date().toLocaleTimeString('es-UY',{timeStyle:'short'})}`}
 catch(x){$('#cErr').textContent=x.message;if(x.detalle&&x.detalle.error==='correccion_final'){const inf=await Datos.leerInforme(COR.codigo).catch(()=>null);if(inf)abreCorreccion(inf)}}
 finally{b.disabled=false;b.textContent=t0}}
$('#cBorr').onclick=()=>guardaCorreccion(false);
$('#cFin').onclick=()=>{const {error,correccion}=leeCorreccion();$('#cErr').textContent=error;if(error)return;
 const faltas=faltasParaFinalizar(correccion),cf=$('#cConf');
 cf.innerHTML=faltas.length?`<b>Todavía no se puede finalizar:</b><ul style="margin:6px 0 0;padding-left:18px">${faltas.map(f=>`<li>${esc(f)}</li>`).join('')}</ul><p style="margin:6px 0 0">Un postulante que no se presentó puede quedar totalmente vacío (sin nombre ni puntajes).</p>`
  :`<b>¿Finalizar la corrección?</b> El informe <span class="cod-g">${esc(COR.codigo)}</span> quedará cerrado: no se podrán cambiar los puntajes ni el informe. Podrás imprimirlo en blanco o con la corrección.<br><button type="button" class="btn" id="cSi">Sí, finalizar</button><button type="button" class="btn sec" id="cNo">Seguir editando</button>`;
 cf.hidden=false;cf.scrollIntoView({block:'nearest'});
 if(!faltas.length){$('#cSi').onclick=()=>{cf.hidden=true;guardaCorreccion(true)};$('#cNo').onclick=()=>{cf.hidden=true}}};
$('#cVer').onclick=()=>{dc.close();mostrarInforme(COR,{codigo:COR.codigo,reabierto:true},'cor')};
const cierraCor=()=>{if(corSucio&&!confirm('Hay cambios sin guardar en la corrección. ¿Cerrar igual?'))return;corSucio=false;dc.close()};
$('#cCerrar').onclick=cierraCor;$('#cX').onclick=cierraCor;
dc.addEventListener('cancel',e=>{e.preventDefault();cierraCor()});

async function iniciar(){
 $('#areas').innerHTML='<div class="vacio-box" style="grid-column:1/-1">Cargando catálogo…</div>';
 try{D=await Datos.cargar();todo()}
 catch(e){$('#areas').innerHTML=`<div class="vacio-box" style="grid-column:1/-1"><b>No se pudo cargar el catálogo</b><br>${esc(e.message)}<br><button class="btn sec" id="reintentar" style="margin-top:12px">Reintentar</button></div>`;$('#reintentar').onclick=iniciar}}
iniciar();
