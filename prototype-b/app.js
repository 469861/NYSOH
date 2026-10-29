const app = document.querySelector('#app');
const primaryButton = document.querySelector('#primary-button');
const headerBackButton = document.querySelector('#header-back');
const headerCloseButton = document.querySelector('#header-close');

const state = {
  screen: 0,
  submitted: false,
  exemptionAnswers: Array(9).fill(''),
  activeExemption: -1,
  educationAnswer: '',
  trips: [createTrip()],
  followUp: '',
  caregiver1FollowUps: { related: '', livesWith: '' },
  caregiver2FollowUps: { related: '', livesWith: '' },
  documentType: '',
  uploadMethod: '',
  uploadFile: null
};

const newYorkCounties = ['Albany', 'Allegany', 'Bronx', 'Broome', 'Cattaraugus', 'Cayuga', 'Chautauqua', 'Chemung', 'Chenango', 'Clinton', 'Columbia', 'Cortland', 'Delaware', 'Dutchess', 'Erie', 'Essex', 'Franklin', 'Fulton', 'Genesee', 'Greene', 'Hamilton', 'Herkimer', 'Jefferson', 'Kings', 'Lewis', 'Livingston', 'Madison', 'Monroe', 'Montgomery', 'Nassau', 'New York', 'Niagara', 'Oneida', 'Onondaga', 'Ontario', 'Orange', 'Orleans', 'Oswego', 'Otsego', 'Putnam', 'Queens', 'Rensselaer', 'Richmond', 'Rockland', 'St. Lawrence', 'Saratoga', 'Schenectady', 'Schoharie', 'Schuyler', 'Seneca', 'Steuben', 'Suffolk', 'Sullivan', 'Tioga', 'Tompkins', 'Ulster', 'Warren', 'Washington', 'Wayne', 'Westchester', 'Wyoming', 'Yates'];

function createTrip() {
  return { condition: '', facility: '', accompanyingDependent: false, dependentMember: '', dependentName: '', withinState: false, facilityZip: '', facilityCounty: '', fromDate: '', toDate: '' };
}

function render() {
  const screens = [
    ...exemptionTypes.map((type, index) => () => renderExemptionTypeScreen(index)),
    renderTravelScreen,
    renderFollowUpScreen,
    renderNoExemptionScreen,
    renderDocumentUploadScreen,
    renderDocumentSuccessScreen,
    renderCaregiverOneFollowUps,
    renderEducationExemptionScreen,
    renderCaregiverTwoFollowUps
  ];
  screens[state.screen]();
  headerBackButton.hidden = state.screen === 11 || state.screen === 13;
  primaryButton.textContent = getPrimaryActionLabel();
  clearAlert();
}

const exemptionTypes = [
  { title: 'Caregiver exemption 1', question: 'Was Christopher Johnson a caregiver for a disabled individual during December 2026?' },
  { title: 'Caregiver exemption 2', question: 'Was Christopher Johnson a caregiver for a child under 14 during December 2026?' },
  {
    title: 'Medical hardship',
    question: 'Has a physician determined that Christopher Johnson has a medical condition that keeps him from his usual activities (for example: working, attending school, volunteering, participating in training, or completing other community engagement)?',
    description: 'A medical condition may include a physical, mental, or emotional condition; intellectual or developmental disability; or substance use disorder that makes it difficult to perform day-to-day activities, such as:',
    examples: [
      'Determined to be blind or disabled',
      'Diagnosed with a substance use disorder',
      'Diagnosed with a mental health condition',
      'Diagnosed with a physical, intellectual, or developmental disability that significantly impairs the ability to perform activities of daily living',
      'Diagnosed with a substance use disorder and either not in recovery or in recovery for less than 5 years',
      'Diagnosed with a serious or complex medical condition'
    ]
  },
  { title: 'SNAP', question: 'Do you meet the requirements for a SNAP exemption?' },
  { title: 'TANF', question: 'Do you meet the requirements for a TANF exemption?' },
  { title: 'Veteran with disability', question: 'Do you meet the requirements for the veteran with disability exemption?' },
  { title: 'Correctional facility', question: 'Do you meet the requirements for the correctional facility exemption?' },
  { title: 'Medical hardship', question: 'Do you meet the requirements for a medical hardship exemption?' },
  { title: 'Travel for medical care', question: 'Did you travel out of your community for medical care for 2 or more nights?' }
];

