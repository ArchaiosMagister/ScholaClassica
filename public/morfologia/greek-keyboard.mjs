// Teclado griego polifónico accesible, sin dependencia del teclado físico.
// Inserta signos combinantes canónicos sobre la vocal que precede al cursor.
const LETTERS=['α','β','γ','δ','ε','ζ','η','θ','ι','κ','λ','μ','ν','ξ','ο','π','ρ','σ','ς','τ','υ','φ','χ','ψ','ω'];
const MARKS=[
  {label:'᾿',value:'\u0313',name:'Espíritu suave'},
  {label:'῾',value:'\u0314',name:'Espíritu áspero'},
  {label:'´',value:'\u0301',name:'Acento agudo'},
  {label:'`',value:'\u0300',name:'Acento grave'},
  {label:'῀',value:'\u0342',name:'Circunflejo'},
  {label:'¨',value:'\u0308',name:'Diéresis'},
  {label:'ͅ',value:'\u0345',name:'Iota suscrita'}
];
const vowel=/^[αεηιουωΑΕΗΙΟΥΩρΡ]/u;
const accentGroup=/[\u0300\u0301\u0342]/gu;
const breathingGroup=/[\u0313\u0314]/gu;
function previousGrapheme(text){
  if(!text)return '';
  if(typeof Intl.Segmenter==='function'){
    const chunks=[...new Intl.Segmenter('el',{granularity:'grapheme'}).segment(text)];
    return chunks.at(-1)?.segment||'';
  }
  // Formato de respaldo: base + sus marcas combinantes.
  const nfd=text.normalize('NFD');
  const match=nfd.match(/.[\u0300-\u036f]*$/u);
  return (match?.[0]||'').normalize('NFC');
}
function changeText(input,start,end,insert){
  if(!input||typeof input.setRangeText!=='function'||input.disabled)return false;
  input.setRangeText(insert,start,end,'end');
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.focus({preventScroll:true});
  return true;
}
export function insertGreek(input,symbol){
  if(typeof symbol!=='string'||![...LETTERS,' '].includes(symbol))return false;
  if(!input)return false;
  const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;
  return changeText(input,start,end,symbol);
}
export function applyGreekMark(input,mark){
  if(!MARKS.some(item=>item.value===mark)||!input)return false;
  const position=input.selectionStart??input.value.length;
  const before=input.value.slice(0,position),previous=previousGrapheme(before);
  if(!previous)return false;
  const decomposition=previous.normalize('NFD');
  const base=Array.from(decomposition)[0];
  if(!vowel.test(base))return false;
  if(/^[ρΡ]$/u.test(base)&&!['\u0313','\u0314'].includes(mark))return false;
  if(mark==='\u0345'&&!/^[αηωΑΗΩ]$/u.test(base))return false;
  if(mark==='\u0342'&&/^[εοΕΟ]$/u.test(base))return false;
  let components=decomposition;
  if(['\u0300','\u0301','\u0342'].includes(mark))components=components.replace(accentGroup,'');
  if(['\u0313','\u0314'].includes(mark))components=components.replace(breathingGroup,'');
  // Nunca duplicar la marca al pulsarla dos veces.
  components=components.replace(mark,'');
  const next=(components+mark).normalize('NFC');
  return changeText(input,position-previous.length,position,next);
}
export function backspaceGreek(input){
  if(!input)return false;
  const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;
  if(end>start)return changeText(input,start,end,'');
  if(start===0)return false;
  const prev=previousGrapheme(input.value.slice(0,start));
  return changeText(input,start-prev.length,start,'');
}
export function mountGreekKeyboard(container,getTarget,onNotice=()=>{}){
  if(!container)return;
  const key=(label,action,description)=>{
    const button=document.createElement('button');
    button.type='button';button.className='greek-key';
    button.textContent=label;button.setAttribute('aria-label',description||label);
    button.addEventListener('pointerdown',event=>event.preventDefault());
    button.addEventListener('click',()=>{
      const target=getTarget();
      if(!target){onNotice('Selecciona una casilla antes de escribir.');return}
      if(!action(target))onNotice('Coloca el cursor detrás de una vocal griega adecuada.');
      else onNotice('');
    });
    return button;
  };
  const section=(title,items)=>{
    const div=document.createElement('div');div.className='greek-key-row';
    div.setAttribute('role','group');div.setAttribute('aria-label',title);
    div.append(...items);container.append(div);
  };
  container.replaceChildren();
  section('Letras griegas',LETTERS.map(letter=>key(letter,
    target=>insertGreek(target,letter),'Insertar '+letter)));
  section('Acentos y espíritus',MARKS.map(mark=>key(mark.label,
    target=>applyGreekMark(target,mark.value),mark.name)));
  section('Edición',[
    key('Espacio',target=>insertGreek(target,' '),'Insertar espacio'),
    key('⌫',backspaceGreek,'Retroceso')
  ]);
}
