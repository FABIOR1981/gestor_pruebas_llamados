
// Administración (ABM) con bajas lógicas. Depende de utilidades.js (esc, hojas) y datos/datos.js (cargar y guardar).
const $=s=>document.querySelector(s);
const limpio=t=>String(t||'').replace(/\s*\[cite:[^\]]*\]/g,'').trim();
const clon=o=>JSON.parse(JSON.stringify(o));
let base={areas:{},cargos:{},dinamicas:[]},D=clon(base),LOG=[],V='act';const S={area:null,cargo:null};
const act=o=>o.activo!==false,vis=o=>V==='todos'||(V==='act'?act(o):!act(o));
const areaDe=c=>Object.keys(D.areas).find(k=>k===c.area||D.areas[k].nombre===c.area);
const cargosDe=k=>Object.entries(D.cargos).filter(([,c])=>areaDe(c)===k);
const dinDe=k=>D.dinamicas.filter(d=>d.cargo_id===k);
const getO=(t,k)=>t==='a'?D.areas[k]:t==='c'?D.cargos[k]:D.dinamicas.find(d=>d.id===k);
const nom=(t,k)=>t==='d'?k:(getO(t,k).nombre);
const log=t=>{LOG.push(t);pintaPanel()};
const toast=t=>{const e=document.createElement('div');e.className='toast';e.textContent=t;document.body.append(e);setTimeout(()=>e.remove(),2300)};
const botones=(t,k,o)=>`<span class="ac"><button data-x="e${t}|${k}" title="Editar" aria-label="Editar">✏️</button>${act(o)?`<button data-x="b${t}|${k}" title="Dar de baja" aria-label="Dar de baja">⏻</button>`:`<button data-x="r${t}|${k}" title="Reactivar" aria-label="Reactivar">↺</button>`}</span>`;

function pintaAreas(){const l=Object.entries(D.areas).filter(([,a])=>vis(a));
 $('#ar').innerHTML=l.map(([k,a])=>`<div class="it ${k===S.area?'on':''} ${act(a)?'':'ina'}" data-s="${k}"><div><strong>${esc(a.nombre)}</strong><small>${k} · ${cargosDe(k).filter(([,c])=>act(c)).length} cargos activos ${act(a)?'':'<span class="bad">Inactiva</span>'}</small></div>${botones('a',k,a)}</div>`).join('')||'<div class="vacio-box">Nada para mostrar en esta vista.</div>'}
function pintaCargos(){$('#p2').classList.toggle('off',!S.area);$('#nC').hidden=!S.area;
 if(!S.area){$('#ca').innerHTML='<div class="vacio-box">Elige un área.</div>';return}
 $('#ca').innerHTML=cargosDe(S.area).filter(([,c])=>vis(c)).map(([k,c])=>`<div class="it ${k===S.cargo?'on':''} ${act(c)?'':'ina'}" data-s="${k}"><div><strong>${esc(c.nombre.toLowerCase())}</strong><small class="cod">${k} · ${dinDe(k).filter(act).length} dinámicas activas ${act(c)?'':'<span class="bad">Inactivo</span>'}</small></div>${botones('c',k,c)}</div>`).join('')||'<div class="vacio-box">Sin cargos en esta vista.</div>'}
function pintaDin(){const c=D.cargos[S.cargo];$('#p3').classList.toggle('off',!c);$('#cab').hidden=!c;
 if(!c){$('#lista').innerHTML=`<div class="vacio-box" style="grid-column:1/-1"><b>${S.area?'Ahora elige un cargo':'Empieza eligiendo un área'}</b><br>Sus dinámicas aparecerán acá.</div>`;return}
 $('#tC').textContent=c.nombre.toLowerCase();$('#sC').textContent=`${c.competencias.length} competencias · ${dinDe(S.cargo).filter(act).length} dinámicas activas`;
 $('#lista').innerHTML=dinDe(S.cargo).filter(vis).map(d=>`<div class="din adm ${act(d)?'':'ina'}"><h3>${esc(d.titulo)}</h3><p>${esc(limpio(d.desc))}</p><div class="meta"><span class="tag id">${d.id.replace('DIN-','')}</span>${act(d)?'':'<span class="bad">Inactiva</span>'}<span style="margin-left:auto">${botones('d',d.id,d)}</span></div></div>`).join('')||'<div class="vacio-box" style="grid-column:1/-1">Sin dinámicas en esta vista.</div>'}
