import { families, rounds } from './banco.mjs';
import { checkBase, correctRound } from './corrector.mjs';

const byId = id => document.getElementById(id);
const practice = byId('practice');
const form = byId('exercise');
const roundPicker = byId('round');
const roundSource = byId('round-source');
const bases = byId('bases');
const compounds = byId('compounds');
const derivatives = byId('derivatives');
const wordContext = byId('word-context');
const baseStatus = byId('base-status');
const submit = byId('submit-stage');
const previous = byId('previous');
const showBases = byId('show-bases');
const solution = byId('solution');
const result = byId('result');
const resultSummary = byId('result-summary');
const solutionContent = byId('solution-content');
const panels = [...form.querySelectorAll(':scope > section')];
const steps = [...practice.querySelectorAll('.stages li')];
const actions = ['Comprobar bases', 'Ir a derivados', 'Corregir ejercicio'];
const numberFormat = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 1 });
const isLatinI = new URLSearchParams(location.search).get('subject') === 'lat1';

let round;
let phase;
let baseChecks;
const consulted = new Set();

function element(tag, text, lang) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (lang) node.lang = lang;
  return node;
}

function answerField(id, title, language, instructions) {
  const field = element('div');
  field.className = 'answer';
  const label = element('label', title);
  label.htmlFor = id;
  const input = element('input', '', language);
  input.type = 'text';
  input.id = id;
  input.maxLength = 60;
  input.spellcheck = false;
  input.setAttribute('autocapitalize', 'none');
  input.setAttribute('aria-describedby', instructions);
  field.append(label, input);
  return field;
}

function baseField({ form: given }, index) {
  const field = answerField('base-' + index, 'Base simple', 'la', 'base-instructions base-feedback-' + index);
  field.classList.add('base-field');
  const prompt = element('span', given, 'la');
  prompt.className = 'latin-form';
  const label = field.querySelector('label');
  const name = element('span', ' de ');
  name.className = 'visually-hidden';
  name.append(element('span', given, 'la'));
  label.append(name);
  prompt.setAttribute('aria-hidden', 'true');
  field.prepend(prompt);
  const feedback = element('p');
  feedback.id = 'base-feedback-' + index;
  feedback.className = 'field-feedback';
  feedback.hidden = true;
  field.append(feedback);
  return field;
}

function compoundFields({ base }, index) {
  const group = element('fieldset');
  const legend = element('legend');
  const lemma = element('span', base, 'la');
  lemma.className = 'latin-form';
  const count = 3 - index;
  legend.append(lemma, element('span', count + ' compuestos'));
  const fields = element('div');
  fields.className = 'field-grid';
  for (let position = 1; position <= count; position++) {
    fields.append(answerField('compound-' + index + '-' + position, 'Compuesto ' + position, 'la', 'compound-instructions'));
  }
  group.append(legend, fields);
  return group;
}

function setPhase(next, focus = true) {
  phase = next;
  panels.forEach((panel, i) => { panel.hidden = i !== phase; });
  steps.forEach((step, i) => {
    step.classList.toggle('is-complete', i < phase);
    if (i === phase) step.setAttribute('aria-current', 'step');
    else step.removeAttribute('aria-current');
  });
  form.hidden = phase === 3;
  solution.hidden = phase !== 3;
  submit.textContent = actions[phase] ?? '';
  previous.hidden = phase < 1;
  showBases.hidden = phase !== 0 || !baseChecks.some(check => check.status !== 'correct' && check.status !== 'empty');
  if (focus) (phase === 3 ? result : panels[phase].querySelector('h2')).focus();
}

function renderRound(focus = false) {
  round = rounds[roundPicker.selectedIndex];
  consulted.clear();
  baseChecks = [];
  baseStatus.textContent = '';
  solutionContent.replaceChildren();
  roundSource.hidden = !round.source;
  if (round.source) roundSource.href = round.source;
  bases.replaceChildren(...round.prompts.map(baseField));
  compounds.replaceChildren(...round.prompts.map(compoundFields));
  derivatives.replaceChildren(...Array.from({ length: 5 }, (_, index) =>
    answerField('word-' + index, 'Derivado ' + (index + 1), undefined, 'word-instructions')));
  setPhase(0, focus);
}

const baseMessages = {
  correct: '✓ Base correcta',
  empty: 'Escribe la base simple.',
  infinitive: 'Pásalo a la 1.ª persona del singular.',
  inflected: 'Es el verbo simple. Escríbelo en la 1.ª persona del singular del presente.',
  compound: 'Quita el preverbio y escribe la base en 1.ª persona.',
  unknown: 'Revisa la base del verbo.',
};

