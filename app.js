const app = document.querySelector('#app');
const primaryButton = document.querySelector('#primary-button');
const headerBackButton = document.querySelector('#header-back');
const formAlert = document.querySelector('#form-alert');

const state = {
  screen: 0,
  submitted: false,
  exemptionAnswers: Array(9).fill(''),
  activeExemption: -1,
  trips: [createTrip()],
  months: [],
  followUp: '',
  documentType: '',
  uploadMethod: '',
  uploadFile: null
};

const eligibleMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function createTrip() {
  return { condition: '', facility: '', accompanyingDependent: false, withinState: false, fromDate: '', toDate: '' };
}

function render() {
  const screens = [
    ...exemptionTypes.map((type, index) => () => renderExemptionTypeScreen(index)),
    renderTravelScreen,
    renderMonthsScreen,
    renderFollowUpScreen,
    renderNoExemptionScreen,
    renderDocumentUploadScreen,
    renderDocumentSuccessScreen
  ];
  screens[state.screen]();
  headerBackButton.hidden = state.screen === 0 || state.screen === 12 || state.screen === 14;
  primaryButton.textContent = getPrimaryActionLabel();
  clearAlert();
}

const exemptionTypes = [
  { title: 'Caregiver exemption 1', question: 'Was Christopher Johnson a caregiver for a disabled individual?' },
  { title: 'Caregiver exemption 2', question: 'Does the person you care for live with you or depend on you for regular support?' },
  { title: 'Medical Exemption', question: 'Do you meet the requirements for a medical exemption?' },
  { title: 'SNAP', question: 'Do you meet the requirements for a SNAP exemption?' },
  { title: 'TANF', question: 'Do you meet the requirements for a TANF exemption?' },
  { title: 'Veteran with disability', question: 'Do you meet the requirements for the veteran with disability exemption?' },
  { title: 'Correctional facility', question: 'Do you meet the requirements for the correctional facility exemption?' },
  { title: 'Medical hardship', question: 'Do you meet the requirements for a medical hardship exemption?' },
  { title: 'Travel for care', question: 'Did you travel out of your community for medical care for 2 or more nights?' }
];

function renderExemptionTypeScreen(index) {
  const exemption = exemptionTypes[index];
  app.innerHTML = `
    <p class="eyebrow">Work requirement exemption</p>
    <h2 class="screen-title">${exemption.title}</h2>
    <p class="intro">Answer each question to help us determine whether you may qualify for an exemption.</p>
    <div class="question-card" role="group" aria-labelledby="exemption-question-${index}">
      <p class="question-text" id="exemption-question-${index}">${exemption.question}</p>
      <div class="radio-group">
        <label class="radio-option"><input type="radio" name="exemption-answer" value="yes" ${state.exemptionAnswers[index] === 'yes' ? 'checked' : ''}><span>Yes</span></label>
        <label class="radio-option"><input type="radio" name="exemption-answer" value="no" ${state.exemptionAnswers[index] === 'no' ? 'checked' : ''}><span>No</span></label>
      </div>
    </div>`;
  document.querySelectorAll('[name="exemption-answer"]').forEach((radio) => radio.addEventListener('change', (event) => {
    state.exemptionAnswers[index] = event.target.value;
    primaryButton.textContent = getPrimaryActionLabel();
    clearAlert();
  }));
}

function renderTravelScreen() {
  app.innerHTML = `
    <p class="eyebrow">Work requirement exemption</p>
    <h2 class="screen-title">Travel for medical care</h2>
    <p class="intro">You can request a short-term hardship exemption for a household member if they have traveled out of their community for medical care for themselves or a dependent for 2 or more nights. We may require more information after your application.</p>
    <p class="member-prompt">Please enter the following information for Christopher Johnson</p>
    <div id="trip-list">${state.trips.map((trip, index) => tripTemplate(trip, index)).join('')}</div>
    <button class="add-trip" id="add-trip" type="button"><span aria-hidden="true">+</span> Add Another Trip</button>`;

  document.querySelector('#add-trip').addEventListener('click', () => {
    state.trips.push(createTrip());
    renderTravelScreen();
  });
  document.querySelectorAll('[data-trip-field]').forEach((field) => {
    field.addEventListener('input', updateTrip);
    field.addEventListener('change', updateTrip);
  });
  document.querySelectorAll('[data-remove-trip]').forEach((button) => button.addEventListener('click', removeTrip));
}

