// Construye el HTML del informe imprimible. Depende de utilidades.js (esc, prepararHojaDinamica, cantidadRenglonesDinamica).
const limpio=t=>String(t||'').replace(/\s*\[cite:[^\]]*\]/g,'').trim();
const mins=d=>{const n=(d.tiempo_limite||'').match(/\d+/g);return n?Math.max(...n.map(Number)):0};
const cod=(c,i)=>c.codigo||'C'+String(i+1).padStart(2,'0');
const aplica=(d,car)=>{const r=[...String(d.caso_o_consigna||'').matchAll(/\b\d+\.\d+\b/g)].map(m=>m[0]);
 return car.competencias.map(cod).filter(c=>!r.length||r.includes(c))};
const nl=(t,v)=>esc(limpio(t)||v).replace(/\n/g,'<br>');

function construirInforme(key,car,sel,n){const comps=car.competencias,MAXF=30;
 const total=sel.reduce((a,d)=>a+mins(d),0),multi=sel.length>1;
 const bloques=sel.map((d,i)=>`<div class="bloque-dinamica bd"><p><strong>Dinámica ${i+1}:</strong> ${esc(d.titulo)} <span class="idm">ID: ${esc(d.id)}</span></p>
  <p class="dynamics-list"><strong>Descripción:</strong> ${esc(limpio(d.desc))}</p>
  <div class="cj t"><strong>⏱️ Tiempo límite:</strong> <b>${esc(d.tiempo_limite||'Sin límite especificado')}</b></div>
  <div class="cj o"><strong>🎯 Objetivo de la prueba:</strong><br>${nl(d.caso_o_consigna,'Sin objetivo específico.')}</div>
  <div class="cj g bloque-guia"><strong>🔍 Guía de observación para el evaluador:</strong><br>${nl(d.guia_evaluacion,'Sin guía específica.')}</div>
  <div class="cj c bloque-guia"><strong>✅ Corrector: respuestas correctas / esperadas:</strong><br>${nl(d.respuesta_esperada,'Sin respuesta esperada definida.')}</div></div>`).join('');
 const cpd=sel.map(d=>new Set(aplica(d,car))),maxD=cpd.map(s=>s.size*5),maxC=comps.map((c,i)=>cpd.filter(s=>s.has(cod(c,i))).length*5),maxT=maxD.reduce((a,b)=>a+b,0);
 const pesos=sel.map(d=>Number(d.peso)>0?Number(d.peso):1),pA=pesos.filter((_,i)=>maxD[i]>0),sumP=pA.reduce((a,b)=>a+b,0),iguales=pA.length>0&&pA.every(p=>p===pA[0]);
 const formula=maxT===0?'Sin competencias aplicables':iguales?`Total ÷ ${maxT} × ${MAXF}`:`Σ (Sub total ÷ máximo aplicable × peso) ÷ ${sumP} × ${MAXF}`;
 const leyenda=`<div class="leyenda-dinamicas bloque-dinamica"><strong>Competencias a observar</strong><ul>${comps.map((c,i)=>`<li><strong>${esc(cod(c,i))} - ${esc(c.comp)}:</strong> ${esc(limpio(c.desc))}</li>`).join('')}</ul></div>`;
 const celdaMax=m=>m?`<td class="celda-puntaje"><span class="max">/ ${m}</span></td>`:'<td class="celda-no-aplica"></td>';
 const filas=sel.map((d,i)=>`<tr><td class="celda-comp"><strong><span class="badge-d">D${i+1}</span>${esc(d.titulo)}</strong><span><span class="chip chip-id">${esc(d.id)}</span> <span class="chip chip-tiempo">⏱️ ${esc(d.tiempo_limite||'sin límite')}</span>${iguales?'':` <span class="chip chip-id">Peso ${pesos[i]}</span>`}</span></td>${comps.map((c,j)=>cpd[i].has(cod(c,j))?'<td class="celda-puntaje"><span class="max">/ 5</span></td>':'<td class="celda-no-aplica"></td>').join('')}<td class="celda-puntaje col-subtotal"><span class="max">${maxD[i]?`/ ${maxD[i]}`:'No aplica'}</span></td></tr>`).join('');
 const tabla=`<table class="tabla-puntaje"><thead><tr><th>Dinámica</th>${comps.map((c,i)=>`<th class="col-puntaje" title="${esc(c.comp)}">${esc(cod(c,i))}</th>`).join('')}<th class="col-subtotal">Sub total</th></tr></thead><tbody>${filas}
  <tr class="fila-total"><td>TOTAL</td>${maxC.map(celdaMax).join('')}<td class="celda-puntaje"><span class="max">/ ${maxT}</span></td></tr>
  <tr class="fila-total"><td>PUNTAJE FINAL</td><td colspan="${comps.length+1}" class="celda-puntaje celda-formula"><span class="max">${formula}${maxT?` = ______ / ${MAXF}`:''}</span></td></tr></tbody></table>`;
 let post='',hojas='';
 for(let i=1;i<=n;i++){post+=`<div class="candidate-box"><h4>Postulante #${i}: __________________________________________________</h4>${tabla}<div style="font-size:.75rem;font-weight:600;color:var(--secondary);margin-top:.5rem">Observaciones y notas de conducta del postulante:</div><div class="observations-box"></div></div>`;
  sel.forEach(d=>{hojas+=`<div class="candidate-sheet"><div class="pag">Hoja de trabajo · página nueva al imprimir</div><h3 class="ht">HOJA DE TRABAJO / CONSIGNA</h3>
   <div class="enc"><div style="display:flex;justify-content:space-between"><div style="flex:1;margin-right:1.25rem"><strong>Nombre del Postulante:</strong> ______________________________________</div><div><strong>Fecha:</strong> ____/____/20___</div></div>
   <div style="display:flex;justify-content:space-between;margin-top:.5rem;border-top:1px dashed var(--border);padding-top:.5rem"><div><strong>Dinámica ID:</strong> <span class="idm">${esc(d.id)}</span></div><div style="color:#8e44ad;font-weight:bold">⏱️ Tiempo Límite: ${esc(d.tiempo_limite||'Sin límite especificado')}</div></div></div>
   <div class="area-respuesta-postulante ${cantidadRenglonesDinamica(d)===0?'area-respuesta-libre':''}">${prepararHojaDinamica(d)||'Sin material específico definido.'}</div></div>`})}
 return `<div class="header-eval"><div><h2>INFORME DE EVALUACIÓN PSICOTÉCNICA</h2><div style="font-weight:bold;color:var(--accent);margin-top:.3rem">Cargo Objetivo: [${esc(key)}] ${esc(car.nombre)}</div></div><div class="meta-info"><strong>Fecha:</strong> ____/____/20___<br><strong>Evaluador(a):</strong> ________________________</div></div>
 <div class="section-title">1. DINÁMICAS DE EVALUACIÓN SELECCIONADAS</div>${bloques}${multi?`<div class="cj t" style="font-weight:bold">⏱️ Tiempo total estimado (${sel.length} dinámicas): ${total} minutos</div>`:''}
 <div class="section-title">2. EVALUACIÓN Y PUNTAJE POR POSTULANTE</div>${leyenda}${post}
 <div class="general-notes"><div class="section-title" style="margin-top:0">3. CONCLUSIÓN Y DICTAMEN GENERAL</div><div style="border:1px solid var(--border);height:5rem;border-radius:.25rem;padding:.5rem;font-size:.8125rem"><strong>Dictamen Global (Apto / Apto con reservas / No apto):</strong><br><br><strong>Comentarios finales:</strong></div></div>${hojas}`;
}