function verifyBases() {
  baseChecks = round.prompts.map((prompt, i) => {
    const answer = byId('base-' + i).value;
    const status = checkBase(prompt, answer);
    const feedback = byId('base-feedback-' + i);
    feedback.textContent = baseMessages[status];
    feedback.classList.toggle('correct', status === 'correct');
    feedback.hidden = false;
    if (status === 'correct') byId('base-' + i).removeAttribute('aria-invalid');
    else byId('base-' + i).setAttribute('aria-invalid', 'true');
    return { answer, status };
  });
}

function enteredCompounds() {
  return Array.from(compounds.children, group =>
    Array.from(group.querySelectorAll('input'), input => input.value.trim()));
}

function renderWordContext() {
  const answers = enteredCompounds();
  wordContext.replaceChildren(...round.prompts.map(({ base }, i) => {
    const row = element('p');
    row.append(element('strong', base, 'la'));
    const proposed = answers[i].filter(Boolean).join(', ');
    if (proposed) row.append(' · ', element('span', proposed, 'la'));
    return row;
  }));
}

function reviewFeedback(item, latin) {
  const detail = element('span');
  if (item.status === 'correct') {
    detail.className = 'correct';
    if (latin) {
      const [, , prefix, meaning] = item.entry;
      detail.append('✓ ', element('i', prefix + '-', 'la'), ' · ' + meaning);
    } else {
      const [origin, wordClass] = item.entry;
      detail.append('✓ ' + wordClass + ' de ', element('i', origin, 'la'));
    }
    return detail;
  }
  detail.className = 'needs-review';
  const messages = {
    empty: 'Sin respuesta',
    duplicate: 'Respuesta equivalente ya usada',
    base: 'Base simple · añade un preverbio',
    origin: 'Requiere el compuesto ' + (item.entry?.[0] ?? ''),
    class: 'Clase repetida para la misma base',
    unknown: 'Pendiente de revisar en el diccionario',
  };
  detail.textContent = messages[item.status];
  return detail;
}

function reviewList(title, answers, checks, latin = false) {
  const group = element('div');
  group.append(element('h3', title));
  const list = element('ul');
  list.className = 'answer-review';
  answers.forEach((answer, i) => {
    const row = element('li');
    row.append(element('strong', answer.trim() || '—', latin ? 'la' : undefined), reviewFeedback(checks[i], latin));
    list.append(row);
  });
  group.append(list);
  return group;
}

function baseAnalysis({ form, lemma, base }) {
  const forms = lemma === base ? [form, base] : [form, lemma, base];
  return element('strong', forms.join(' → '), 'la');
}

function reviewBases() {
  const group = element('div');
  group.append(element('h3', 'Bases simples'));
  const list = element('ul');
  list.className = 'answer-review';
  round.prompts.forEach((prompt, i) => {
    const { answer } = baseChecks[i];
    const row = element('li');
    const feedback = element('span');
    if (consulted.has(i)) {
      feedback.className = 'needs-review';
      feedback.append('Base consultada.');
      if (answer.trim()) feedback.append(' Escribiste ', element('i', answer.trim(), 'la'), '.');
      else feedback.append(' Sin respuesta.');
    } else {
      feedback.className = 'correct';
      feedback.textContent = '✓ Identificada sin ayuda';
    }
    row.append(baseAnalysis(prompt), feedback);
    list.append(row);
  });
  group.append(list);
  return group;
}

function renderModel() {
  const model = element('details');
  model.append(element('summary', 'Una solución posible'));
  const examples = element('ul');
  for (const prompt of round.prompts) {
    const { base, model: examplesForBase } = prompt;
    const row = element('li');
    row.append(baseAnalysis(prompt), ' («' + families[base].meaning + '»). ',
      'Compuestos como ', element('i', examplesForBase.join(', '), 'la'), '.');
    examples.append(row);
  }
  model.append(examples);
  const exampleWords = correctRound(round, round.prompts.map(prompt => prompt.model), round.words).words;
  const words = element('ul');
  for (const [index, { entry: [origin, wordClass, es] }] of exampleWords.entries()) {
    const word = round.words[index];
    const row = element('li');
    row.append(element('strong', word, word === es ? 'es' : 'ca-valencia'),
      ' · ' + wordClass + ' de ', element('i', origin, 'la'));
    words.append(row);
  }
  model.append(words);
  return model;
}

