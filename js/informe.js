// Construye el HTML del informe imprimible. Depende de utilidades.js (esc, prepararHojaDinamica, cantidadRenglonesDinamica, calcularPuntajes).
const limpio=t=>String(t||'').replace(/\s*\[cite:[^\]]*\]/g,'').trim();
// Sin tiempo = campo vacío o con valor 0 ("0", "0 minutos"). Un texto sin números ("Sin límite") se muestra tal cual.
const sinTiempo=d=>{const t=String(d.tiempo_limite??'').trim();if(!t)return true;const n=t.match(/\d+/g);return !!n&&Math.max(...n.map(Number))===0};
const mins=d=>{const n=(d.tiempo_limite||'').match(/\d+/g);return n?Math.max(...n.map(Number)):0};
const cod=codigoCompetencia,aplica=competenciasDeDinamica; // definidas en utilidades.js (relación competencias ↔ dinámicas)
const nl=(t,v)=>esc(limpio(t)||v).replace(/\n/g,'<br>');
const txt=t=>esc(String(t||'').trim()).replace(/\n/g,'<br>');

const fmtFecha=f=>/^\d{4}-\d{2}-\d{2}$/.test(f||'')?f.split('-').reverse().join('/'):'';
// Un postulante de la corrección "se usó" si tiene nombre o algún puntaje; los vacíos se imprimen en blanco.
const postulanteUsado=p=>!!p&&(String(p.nombre||'').trim()!==''||Object.values(p.puntajes||{}).some(o=>Object.keys(o||{}).length));
const fmtFechaISO=s=>{const d=new Date(s);return isNaN(d)?'':d.toLocaleDateString('es-UY',{day:'2-digit',month:'2-digit',year:'numeric'})};
// meta.correccion (opcional): con ella se arma el INFORME DE RESULTADOS (resumen, dinámicas como testigo,
// detalle por postulante y conclusión con firma). Sin ella, el formulario en blanco de siempre.
function construirInforme(key,car,sel,n,tiempoTotal,meta){meta=meta||{};const comps=car.competencias,MAXF=PUNTAJE_FINAL_MAX,cor=meta.correccion||null;
 const calc=sel.reduce((a,d)=>a+mins(d),0),total=tiempoTotal==null?calc:tiempoTotal,multi=sel.length>1,editado=tiempoTotal!=null&&tiempoTotal!==calc;
 const bloques=sel.map((d,i)=>`<div class="bloque-dinamica bd"><p><strong>Dinámica ${i+1}:</strong> ${esc(d.titulo)} <span class="idm">ID: ${esc(d.id)}</span></p>
  <p class="dynamics-list"><strong>Descripción:</strong> ${esc(limpio(d.desc))}</p>
  ${sinTiempo(d)?'':`<div class="cj t"><strong>⏱️ Tiempo límite:</strong> <b>${esc(d.tiempo_limite)}</b></div>`}
  <div class="cj o"><strong>🎯 Objetivo de la prueba:</strong><br>${nl(d.caso_o_consigna,'Sin objetivo específico.')}</div>
  <div class="cj g bloque-guia"><strong>🔍 Guía de observación para el evaluador:</strong><br>${nl(d.guia_evaluacion,'Sin guía específica.')}</div>
  <div class="cj c bloque-guia"><strong>✅ Corrector: respuestas correctas / esperadas:</strong><br>${nl(d.respuesta_esperada,'Sin respuesta esperada definida.')}</div></div>`).join('');
 const E=esquemaPuntaje(car,sel),{pm,maxD,maxC,maxT,pesos,sumP,iguales}=E,cpd=E.aplicables;
 const formula=maxT===0?'Sin competencias aplicables':iguales?`Total ÷ ${maxT} × ${MAXF}`:`Σ (Sub total ÷ máximo aplicable × peso) ÷ ${sumP} × ${MAXF}`;
 const leyenda=`<div class="leyenda-dinamicas bloque-dinamica"><strong>Competencias a observar</strong><ul>${comps.map((c,i)=>`<li><strong>${esc(cod(c,i))} - ${esc(c.comp)}:</strong> ${esc(limpio(c.desc))}</li>`).join('')}</ul></div>`;
 // v: valor cargado (null = celda en blanco para completar a mano).
 const val=v=>v===null||v===undefined?'':`<b class="val">${fmtPuntaje(v)}</b> `;
 const tabla=r=>{const g=r?r.valor:()=>null,sub=r?r.sub:[],col=r?r.col:[];
  const celdaMax=(m,j)=>m?`<td class="celda-puntaje">${val(col[j])}<span class="max">/ ${m}</span></td>`:'<td class="celda-no-aplica"></td>';
  const filas=sel.map((d,i)=>`<tr><td class="celda-comp"><strong><span class="badge-d">D${i+1}</span>${esc(d.titulo)}</strong><span><span class="chip chip-id">${esc(d.id)}</span>${sinTiempo(d)?'':` <span class="chip chip-tiempo">⏱️ ${esc(d.tiempo_limite)}</span>`}${iguales?'':` <span class="chip chip-id">Peso ${pesos[i]}</span>`}${pm[i]!==PUNTAJE_MAX_COMPETENCIA?` <span class="chip chip-id">Máx. ${pm[i]} c/u</span>`:''}</span></td>${comps.map((c,j)=>cpd[i].has(cod(c,j))?`<td class="celda-puntaje">${val(g(d,cod(c,j)))}<span class="max">/ ${pm[i]}</span></td>`:'<td class="celda-no-aplica"></td>').join('')}<td class="celda-puntaje col-subtotal">${val(sub[i])}<span class="max">${maxD[i]?`/ ${maxD[i]}`:'No aplica'}</span></td></tr>`).join('');
  return `<table class="tabla-puntaje"><thead><tr><th>Dinámica</th>${comps.map((c,i)=>`<th class="col-puntaje" title="${esc(c.comp)}">${esc(cod(c,i))}</th>`).join('')}<th class="col-subtotal">Sub total</th></tr></thead><tbody>${filas}
  <tr class="fila-total"><td>TOTAL</td>${maxC.map(celdaMax).join('')}<td class="celda-puntaje">${val(r?r.total:null)}<span class="max">/ ${maxT}</span></td></tr>
  <tr class="fila-total"><td>PUNTAJE FINAL</td><td colspan="${comps.length+1}" class="celda-puntaje celda-formula"><span class="max">${formula}${maxT?` = ${r&&r.final!==null?`<b class="val">${fmtPuntaje(r.final)}</b>`:'______'} / ${MAXF}`:''}</span></td></tr></tbody></table>`};
 if(cor)return informeResultados({key,car,sel,n,meta,cor,tabla,leyenda,total,multi,editado});
 const LINEA='__________________________________________________';
 let post='',hojas='';
 for(let i=1;i<=n;i++){post+=`<div class="candidate-box"><h4>Postulante #${i}: ${LINEA}</h4>${tabla(null)}<div style="font-size:.75rem;font-weight:600;color:var(--secondary);margin-top:.5rem">Observaciones y notas de conducta del postulante:</div><div class="observations-box"></div></div>`;
  sel.forEach(d=>{hojas+=`<div class="candidate-sheet"><div class="pag">Hoja de trabajo · página nueva al imprimir</div><h3 class="ht">HOJA DE TRABAJO / CONSIGNA</h3>
   <div class="enc"><div style="display:flex;justify-content:space-between"><div style="flex:1;margin-right:1.25rem"><strong>Nombre del Postulante:</strong> ______________________________________</div><div><strong>Fecha:</strong> ____/____/20___</div></div>
   <div style="display:flex;justify-content:space-between;margin-top:.5rem;border-top:1px dashed var(--border);padding-top:.5rem"><div><strong>Dinámica ID:</strong> <span class="idm">${esc(d.id)}</span></div><div style="color:#8e44ad;font-weight:bold">${sinTiempo(d)?'':`⏱️ Tiempo Límite: ${esc(d.tiempo_limite)}`}</div></div></div>
   <div class="area-respuesta-postulante ${cantidadRenglonesDinamica(d)===0?'area-respuesta-libre':''}">${prepararHojaDinamica(d)||'Sin material específico definido.'}</div></div>`})}
 const conclusion=`<div style="border:1px solid var(--border);height:5rem;border-radius:.25rem;padding:.5rem;font-size:.8125rem"><strong>Dictamen Global (Recomendable / Recomendable con observaciones / No recomendable):</strong><br><br><strong>Comentarios finales:</strong></div>`;
 return `<div class="header-eval"><div><h2>INFORME DE EVALUACIÓN PSICOTÉCNICA</h2><div class="inf-linea"><span class="inf-n">${esc(meta.nombre||bonito(car.nombre))}</span><span class="inf-sep">-</span><span class="inf-c">Cargo Objetivo:</span><span class="idm">${esc(key)}</span>${meta.nombre?(meta.codigo?`<span class="inf-sep">·</span><span class="inf-c">Informe</span><span class="idm">${esc(meta.codigo)}</span>`:'<span class="inf-sep">·</span><em>sin guardar</em>'):''}</div></div><div class="meta-info"><strong>Fecha de evaluación:</strong> ${fmtFecha(meta.fecha)||'____/____/20___'}<br><strong>Evaluador(a):</strong> ________________________</div></div>
 <div class="section-title">1. DINÁMICAS DE EVALUACIÓN SELECCIONADAS</div>${bloques}${(multi||editado)&&total>0?`<div class="cj t" style="font-weight:bold">⏱️ Tiempo total estimado (${sel.length} dinámica${multi?'s':''}): ${total} minutos</div>`:''}
 <div class="section-title">2. EVALUACIÓN Y PUNTAJE POR POSTULANTE</div>${leyenda}${post}
 <div class="general-notes"><div class="section-title" style="margin-top:0">3. CONCLUSIÓN Y DICTAMEN GENERAL</div>${conclusion}</div>${hojas}`;
}

