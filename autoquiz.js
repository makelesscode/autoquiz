const DEFINITION_SEPARATOR = / [-–—―] /i;
const TEST_OPTIONS_AMOUNT = 4;

const NO_DEFINITIONS_FOUND_MESSAGE = 'В тексте не найдено определений.';
const MIN_DEFINITIONS_THRESHOLD_NOT_REACHED_MESSAGE = `Количество определений в тексте должно быть не менее ${TEST_OPTIONS_AMOUNT}.`;

let currentQuestionIndex = 0;
let currentDefinitionIndex = -1;
let showAsTest = false;
let definitions = [];

let usedDefinitionIndices = [];
let correctlyGuessedDefinitionIndices = [];
let currentCorrectTestOption = 0;
/**
 * 
 * @param {String} text A string to get definitions from
 */
function getDefinitionsFromText(text) {
  const definitions = text.split('\n')
    .map((line) => line.trim())
    .filter((line) => !!line)
    .map((line) => {
      const definition = line.split(DEFINITION_SEPARATOR);
      if (!definition[1]) {
        return null;
      }
      return {
        title: makeFirstLetterLowercased(definition[0].trim()),
        description: definition[1].trim()
      };
  });

  return definitions.filter((definition) => definition !== null);
}

function getRandomIntInRange(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function getRandomBool() {
  return Math.random() >= 0.5;
}

function getRandomDefinitionIndex() {
  return getRandomIntInRange(0, definitions.length - 1);
}

function getRandomUnusedDefinitionIndex() {
  const searchedArrayIndex = getRandomIntInRange(0, definitions.length - usedDefinitionIndices.length - 1);

  for (let i = 0, unusedIndex = -1; unusedIndex <= searchedArrayIndex; i += 1) {
    if (!usedDefinitionIndices.includes(i)) {
      unusedIndex += 1;
      if (unusedIndex === searchedArrayIndex) {
        return i;
      }
    }
  }

  return null;
}
/**
 * 
 * @param {String} str
 * @returns {String}
 */
function makeFirstLetterLowercased(str) {
  return str.charAt(0).toLowerCase() + str.substring(1);
}

function handleFormSubmit(evt) {
  evt.preventDefault();
  initQuizBody();
}

function initQuizBody() {
  showAsTest = document.getElementById('quiz-form-test').checked;
  const textarea = document.getElementById('quiz-form-textarea');
  definitions = getDefinitionsFromText(textarea.value);

  if (!definitions.length) {
    textarea.setCustomValidity(NO_DEFINITIONS_FOUND_MESSAGE);
    textarea.reportValidity();
    return;
  }

  if (showAsTest && definitions.length < TEST_OPTIONS_AMOUNT) {
    textarea.setCustomValidity(MIN_DEFINITIONS_THRESHOLD_NOT_REACHED_MESSAGE);
    textarea.reportValidity();
    return;
  }
  document.getElementById('quiz-form-wrapper').hidden = true;
  document.getElementById('quiz-body').hidden = false;
  currentQuestionIndex = 0;
  usedDefinitionIndices = [];
  correctlyGuessedDefinitionIndices = [];

  document.getElementById('quiz-body-total').innerHTML = definitions.length;

  document.getElementById('quiz-body-test-options').hidden = !showAsTest;

  displayCurrentQuestion();
}

function displayCurrentQuestion() {
  currentDefinitionIndex = getRandomUnusedDefinitionIndex();
  const currentDefinition = definitions[currentDefinitionIndex];
  document.getElementById('quiz-body-current').innerHTML = currentQuestionIndex + 1;
  const askDescription = getRandomBool();

  document.getElementById('quiz-body-text').innerHTML = !askDescription
    ? `... - ${currentDefinition.description}`
    : `Что такое "${currentDefinition.title}"?`;

  document.getElementById('quiz-body-correct-answer').hidden = true;
  document.getElementById('quiz-body-correct-answer-trigger').hidden = showAsTest;
  document.getElementById('quiz-body-accept').hidden = !showAsTest;
  document.getElementById('quiz-body-next').hidden = showAsTest;
  document.getElementById('quiz-body-accept').disabled = true;

  if (showAsTest) {
    const testOptionsContainer = document.getElementById('quiz-body-test-options');
    testOptionsContainer.innerHTML = '';
    const testOptions = generateTestOptions(askDescription, currentDefinitionIndex);
    testOptions.forEach((option) => testOptionsContainer.appendChild(option));
  }
}

function showCorrectAnswer() {
  const correctAnswerContaniner = document.getElementById('quiz-body-correct-answer');
  const definition = definitions[currentDefinitionIndex];
  document.getElementById('quiz-body-correct-answer-trigger').hidden = true;
  correctAnswerContaniner.hidden = false;
  correctAnswerContaniner.innerHTML = `<strong>${definition.title}</strong> &mdash; ${definition.description}`;
}

function checkAnswer() {
  const options = document.getElementById('quiz-body-test-options').children;
  let chosenOption = -1;

  for (let i = 0; i < options.length; i += 1) {
    const checkbox = options[i].querySelector('input');
    checkbox.disabled = true;
    if (checkbox.checked) {
      chosenOption = i;
    }
  }

  options.item(currentCorrectTestOption).classList.add('valid');
  if (currentCorrectTestOption !== chosenOption) {
    options[chosenOption].classList.add('invalid');
  } else {
    correctlyGuessedDefinitionIndices.push(currentDefinitionIndex);
  }

  document.getElementById('quiz-body-accept').hidden = true;
  document.getElementById('quiz-body-next').hidden = false;
}

function goToNextQuestion() {
  currentQuestionIndex += 1;
  usedDefinitionIndices.push(currentDefinitionIndex);
  if (currentQuestionIndex >= definitions.length) {
    showResults();
  } else {
    displayCurrentQuestion();
  }
}

function generateTestOptions(useDescriptions, currentDefinitionIndex) {
  currentCorrectTestOption = getRandomIntInRange(0, TEST_OPTIONS_AMOUNT - 1);
  const usedDefinitions = [currentDefinitionIndex];
  const answers = new Array(TEST_OPTIONS_AMOUNT);
  const currentDefinition = definitions[currentDefinitionIndex];
  answers[currentCorrectTestOption] = generateTestOptionMarkup(
    useDescriptions ? currentDefinition.description : currentDefinition.title
  );

  let currentOptionIndex = 0;

  while (currentOptionIndex < TEST_OPTIONS_AMOUNT) {
    if (currentOptionIndex === currentCorrectTestOption) {
      currentOptionIndex += 1;
      continue;
    }
    const randomDefIndex = getRandomDefinitionIndex();

    if (!usedDefinitions.includes(randomDefIndex)) {
      const definition = definitions[randomDefIndex];
      answers[currentOptionIndex] = generateTestOptionMarkup(
        useDescriptions ? definition.description : definition.title
      );
      currentOptionIndex += 1;
      usedDefinitions.push(randomDefIndex);
    }
  }

  return answers;
}

function generateTestOptionMarkup(text) {
  const node = document.getElementById('quiz-template-test-option').content.cloneNode(true);

  node.querySelector('span').innerHTML = text;
  node.querySelector('input').addEventListener('change', enableCheckButton);

  return node;
}

function showResults() {
  document.getElementById('quiz-body').hidden = true;
  document.getElementById('quiz-results').hidden = false;
  document.getElementById('quiz-test-results-correct').innerHTML = correctlyGuessedDefinitionIndices.length;
  document.getElementById('quiz-test-results-total').innerHTML = definitions.length;
  document.getElementById('quiz-test-results-success-rate').innerHTML = Math.round(correctlyGuessedDefinitionIndices.length / definitions.length * 100);
  document.getElementById('quiz-results-test').hidden = !showAsTest;
  document.getElementById('quiz-results-questionnaire').hidden = showAsTest;
}

function retry() {
  const textarea = document.getElementById('quiz-form-textarea');
  document.getElementById('quiz-body').hidden = true;
  document.getElementById('quiz-results').hidden = true;
  document.getElementById('quiz-form-wrapper').hidden = false;
  document.getElementById('quiz-form-test').checked = false;
  textarea.value = '';
  textarea.focus();
}

function enableCheckButton() {
  document.getElementById('quiz-body-accept').disabled = false;
}

function clearTextareaValidity() {
  const textarea = document.getElementById('quiz-form-textarea');
  textarea.setCustomValidity('');
  textarea.reportValidity();
}

function init() {
  document.getElementById('quiz-form').addEventListener('submit', handleFormSubmit);
  document.getElementById('quiz-body-correct-answer-trigger').addEventListener('click', showCorrectAnswer);
  document.getElementById('quiz-body-accept').addEventListener('click', checkAnswer);
  document.getElementById('quiz-body-next').addEventListener('click', goToNextQuestion);
  document.getElementById('quiz-retry').addEventListener('click', retry);
  document.getElementById('quiz-body-retry').addEventListener('click', retry);
  document.getElementById('quiz-form-textarea').addEventListener('input', clearTextareaValidity);
}

window.addEventListener('DOMContentLoaded', init);