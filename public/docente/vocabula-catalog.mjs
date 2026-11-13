// Catálogo público original + aportaciones privadas autorizadas en Supabase.
// Las formas originales nunca se modifican: editarlas crea una sobreescritura.
// Misma clave que applyWords() de Vocabula para mantener su comportamiento.
export const entryKey=item=>String(item.subject)+'|'+String(item.form).normalize('NFC').toLocaleLowerCase();
export const searchKey=value=>String(value||'')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLocaleLowerCase().replace(/[–−—]/g,'-').trim();
const unique=values=>[...new Set(values)];
export function mergeCatalog(original,custom){
  const grouped=new Map();
  for(const item of original){
    if(!item||!['general','examen'].includes(item.mode))continue;
    const key=entryKey(item);
    if(!grouped.has(key)){
      grouped.set(key,{subject:item.subject,form:item.form,meaning:item.meaning,
        answers:[],units:[],in_exam:false,active:true,origin:'original',id:null});
    }
    const row=grouped.get(key);
    row.answers=unique(row.answers.concat(item.answers||[]));
    row.units=unique(row.units.concat(item.units||[]));
    if(item.mode==='examen')row.in_exam=true;
  }
  for(const item of custom){
    const key=entryKey(item);
    if(item.active===false){
      // Al retirar una sobreescritura, Vocabula repone el lema original.
      // Se conserva la aportación desactivada para permitir reactivarla.
      const originalRow=grouped.get(key);
      if(originalRow)grouped.set(key+'|original',originalRow);
      grouped.set(key,{...item,origin:'docente'});
    }else{
      grouped.set(key,{...item,origin:'docente'});
    }
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
