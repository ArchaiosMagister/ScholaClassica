/** Teclado griego reutilizable: sin bibliotecas, red ni teclado del sistema. */
const LETTERS='α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ σ ς τ υ φ χ ψ ω'.split(' ');
export function attachGreekKeyboard(container,getInput,isEnabled=()=>true){
  for(const character of LETTERS){
    const key=document.createElement('button');
    key.type='button';
    key.className='greek-key';
    key.lang='grc';
    key.textContent=character;
    key.setAttribute('aria-label','Insertar '+character);
    key.addEventListener('click',()=>{
      if(!isEnabled())return;
      const input=getInput();
      if(!input)return;
      const start=input.selectionStart??input.value.length;
      const end=input.selectionEnd??input.value.length;
      input.setRangeText(character,start,end,'end');
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.focus();
    });
    container.append(key);
  }
}
