// Catálogo docente: cada ficha histórica conserva su ID, modo, glosa,
// respuestas y unidades. La clave subject|form solo agrupa para MOSTRAR,
// nunca mezcla acepciones ni convierte General en Examen.
// Las aportaciones docentes usan esa misma clave en Vocabula, donde una
// versión activa sustituye a todas las fichas originales de la misma forma.
export const entryKey=item=>String(item.subject)+'|'+String(item.form).normalize('NFC').toLocaleLowerCase();
export const searchKey=value=>String(value||'')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLocaleLowerCase().replace(/[–−—]/g,'-').trim();

export function mergeCatalog(original=[],custom=[]){
  const grouped=new Map();
  const groupFor=item=>{
    const key=entryKey(item);
    if(!grouped.has(key))grouped.set(key,{
      key,subject:item.subject,form:item.form,originals:[],docentes:[]
    });
    return grouped.get(key);
  };
  for(const item of original){
    if(!item||!['general','examen'].includes(item.mode))continue;
    // No deduplicar por texto ni por significado: los IDs históricos se
    // conservan incluso cuando dos fichas tienen respuestas idénticas.
    groupFor(item).originals.push({
      id:item.id,subject:item.subject,mode:item.mode,form:item.form,
      meaning:item.meaning,answers:[...(item.answers||[])],
      units:[...(item.units||[])],active:true,origin:'original'
    });
  }
  for(const item of custom){
    if(!item)continue;
    groupFor(item).docentes.push({
      ...item,answers:[...(item.answers||[])],units:[...(item.units||[])],
      origin:'docente'
    });
  }
  return [...grouped.values()].sort((a,b)=>
    String(a.subject).localeCompare(String(b.subject))||
    searchKey(a.form).localeCompare(searchKey(b.form),'es'));
}
export function matchingOriginals(catalog,item){
  return catalog.find(group=>group.key===entryKey(item))?.originals||[];
}
export function matchCatalog(items,{subject='',search='',offset=0,pageSize=50}={}){
  const needle=searchKey(search);
  const matches=items.filter(group=>
    (!subject||group.subject===subject)&&
    (!needle||[group.form,...group.originals.flatMap(item=>
      [item.form,item.meaning,...item.answers]),
      ...group.docentes.flatMap(item=>[item.form,item.meaning,...item.answers])]
      .some(value=>searchKey(value).includes(needle))));
  return {rows:matches.slice(offset,offset+pageSize),total:matches.length,
    more:offset+pageSize<matches.length};
}
