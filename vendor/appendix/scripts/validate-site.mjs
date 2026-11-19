import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const errors = [];
function fail(message) { errors.push(message); }
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function exists(file) { return fs.existsSync(path.join(root, file)); }

const required = [
  'index.html', 'curso.html', 'val/index.html', 'val/curso.html',
  'assets/style.css', 'assets/language-colors.css', 'assets/app.js',
  'assets/curriculum.json', 'val/app.js', 'val/curriculum.json',
  'assets/search-data.json', 'val/search-data.json'
];
for (const file of required) if (!exists(file)) fail('Falta archivo esencial: ' + file);

for (const file of ['assets/app.js', 'val/app.js', 'assets/theme.js']) {
  if (!exists(file)) continue;
  try { execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' }); }
  catch (e) { fail('Error de sintaxis JavaScript en ' + file + ': ' + (e.stderr?.toString() || e.message)); }
}

const curricula = {};
for (const [lang, file] of [['es', 'assets/curriculum.json'], ['val', 'val/curriculum.json']]) {
  if (!exists(file)) continue;
  try {
    const data = JSON.parse(read(file));
    curricula[lang] = data;
    for (const subject of ['latin', 'griego']) {
      if (!Array.isArray(data[subject]?.units) || !data[subject].units.length) {
        fail(file + ': faltan unidades para ' + subject);
        continue;
      }
      for (const [i, unit] of data[subject].units.entries()) {
        if (unit.number !== i + 1) fail(file + ': numeración no consecutiva en ' + subject);
        if (!Array.isArray(unit.topics) || !unit.topics.length) fail(file + ': unidad sin temas ' + subject + ' ' + unit.number);
        for (const topic of unit.topics || []) {
          if (typeof topic.title !== 'string' || !topic.title.trim()) fail(file + ': tema sin título');
          if (!(typeof topic.html === 'string' && topic.html.trim()) && !topic.source) {
            fail(file + ': tema sin contenido: ' + topic.title);
          }
        }
      }
    }
  } catch (e) { fail('JSON inválido en ' + file + ': ' + e.message); }
}

if (curricula.es && curricula.val) {
  for (const subject of ['latin', 'griego']) {
    const a = curricula.es[subject]?.units || [];
    const b = curricula.val[subject]?.units || [];
    if (a.length !== b.length) fail('Diferente número de unidades en ' + subject + ': ' + a.length + '/' + b.length);
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i].topics.length !== b[i].topics.length) {
        fail('Apartados desincronizados en ' + subject + ', unidad ' + (i + 1));
      }
    }
  }
}