function pintaPanel(){const n=LOG.length;$('#pn').textContent=n?`${n} cambio${n>1?'s':''} sin guardar`:'Todo guardado.';
 $('#log').innerHTML=LOG.map(t=>`<li>${esc(t)}</li>`).join('');$('#gu').disabled=$('#de').disabled=!n;
 const c=(o)=>Object.values(o).filter(act).length,i=(o)=>Object.values(o).length-c(o);
 $('#res').textContent=`${c(D.areas)} áreas · ${c(D.cargos)} cargos · ${D.dinamicas.filter(act).length} dinámicas activas (${i(D.areas)+i(D.cargos)+D.dinamicas.filter(d=>!act(d)).length} inactivas)`}
const todo=()=>{pintaAreas();pintaCargos();pintaDin();pintaPanel()};

/* modal genérico */
const dm=$('#dm');let onOk=null;
function abre(titulo,html,ok,fn){$('#mt').textContent=titulo;document.querySelector('#fm .mf .sec').textContent='Cancelar';$('#mc').innerHTML=html+'<p class="err" id="er"></p>';$('#ok').textContent=ok||'';$('#ok').hidden=!ok;onOk=fn;dm.showModal()}
const err=m=>{$('#er').textContent=m;return false};
$('#fm').onsubmit=e=>{e.preventDefault();if(!onOk)return;if(onOk(new FormData($('#fm')))!==false)dm.close()};
dm.addEventListener('click',e=>{if(e.target===dm||e.target.closest('[data-c]'))dm.close()});

function fArea(k){const a=k?D.areas[k]:{nombre:''};
 abre(k?'Editar área':'Nueva área',`<label class="cp">Nombre<input name="nombre" value="${esc(a.nombre)}" required></label><label class="cp">Sigla (3 letras)<input name="sigla" value="${esc(k||'')}" maxlength="3" minlength="3" ${k?'readonly':''} style="text-transform:uppercase" required></label>`,k?'Guardar cambios':'Crear área',f=>{
  const nombre=f.get('nombre').trim(),sg=f.get('sigla').trim().toUpperCase();
  if(!k&&D.areas[sg])return err('Ya existe un área con esa sigla.');
  if(k){const ant=D.areas[k].nombre;Object.values(D.cargos).forEach(c=>{if(c.area===ant)c.area=nombre});D.areas[k].nombre=nombre;log(`Área ${k} modificada`)}
  else{D.areas[sg]={nombre};S.area=sg;S.cargo=null;log(`Área ${sg} creada`)}
  todo()})}
const filaC=c=>`<div class="fc"><input class="cc" placeholder="Código" maxlength="12" value="${esc(c.codigo||'')}"><input class="cn" placeholder="Competencia" value="${esc(c.comp||'')}"><input class="cd" placeholder="Qué se observa" value="${esc(c.desc?limpio(c.desc):'')}"><button type="button" class="x" data-delc aria-label="Quitar">✕</button></div>`;
function fCargo(k){const c=k?D.cargos[k]:{nombre:'',competencias:[{},{},{}]};
 const ops=Object.entries(D.areas).filter(([,a])=>act(a)).map(([s,a])=>`<option value="${s}" ${S.area===s?'selected':''}>${esc(a.nombre)} [${s}]</option>`).join('');
 abre(k?'Editar cargo y competencias':'Nuevo cargo',`<label class="cp">Nombre del cargo<input name="nombre" value="${esc(c.nombre)}" required></label>
 ${k?`<p class="sub">Código: <span class="cod">${k}</span></p>`:`<div class="dos"><label class="cp">Área<select name="area" required>${ops}</select></label><label class="cp">Especialidad (3 letras)<input name="esp" maxlength="3" style="text-transform:uppercase" required></label></div>`}
 <p class="paso" style="margin-top:12px">Competencias · columnas de la tabla de puntaje</p><div id="comps">${c.competencias.map(filaC).join('')}</div><button type="button" class="link" data-addc>+ Agregar competencia</button>`,k?'Guardar cambios':'Crear cargo',f=>{
  const cs=[...document.querySelectorAll('#comps .fc')].map(r=>({codigo:r.querySelector('.cc').value.trim(),comp:r.querySelector('.cn').value.trim(),desc:r.querySelector('.cd').value.trim()})).filter(x=>x.comp);
  if(!cs.length)return err('Define al menos una competencia.');
  if(new Set(cs.map(x=>x.comp.toLowerCase())).size<cs.length)return err('Hay competencias repetidas.');
  const cods=cs.map(x=>x.codigo).filter(Boolean);if(new Set(cods).size<cods.length)return err('Hay códigos repetidos.');
  cs.forEach(x=>{if(!x.codigo)delete x.codigo});const nombre=f.get('nombre').trim();
  if(k){D.cargos[k].nombre=nombre;D.cargos[k].competencias=cs;log(`Cargo ${k} modificado`)}
  else{const sg=f.get('area'),esp=(f.get('esp').trim().toUpperCase()+'XXX').slice(0,3),pre=`CAR-${sg}-${esp}-`;
   const mx=Math.max(0,...Object.keys(D.cargos).filter(x=>x.startsWith(pre)).map(x=>parseInt(x.slice(pre.length),10)||0));
   const key=pre+String(mx+1).padStart(2,'0');D.cargos[key]={nombre,area:D.areas[sg].nombre,competencias:cs};S.area=sg;S.cargo=key;log(`Cargo ${key} creado`)}
  todo()})}
