import { families, rounds } from './banco.mjs';
import { correctRound } from './corrector.mjs';

const practice = document.getElementById('practice');
const roundPicker = document.getElementById('round');
const roundSource = document.getElementById('round-source');
const form = document.getElementById('exercise');
const compoundFields = document.getElementById('compounds');
const wordFields = document.getElementById('derivatives');
const formStatus = document.getElementById('form-status');
const solution = document.getElementById('solution');
const result = document.getElementById('result');
const solutionContent = document.getElementById('solution-content');

function element(tag, text, lang) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (lang) node.lang = lang;
  return node;
}

function answerField(id, title, latin) {
  const field = element('div');
  field.className = 'answer';
  const label = element('label', title);
  label.htmlFor = id;
  const input = element('input', '', latin ? 'la' : undefined);
  input.type = 'text';
  input.id = id;
  input.maxLength = 60;
  input.spellcheck = false;
  input.setAttribute('autocapitalize', 'none');
  const feedback = element('p');
  feedback.className = 'feedback';
  feedback.id = id + '-feedback';
  feedback.hidden = true;
  const instructions = latin ? '' : 'word-instructions ';
  input.setAttribute('aria-describedby', instructions + feedback.id);
  field.append(label, input, feedback);
  return field;
}

function renderRound(focus = false) {
  const round = rounds[roundPicker.selectedIndex];
  formStatus.textContent = '';
  solution.hidden = true;
  solutionContent.replaceChildren();
  roundSource.hidden = !round.source;
  if (round.source) roundSource.href = round.source;

  compoundFields.replaceChildren(...round.prompts.map(({ form }, index) => {
    const group = element('fieldset');
    const legend = element('legend', 'Forma ' + (index + 1));
    legend.append(' · ', element('i', form, 'la'));
    const count = 3 - index;
    group.append(legend, element('p', count + ' verbos compuestos'));
    for (let position = 1; position <= count; position++) {
      group.append(answerField('compound-' + index + '-' + position, 'Compuesto ' + position, true));
    }
    return group;
  }));
  wordFields.replaceChildren(...Array.from({ length: 5 }, (_, index) =>
    answerField('word-' + index, 'Derivado ' + (index + 1), false)));
  if (focus) compoundFields.querySelector('input').focus();
}

function showFeedback(input, item, type) {
  const feedback = input.nextElementSibling;
  const messages = {
    empty: 'Sin respuesta.',
    duplicate: 'Ya cuenta una respuesta equivalente.',
    base: 'Es la base simple. Añade un preverbio.',
    origin: 'Deriva de ' + (item.entry?.[0] ?? '') + '. Incluye ese compuesto en tu respuesta.',
    class: 'Ya has usado un ' + (item.entry?.[1] ?? '') + ' de esta misma base.',
    unknown: 'Pendiente de revisar. La respuesta no figura en el banco para esta pregunta.',
  };
  feedback.replaceChildren();
  if (item.status !== 'correct') {
    feedback.textContent = messages[item.status];
  } else if (type === 'compound') {
    const [lemma, , prefix, meaning] = item.entry;
    feedback.append('✓ ', element('i', lemma, 'la'), ' · ', element('i', prefix + '-', 'la'), ' · ' + meaning + '.');
  } else {
    const [origin, wordClass] = item.entry;
    feedback.append('✓ ' + wordClass + ' de ', element('i', origin, 'la'), '.');
  }
  feedback.hidden = false;
}

function renderSolution(round) {
  const model = element('div');
  model.append(element('h3', 'Una solución posible'));
  const examples = element('ul');
  for (const prompt of round.prompts) {
    const family = families[prompt.base];
    const row = element('li');
    row.append(element('i', prompt.form + ' → ' + prompt.lemma + ' → ' + family.entry, 'la'),
      ' («' + family.meaning + '»). Compuestos: ', element('i', prompt.model.join(', '), 'la'), '.');
    examples.append(row);
  }
  model.append(examples);

  const exampleWords = correctRound(round, round.prompts.map(prompt => prompt.model), round.words).words;
  const words = element('ul');
  for (const [index, { entry }] of exampleWords.entries()) {
    const [origin, wordClass, es] = entry;
    const word = round.words[index];
    const row = element('li');
    row.append(element('strong', word, word === es ? 'es' : 'ca-valencia'),
      ' · ' + wordClass + ' de ', element('i', origin, 'la'));
    words.append(row);
  }
  model.append(words);

  for (const { base } of round.prompts) {
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
    model.append(details);
  }
  solutionContent.replaceChildren(model);
}

for (const { label } of rounds) roundPicker.append(element('option', label));
roundPicker.addEventListener('change', () => renderRound());
document.getElementById('retry').addEventListener('click', () => renderRound(true));
document.getElementById('next').addEventListener('click', () => {
  roundPicker.selectedIndex = (roundPicker.selectedIndex + 1) % rounds.length;
  renderRound(true);
});
form.addEventListener('submit', event => {
  event.preventDefault();
  const compounds = Array.from(compoundFields.children, group => [...group.querySelectorAll('input')]);
  const words = [...wordFields.querySelectorAll('input')];
  const answers = inputs => inputs.map(input => input.value);
  if (![...compounds.flat(), ...words].some(input => input.value.trim())) {
    formStatus.textContent = 'Escribe al menos una respuesta para corregir el ejercicio.';
    return;
  }
  formStatus.textContent = '';
  const round = rounds[roundPicker.selectedIndex];
  const correction = correctRound(round, compounds.map(answers), answers(words));
  compounds.forEach((group, index) =>
    group.forEach((input, position) => showFeedback(input, correction.compounds[index][position], 'compound')));
  words.forEach((input, index) => showFeedback(input, correction.words[index], 'word'));
  const score = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 1 }).format(correction.points / 10);
  result.textContent = 'Puntuación orientativa: ' + score + ' / 1';
  renderSolution(round);
  solution.hidden = false;
  result.focus();
});
form.addEventListener('input', () => {
  if (solution.hidden) {
    formStatus.textContent = '';
    return;
  }
  solution.hidden = true;
  for (const feedback of form.querySelectorAll('.feedback')) feedback.hidden = true;
  formStatus.textContent = 'Vuelve a corregir para ver el resultado actualizado.';
});

renderRound();
practice.hidden = false;