// ---------- Informe de resultados (con la corrección) ----------
// 1. Resumen por postulante · 2. Dinámicas aplicadas como testigo (sin renglones de respuesta)
// 3. Detalle de puntaje por postulante (cada uno en su página) · 4. Conclusión y firma. Sin hojas de trabajo.
function informeResultados({key,car,sel,n,meta,cor,tabla,leyenda,total,multi,editado}){const MAXF=PUNTAJE_FINAL_MAX,fin=cor.estado==='final';
 const ps=Array.from({length:n},(_,i)=>{const p=cor.postulantes&&cor.postulantes[i];return postulanteUsado(p)?p:null});
 const nombre=p=>String(p.nombre||'').trim()||'(sin nombre)';
 const ev=String(cor.evaluador||'').trim(),tit=String(cor.titulo_evaluador||'').trim();
 const resumen=`<table class="tabla-resumen"><thead><tr><th>#</th><th>Postulante</th><th class="num">Puntaje final</th><th>Dictamen</th></tr></thead><tbody>${ps.map((p,i)=>{
   if(!p)return `<tr class="ausente"><td>${i+1}</td><td colspan="3">No se presentó</td></tr>`;
   const r=calcularPuntajes(car,sel,p.puntajes);
   return `<tr><td>${i+1}</td><td><strong>${esc(nombre(p))}</strong></td><td class="num">${r.final!==null?`<b>${fmtPuntaje(r.final)}</b> / ${MAXF}`:'<em>Incompleto</em>'}</td><td>${p.dictamen?`<span class="dic">${esc(p.dictamen)}</span>`:'—'}</td></tr>`}).join('')}</tbody></table>`;
 const testigos=sel.map((d,i)=>{const consigna=separarRenglones(d.hoja_postulante||'').texto;
  return `<div class="bloque-dinamica bd"><p><strong>Dinámica ${i+1}:</strong> ${esc(d.titulo)} <span class="idm">ID: ${esc(d.id)}</span></p>
  <p class="dynamics-list"><strong>Descripción:</strong> ${esc(limpio(d.desc))}</p>
  ${sinTiempo(d)?'':`<div class="cj t"><strong>⏱️ Tiempo límite:</strong> <b>${esc(d.tiempo_limite)}</b></div>`}
  <div class="cj o"><strong>🎯 Objetivo de la prueba:</strong><br>${nl(d.caso_o_consigna,'Sin objetivo específico.')}</div>
  ${consigna?`<div class="cj h"><strong>📝 Consigna entregada al postulante:</strong><div class="consigna">${consigna}</div></div>`:''}
  <div class="cj g bloque-guia"><strong>🔍 Guía de observación para el evaluador:</strong><br>${nl(d.guia_evaluacion,'Sin guía específica.')}</div>
  <div class="cj c bloque-guia"><strong>✅ Corrector: respuestas correctas / esperadas:</strong><br>${nl(d.respuesta_esperada,'Sin respuesta esperada definida.')}</div></div>`}).join('');
 let primero=true;
 const detalle=ps.map((p,i)=>{if(!p)return '';const salto=primero?'':' res-salto';primero=false;
  return `<div class="candidate-box${salto}"><h4>Postulante #${i+1}: <span class="val-n">${esc(nombre(p))}</span></h4>${tabla(calcularPuntajes(car,sel,p.puntajes))}
  ${String(p.observaciones||'').trim()?`<div class="res-et">Observaciones y notas de conducta:</div><div class="observations-box res-obs">${txt(p.observaciones)}</div>`:''}
  <div class="dictamen-p"><strong>Dictamen:</strong> ${p.dictamen?esc(p.dictamen):'—'}</div></div>`}).join('')||'<p>No hay postulantes evaluados.</p>';
 const firma=`<div class="firma"><div class="firma-linea"></div><div class="firma-n">${esc(ev)}</div>${tit?`<div class="firma-t">${esc(tit)}</div>`:''}<div class="firma-t">Firma del evaluador(a)</div></div>`;
 const estado=fin?`Finalizada${cor.finalizada?' el '+fmtFechaISO(cor.finalizada):''}`:'<b class="res-borr">BORRADOR · no finalizada</b>';
 return `<div class="header-eval"><div><h2>INFORME DE RESULTADOS · EVALUACIÓN PSICOTÉCNICA</h2><div class="inf-linea"><span class="inf-n">${esc(meta.nombre||bonito(car.nombre))}</span><span class="inf-sep">-</span><span class="inf-c">Cargo Objetivo:</span><span class="idm">${esc(key)}</span>${meta.codigo?`<span class="inf-sep">·</span><span class="inf-c">Informe</span><span class="idm">${esc(meta.codigo)}</span>`:''}</div></div>
 <div class="meta-info"><strong>Fecha de evaluación:</strong> ${fmtFecha(meta.fecha)||'—'}<br><strong>Evaluador(a):</strong> ${ev?`${esc(ev)}${tit?`, ${esc(tit)}`:''}`:'—'}<br><strong>Corrección:</strong> ${estado}</div></div>
 <div class="section-title">1. RESUMEN DE RESULTADOS</div>${resumen}
 <div class="section-title">2. DINÁMICAS APLICADAS</div>${testigos}${(multi||editado)&&total>0?`<div class="cj t" style="font-weight:bold">⏱️ Tiempo total estimado (${sel.length} dinámica${multi?'s':''}): ${total} minutos</div>`:''}
 <div class="section-title res-salto">3. DETALLE DE PUNTAJE POR POSTULANTE</div>${leyenda}${detalle}
 <div class="general-notes"><div class="section-title" style="margin-top:0">4. CONCLUSIÓN</div><div class="conclusion-cor"><strong>Comentarios finales:</strong><div class="val-txt">${txt(cor.comentarios)||'—'}</div></div>${firma}</div>`;
}
