// Validadores puros del editor de Vocabula, compartidos por la Edge Function y las pruebas.
const SUBJECTS=new Set(['lat1','lat2','lat4','gr1']);
const REPORT_STATUSES=new Set(['pending','reviewing','resolved','dismissed']);
const PAGE_SIZE=50;
const LAT2_CATEGORIES=new Set(['Sustantivos','Adjetivos','Verbos','Preposiciones','Conjunciones y adverbios']);
export const LAT2_CATEGORY_NAMES=[...LAT2_CATEGORIES];
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const trimmed=(v,max,min=0)=>typeof v==='string'&&v.trim().length>=min&&
  v.trim().length<=max?v.trim():null;
function strings(v,max=30){
  if(!Array.isArray(v)||v.length<1||v.length>max)return null;
  const values=[];
  for(const item of v){
    const cleaned=trimmed(item,150,1);
    if(cleaned===null)return null;
    if(!values.includes(cleaned))values.push(cleaned);
  }
  return values.length?values:null;
}
export function validateWordInput(body){
  if(!body||typeof body!=='object'||Array.isArray(body))return null;
  if(body.id!==undefined&&body.id!==null&&(!UUID.test(body.id)))return null;
  if(!SUBJECTS.has(body.subject))return null;
  const form=trimmed(body.form,300,1),meaning=trimmed(body.meaning,1000,1);
  const answers=strings(body.answers),providedUnits=strings(body.units);
  if(!form||!meaning||!answers||!providedUnits)return null;
  // Latín II usa clases gramaticales, nunca UDs. Las demás unidades son
  // etiquetas de estudio y UD10 debe coincidir con la UD 10 del banco.
  if(body.subject==='lat2'&&(providedUnits.length!==1||
      !LAT2_CATEGORIES.has(providedUnits[0])))return null;
  const units=body.subject==='lat2'?providedUnits:
    [...new Set(providedUnits.map(unit=>{
      const number=/^UD\s*(\d{1,2})$/i.exec(unit);
      return number?'UD '+Number(number[1]):unit;
    }))];
  if(typeof body.in_exam!=='boolean'||typeof body.active!=='boolean')return null;
  const payload={subject:body.subject,form,form_key:form.normalize('NFC').toLowerCase(),
    meaning,answers,units,in_exam:body.in_exam,active:body.active};
  return {id:body.id||null,payload};
}
export function validateReportReview(body){
  if(!body||typeof body!=='object'||Array.isArray(body)||typeof body.id!=='string'||
      !UUID.test(body.id)||!REPORT_STATUSES.has(body.status))return null;
  const note=trimmed(body.teacher_note,2000,0);
  if(note===null)return null;
  return {id:body.id,status:body.status,teacher_note:note};
}
export function validateWordFilter(body){
  if(!body||typeof body!=='object'||Array.isArray(body))return null;
  const offset=body.offset??0;
  const subject=body.subject??'';
  const search=body.search??'';
  if(!Number.isSafeInteger(offset)||offset<0||offset>100000)return null;
  if(subject!==''&&!SUBJECTS.has(subject))return null;
  // Restringir los metacaracteres de filtros PostgREST en búsquedas literales.
  if(typeof search!=='string'||search.length>80||
    !/^[\p{L}\p{M}\p{N}\s-]*$/u.test(search))return null;
  return {offset,subject,search:search.trim().normalize('NFC'),pageSize:PAGE_SIZE};
}
export function validateReportFilter(body){
  if(!body||typeof body!=='object'||Array.isArray(body))return null;
  const status=body.status??'pending';
  const offset=body.offset??0;
  if(status!==''&&!REPORT_STATUSES.has(status))return null;
  if(!Number.isSafeInteger(offset)||offset<0||offset>100000)return null;
  return {status,offset,pageSize:PAGE_SIZE};
}