function fDin(id){const d=id?D.dinamicas.find(x=>x.id===id):{peso:1},hoja=separarRenglones(d.hoja_postulante||'').texto;
 const T=(n,l,v,r)=>`<label class="cp">${l}<input name="${n}" value="${esc(v??'')}" ${r?'required':''}></label>`,A=(n,l,v,r)=>`<label class="cp">${l}<textarea name="${n}" ${r?'required':''}>${esc(v??'')}</textarea></label>`;
 abre(id?'Editar dinámica':'Nueva dinámica',`${id?`<p class="sub">Código: <span class="cod">${id}</span></p>`:''}
 <p class="paso">Datos</p>${T('titulo','Título',d.titulo,1)}${T('desc','Descripción breve',limpio(d.desc),1)}<div class="dos">${T('tiempo','Tiempo límite',d.tiempo_limite,1)}<label class="cp">Peso (1 a 5)<input type="number" name="peso" min="1" max="5" value="${d.peso||1}"></label></div>
 <p class="paso" style="margin-top:8px">Hoja del postulante</p>${A('hoja','Consigna que verá el postulante',hoja,1)}<label class="cp" style="max-width:200px">Renglones (vacío = 5)<input type="number" name="reng" min="0" max="30" value="${d.renglones_hoja??''}"></label>
 <p class="paso" style="margin-top:8px">Para el evaluador</p>${A('caso','Objetivo de la prueba',limpio(d.caso_o_consigna),1)}${A('guia','Guía de observación (Éxito / Alerta)',d.guia_evaluacion,1)}${A('resp','Corrector: respuestas esperadas',d.respuesta_esperada)}`,id?'Guardar cambios':'Crear dinámica',f=>{
  const ck=S.cargo,r=f.get('reng').trim(),rn=r===''?RENGLONES_HOJA_GLOBAL:normalizarCantidadRenglones(r);
  const o={id:id||'',cargo_id:ck,titulo:f.get('titulo').trim(),desc:f.get('desc').trim(),tiempo_limite:f.get('tiempo').trim(),peso:Math.min(5,Math.max(1,parseInt(f.get('peso'),10)||1)),
   hoja_postulante:componerHoja(f.get('hoja'),rn),caso_o_consigna:f.get('caso').trim(),guia_evaluacion:f.get('guia').trim(),respuesta_esperada:f.get('resp').trim()};
  if(r!=='')o.renglones_hoja=rn;
  if(id){const i=D.dinamicas.findIndex(x=>x.id===id);if(d.activo===false)o.activo=false;D.dinamicas[i]=o;log(`Dinámica ${id} modificada`)}
  else{const p=ck.split('-'),pre=p.length>=4?`DIN-${p[1]}-${p[2]}-`:`DIN-${ck}-`;
   const mx=Math.max(0,...D.dinamicas.filter(x=>x.id.startsWith(pre)).map(x=>parseInt(x.id.slice(pre.length),10)||0));o.id=pre+String(mx+1).padStart(2,'0');D.dinamicas.push(o);log(`Dinámica ${o.id} creada`)}
  todo()})}