function tripTemplate(trip, index) {
  return `<article class="trip-card">
    <p class="trip-number">Trip ${index + 1}</p>
    <label class="field"><span class="field-label">What is the name of the medical condition that they traveled for? <span aria-hidden="true">*</span></span><input type="text" data-trip-field="condition" data-index="${index}" value="${escapeHtml(trip.condition)}" placeholder="Enter name of medical condition" autocomplete="off"></label>
    <label class="check-option"><input type="checkbox" data-trip-field="accompanyingDependent" data-index="${index}" ${trip.accompanyingDependent ? 'checked' : ''}><span>Travel was to accompany a dependent</span></label>
    <label class="field"><span class="field-label">What is the name of the hospital/treatment facility? <span aria-hidden="true">*</span></span><input type="text" data-trip-field="facility" data-index="${index}" value="${escapeHtml(trip.facility)}" placeholder="Enter name of hospital" autocomplete="organization"></label>
    <label class="check-option"><input type="checkbox" data-trip-field="withinState" data-index="${index}" ${trip.withinState ? 'checked' : ''}><span>Travel was within New York State</span></label>
    <fieldset class="date-range">
      <legend>When did they travel for care?</legend>
      <p class="helper">Valid dates are from June 2025 to November 2025.</p>
      <div class="date-fields">
        <label class="field"><span class="field-label">From <span aria-hidden="true">*</span></span><input type="date" data-trip-field="fromDate" data-index="${index}" value="${escapeHtml(trip.fromDate)}" min="2025-06-01" max="2025-11-30" aria-label="Trip ${index + 1} start date"></label>
        <label class="field"><span class="field-label">To <span aria-hidden="true">*</span></span><input type="date" data-trip-field="toDate" data-index="${index}" value="${escapeHtml(trip.toDate)}" min="2025-06-01" max="2025-11-30" aria-label="Trip ${index + 1} end date"></label>
      </div>
    </fieldset>
    ${index > 0 ? `<button class="remove-trip" data-remove-trip="${index}" type="button">Remove trip</button>` : ''}
  </article>`;
}

function renderMonthsScreen() {
  const dropdownWasOpen = document.querySelector('#month-dropdown')?.open ?? false;
  const exemptionTitle = exemptionTypes[state.activeExemption]?.title ?? 'this exemption';
  app.innerHTML = `
    <p class="eyebrow">Work requirement exemption</p>
    <h2 class="screen-title">Confirm months impacted</h2>
    <p class="intro">Select the months when ${exemptionTitle} affected your ability to meet work requirements.</p>
    <section class="question-card" aria-labelledby="months-heading">
      <h2 id="months-heading">Which months were impacted?</h2>
      <p class="months-note">Only months when you were eligible to enter work requirements are available to select.</p>
      <p class="field-label" id="month-label">Select impacted months</p>
      <details class="month-dropdown" id="month-dropdown" ${dropdownWasOpen ? 'open' : ''}>
        <summary aria-describedby="month-help">${state.months.length ? `${state.months.length} month${state.months.length === 1 ? '' : 's'} selected` : 'Choose months'}</summary>
        <div class="month-options" role="group" aria-labelledby="month-label">
          ${eligibleMonths.map((month) => `<label class="month-option"><input type="checkbox" value="${month}" ${state.months.includes(month) ? 'checked' : ''}><span>${month}</span></label>`).join('')}
        </div>
      </details>
      <p class="helper" id="month-help">Select one or more eligible months. You can remove a month below.</p>
      <div class="month-list" aria-label="Selected months">${state.months.map((month) => `<span class="month-chip selected">${month}<button type="button" data-remove-month="${month}" aria-label="Remove ${month}">&times;</button></span>`).join('')}</div>
    </section>`;
  document.querySelectorAll('.month-option input').forEach((checkbox) => checkbox.addEventListener('change', (event) => {
    if (event.target.checked && !state.months.includes(event.target.value)) state.months.push(event.target.value);
    if (!event.target.checked) state.months = state.months.filter((month) => month !== event.target.value);
    renderMonthsScreen();
    primaryButton.textContent = getPrimaryActionLabel();
    if (isScreenComplete()) clearAlert();
  }));
  document.querySelectorAll('[data-remove-month]').forEach((button) => button.addEventListener('click', () => {
    state.months = state.months.filter((month) => month !== button.dataset.removeMonth);
    renderMonthsScreen();
    primaryButton.textContent = getPrimaryActionLabel();
    if (isScreenComplete()) clearAlert();
  }));
}