function renderYesNoGroup(name, label, selectedValue) {
  const safeName = escapeHtml(name);
  const safeLabel = escapeHtml(label);
  const safeValue = escapeHtml(selectedValue || '');
  if (customElements.get('mms-radio-group')) {
    return `<mms-radio-group data-response-name="${safeName}" name="${safeName}" label="${safeLabel}" value="${safeValue}" color-scheme="primary" orientation="horizontal" size="md" required><mms-radio label="Yes" value="yes"></mms-radio><mms-radio label="No" value="no"></mms-radio></mms-radio-group>`;
  }
  return `<div class="radio-response" data-response-name="${safeName}" role="group" aria-label="${safeLabel}"><p class="question-text">${safeLabel}</p><div class="radio-group"><label class="radio-option"><input type="radio" name="${safeName}" value="yes" ${selectedValue === 'yes' ? 'checked' : ''}><span>Yes</span></label><label class="radio-option"><input type="radio" name="${safeName}" value="no" ${selectedValue === 'no' ? 'checked' : ''}><span>No</span></label></div></div>`;
}

function bindYesNoGroup(name, onChange) {
  const group = app.querySelector(`[data-response-name="${name}"]`);
  group?.addEventListener('change', (event) => {
    const value = event.detail?.value ?? event.target?.value;
    if (!value) return;
    onChange(value);
    primaryButton.textContent = getPrimaryActionLabel();
    clearAlert();
  });
}

function renderExemptionTypeScreen(index) {
  const exemption = exemptionTypes[index];
  app.innerHTML = `
    <h2 class="screen-title">${exemption.title}</h2>
    ${exemption.description ? '' : '<p class="intro">Answer each question to help us determine whether you may qualify for an exemption.</p>'}
    <div class="question-card">
      ${exemption.description ? `<div class="question-support"><p>${exemption.description}</p><ul>${exemption.examples.map((example) => `<li>${example}</li>`).join('')}</ul></div>` : ''}
      ${renderYesNoGroup('exemption-answer', exemption.question, state.exemptionAnswers[index])}
    </div>`;
  bindYesNoGroup('exemption-answer', (value) => { state.exemptionAnswers[index] = value; });
}