function baja(t,k){const o=getO(t,k);let msg='';
 if(t==='a'){const cs=cargosDe(k).filter(([,c])=>act(c));msg=`${cs.length} cargo(s) y ${cs.reduce((n,[x])=>n+dinDe(x).filter(act).length,0)} dinámica(s) dejarán de aparecer en el generador.`}
 if(t==='c')msg=`${dinDe(k).filter(act).length} dinámica(s) dejarán de aparecer en el generador.`;
 if(t==='d')msg='Dejará de aparecer en el generador.';
 abre('Dar de baja',`<p><b>${esc(nom(t,k))}</b></p><p>${msg}</p><p class="sub">No se borra nada: queda en Inactivos y puedes reactivarla cuando quieras.</p>`,'Dar de baja',()=>{o.activo=false;log(`${t==='a'?'Área':t==='c'?'Cargo':'Dinámica'} ${k} dada de baja`);todo()})}
function reac(t,k){delete getO(t,k).activo;log(`${t==='a'?'Área':t==='c'?'Cargo':'Dinámica'} ${k} reactivada`);toast('Reactivado');todo()}
const acc=c=>{const[o,k]=c.split('|');({ea:()=>fArea(k),ba:()=>baja('a',k),ra:()=>reac('a',k),ec:()=>fCargo(k),bc:()=>baja('c',k),rc:()=>reac('c',k),ed:()=>fDin(k),bd:()=>baja('d',k),rd:()=>reac('d',k)})[o]()};

/* asistente */
const A={modo:1,area:'',cargo:'',n:4,texto:'',crudo:'',terminos:'',out:''};
const MAMMOTH='https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
const cargaMammoth=()=>window.mammoth?Promise.resolve():new Promise((ok,ko)=>{const x=document.createElement('script');x.src=MAMMOTH;x.onload=ok;x.onerror=()=>ko(new Error('No se pudo cargar el lector de .docx'));document.head.appendChild(x)});
function anonimizar(texto,terminos){let t=texto.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g,'[EMAIL]').replace(/\b\d{1}\.?\d{3}\.?\d{3}-?\d\b/g,'[DOC]').replace(/\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b/g,'[FECHA]').replace(/(\$|U\$S|USD|UYU)\s?[\d.,]+/gi,'[MONTO]').replace(/\b(llamado|concurso|licitaci[oó]n)\s*(n[°ºo.]*\s*)?[\w\/-]*\d[\w\/-]*/gi,'[LLAMADO]');
 terminos.forEach(w=>{if(w.trim())t=t.replace(new RegExp(w.trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),'[X]')});return t}
async function leerDocx(f){try{await cargaMammoth();const r=await window.mammoth.extractRawText({arrayBuffer:await f.arrayBuffer()});A.crudo=r.value;A.texto=anonimizar(A.crudo,A.terminos.split(','));A.out='';pintaA()}catch(x){$('#er2').textContent=x.message}}
function nuevoTexto(){const m=A.modo,ar=D.areas[A.area],ca=D.cargos[A.cargo];
 const jd='"dinamicas":[{"titulo":"","desc":"","tiempo_limite":"10 Minutos","peso":1,"hoja_postulante":"","caso_o_consigna":"","guia_evaluacion":"• Éxito: …\\n• Alerta: …","respuesta_esperada":""}]',jc='"competencias":[{"codigo":"1.1","comp":"","desc":""}]';
 const forma=m===1?`{"area":{"sigla":"3 letras","nombre":""},"cargo":{"especialidad":"3 letras","nombre":"",${jc}},${jd}}`:m===2?`{"cargo":{"especialidad":"3 letras","nombre":"",${jc}},${jd}}`:`{${jd}}`;
 const tarea=m===1?'Crea un área nueva, un cargo dentro de ella y sus dinámicas de evaluación':m===2?`Crea un cargo nuevo dentro del área existente "${ar.nombre}" y sus dinámicas de evaluación`:`Crea únicamente dinámicas de evaluación nuevas para el cargo existente "${ca.nombre}"`;
 const cs=m===3?ca.competencias:[],conCod=cs.length&&cs.every(c=>c.codigo);
 const L=[`Eres un especialista en selección de personal y evaluación psicotécnica. ${tarea}, a partir de las bases del llamado que figuran al final.`,'',
  m===3?`Competencias del cargo (úsalas tal cual):\n${cs.map((c,i)=>`- ${c.codigo||'C'+String(i+1).padStart(2,'0')} ${c.comp}: ${limpio(c.desc)}`).join('\n')}\nDinámicas que ya existen (no las repitas): ${dinDe(A.cargo).map(d=>d.titulo).join('; ')||'ninguna'}.\n`:'',
  `Genera exactamente ${A.n} dinámicas. Reglas:`,
  m===3?(conCod?'- En "caso_o_consigna" menciona los códigos de las competencias que evalúa cada dinámica (por ejemplo "Evalúa 6.1 y 6.3"): la app los usa para armar la tabla de puntaje.':'- No menciones códigos de competencias en "caso_o_consigna".'):'- Define entre 3 y 13 competencias del cargo con códigos del tipo 1.1, 1.2…; en "caso_o_consigna" menciona los códigos que evalúa cada dinámica (por ejemplo "Evalúa 1.1 y 1.3").',
  '- "tiempo_limite" es texto con minutos (ej. "10 Minutos"). "peso" va de 1 a 5.','- "hoja_postulante" es solo lo que verá el postulante, sin respuestas.','- "guia_evaluacion" usa las viñetas "• Éxito:" y "• Alerta:". "respuesta_esperada" da el criterio de corrección.','- No inventes códigos de identificación: la app los asigna.','- No incluyas datos personales.',
  `Códigos que ya existen, para no duplicar: áreas ${Object.keys(D.areas).join(', ')}; cargos ${Object.keys(D.cargos).join(', ')}.`,'',
  'Responde SOLO con JSON válido, sin texto adicional ni bloques de código, con esta forma:',forma,'','=== BASES DEL LLAMADO (anonimizadas) ===',A.texto.trim()||'[pega aquí el texto de las bases]','=== FIN ==='];
 return L.filter(x=>x!==null).join('\n')}