function checkHTMLLinks(file) {
  const html = read(file);
  const re = /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;
  for (const match of html.matchAll(re)) {
    const url = match[1].replaceAll('&amp;', '&').trim();
    if (!url || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\?|\$\{)/i.test(url)) continue;
    const relative = url.split(/[?#]/)[0];
    if (!relative || relative.startsWith('/')) continue;
    const target = path.resolve(root, path.dirname(file), decodeURIComponent(relative));
    if (!target.startsWith(root + path.sep) && target !== root) {
      fail(file + ': referencia fuera del repositorio: ' + url);
    } else if (!fs.existsSync(target)) {
      fail(file + ': enlace o recurso inexistente: ' + url);
    }
  }
}
for (const file of ['index.html', 'curso.html', 'val/index.html', 'val/curso.html']) {
  if (exists(file)) checkHTMLLinks(file);
}


function checkDocumentedVocatives() {
  function findRow(html, marker, label) {
    const start = html.indexOf(marker);
    if (start < 0) return null;
    const fragment = html.slice(start);
    const pattern = new RegExp('<tr><th scope="row">' + label + '<\\/th>([\\s\\S]*?)<\\/tr>');
    return fragment.match(pattern)?.[1] ?? null;
  }
  function latin(html, file, label) {
    const row = findRow(html, '<caption>acer, acris, acre', label);
    if (!row) { fail(file + ': falta el vocativo de acer'); return; }
    const cells = [...row.matchAll(new RegExp('<td><i lang="la">([^<]+)</i></td>', 'g'))].map(m => m[1]);
    const expected = ['acer', 'acris', 'acre', 'acres', 'acres', 'acria'];
    if (JSON.stringify(cells) !== JSON.stringify(expected)) {
      fail(file + ': vocativo de acer incorrecto: ' + cells.join(', '));
    }
  }
  function greek(html, file, label) {
    const row = findRow(html, 'ἐλπίς, ἐλπίδος', '<strong>' + label + '</strong>');
    if (!row) { fail(file + ': falta el vocativo de ἐλπίς'); return; }
    const first = row.split('</td>')[0].replace(/^<td>/, '');
    if (first !== 'ἐλπί<sup>*</sup>') fail(file + ': vocativo singular de ἐλπίς incorrecto: ' + first);
    const explanation = label === 'Vocativo' ? '* Excepción:' : '* Excepció:';
    if (!html.includes('<strong>' + explanation + '</strong>') ||
        !html.includes('temas en –ιδ') && !html.includes('temes en –ιδ')) {
      fail(file + ': falta la explicación de los temas en -ιδ');
    }
    if (!row.includes('ἐλπίδ<strong>ες</strong>')) {
      fail(file + ': el vocativo plural de ἐλπίς se ha alterado');
    }
  }
  latin(read('adjetivos.html'), 'adjetivos.html', 'Vocativo');
  latin(read('val/adjetivos.html'), 'val/adjetivos.html', 'Vocatiu');
  greek(read('griego-sustantivos.html'), 'griego-sustantivos.html', 'Vocativo');
  greek(read('val/griego-sustantivos.html'), 'val/griego-sustantivos.html', 'Vocatiu');
  if (curricula.val) {
    const topic = curricula.val.latin.units.flatMap(u => u.topics).find(t => t.html?.includes('<caption>acer, acris, acre'));
    if (topic) latin(topic.html, 'val/curriculum.json', 'Vocatiu');
    else fail('val/curriculum.json: falta el paradigma de acer');
  }
  for (const [lang, file, label] of [['es', 'assets/curriculum.json', 'Vocativo'], ['val', 'val/curriculum.json', 'Vocatiu']]) {
    const topic = curricula[lang]?.griego?.units.flatMap(u => u.topics).find(t => t.html?.includes('ἐλπίς, ἐλπίδος'));
    if (topic) greek(topic.html, file, label);
    else fail(file + ': falta el paradigma de ἐλπίς');
  }
  for (const [file, label] of [['assets/search-data.json', 'Vocativo'], ['val/search-data.json', 'Vocatiu']]) {
    const data = JSON.parse(read(file));
    const entry = data.find(item => item.url === 'griego-sustantivos.html');
    if (!entry?.text.includes(label + ' ἐλπί* ἐλπίδ ες')) {
      fail(file + ': el índice de búsqueda no refleja ἐλπί');
    }
  }
  const valSearch = JSON.parse(read('val/search-data.json'));
  if (!valSearch.find(item => item.url === 'adjetivos.html')?.text.includes('Vocatiu acer acris acre')) {
    fail('val/search-data.json: el índice de búsqueda no refleja acer');
  }
}
if (required.every(exists)) checkDocumentedVocatives();


function checkLatinNexusIndex() {
  const profiles = [
    { prefix: '', search: 'assets/search-data.json', title: 'Subordinadas por nexo' },
    { prefix: 'val/', search: 'val/search-data.json', title: 'Subordinades per nexe' }
  ];
  let referenceNexuses = null;
  for (const profile of profiles) {
    const chapterFile = profile.prefix + 'subordinadas.html';
    const chapter = read(chapterFile);
    const index = read(profile.prefix + 'sintaxis.html');
    const guide = read(profile.prefix + 'conjunciones.html');
    const start = chapter.indexOf('<h2 id="por-nexo">');
    const end = chapter.indexOf('<h2 id="sustantivas">');
    if (start < 0 || end < start) { fail(chapterFile + ': falta la consulta por nexo'); continue; }
    const section = chapter.slice(start, end);
    if (!section.includes(profile.title)) fail(chapterFile + ': título de la consulta incorrecto');
    const nexuses = [...section.matchAll(/<tr><th scope="row">([\s\S]*?)<\/th>/g)]
      .map(match => match[1].replace(/<[^>]+>/g, '').trim());
    if (nexuses.length !== 15) fail(chapterFile + ': se esperaban 15 grupos de nexos');
    if (referenceNexuses !== null && JSON.stringify(referenceNexuses) !== JSON.stringify(nexuses)) {
      fail(chapterFile + ': nexos desincronizados respecto del castellano');
    }
    referenceNexuses = nexuses;
    for (const match of section.matchAll(/href="#([^"]+)"/g)) {
      if (!chapter.includes('id="' + match[1] + '"')) fail(chapterFile + ': falta el destino #' + match[1]);
    }
    for (const word of ['ut', 'ne', 'cum', 'nisi', 'quominus']) {
      if (!section.includes('<i lang="la">' + word + '</i>')) fail(chapterFile + ': falta la cursiva de ' + word);
    }
    if (!index.includes('href="subordinadas.html#por-nexo"')) {
      fail(profile.prefix + 'sintaxis.html: falta la tarjeta de nexos');
    }
    if (!guide.includes('href="subordinadas.html#por-nexo"')) {
      fail(profile.prefix + 'conjunciones.html: falta el enlace a la clasificación por nexos');
    }
    const search = JSON.parse(read(profile.search));
    const entry = search.find(item => item.url === 'subordinadas.html');
    if (!entry?.text.includes(profile.title)) fail(profile.search + ': falta indexar la consulta por nexo');
  }
}
if (required.every(exists)) checkLatinNexusIndex();


function checkConjunctionItalics() {
  const css = read('assets/style.css');
  if (!css.includes('.conjunction-card i[lang="la"]') ||
      !css.includes('.conjunction-guide i[lang="la"]') ||
      !css.includes('font-style: italic;')) {
    fail('Falta un estilo de cursiva visible para los nexos latinos de tarjeta y guía');
  }
  for (const prefix of ['', 'val/']) {
    const syntaxFile = prefix + 'sintaxis.html';
    const guideFile = prefix + 'conjunciones.html';
    const syntax = read(syntaxFile);
    const guide = read(guideFile);
    const card = syntax.match(/<a class="card conjunction-card" href="conjunciones\.html">([\s\S]*?)<\/a>/)?.[1];
    if (!card) { fail(syntaxFile + ': falta la tarjeta de conjunciones'); continue; }
    if (!guide.includes('<div class="article conjunction-guide">')) {
      fail(guideFile + ': falta aplicar el estilo de cursiva a la guía');
    }
    const lede = guide.match(/<p class="lede">([\s\S]*?)<\/p>/)?.[1] || '';
    for (const nexo of ['ut', 'cum', 'ne', 'quod', 'si', 'dum']) {
      const italics = '<i lang="la">' + nexo + '</i>';
      if (!card.includes(italics)) fail(syntaxFile + ': falta la cursiva de ' + nexo);
      if (!lede.includes(italics)) fail(guideFile + ': falta la cursiva introductoria de ' + nexo);
    }
    const article = guide.split('<article>')[1]?.split('</article>')[0] || '';
    const heads = [...article.matchAll(/<th scope="row">([\s\S]*?)<\/th>/g)].map(m => m[1]);
    if (heads.length !== 13) fail(guideFile + ': se esperaban 13 filas de nexos');
    for (const h of heads) {
      const rest = h.replace(/<i lang="la">[^<]*<\/i>/g, '').replace(/[\s,\/]/g, '');
      if (rest) fail(guideFile + ': nexo sin cursiva en cabecera: ' + rest);
    }
    for (const nexo of ['tam', 'tantus', 'talis', 'ut non', 'nisi', 'quia', 'qui', 'quæ']) {
      if (!article.includes('<i lang="la">' + nexo + '</i>')) fail(guideFile + ': falta la cursiva de ' + nexo);
    }
  }
}
if (required.every(exists)) checkConjunctionItalics();


function checkSubordinateTypography() {
  const css = read('assets/style.css');
  if (!css.includes('.subordinate-chapter i[lang="la"]') ||
      !css.includes('.subordinate-chapter .subordinate-item')) {
    fail('Faltan estilos para las cursivas y los guiones de subordinadas');
  }
  for (const prefix of ['', 'val/']) {
    const file = prefix + 'subordinadas.html';
    const html = read(file);
    if (!html.includes('<div class="article subordinate-chapter">')) {
      fail(file + ': falta la clase de sintaxis');
    }
    const paragraphTypes = [...html.matchAll(/<p id="([^"]+)" class="subordinate-type"><strong>– ([^<]+)<\/strong>/g)];
    const expected = ['temporales', 'modales', 'causales', 'finales', 'consecutivas', 'concesivas', 'condicionales'];
    if (JSON.stringify(paragraphTypes.map(m => m[1])) !== JSON.stringify(expected)) {
      fail(file + ': falta un subtipo adverbial o su guion');
    }
    const subtypeCount = (html.match(/class="subordinate-item">– /g) || []).length;
    if (subtypeCount !== 22) fail(file + ': se esperaban 22 guiones de subtipos, hay ' + subtypeCount);
    for (const latin of [
      'si habeo… do',
      'si habeam / habuerim… dem',
      'si haberem… darem / si habuissem… dedissem',
      'erras si id credis',
      'si civem meum in servitutem videam, nequiquam Capitolium servaverim',
      'si equus esses, esses indomabilis'
    ]) {
      if (!html.includes('<i lang="la">' + latin + '</i>')) {
        fail(file + ': falta la cursiva de la oración o fórmula ' + latin);
      }
    }
    const start = html.indexOf('<h2 id="sustantivas">');
    const end = html.indexOf('<div class="related">', start);
    const article = html.slice(start, end);
    for (const p of article.matchAll(/<p[^>]*>[\s\S]*?<\/p>/g)) {
      if (/Ejemplo:|Exemple:/.test(p[0]) && !p[0].includes('<i lang="la">') && !/(?:Ejemplo|Exemple):<\/p>$/.test(p[0])) {
        fail(file + ': ejemplo sin cursiva: ' + p[0].slice(0, 80));
      }
    }
  }
}
if (required.every(exists)) checkSubordinateTypography();

if (errors.length) {
  console.error('Validación fallida (' + errors.length + ' error/es):');
  for (const error of errors) console.error(' - ' + error);
  process.exit(1);
}
console.log('OK: JavaScript, JSON, estructura ES/VAL, enlaces de acceso y recursos principales.');