function renderFollowUpScreen() {
  const isCaregiverOne = state.activeExemption === 0;
  const question = isCaregiverOne
    ? 'Is the individual being cared for related to this household member?'
    : 'Did this situation prevent you from meeting work requirements?';
  app.innerHTML = `
    <p class="eyebrow">Work requirement exemption</p>
    <h2 class="screen-title">Follow-up question</h2>
    <div class="question-card" role="group" aria-labelledby="follow-up-question">
      <p class="question-text" id="follow-up-question">${question}</p>
      <div class="radio-group">
        <label class="radio-option"><input type="radio" name="follow-up" value="yes" ${state.followUp === 'yes' ? 'checked' : ''}><span>Yes</span></label>
        <label class="radio-option"><input type="radio" name="follow-up" value="no" ${state.followUp === 'no' ? 'checked' : ''}><span>No</span></label>
      </div>
    </div>`;
  document.querySelectorAll('[name="follow-up"]').forEach((radio) => radio.addEventListener('change', (event) => {
    state.followUp = event.target.value;
    primaryButton.textContent = getPrimaryActionLabel();
    clearAlert();
  }));
}

function renderNoExemptionScreen() {
  app.innerHTML = `
    <p class="eyebrow">Work requirement exemption</p>
    <h2 class="screen-title">No exemption selected</h2>
    <p class="intro">No additional exemption types are available in this flow.</p>`;
}

const veteranDocumentTypes = [
  'VA disability benefits letter',
  'VA disability rating decision',
  'Medical documentation',
  'Other supporting document'
];

