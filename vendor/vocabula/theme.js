(()=>{
'use strict';
const key='classics-theme',valid=['system','light','dark'],media=window.matchMedia('(prefers-color-scheme: dark)');
let preference='system';
try{const saved=localStorage.getItem(key);if(valid.includes(saved))preference=saved}catch{}
function apply(){
 const dark=preference==='dark'||(preference==='system'&&media.matches);
 document.documentElement.dataset.theme=dark?'dark':'light';
 const meta=document.querySelector('meta[name="theme-color"]');
 if(meta)meta.content=dark?'#101b18':'#f6f4ed';
 const select=document.getElementById('theme-select');
 if(select)select.value=preference;
}
apply();
document.addEventListener('DOMContentLoaded',()=>{
 apply();
 document.getElementById('theme-select').addEventListener('change',event=>{
  if(!valid.includes(event.target.value))return;
  preference=event.target.value;
  try{localStorage.setItem(key,preference)}catch{}
  apply();
 });
});
media.addEventListener('change',()=>{if(preference==='system')apply()});
window.addEventListener('storage',event=>{
 if(event.key===key){preference=valid.includes(event.newValue)?event.newValue:'system';apply()}
});
})();