function pintaA(){const sel=(k,l,o)=>`<label class="cp">${l}<select name="${k}"><option value="">Elegir…</option>${o}</select></label>`;
 const oa=Object.entries(D.areas).filter(([,a])=>act(a)).map(([k,a])=>`<option value="${k}" ${A.area===k?'selected':''}>${esc(a.nombre)}</option>`).join(''),
  oc=Object.entries(D.cargos).filter(([k,c])=>act(c)&&areaDe(c)===A.area).map(([k,c])=>`<option value="${k}" ${A.cargo===k?'selected':''}>${esc(c.nombre.toLowerCase())}</option>`).join('');
 const M=(n,t,s)=>`<label class="modo"><input type="radio" name="modo" value="${n}" ${A.modo===n?'checked':''}><b>${t}</b><small>${s}</small></label>`;
 $('#mc').innerHTML=`<p class="paso"><b>1</b> ¿Qué quieres que genere la IA?</p>${M(1,'Área, cargo y dinámicas','Todo es nuevo.')}${M(2,'Cargo y dinámicas','El área ya existe.')}${M(3,'Solo dinámicas','El área y el cargo ya existen.')}
 ${A.modo>1?`<div class="dos">${sel('area','Área existente',oa)}${A.modo===3?sel('cargo','Cargo existente',oc):'<span></span>'}</div>`:''}
 <p class="paso" style="margin-top:12px"><b>2</b> Bases del llamado</p><p class="sub" style="margin:0 0 8px">El archivo se lee en este navegador y no se envía a ningún servidor. Revisa el texto: es lo único que irá en el prompt.</p>
 <label class="cp">Archivo .docx<input type="file" name="archivo" accept=".docx"></label>
 <label class="cp">Términos a enmascarar <small style="font-weight:400">(organismo, nombres, sectores; separados por coma)</small><input name="terminos" value="${esc(A.terminos)}"></label>
 <label class="cp">Texto de las bases (editable)<textarea name="texto" style="min-height:110px">${esc(A.texto)}</textarea></label>
 <label class="cp" style="max-width:200px">Cantidad de dinámicas<input type="number" name="n" min="1" max="10" value="${A.n}"></label>
 <button type="button" class="btn" data-gen style="width:auto;margin:0 0 10px">Generar prompt</button><p class="err" id="er2"></p>
 ${A.out?`<p class="paso"><b>3</b> Prompt para tu IA</p><textarea class="pre" readonly id="pre">${esc(A.out)}</textarea><button type="button" class="ghost" data-cop style="margin-top:8px">Copiar prompt</button><p class="sub">Revisa el texto antes de usarlo: la anonimización no garantiza quitar todos los datos sensibles.</p>`:''}`}
