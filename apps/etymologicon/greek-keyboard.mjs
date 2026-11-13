/** Teclado griego reutilizable: nunca se apoya en un teclado instalado. */
const LETTERS='α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ σ ς τ υ φ χ ψ ω'.split(' ');

/**
 * En pantalla táctil, abrir el teclado integrado deja las casillas en modo
 * lectura: el sistema operativo no levanta el teclado nativo al tocarlas.
 * La inserción por JS sigue funcionando, incluidas selección y corrección.
 * El usuario puede volver explícitamente al teclado del dispositivo.
 */
export function attachGreekKeyboard(container,getInput,isEnabled=()=>true,inputs=[]){
  const details=container.closest('details.virtual-keyboard');
  const fields=inputs.length?inputs:[getInput()].filter(Boolean);
  const touchDevice=typeof matchMedia==='function'&&matchMedia('(pointer: coarse)').matches;
  const nativeButton=details?.querySelector('.native-keyboard-button');
  function setVirtual(enabled){
    if(!touchDevice)return;
    for(const input of fields){
      input.readOnly=enabled;
      if(enabled&&document.activeElement===input)input.blur();
    }
  }
  if(details){
    details.addEventListener('toggle',()=>{
      setVirtual(details.open);
      if(details.open&&touchDevice){
        // Intentar mantener la casilla y las letras dentro del área visible.
        requestAnimationFrame(()=>{
          const input=getInput(),keyboard=container.getBoundingClientRect();
          const field=input?.getBoundingClientRect();
          const height=window.visualViewport?.height||window.innerHeight;
          if(!field||!keyboard.height)return;
          const top=Math.min(field.top,keyboard.top);
          const bottom=Math.max(field.bottom,keyboard.bottom);
          if(bottom-top<height-32&&top<12)
            window.scrollBy({top:top-14,behavior:'instant'});
          else if(bottom>height-12&&bottom-top<height-32)
            window.scrollBy({top:bottom-height+18,behavior:'instant'});
        });
      }
    });
    nativeButton?.addEventListener('click',()=>{
      details.open=false;
      setVirtual(false); // Sin esperar al evento toggle: gesto directo de usuario.
      getInput()?.focus();
    });
  }
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
      // Si usamos el teclado integrado en móvil, no reabrir el teclado nativo.
      input.focus({preventScroll:true});
    });
    container.append(key);
  }
}