function renderDocumentUploadScreen() {
  app.innerHTML = `
    <p class="eyebrow">Veteran with disability</p>
    <h2 class="screen-title">Upload Supporting Document</h2>
    <div class="upload-info">
      <strong>Supporting documents required</strong>
      <p>Upload a document that verifies the veteran's disability status. The document should clearly show the member's name and relevant disability information.</p>
    </div>
    <label class="field upload-type-field"><span class="field-label">Type of document</span>
      <select id="document-type">
        <option value="">Select document type</option>
        ${veteranDocumentTypes.map((type) => `<option value="${type}" ${state.documentType === type ? 'selected' : ''}>${type}</option>`).join('')}
      </select>
    </label>
    <p class="field-label upload-label">How would you like to upload?</p>
    <div class="upload-options" role="radiogroup" aria-label="How would you like to upload?">
      <label class="upload-method"><input type="radio" name="upload-method" value="camera" ${state.uploadMethod === 'camera' ? 'checked' : ''}><span class="upload-method-icon icon-camera" aria-hidden="true"></span><span>Take a photo</span></label>
      <label class="upload-method"><input type="radio" name="upload-method" value="photo" ${state.uploadMethod === 'photo' ? 'checked' : ''}><span class="upload-method-icon icon-photo" aria-hidden="true"></span><span>Choose a photo</span></label>
      <label class="upload-method"><input type="radio" name="upload-method" value="file" ${state.uploadMethod === 'file' ? 'checked' : ''}><span class="upload-method-icon icon-file" aria-hidden="true"></span><span>Choose a file</span></label>
    </div>
    <input class="visually-hidden" id="document-file" type="file" accept="${state.uploadMethod === 'camera' || state.uploadMethod === 'photo' ? 'image/*' : '.pdf,.jpeg,.jpg,.png,.tif,.gif'}" ${state.uploadMethod === 'camera' ? 'capture="environment"' : ''}>
    ${state.uploadMethod ? `<button class="change-upload" id="choose-upload" type="button">${state.uploadFile ? 'Choose a different file' : 'Choose a file (optional)'}</button>` : ''}
    <p class="selected-file" id="selected-file" aria-live="polite">${state.uploadFile ? `Selected: ${escapeHtml(state.uploadFile.name)}` : ''}</p>
    <p class="upload-optional-note">For this demo, selecting a file is optional.</p>
    <div class="upload-privacy"><strong>We protect your private information</strong><p>This prototype keeps the selected file on this device only. It does not upload or store your document.</p></div>
    <section class="document-requirements" aria-labelledby="document-requirements-title">
      <h3 id="document-requirements-title">Document requirements</h3>
      <ul><li>Maximum file size: 50 MB</li><li>Accepted file types: .pdf, .jpeg, .jpg, .png, .tif, .gif</li></ul>
    </section>`;

  document.querySelector('#document-type').addEventListener('change', (event) => {
    state.documentType = event.target.value;
    clearAlert();
  });
  document.querySelectorAll('[name="upload-method"]').forEach((radio) => radio.addEventListener('change', (event) => {
    state.uploadMethod = event.target.value;
    renderDocumentUploadScreen();
  }));
  document.querySelector('#document-file').addEventListener('change', handleDocumentFile);
  document.querySelector('#choose-upload')?.addEventListener('click', () => document.querySelector('#document-file').click());
}

function handleDocumentFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const validType = /\.(pdf|jpe?g|png|tif|gif)$/i.test(file.name);
  if (file.size > 50 * 1024 * 1024) {
    state.uploadFile = null;
    showAlert('Choose a document that is 50 MB or smaller.');
  } else if (!validType) {
    state.uploadFile = null;
    showAlert('Choose a PDF, JPEG, JPG, PNG, TIF, or GIF file.');
  } else {
    state.uploadFile = file;
    clearAlert();
  }
  renderDocumentUploadScreen();
}

function renderDocumentSuccessScreen() {
  const confirmation = state.uploadFile
    ? `Your ${escapeHtml(state.documentType || 'supporting document')} has been received. You can now continue.`
    : 'Your document type and upload method have been recorded. No file was attached in this demo.';
  app.innerHTML = `
    <section class="upload-success" role="status" aria-live="polite">
      <span class="success-check" aria-hidden="true"></span>
      <h2 class="screen-title">Document submitted</h2>
      <p>${confirmation}</p>
    </section>`;
}

function updateTrip(event) {
  const index = Number(event.target.dataset.index);
  const { tripField } = event.target.dataset;
  state.trips[index][tripField] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
  clearAlert();
}

function removeTrip(event) {
  state.trips.splice(Number(event.target.dataset.removeTrip), 1);
  renderTravelScreen();
}

function isScreenComplete() {
  if (state.screen < 9) return Boolean(state.exemptionAnswers[state.screen]);
  if (state.screen === 9) return state.trips.length > 0 && state.trips.every(isTripComplete);
  if (state.screen === 10) return state.months.length > 0;
  if (state.screen === 11) return Boolean(state.followUp);
  if (state.screen === 13) return Boolean(state.documentType && state.uploadMethod);
  return state.screen === 12 || state.screen === 14;
}

function isSubmitState() {
  return (state.screen === 10 && state.activeExemption === 2 && state.months.length > 0) ||
    (state.screen === 11 && state.followUp === 'yes');
}

