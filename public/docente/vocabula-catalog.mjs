// Catálogo público original + aportaciones privadas autorizadas en Supabase.
// Las fichas originales nunca se modifican. La clave de las sobreescrituras
// docentes continúa siendo subject|form para mantener el motor del alumnado.
export const entryKey=item=>String(item.subject)+'|'+String(item.form).normalize('NFC').toLocaleLowerCase();
export const searchKey=value=>String(value||'')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLocaleLowerCase().replace(/[–−—]/g,'-').trim();
const unique=values=>[...new Set(values)];
const semanticKey=item=>JSON.stringify([item.meaning,item.answers||[]]);

// Una tarjeta por lema, pero nunca una sola acepción o lista de respuestas
// ficticia. Se conserva CADA ID y la procedencia de CADA unidad.
export function mergeCatalog(original,custom){
  const grouped=new Map();
  for(const item of original){
    if(!item||!['general','examen'].includes(item.mode))continue;
    const key=entryKey(item);
    if(!grouped.has(key)){
      grouped.set(key,{subject:item.subject,form:item.form,meaning:'',
        answers:[],units:[],in_exam:false,active:true,origin:'original',id:null,
        sources:[],variants:[],semanticConflict:false});
    }
    const row=grouped.get(key);
    const source={id:item.id,mode:item.mode,units:[...(item.units||[])],
      meaning:item.meaning,answers:[...(item.answers||[])]};
    row.sources.push(source);
    const signature=semanticKey(source);
    let variant=row.variants.find(value=>value.signature===signature);
    if(!variant){
      variant={signature,meaning:source.meaning,answers:[...source.answers],sources:[]};
      row.variants.push(variant);
    }
    variant.sources.push({id:source.id,mode:source.mode,units:[...source.units]});
    row.units=unique(row.units.concat(source.units));
    if(item.mode==='examen')row.in_exam=true;
  }
  for(const row of grouped.values()){
    row.semanticConflict=row.variants.length>1;
    // El campo de búsqueda recoge todas las glosas, no solo la primera.
    row.meaning=unique(row.variants.map(value=>value.meaning)).join(' · ');
    // Respuestas de distintas procedencias nunca se agregan automáticamente.
    row.answers=row.semanticConflict?[]:[...row.variants[0].answers];
  }
  for(const item of custom){
    if(!item)continue;
    const key=entryKey(item);
    const originalRow=grouped.get(key);
    const docente={...item,origin:'docente',
      // Trazabilidad incluso si una sobreescritura activa sustituye la vista original.
      originalSources:originalRow?.sources||[],
      originalVariants:originalRow?.variants||[],
      originalSemanticConflict:originalRow?.semanticConflict||false};
    if(item.active===false&&originalRow){
      // La retirada de la sobreescritura restituye la vista original.
      grouped.set(key+'|original',originalRow);
    }
    grouped.set(key,docente);
  }
  return [...grouped.values()].sort((a,b)=>
    String(a.subject).localeCompare(String(b.subject))||
    searchKey(a.form).localeCompare(searchKey(b.form),'es')||
    String(a.origin).localeCompare(String(b.origin)));
}
export function matchCatalog(items,{subject='',search='',offset=0,pageSize=50}={}){
  const needle=searchKey(search);
  const matches=items.filter(item=>
    (!subject||item.subject===subject)&&
    (!needle||searchKey(item.form).includes(needle)||
      searchKey(item.meaning).includes(needle)));
  return {rows:matches.slice(offset,offset+pageSize),total:matches.length,
    more:offset+pageSize<matches.length};
}