function familyDetails(base) {
  const family = families[base];
  const details = element('details');
  details.append(element('summary', 'Consultar la familia de ' + base));
  const list = element('ul');
  for (const [lemma, infinitive, prefix, gloss] of [[base], ...family.compounds]) {
    const row = element('li');
    row.append(element('i', lemma, 'la'));
    if (infinitive) row.append(' (', element('i', infinitive, 'la'), ') · ',
      element('i', prefix + '-', 'la'), ' · ' + gloss);
    const words = family.derivatives.filter(([origin]) => origin === lemma);
    if (words.length) {
      const derivatives = element('ul');
      for (const [, wordClass, es, val] of words) {
        const item = element('li');
        item.append(element('span', es, 'es'));
        if (val && val !== es) item.append(' / ', element('span', val, 'ca-valencia'));
        item.append(' (' + wordClass + ')');
        derivatives.append(item);
      }
      row.append(derivatives);
    }
    list.append(row);
  }
  details.append(list);
  return details;
}

function showResult() {
  const compoundAnswers = enteredCompounds();
  const wordAnswers = Array.from(derivatives.querySelectorAll('input'), input => input.value);
  const correction = correctRound(round, compoundAnswers, wordAnswers);
  const identified = baseChecks.filter(({ status }, i) => status === 'correct' && !consulted.has(i)).length;
  const compoundChecks = correction.compounds.flat();
  const wordPoints = correction.words.filter(({ status }) => status === 'correct').length;
  result.textContent = 'Puntuación orientativa · ' + numberFormat.format(correction.points / 10) + ' / 1';
  byId('compound-score').textContent = (correction.points - wordPoints) + ' de ' + compoundChecks.length;
  byId('word-score').textContent = wordPoints + ' de ' + correction.words.length;
  resultSummary.textContent = identified + ' de ' + round.prompts.length + ' bases identificadas sin ayuda. ' +
    'Cada compuesto o derivado acertado suma 0,1 puntos.';

  const review = element('details');
  review.open = correction.points < compoundChecks.length + correction.words.length || identified < round.prompts.length;
  review.append(element('summary', 'Revisar mis respuestas'), reviewBases());
  for (const [i, { base }] of round.prompts.entries()) {
    review.append(reviewList('Compuestos de ' + base, compoundAnswers[i], correction.compounds[i], true));
  }
  review.append(reviewList('Derivados', wordAnswers, correction.words));
  solutionContent.replaceChildren(review, renderModel(), ...round.prompts.map(({ base }) => familyDetails(base)));
  setPhase(3);
}

for (const { label } of rounds) roundPicker.append(element('option', label));
if (isLatinI) {
  byId('study-link').href = './estudio.html?subject=lat1';
  byId('practice-mode-link').href = './index.html?subject=lat1';
  byId('module-context').textContent = 'Latín I · Formación de palabras';
  roundPicker.selectedIndex = rounds.findIndex(({ source }) => !source);
}
roundPicker.addEventListener('change', () => renderRound());
byId('edit').addEventListener('click', () => setPhase(1));
byId('retry').addEventListener('click', () => renderRound(true));
byId('next').addEventListener('click', () => {
  roundPicker.selectedIndex = (roundPicker.selectedIndex + 1) % rounds.length;
  renderRound(true);
});
previous.addEventListener('click', () => setPhase(phase - 1));
showBases.addEventListener('click', () => {
  verifyBases();
  baseChecks.forEach(({ status }, i) => {
    if (status !== 'correct') consulted.add(i);
  });
  setPhase(1);
});
bases.addEventListener('input', ({ target }) => {
  target.removeAttribute('aria-invalid');
  target.nextElementSibling.hidden = true;
  baseStatus.textContent = '';
});
form.addEventListener('submit', event => {
  event.preventDefault();
  if (phase === 0) {
    verifyBases();
    if (baseChecks.every(({ status }) => status === 'correct')) {
      baseStatus.textContent = '';
      setPhase(1);
      return;
    }
    baseStatus.textContent = 'Revisa las bases marcadas.';
    setPhase(0, false);
    bases.querySelector('[aria-invalid="true"]').focus();
  } else if (phase === 1) {
    renderWordContext();
    setPhase(2);
  } else if (phase === 2) {
    showResult();
  }
});

renderRound();
practice.hidden = false;