function renderTravelScreen() {
  app.innerHTML = `
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
    ${trip.accompanyingDependent ? `<label class="field"><span class="field-label">Which household member is the dependent with the medical condition? <span aria-hidden="true">*</span></span><select data-trip-field="dependentMember" data-index="${index}"><option value="">Select a household member</option><option value="other" ${trip.dependentMember === 'other' ? 'selected' : ''}>Another household member</option></select></label>${trip.dependentMember === 'other' ? `<label class="field"><span class="field-label">Enter the dependent's name <span aria-hidden="true">*</span></span><input type="text" data-trip-field="dependentName" data-index="${index}" value="${escapeHtml(trip.dependentName)}" placeholder="Enter household member's name"></label>` : ''}` : ''}
    <label class="field"><span class="field-label">What is the name of the hospital/treatment facility? <span aria-hidden="true">*</span></span><input type="text" data-trip-field="facility" data-index="${index}" value="${escapeHtml(trip.facility)}" placeholder="Enter name of hospital" autocomplete="organization"></label>
    <label class="check-option"><input type="checkbox" data-trip-field="withinState" data-index="${index}" ${trip.withinState ? 'checked' : ''}><span>Travel was within New York State</span></label>
    <div class="facility-location">
      <label class="field"><span class="field-label">What is the hospital/treatment facility ZIP code? <span aria-hidden="true">*</span></span><input type="text" inputmode="numeric" pattern="[0-9]{5}" maxlength="5" data-trip-field="facilityZip" data-index="${index}" value="${escapeHtml(trip.facilityZip)}" placeholder="5-digit ZIP code" autocomplete="postal-code"></label>
      <label class="field"><span class="field-label">What is the hospital/treatment facility county? <span aria-hidden="true">*</span></span><select data-trip-field="facilityCounty" data-index="${index}"><option value="">Select county</option>${newYorkCounties.map((county) => `<option value="${county}" ${trip.facilityCounty === county ? 'selected' : ''}>${county}</option>`).join('')}</select></label>
    </div>
    <fieldset class="date-range">
      <legend>When did they travel for medical care?</legend>
      <p class="helper">Valid dates are from June 2025 to November 2025.</p>
      <div class="date-fields">
        <label class="field"><span class="field-label">From <span aria-hidden="true">*</span></span><input type="date" data-trip-field="fromDate" data-index="${index}" value="${escapeHtml(trip.fromDate)}" min="2025-06-01" max="2025-11-30" aria-label="Trip ${index + 1} start date"></label>
        <label class="field"><span class="field-label">To <span aria-hidden="true">*</span></span><input type="date" data-trip-field="toDate" data-index="${index}" value="${escapeHtml(trip.toDate)}" min="2025-06-01" max="2025-11-30" aria-label="Trip ${index + 1} end date"></label>
      </div>
    </fieldset>
    ${index > 0 ? `<button class="remove-trip" data-remove-trip="${index}" type="button">Remove trip</button>` : ''}
  </article>`;
}

function renderFollowUpScreen() {
  const question = state.activeExemption === 16
    ? 'Was Christopher Johnson considered to be at least a half-time student by their institution during December 2026?'
    : 'Did this situation prevent you from meeting work requirements in December 2026?';
  app.innerHTML = `
    <h2 class="screen-title">Follow-up question</h2>
    <div class="question-card">${renderYesNoGroup('follow-up', question, state.followUp)}</div>`;
  bindYesNoGroup('follow-up', (value) => { state.followUp = value; });
}

function renderCaregiverOneFollowUps() {
  const allYes = state.caregiver1FollowUps.related === 'yes' && state.caregiver1FollowUps.livesWith === 'yes';
  app.innerHTML = `
    <h2 class="screen-title">Tell us about Christopher Johnson's time as a caregiver for a disabled individual</h2>
    <p class="helper">Answer these questions about December 2026.</p>
    <div class="question-card">${renderYesNoGroup('caregiver1-related', 'Was the individual being cared for related to Christopher Johnson in December 2026?', state.caregiver1FollowUps.related)}</div>
    <div class="question-card">${renderYesNoGroup('caregiver1-lives-with', 'Did the individual being cared for live with Christopher Johnson in December 2026?', state.caregiver1FollowUps.livesWith)}</div>`;

  bindYesNoGroup('caregiver1-related', (value) => { state.caregiver1FollowUps.related = value; });
  bindYesNoGroup('caregiver1-lives-with', (value) => { state.caregiver1FollowUps.livesWith = value; });
}

function renderCaregiverTwoFollowUps() {
  app.innerHTML = `
    <h2 class="screen-title">Tell us about Christopher Johnson's time as a caregiver for a child under 14</h2>
    <p class="helper">Answer these questions about December 2026.</p>
    <div class="question-card">${renderYesNoGroup('caregiver2-related', 'Was the child being cared for related to Christopher Johnson in December 2026?', state.caregiver2FollowUps.related)}</div>
    <div class="question-card">${renderYesNoGroup('caregiver2-lives-with', 'Did the child being cared for live with Christopher Johnson in December 2026?', state.caregiver2FollowUps.livesWith)}</div>`;

  bindYesNoGroup('caregiver2-related', (value) => { state.caregiver2FollowUps.related = value; });
  bindYesNoGroup('caregiver2-lives-with', (value) => { state.caregiver2FollowUps.livesWith = value; });
}