function getPrimaryActionLabel() {
  if (state.screen === 13) return 'Submit document';
  if (state.screen === 14) return state.activeExemption === 5 ? 'Back to account home' : 'Continue';
  if (state.submitted || state.screen === 12) return 'Back to account home';
  return isSubmitState() ? 'Submit' : 'Next';
}

function next() {
  if (state.submitted || state.screen === 12) {
    window.location.href = 'index.html?view=account-home';
    return;
  }
  if (!isScreenComplete()) {
    showAlert(incompleteMessage());
    return;
  }
  clearAlert();

  if (state.screen === 13) {
    state.screen = 14;
    render();
    return;
  }
  if (state.screen === 14) {
    if (state.activeExemption === 5) {
      window.location.href = 'index.html?view=account-home';
      return;
    }
    state.screen = 11;
    render();
    return;
  }

  if (isSubmitState()) {
    state.submitted = true;
    app.innerHTML = '<div class="complete-message"><h2 class="screen-title">Exemption submitted</h2><p>Please allow 7–10 days to process.</p></div>';
    headerBackButton.hidden = true;
    primaryButton.textContent = 'Back to account home';
    return;
  }

  if (state.screen < 9) {
    if (state.exemptionAnswers[state.screen] === 'yes') {
      state.activeExemption = state.screen;
      state.months = [];
      state.followUp = '';
      state.screen = state.activeExemption === 8 ? 9 : 10;
    } else {
      state.screen = state.screen === 8 ? 12 : state.screen + 1;
    }
    render();
    return;
  }

  if (state.screen === 9) {
    state.screen = state.activeExemption === 8 ? 11 : 10;
    render();
    return;
  }

  if (state.screen === 10) {
    state.screen = state.activeExemption === 5 ? 13 : 11;
    render();
    return;
  }

  if (state.screen === 11) {
    state.screen = state.activeExemption < 8 ? state.activeExemption + 1 : 12;
    state.followUp = '';
  }
  render();
}

function incompleteMessage() {
  if (state.screen === 13) return 'Select a document type and an upload method to continue.';
  if (state.screen < 9 || state.screen === 11) return 'Select Yes or No to continue.';
  if (state.screen === 9) return 'Complete the required trip information for each trip. Dates must be between June and November 2025, and the end date cannot be before the start date.';
  return 'Select at least one impacted month to continue.';
}

function isTripComplete(trip) {
  return Boolean(
    trip.condition.trim() &&
    trip.facility.trim() &&
    trip.fromDate &&
    trip.toDate &&
    trip.fromDate <= trip.toDate &&
    trip.fromDate >= '2025-06-01' &&
    trip.toDate <= '2025-11-30'
  );
}

function showAlert(message) {
  formAlert.textContent = message;
  formAlert.hidden = false;
}

function clearAlert() {
  formAlert.textContent = '';
  formAlert.hidden = true;
}

function back() {
  if (state.screen > 0) {
    if (state.screen < 9) {
      state.screen -= 1;
    } else if (state.screen === 9) {
      state.screen = 8;
    } else if (state.screen === 10) {
      state.screen = state.activeExemption === 8 ? 9 : state.activeExemption;
    } else if (state.screen === 11) {
      state.screen = state.activeExemption === 8 ? 9 : 10;
    } else if (state.screen === 13) {
      state.screen = 10;
    } else if (state.screen === 14) {
      state.screen = 13;
    }
    render();
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

primaryButton.addEventListener('click', next);
headerBackButton.addEventListener('click', back);

function renderAccountHome() {
  app.innerHTML = '<div class="account-home"><h2 class="screen-title">Account home</h2><p>You are back at your NY State of Health account.</p><a class="account-home-link" href="index.html?flow=exemption"><span>Work requirements</span><span class="account-home-arrow" aria-hidden="true">&#8250;</span></a></div>';
  document.querySelector('.app-footer').hidden = true;
  headerBackButton.hidden = true;
}

if (new URLSearchParams(window.location.search).get('view') === 'account-home') {
  renderAccountHome();
} else {
  render();
}