$('#bAsist').onclick=()=>{abre('Asistente de bases',' ',null,null);document.querySelector('#fm .mf .sec').textContent='Cerrar';dm.dataset.tipo='asist';A.area=A.area||S.area||'';A.cargo=A.cargo||S.cargo||'';pintaA()};
dm.addEventListener('close',()=>{dm.dataset.tipo='';A.out=''});
$('#mc').addEventListener('change',e=>{if(dm.dataset.tipo!=='asist')return;const n=e.target.name,v=e.target.value;
 if(n==='archivo'){if(e.target.files[0])leerDocx(e.target.files[0]);return}
 if(n==='terminos'){A.terminos=v;if(A.crudo){A.texto=anonimizar(A.crudo,v.split(','));A.out='';pintaA()}return}
 if(n==='modo'){A.modo=+v;A.out=''}else if(n==='area'){A.area=v;A.cargo='';A.out=''}else if(n==='cargo'){A.cargo=v;A.out=''}else if(n==='n')A.n=Math.min(10,Math.max(1,+v||1));
 if(n==='texto')A.texto=v;if(n==='modo'||n==='area')pintaA()});
$('#mc').addEventListener('click',e=>{
 if(e.target.closest('[data-addc]'))$('#comps').insertAdjacentHTML('beforeend',filaC({}));
 const q=e.target.closest('[data-delc]');if(q){if(document.querySelectorAll('#comps .fc').length>1)q.closest('.fc').remove()}
 if(e.target.closest('[data-gen]')){const t=document.querySelector('[name=texto]');A.texto=t.value;
  if(A.modo>1&&!A.area)return $('#er2').textContent='Elige el área existente.';if(A.modo===3&&!A.cargo)return $('#er2').textContent='Elige el cargo existente.';
  A.out=nuevoTexto();pintaA();document.querySelector('#pre').scrollIntoView({block:'nearest'})}
 if(e.target.closest('[data-cop]')){navigator.clipboard&&navigator.clipboard.writeText(A.out).then(()=>toast('Prompt copiado'),()=>{$('#pre').select()})}});

/* eventos */
document.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{V=b.dataset.v;document.querySelectorAll('.seg button').forEach(x=>x.setAttribute('aria-pressed',x===b));todo()});
$('#ar').onclick=e=>{const x=e.target.closest('[data-x]');if(x)return acc(x.dataset.x);const s=e.target.closest('[data-s]');if(s){S.area=s.dataset.s;S.cargo=null;todo()}};
$('#ca').onclick=e=>{const x=e.target.closest('[data-x]');if(x)return acc(x.dataset.x);const s=e.target.closest('[data-s]');if(s){S.cargo=s.dataset.s;todo()}};
$('#lista').onclick=e=>{const x=e.target.closest('[data-x]');if(x)acc(x.dataset.x)};
$('#nA').onclick=()=>fArea();$('#nC').onclick=()=>fCargo();$('#nD').onclick=()=>fDin();$('#eC').onclick=()=>fCargo(S.cargo);
$('#gu').onclick=()=>abre('Guardar','<p class="sub">Escribe los cambios en bd/pruebas_llamados.</p><label class="cp">Contraseña<input type="password" name="pw" autocomplete="current-password" required></label>','Guardar',f=>{
 const b=$('#ok'),e2=$('#er');b.disabled=true;e2.style.color='var(--suave)';e2.textContent='Guardando…';
 Datos.guardar(D,f.get('pw')).then(r=>{base=clon(D);LOG=[];pintaPanel();dm.close();toast(r.escritos.length?`Guardado: ${r.escritos.join(', ')}`:'No había cambios para guardar')}).catch(x=>{e2.style.color='';err(x.message)}).finally(()=>{b.disabled=false});
 return false});
$('#de').onclick=()=>abre('Descartar cambios',`<p>Se perderán ${LOG.length} cambio(s) sin guardar.</p>`,'Descartar',()=>{D=clon(base);LOG=[];if(!D.areas[S.area]){S.area=null}if(!D.cargos[S.cargo])S.cargo=null;todo()});
$('#tema').onclick=()=>{const r=document.documentElement,os=matchMedia('(prefers-color-scheme: dark)').matches;r.dataset.theme=(r.dataset.theme||(os?'dark':'light'))==='dark'?'light':'dark'};
window.addEventListener('beforeunload',e=>{if(LOG.length){e.preventDefault();e.returnValue=''}});
async function iniciar(){
 $('#ar').innerHTML='<div class="vacio-box">Cargando catálogo…</div>';
 try{base=await Datos.cargar();D=clon(base);todo()}
 catch(e){$('#ar').innerHTML=`<div class="vacio-box"><b>No se pudo cargar el catálogo</b><br>${esc(e.message)}<br><button class="btn sec" id="reint" style="margin-top:12px;width:auto">Reintentar</button></div>`;$('#reint').onclick=iniciar}}
iniciar();
