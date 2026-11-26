import { studyFamilies, familyOrigins } from './study.mjs';

const byId = id => document.getElementById(id);
const search = byId('study-search');
const filter = byId('study-family');
const entries = byId('study-entries');
const count = byId('study-count');
const empty = byId('study-empty');
const latinI = new URLSearchParams(location.search).get('subject') === 'lat1';
if (latinI) {
  byId('module-context').textContent = 'Latín I · Formación de palabras';
  byId('practice-link').href = './index.html?subject=lat1';
  document.querySelector('.preverbial-modes [aria-current="page"]').href = './estudio.html?subject=lat1';
}

function el(tag, text, lang) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (lang) node.lang = lang;
  return node;
}

function originCard(origin) {
  const card = el('li');
  card.className = 'study-origin';
  const heading = el('h3');
  heading.append(el('i', origin.lemma, 'la'));
  if (origin.infinitive) heading.append(' · ', el('i', origin.infinitive, 'la'));
  card.append(heading);
  if (origin.prefix) {
    const formation = el('p');
    formation.append('Preverbio: ', el('i', origin.prefix + '-', 'la'));
    card.append(formation);
  }
  card.append(el('p', origin.meaning));
  if (!origin.derivatives.length) {
    card.append(el('p', 'Sin derivados recogidos en este banco.'));
    return card;
  }
  const list = el('ul');
  for (const [, wordClass, es, val] of origin.derivatives) {
    const item = el('li');
    item.append(el('strong', es, 'es'));
    if (val && val !== es) item.append(' / ', el('span', val, 'ca-valencia'));
    item.append(' · ' + wordClass);
    list.append(item);
  }
  card.append(list);
  return card;
}

function familyCard(base, family) {
  const details = el('details');
  details.className = 'practice-card study-family';
  const summary = el('summary');
  summary.append(el('i', family.entry, 'la'), el('span', ' — ' + family.meaning));
  const origins = el('ul');
  origins.className = 'study-origins';
  origins.append(...familyOrigins(base, family).map(originCard));
  details.append(summary, origins);
  return details;
}

for (const [base, family] of studyFamilies()) {
  const option = el('option', base + ' · ' + family.meaning);
  option.value = base;
  filter.append(option);
}

function render() {
  const matches = studyFamilies(search.value, filter.value);
  const reveal = Boolean(search.value.trim()) || filter.value !== 'all';
  entries.replaceChildren(...matches.map(([base, family]) => {
    const card = familyCard(base, family);
    card.open = reveal;
    return card;
  }));
  count.textContent = matches.length + (matches.length === 1 ? ' familia' : ' familias');
  empty.hidden = matches.length !== 0;
}
search.addEventListener('input', render);
filter.addEventListener('change', render);
byId('study-expand').addEventListener('click', () => {
  for (const card of entries.children) card.open = true;
});
byId('study-collapse').addEventListener('click', () => {
  for (const card of entries.children) card.open = false;
});
render();