function renderNoExemptionScreen() {
  app.innerHTML = `
    <h2 class="screen-title">No exemption selected</h2>
    <p class="intro">No additional exemption types are available in this flow.</p>`;
}

function renderEducationExemptionScreen() {
  app.innerHTML = `
    <h2 class="screen-title">Education exemption</h2>
    <div class="question-card">${renderYesNoGroup('education-answer', 'Was Christopher Johnson enrolled in school, college, or another educational institution?', state.educationAnswer)}</div>`;
  bindYesNoGroup('education-answer', (value) => { state.educationAnswer = value; });
}

const veteranDocumentTypes = [
  'VA disability benefits letter',
  'VA disability rating decision',
  'Medical documentation',
  'Other supporting document'
];
const correctionalDocumentTypes = [
  'Correctional facility letter',
  'Incarceration record',
  'Release or discharge document',
  'Other supporting document'
];

function renderDocumentUploadScreen() {
  const isCorrectionalFacility = state.activeExemption === 6;
  const documentTypes = isCorrectionalFacility ? correctionalDocumentTypes : veteranDocumentTypes;
  const documentInstructions = isCorrectionalFacility
    ? "Upload a document that supports the correctional facility exemption. The document should clearly show Christopher Johnson's name and relevant dates."
    : "Upload a document that verifies the veteran's disability status. The document should clearly show the member's name and relevant disability information.";
  app.innerHTML = `
    <h2 class="screen-title">Upload Supporting Document</h2>
    <div class="upload-info">
      <strong>Supporting documents required</strong>
      <p>${documentInstructions}</p>
    </div>
    <label class="field upload-type-field"><span class="field-label">Type of document</span>
      <select id="document-type">
        <option value="">Select document type</option>
        ${documentTypes.map((type) => `<option value="${type}" ${state.documentType === type ? 'selected' : ''}>${type}</option>`).join('')}
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
  const returnMessage = state.activeExemption === 6
    ? 'Your correctional facility exemption documents are complete. Return to your account home.'
    : confirmation;
  app.innerHTML = `
    <h2 class="screen-title">Document submitted</h2>
    <section class="upload-success" role="status" aria-live="polite">
      <span class="success-check" aria-hidden="true"></span>
      <p>${returnMessage}</p>
    </section>`;
}

function updateTrip(event) {
  const index = Number(event.target.dataset.index);
  const { tripField } = event.target.dataset;
  state.trips[index][tripField] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
  if (tripField === 'accompanyingDependent' && !event.target.checked) {
    state.trips[index].dependentMember = '';
    state.trips[index].dependentName = '';
  }
  clearAlert();
  if (tripField === 'accompanyingDependent' || tripField === 'dependentMember') renderTravelScreen();
}

function removeTrip(event) {
  state.trips.splice(Number(event.target.dataset.removeTrip), 1);
  renderTravelScreen();
}

function isScreenComplete() {
  if (state.screen < 9) return Boolean(state.exemptionAnswers[state.screen]);
  if (state.screen === 9) return state.trips.length > 0 && state.trips.every(isTripComplete);
  if (state.screen === 10) return Boolean(state.followUp);
  if (state.screen === 12) return Boolean(state.documentType && state.uploadMethod);
  if (state.screen === 14) return state.caregiver1FollowUps.related === 'yes' || state.caregiver1FollowUps.livesWith === 'yes' || (state.caregiver1FollowUps.related === 'no' && state.caregiver1FollowUps.livesWith === 'no');
  if (state.screen === 15) return Boolean(state.educationAnswer);
  if (state.screen === 16) return state.caregiver2FollowUps.related === 'yes' || state.caregiver2FollowUps.livesWith === 'yes' || (state.caregiver2FollowUps.related === 'no' && state.caregiver2FollowUps.livesWith === 'no');
  return state.screen === 11 || state.screen === 13;
}

function isSubmitState() {
  return (state.screen === 10 && state.followUp === 'yes') ||
    (state.screen === 14 && (state.caregiver1FollowUps.related === 'yes' || state.caregiver1FollowUps.livesWith === 'yes')) ||
    (state.screen === 16 && (state.caregiver2FollowUps.related === 'yes' || state.caregiver2FollowUps.livesWith === 'yes'));
}

function getPrimaryActionLabel() {
  if (state.screen === 12) return 'Submit document';
  if (state.screen === 13) return state.activeExemption === 5 || state.activeExemption === 6 ? 'Back to account home' : 'Continue';
  if (state.submitted || state.screen === 11) return 'Back to account home';
  return isSubmitState() ? 'Submit' : 'Next';
}

function next() {
  if (state.submitted || state.screen === 11) {
    window.location.href = 'index.html?view=account-home';
    return;
  }
  if (!isScreenComplete()) {
    showAlert(incompleteMessage());
    return;
  }
  clearAlert();

  if (state.screen === 12) {
    state.screen = 13;
    render();
    return;
  }
  if (state.screen === 13) {
    if (state.activeExemption === 5 || state.activeExemption === 6) {
      window.location.href = 'index.html?view=account-home';
      return;
    }
    state.screen = 10;
    render();
    return;
  }

  if (state.screen === 15) {
    if (state.educationAnswer === 'yes') {
      state.activeExemption = 16;
      state.followUp = '';
      state.screen = 10;
    } else {
      state.screen = 11;
    }
    render();
    return;
  }

  if (isSubmitState()) {
    state.submitted = true;
    app.innerHTML = '<section class="submission-success" role="status" aria-labelledby="submission-title"><span class="success-check" aria-hidden="true"></span><h2 id="submission-title">Exemption submitted</h2><p>Please allow 7–10 days to process.</p></section>';
    headerBackButton.hidden = true;
    headerCloseButton.hidden = true;
    primaryButton.textContent = 'Continue';
    return;
  }

  if (state.screen < 9) {
    if (state.exemptionAnswers[state.screen] === 'yes') {
      state.activeExemption = state.screen;
      state.followUp = '';
      state.screen = state.activeExemption === 8 ? 9 : state.activeExemption === 0 ? 14 : state.activeExemption === 1 ? 16 : state.activeExemption === 5 || state.activeExemption === 6 ? 12 : 10;
    } else {
      state.screen = state.screen === 8 ? 15 : state.screen + 1;
    }
    render();
    return;
  }

  if (state.screen === 9) {
    state.screen = 10;
    render();
    return;
  }

  if (state.screen === 14) {
    state.screen = 1;
    render();
    return;
  }

  if (state.screen === 16) {
    state.screen = 2;
    render();
    return;
  }

  if (state.screen === 10) {
    state.screen = state.activeExemption === 8
      ? 15
      : state.activeExemption < 8
        ? state.activeExemption + 1
      : 11;
    state.followUp = '';
  }
  render();
}

function incompleteMessage() {
  if (state.screen === 12) return 'Select a document type and an upload method to continue.';
  if (state.screen === 14) return 'Answer both follow-up questions, or select No to continue to Caregiver exemption 2.';
  if (state.screen === 16) return 'Answer both follow-up questions, or select No to continue to Medical hardship.';
  if (state.screen < 9 || state.screen === 10) return 'Select Yes or No to continue.';
  if (state.screen === 15) return 'Select Yes or No to continue.';
  if (state.screen === 9) return 'Complete the required trip information for each trip. Dates must be between June and November 2025, and the end date cannot be before the start date.';
  return 'Complete the required information to continue.';
}

function isTripComplete(trip) {
  return Boolean(
    trip.condition.trim() &&
    trip.facility.trim() &&
    /^\d{5}$/.test(trip.facilityZip) &&
    trip.facilityCounty &&
    (!trip.accompanyingDependent || (trip.dependentMember === 'other' && trip.dependentName.trim())) &&
    trip.fromDate &&
    trip.toDate &&
    trip.fromDate <= trip.toDate &&
    trip.fromDate >= '2025-06-01' &&
    trip.toDate <= '2025-11-30'
  );
}

function showAlert(message) {
  clearAlert();

  let responseName = null;
  if (state.screen < 9) responseName = 'exemption-answer';
  else if (state.screen === 10) responseName = 'follow-up';
  else if (state.screen === 15) responseName = 'education-answer';
  else if (state.screen === 14) {
    responseName = state.caregiver1FollowUps.related ? 'caregiver1-lives-with' : 'caregiver1-related';
  } else if (state.screen === 16) {
    responseName = state.caregiver2FollowUps.related ? 'caregiver2-lives-with' : 'caregiver2-related';
  }

  const responseGroup = responseName
    ? app.querySelector(`[data-response-name="${responseName}"]`)
    : null;
  if (responseGroup) {
    if (responseGroup.matches('mms-radio-group')) {
      responseGroup.error = true;
      responseGroup.errorText = message;
      return;
    }
    const alert = createInlineAlert(message);
    responseGroup.classList.add('has-error');
    responseGroup.querySelector('.radio-group').insertAdjacentElement('afterend', alert);
    return;
  }

  const alert = createInlineAlert(message);
  let target = app.querySelector('.question-card');
  if (state.screen === 9) target = app.querySelector('#trip-list');
  else if (state.screen === 12) target = app.querySelector('.upload-info');

  if (target) target.insertBefore(alert, target.firstChild);
  else app.prepend(alert);
}

function createInlineAlert(message) {
  if (customElements.get('mms-inline-alert')) {
    const alert = document.createElement('mms-inline-alert');
    alert.className = 'inline-validation-alert';
    alert.alertType = 'error';
    alert.dismissible = false;
    alert.message = message;
    return alert;
  }
  const alert = document.createElement('p');
  alert.className = 'form-alert';
  alert.setAttribute('role', 'alert');
  alert.setAttribute('aria-live', 'assertive');
  alert.textContent = message;
  return alert;
}

function clearAlert() {
  app.querySelectorAll('.form-alert').forEach((alert) => {
    alert.closest('.radio-response')?.classList.remove('has-error');
    alert.remove();
  });
  app.querySelectorAll('.inline-validation-alert').forEach((alert) => alert.remove());
  app.querySelectorAll('mms-radio-group[data-response-name]').forEach((group) => {
    group.error = false;
    group.errorText = '';
  });
}

function back() {
  if (state.screen === 0) {
    window.location.href = '../index.html?home=1';
    return;
  }
  if (state.screen > 0) {
    if (state.screen < 9) {
      state.screen -= 1;
    } else if (state.screen === 9) {
      state.screen = 8;
    } else if (state.screen === 10) {
      state.screen = state.activeExemption === 8 ? 9 : state.activeExemption === 16 ? 15 : state.activeExemption;
    } else if (state.screen === 12) {
      state.screen = state.activeExemption;
    } else if (state.screen === 13) {
      state.screen = 12;
    } else if (state.screen === 14) {
      state.screen = state.activeExemption;
    } else if (state.screen === 15) {
      state.screen = 8;
    } else if (state.screen === 16) {
      state.screen = state.activeExemption;
    }
    render();
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

primaryButton.addEventListener('click', next);
headerBackButton.addEventListener('click', back);
headerCloseButton.addEventListener('click', () => {
  window.location.href = 'index.html?view=account-home';
});

function renderAccountHome() {
  app.innerHTML = '<h2 class="screen-title">Account home</h2><div class="account-home"><p>You are back at the Work requirements account.</p><a class="account-home-link" href="index.html?flow=exemption"><span>Work requirements</span><span class="account-home-arrow" aria-hidden="true">&#8250;</span></a></div>';
  document.querySelector('.app-footer').hidden = true;
  headerBackButton.hidden = true;
  headerCloseButton.hidden = true;
}

if (new URLSearchParams(window.location.search).get('view') === 'account-home') {
  renderAccountHome();
} else {
  render();
}