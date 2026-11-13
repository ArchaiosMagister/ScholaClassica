// Segunda fase: únicamente tablas completas del Appendix fijado (sin inferencias léxicas).
import assert from 'node:assert/strict';
const PERSONS=['1.ª singular','2.ª singular','3.ª singular','1.ª plural','2.ª plural','3.ª plural'];
const LAT_CASES=['Nominativo','Vocativo','Acusativo','Genitivo','Dativo','Ablativo'];
const GR_CASES=['Nom.','Voc.','Ac.','Gen.','Dat.'];
const GENDERS=['masculino','femenino','neutro'];
const sanitize=html=>html.replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ')
  .replace(/&amp;/g,'&').replace(/\s+/g,' ').trim().normalize('NFC');
function rowsFrom(html,caption,{expand=false,columns=null}={}){
  const tables=[...html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/g)];
  const match=tables.find(m=>sanitize(m[1].match(/<caption[^>]*>([\s\S]*?)<\/caption>/)?.[1]||'')===caption);
  assert.ok(match,'Tabla curricular no encontrada: '+caption);
  const tbody=match[1].match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/)?.[1];
  assert.ok(tbody,'Tabla sin tbody: '+caption);
  const raw=[...tbody.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map(row=>
    [...row[1].matchAll(/<(th|td)\b([^>]*)>([\s\S]*?)<\/\1>/g)].map(cell=>({
      text:sanitize(cell[3]),rowspan:Number(cell[2].match(/rowspan="(\d+)"/)?.[1]||1)
    })));
  if(!expand)return raw.map(row=>row.map(cell=>cell.text));
  assert.ok(columns>=2,'No hay columnas declaradas');
  const body=raw.slice(-5);
  assert.equal(body.length,5,'Los adjetivos griegos deben tener 5 casos');
  const spans=new Map();
  return body.map((source,index)=>{
    const actual=[];
    let i=0;
    for(let col=0;col<columns;col++){
      if(spans.has(col)){
        const span=spans.get(col);
        actual.push(span.text);
        span.remaining--;
        if(span.remaining===0)spans.delete(col);
      }else{
        const cell=source[i++];
        assert.ok(cell,'Celda ausente '+caption+' caso '+index+' columna '+col);
        actual.push(cell.text);
        if(cell.rowspan>1)spans.set(col,{text:cell.text,remaining:cell.rowspan-1});
      }
    }
    assert.equal(i,source.length,'Cambio de estructura en tabla '+caption);
    return actual;
  });
}
const lemmaForm=text=>text.replace(/–/g,'').replace(/\s+/g,'').normalize('NFC');
function evidence({unit,topic,caption,file,notes}){
  return {source:'Appendix grammaticae',file,unit,topic,caption,
    status:'paradigma-documentado',...(notes?{notes}:{})};
}
function curriculumTopic(curriculum,lang,unit,title,href){
  const topic=curriculum[lang]?.units.find(u=>u.number===unit)?.topics.find(t=>t.title===title);
  assert.ok(topic,'Tema curricular ausente '+lang+'/'+unit+'/'+title);
  if(href)assert.ok(topic.html.includes('href="'+href+'"'),'No remite al capítulo '+href);
  return topic;
}
function latinPerfects(curriculum,html){
  const unit=4,topic='Perfecto y pluscuamperfecto activos';
  curriculumTopic(curriculum,'latin',unit,topic,'indicativo.html');
  const names=['amo, amavi, amatum','habeo, habui, habitum','duco, duxi, ductum',
    'audio, audivi, auditum','capio, cepi, captum'];
  const records=[];
  for(const [code,time,caption,sumCaption] of [
    ['perfecto','perfecto activo','Perfecto de indicativo · voz activa','sum · 3'],
    ['pluscuamperfecto','pluscuamperfecto activo','Pluscuamperfecto de indicativo · voz activa','sum · 4']
  ]){
    const rows=rowsFrom(html,caption);
    assert.equal(rows.length,6,'Paradigma verbal incompleto: '+caption);
    rows.forEach((row,index)=>{
      assert.equal(row.length,6,'Columnas verbales inesperadas '+caption);
      assert.equal(row[0],PERSONS[index]);
    });
    names.forEach((name,index)=>{
      const forms=rows.map((row,person)=>({
        form:row[index+1],analysis:PERSONS[person]+' · '+time,
        person:PERSONS[person],tense:time
      }));
      records.push({id:'latin-'+code+'-'+index,language:'latin',unit,kind:'verbo',
        paradigm:name+' · '+time,forms,
        evidence:evidence({unit,topic,file:'indicativo.html',caption,
          notes:'Enunciado con tres formas (presente, perfecto, supino), de acuerdo con UD4.'})});
    });
    const sums=rowsFrom(html,sumCaption);
    assert.equal(sums.length,6,'sum carece de alguna forma del '+code);
    const forms=sums.map((row,i)=>{
      assert.equal(row.length,2);assert.equal(row[0],PERSONS[i]);
      return {form:row[1],analysis:PERSONS[i]+' · '+time,person:PERSONS[i],tense:time};
    });
    records.push({id:'latin-'+code+'-sum',language:'latin',unit,kind:'verbo',
      paradigm:'sum, fui – · '+time,forms,
      evidence:evidence({unit,topic,file:'indicativo.html',caption:sumCaption,
        notes:'El perfecto de sum se enuncia sum, fui –; no se inventa supino.'})});
  }
  assert.equal(records.find(r=>r.id==='latin-perfecto-2').forms[0].form,'duxi');
  assert.equal(records.find(r=>r.id==='latin-pluscuamperfecto-2').forms[0].form,'duxeram');
  assert.equal(records.find(r=>r.id==='latin-perfecto-sum').forms[0].form,'fui');
  return records;
}
function latinAdjectives(curriculum,html){
  const unit=5,topic='Adjetivos de la tercera declinación';
  curriculumTopic(curriculum,'latin',unit,topic,'adjetivos.html');
  const templates=[
    ['brevis','Adjetivos de la tercera · brevis, -e','brevis, -e · 2 terminaciones',4],
    ['acer','acer, acris, acre · tres terminaciones','acer, acris, acre · 3 terminaciones',6],
    ['audax','audax, audacis · una terminación, tema en -i','audax, audacis · 1 terminación',6],
    ['vetus','vetus, veteris · una terminación, tema consonántico','vetus, veteris · tema consonántico',6]
  ];
  return templates.map(([id,caption,paradigm,width])=>{
    const rows=rowsFrom(html,caption);
    assert.equal(rows.length,6,'Faltan casos del adjetivo '+id);
    const forms=[];
    rows.forEach((row,index)=>{
      assert.equal(row.length,width+1,'Formato inesperado de '+caption);
      assert.equal(row[0],LAT_CASES[index]);
      for(const number of ['singular','plural']){
        for(let g=0;g<3;g++){
          const column=width===4?
            (number==='singular'?(g===2?2:1):(g===2?4:3)):
            (number==='singular'?g+1:g+4);
          const form=row[column];
          assert.ok(form,'Adjetivo sin forma: '+id);
          forms.push({form,analysis:LAT_CASES[index].toLowerCase()+' '+GENDERS[g]+' '+number,
            case:LAT_CASES[index].toLowerCase(),number,gender:GENDERS[g]});
        }
      }
    });
    return {id:'latin-adj-'+id,language:'latin',unit,kind:'adjetivo',
      paradigm,forms,evidence:evidence({unit,topic,file:'adjetivos.html',caption,
        notes:'Las coincidencias de género se representan con análisis múltiples, sin inventar terminaciones.'})};
  });
}
function greekAdjectives(curriculum){
  const unit=5,topic='Adjetivos 2–1–2 y 2–2',source=curriculumTopic(curriculum,'griego',unit,topic);
  const irregularTopic='Adjetivos irregulares: πολύς y μέγας';
  const irregular=curriculumTopic(curriculum,'griego',unit,irregularTopic);
  const models=[
    {id:'agathos',caption:'Tipo 1 · tabla 100',topic,html:source.html,columns:7,width:6,
      paradigm:'ἀγαθός, ἀγαθή, ἀγαθόν · tipo 2–1–2'},
    {id:'barbaros',caption:'Tipo 1 · tabla 101',topic,html:source.html,columns:5,width:4,
      paradigm:'βάρβαρος, βάρβαρον · tipo 2–2'},
    {id:'polys',caption:'πολύς, πολλή, πολύ — mucho',topic:irregularTopic,html:irregular.html,columns:7,width:6,
      paradigm:'πολύς, πολλή, πολύ · irregular'},
    {id:'megas',caption:'μέγας, μεγάλη, μέγα — grande',topic:irregularTopic,html:irregular.html,columns:7,width:6,
      paradigm:'μέγας, μεγάλη, μέγα · irregular'}
  ];
  return models.map(m=>{
    const rows=rowsFrom(m.html,m.caption,{expand:true,columns:m.columns});
    const forms=[];
    rows.forEach((row,index)=>{
      assert.equal(row[0],GR_CASES[index],'Orden de casos griegos alterado');
      for(const number of ['singular','plural']){
        for(let g=0;g<3;g++){
          const col=m.width===4?
            (number==='singular'?(g===2?2:1):(g===2?4:3)):
            (number==='singular'?g+1:g+4);
          const form=lemmaForm(row[col]);
          assert.ok(form&&!form.includes('–'),'Forma griega dividida o vacía: '+m.caption);
          forms.push({form,analysis:
            ['nominativo','vocativo','acusativo','genitivo','dativo'][index]+' '+GENDERS[g]+' '+number,
            case:['nominativo','vocativo','acusativo','genitivo','dativo'][index],
            number,gender:GENDERS[g]});
        }
      }
    });
    return {id:'griego-adj-'+m.id,language:'griego',unit,kind:'adjetivo',
      paradigm:m.paradigm,forms,evidence:evidence({unit,topic:m.topic,
        file:'assets/curriculum.json',caption:m.caption,
        notes:'Formas literales de la tabla del Appendix; se restituye el contenido de las celdas rowspan sin derivar flexiones.'})};
  });
}
export function compileAdditionalMorphology({curriculum,latinIndicativeHtml,latinAdjectivesHtml}){
  assert.ok(typeof latinIndicativeHtml==='string'&&latinIndicativeHtml.includes('id="perfecto-de-indicativo"'));
  assert.ok(typeof latinAdjectivesHtml==='string'&&latinAdjectivesHtml.includes('brevis'));
  const records=[...latinPerfects(curriculum,latinIndicativeHtml),
    ...latinAdjectives(curriculum,latinAdjectivesHtml),
    ...greekAdjectives(curriculum)];
  assert.equal(records.length,20);
  assert.equal(new Set(records.map(r=>r.id)).size,20);
  return records;
}
