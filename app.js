/**
 * NyayaSetu — National Legal Technology Portal
 * Team: Dev Jain, Mansvi Khupse, Swati Kundu, Chinta Bhumika Reddy (Ramdeobaba University, IDEA Lab)
 */

let activeRole = 'citizen';
let activeTab = 'assistant';

let activeProfile = null;
const PORTAL_PROFILES = {
  dev: { id: 'dev', name: 'Dev Jain', role: 'citizen' },
  mansvi: { id: 'mansvi', name: 'Mansvi Khupse', role: 'citizen' },
  swati: { id: 'swati', name: 'Swati Kundu', role: 'advocate' }
};
const PORTAL_SESSION_KEY = 'nyayasetu_portal_profile';
function portalProfileForDigiLockerUser(user) {
  if (!user || !user.name) return null;
  const name = String(user.name).trim().toLowerCase().replace(/\s+/g, ' ');
  return Object.values(PORTAL_PROFILES).find(p => p.name.toLowerCase() === name) || null;
}
function activatePortalProfile(profileId) {
  const profile = PORTAL_PROFILES[profileId];
  if (!profile || !getDigiLockerUser()) return false;
  activeProfile = profile;
  localStorage.setItem(PORTAL_SESSION_KEY, JSON.stringify({id:profile.id}));
  const modal = document.getElementById('modalDigiLockerLogin');
  if (modal) modal.style.display = 'none';
  applyPortalProfile();
  return true;
}
function initPortalLogin() {
  let saved=null; try { saved=JSON.parse(localStorage.getItem(PORTAL_SESSION_KEY)||'null'); } catch(e) {}
  const user=getDigiLockerUser(), mapped=portalProfileForDigiLockerUser(user), selected=saved&&PORTAL_PROFILES[saved.id];
  activeProfile=mapped&&(!selected||selected.id===mapped.id)?mapped:null;
  if(activeProfile) applyPortalProfile();
  else {
    localStorage.removeItem(PORTAL_SESSION_KEY);
    document.body.classList.remove('portal-app-active');
    const modal = document.getElementById('modalDigiLockerLogin');
    if (modal) modal.style.display = 'none';
    showWelcomePage();
  }
}
function logoutPortal() {
  localStorage.removeItem(PORTAL_SESSION_KEY); localStorage.removeItem('nyayasetu_digilocker_user');
  activeProfile=null; selectedClientRoomId=null; pendingClientRoomId=null; selectedLawyerRoomId=null; pendingLawyerRoomId=null; pendingAdvocateTotpSecret=null;
  document.body.classList.remove('portal-app-active');
  const modal = document.getElementById('modalDigiLockerLogin');
  if (modal) modal.style.display = 'none';
  renderDigiLockerHeaderUI();
  showWelcomePage();
}
function applyPortalProfile() {
  if (!activeProfile) return;
  document.body.classList.add('portal-app-active');
  activeRole = activeProfile.role;
  const label = document.getElementById('activePortalProfile');
  if (label) label.innerText = `${activeProfile.name} - ${activeRole === 'advocate' ? 'Advocate' : 'Client'}`;
  const sharedNavs = ['nav-ecourts', 'nav-calendar'];
  const advocateNavs = ['nav-lawyerrooms', 'nav-practicemgmt', 'nav-billable', 'nav-lawyerresearch'];
  const citizenNavs = ['nav-assistant', 'nav-autodraft', 'nav-voicebot', 'nav-clientroom'];
  [...sharedNavs, ...advocateNavs, ...citizenNavs].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const isShared = sharedNavs.includes(id);
    el.style.display = isShared || (activeRole === 'advocate' ? advocateNavs.includes(id) : citizenNavs.includes(id)) ? 'inline-block' : 'none';
  });
  showTab(activeRole === 'advocate' ? 'lawyerrooms' : 'assistant');
}


function showWelcomePage() {
  const welcome = document.getElementById('welcome-page');
  const notFound = document.getElementById('not-found-page');
  if (!welcome || document.body.classList.contains('portal-app-active')) return;
  const path = window.location.pathname;
  const validPath = path === '/' || path.endsWith('/index.html');
  welcome.hidden = !validPath;
  if (notFound) notFound.hidden = validPath;
}

const LEGAL_INFO_CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    html: '<p>NyayaSetu is a student-built prototype for legal information and case organization. This notice describes the prototype as it currently works.</p>' +
      '<h3>Information in this prototype</h3><p>Demo profile choices, case-room details, messages, and document status may be stored in this browser so the demo can work between visits. The current prototype does not upload those room files to a NyayaSetu cloud database. Browser storage is not an appropriate place for confidential or highly sensitive records.</p>' +
      '<h3>Demo identity and DigiLocker</h3><p>Demo profiles are examples and are not identity-verified. Selecting a demo profile does not authenticate through the Government of India DigiLocker service. Do not enter real Aadhaar details, OTPs, passwords, or private case documents into a demo flow.</p>' +
      '<h3>Your choices and device</h3><p>Information saved by this prototype may remain in this browser until you clear its site data. Other people with access to this device or browser profile may be able to see it. Use the browser&#39;s site-data controls to remove locally saved prototype information.</p>' +
      '<h3>AI research</h3><p>Questions entered in the advocate research assistant are sent to Google Gemini with Google Search grounding to prepare a response and source list. Do not include client names, identifying details, confidential facts, or private documents. Google handles these requests under its own applicable terms and data policies.</p>' +
      '<h3>Third-party services</h3><p>When a feature opens an external government or other service, that service handles information under its own terms and privacy notice. NyayaSetu does not claim to be affiliated with or endorsed by those services.</p>' +
      '<h3>Questions</h3><p>This is an educational prototype and does not yet provide a dedicated privacy-request or support channel.</p>'
  },
  terms: {
    title: 'Terms of Use',
    html: '<p>NyayaSetu is a student-built prototype intended for learning, general legal information, and demonstration of case-organization features.</p>' +
      '<h3>Not legal advice</h3><p>Content and automated features are general information only. They are not legal advice, do not create a lawyer-client relationship, and do not replace advice from an advocate who has reviewed your circumstances. Check important information with a qualified advocate and the relevant court or authority.</p>' +
      '<h3>Demo features</h3><p>Demo identities, case details, deadlines, messages, and documents may be sample data. They may be incomplete, inaccurate, or unavailable, and must not be relied on for a real filing, hearing, limitation period, or other legal deadline.</p>' +
      '<h3>Use and sensitive information</h3><p>Do not use this prototype for urgent legal or safety matters. Do not enter real Aadhaar information, authentication codes, passwords, or confidential case documents into demo features. You are responsible for reviewing and independently verifying material before acting on it.</p>' +
      '<h3>Availability and external services</h3><p>Features may change or stop working. Links and integrations to third-party services are subject to those services&#39; own terms. NyayaSetu does not guarantee their availability, accuracy, or response.</p>' +
      '<h3>Prototype status</h3><p>Use of this prototype is voluntary and at your discretion. These terms explain the current demonstration; they are not a substitute for a signed engagement with an advocate or a formal service agreement.</p>'
  }
};

function openLegalInfo(kind) {
  const content = LEGAL_INFO_CONTENT[kind];
  const modal = document.getElementById('legalInfoModal');
  const title = document.getElementById('legalInfoTitle');
  const body = document.getElementById('legalInfoContent');
  if (!content || !modal || !title || !body) return;
  title.textContent = content.title;
  body.innerHTML = content.html;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  document.getElementById('legalInfoClose')?.focus();
  body.focus();
}

function closeLegalInfo() {
  const modal = document.getElementById('legalInfoModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && document.getElementById('legalInfoModal')?.style.display === 'flex') closeLegalInfo();
});

async function submitLawyerResearch(event) {
  if (event) event.preventDefault();
  if (!activeProfile || activeProfile.role !== 'advocate') {
    showTab('assistant');
    return;
  }
  const input = document.getElementById('inpLawyerResearchQuery');
  const button = document.getElementById('btnLawyerResearch');
  const panel = document.getElementById('lawyerResearchResultPanel');
  const answer = document.getElementById('lawyerResearchAnswer');
  const sourcesPanel = document.getElementById('lawyerResearchSources');
  const sourceList = document.getElementById('lawyerResearchSourceList');
  const noOfficial = document.getElementById('lawyerResearchNoOfficial');
  const status = document.getElementById('lawyerResearchGroundingStatus');
  const query = input ? input.value.trim() : '';
  if (!query) return;
  if (button) { button.disabled = true; button.textContent = 'Searching official legal sources…'; }
  if (panel) panel.style.display = 'block';
  if (answer) answer.textContent = 'Searching and preparing a research note…';
  if (sourcesPanel) sourcesPanel.hidden = true;
  if (noOfficial) noOfficial.hidden = true;
  if (sourceList) sourceList.replaceChildren();
  try {
    const response = await fetch('/api/ai/lawyer-research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Legal research could not be completed.');
    if (answer) answer.textContent = data.answer || 'No research note was returned.';
    const sources = Array.isArray(data.sources) ? data.sources : [];
    const officialSources = sources.filter(source => source.official);
    if (sourcesPanel && sourceList && sources.length) {
      sources.forEach((source, index) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = source.uri;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = source.title || new URL(source.uri).hostname;
        item.appendChild(link);
        const label = document.createElement('span');
        label.className = source.official ? 'source-official-label' : 'source-web-label';
        label.textContent = source.official ? 'Official court / government source' : 'Web source · verify independently';
        item.appendChild(label);
        sourceList.appendChild(item);
      });
      sourcesPanel.hidden = false;
    }
    if (noOfficial) noOfficial.hidden = officialSources.length > 0;
    if (status) status.textContent = officialSources.length ? 'Official sources included' : 'No official source verified';
  } catch (error) {
    if (answer) answer.textContent = error.message || 'Unable to reach the legal research service.';
    if (status) status.textContent = 'Research unavailable';
    if (noOfficial) noOfficial.hidden = true;
  } finally {
    if (button) { button.disabled = false; button.textContent = 'Search and prepare research note'; }
  }
}

function startLandingLogin(role) {
  if (activeProfile) {
    showTab(role === 'advocate' ? 'lawyerrooms' : 'assistant');
    return;
  }
  activeTeamMember = role === 'advocate' ? 'swati' : 'dev';
  openDigiLockerModal(1, 'sandbox');
  selectTeamMember(activeTeamMember);
}

// Role switching: Citizen vs Advocate Desk
function switchRole(role) {
  if (!activeProfile || role !== activeProfile.role) return;
  applyPortalProfile();
}
// Tab navigation handler
function showTab(tabName) {
  if (!activeProfile) {
    openDigiLockerModal(1,'sandbox');
    return;
  }
  const advocateOnlyTabs = ['lawyerrooms', 'practicemgmt', 'billable', 'lawyerresearch'];
  const citizenOnlyTabs = ['assistant', 'autodraft', 'voicebot', 'clientroom'];
  if (activeProfile.role === 'advocate' && citizenOnlyTabs.includes(tabName)) tabName = 'lawyerrooms';
  if (activeProfile.role === 'citizen' && advocateOnlyTabs.includes(tabName)) tabName = 'assistant';
  activeTab = tabName;

  document.querySelectorAll('.nav-link').forEach(btn => {
    if (btn.id === 'nav-' + tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  document.querySelectorAll('.tab-content').forEach(sec => {
    if (sec.id === 'tab-' + tabName) {
      sec.classList.add('active');
    } else {
      sec.classList.remove('active');
    }
  });

  const breadcrumb = document.getElementById('breadcrumbTrail');
  const titles = {
    'assistant': 'Statutory Grievance & Legal Guidance Portal',
    'autodraft': 'Court-Ready Document Drafter',
    'voicebot': 'Bhashini Indic Voice Assistant',
    'ecourts': 'eCourts Live Case Status Tracker',
    'calendar': 'Case Hearing Calendar',
    'clientroom': 'Private Case Room (Client View)',
    'lawyerrooms': 'Advocate Case Rooms & Document Verification Desk',
    'practicemgmt': 'Litigation Docket & Practice Management',
    'billable': 'Billable Hours & Associate Tasks',
    'lawyerresearch': 'Legal Research Assistant'
  };

  if (breadcrumb) {
    const parent = (tabName === 'lawyerrooms' || tabName === 'practicemgmt' || tabName === 'billable' || tabName === 'lawyerresearch' || (tabName === 'calendar' && activeRole === 'advocate'))
      ? 'Advocate Desk' : 'Citizen Services';
    breadcrumb.innerHTML = `Home &gt; ${parent} &gt; <strong>${titles[tabName] || tabName}</strong>`;
  }

  if (tabName === 'autodraft') {
    renderPleading();
  } else if (tabName === 'clientroom') {
    renderClientRoom();
  } else if (tabName === 'lawyerrooms') {
    renderLawyerRoom();
  } else if (tabName === 'ecourts') {
    renderRecentSearches();
  } else if (tabName === 'calendar') {
    renderTrackedCases();
  } else if (tabName === 'practicemgmt' || tabName === 'billable') {
    renderPracticeDocket();
  }
  updateBillingAuthenticatorPanel();
}

const TEXT_SIZE_STORAGE_KEY = 'nyayasetu_text_size';
const originalTextMetrics = new WeakMap();
let activeTextSize = 'normal';
let textSizeObserver = null;

function applyTextSize(size) {
  const scale = size === 'small' ? 0.9 : size === 'large' ? 1.15 : 1;
  const elements = Array.from(document.body.querySelectorAll('*')).filter(element => {
    if (element.closest('svg, script, style')) return false;
    const hasText = Array.from(element.childNodes).some(node => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim());
    return hasText || element.matches('input, textarea, select');
  });
  const metrics = elements.map(element => {
    let original = originalTextMetrics.get(element);
    if (!original) {
      const computed = getComputedStyle(element);
      original = {
        fontSize: parseFloat(computed.fontSize) || 13,
        lineHeight: computed.lineHeight === 'normal' ? null : parseFloat(computed.lineHeight),
        inlineFontSize: element.style.getPropertyValue('font-size'),
        inlineFontPriority: element.style.getPropertyPriority('font-size'),
        inlineLineHeight: element.style.getPropertyValue('line-height'),
        inlineLinePriority: element.style.getPropertyPriority('line-height')
      };
      originalTextMetrics.set(element, original);
    }
    return { element, original };
  });
  metrics.forEach(({ element, original }) => {
    if (scale === 1) {
      if (original.inlineFontSize) element.style.setProperty('font-size', original.inlineFontSize, original.inlineFontPriority);
      else element.style.removeProperty('font-size');
      if (original.inlineLineHeight) element.style.setProperty('line-height', original.inlineLineHeight, original.inlineLinePriority);
      else element.style.removeProperty('line-height');
      return;
    }
    element.style.setProperty('font-size', (original.fontSize * scale).toFixed(2) + 'px', 'important');
    if (original.lineHeight) element.style.setProperty('line-height', (original.lineHeight * scale).toFixed(2) + 'px', 'important');
  });
}

function changeFontSize(size) {
  if (!['small', 'normal', 'large'].includes(size)) return;
  activeTextSize = size;
  document.body.dataset.textSize = size;
  try { localStorage.setItem(TEXT_SIZE_STORAGE_KEY, size); } catch (error) {}
  applyTextSize(size);
  document.querySelectorAll('.accessibility-tools button[onclick^="changeFontSize"]').forEach(button => {
    const selected = button.getAttribute('onclick').includes("'" + size + "'");
    button.setAttribute('aria-pressed', String(selected));
  });
}

function initTextSizeControls() {
  let savedSize = 'normal';
  try {
    const saved = localStorage.getItem(TEXT_SIZE_STORAGE_KEY);
    if (['small', 'normal', 'large'].includes(saved)) savedSize = saved;
  } catch (error) {}
  changeFontSize(savedSize);
  if (!textSizeObserver) {
    textSizeObserver = new MutationObserver(() => {
      if (activeTextSize !== 'normal') applyTextSize(activeTextSize);
    });
    textSizeObserver.observe(document.body, { childList: true, subtree: true });
  }
}

// Case Rooms State Management (1 Client Room, 2 Lawyer Rooms + Dynamic Code Sharing)
let selectedClientRoomId = null;
let pendingClientRoomId = null;
let selectedLawyerRoomId = null;
let pendingLawyerRoomId = null;
let pendingAdvocateTotpSecret = null;

const DEFAULT_ROOMS = [];
const LEGACY_DEFAULT_ROOM_IDS = new Set(['NYAYA-701', 'NYAYA-702', 'NYAYA-703', 'NYAYA-704', 'NYAYA-705']);

function getAllRooms() {
  const stored = localStorage.getItem('nyayasetu_case_rooms_store');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const cleaned = parsed
          .filter(room => room && !LEGACY_DEFAULT_ROOM_IDS.has(room.id))
          .map(room => {
            // Remove passwords from the previous local-only advocate room gate.
            if (room.roomPassword) { delete room.roomPassword; room.clientPasswords = {}; }
            if (room.lawyerPasswords) delete room.lawyerPasswords;
            return room;
          });
        if (cleaned.length !== parsed.length || JSON.stringify(cleaned) !== JSON.stringify(parsed)) {
          localStorage.setItem('nyayasetu_case_rooms_store', JSON.stringify(cleaned));
        }
        return cleaned;
      }
    } catch (e) {}
  }
  localStorage.setItem('nyayasetu_case_rooms_store', JSON.stringify(DEFAULT_ROOMS));
  return [];
}
function saveAllRooms(rooms) {
  localStorage.setItem('nyayasetu_case_rooms_store', JSON.stringify(rooms));
  if (activeTab === 'clientroom') renderClientRoom();
  if (activeTab === 'lawyerrooms') renderLawyerRoom();
}

function getRoomById(roomId) {
  const rooms = getAllRooms();
  return rooms.find(r => r.id === roomId) || null;
}

function renderClientRoom() {
  const listView = document.getElementById('clientRoomsListView');
  const detailView = document.getElementById('clientRoomDetailView');
  if (!listView || !detailView) return;

  if (selectedClientRoomId) {
    listView.style.display = 'none';
    detailView.style.display = 'block';
    renderClientRoomDetail(selectedClientRoomId);
  } else {
    listView.style.display = 'block';
    detailView.style.display = 'none';
    renderClientRoomsList();
  }
}

function renderClientRoomsList() {
  const tbody = document.getElementById('clientRoomsTableBody');
  const countBadge = document.getElementById('clientRoomsCountBadge');
  if (!tbody) return;

  const rooms = getAllRooms();
const clientRooms = rooms.filter(room => room.visibleToClient === true && activeProfile &&
    ((Array.isArray(room.clientProfileIds) && room.clientProfileIds.includes(activeProfile.id)) ||
      (!Array.isArray(room.clientProfileIds) && room.clientName === activeProfile.name)));
  if (countBadge) countBadge.innerText = `${clientRooms.length} Active Room${clientRooms.length === 1 ? '' : 's'}`;

  tbody.innerHTML = clientRooms.map(room => {
    return `
      <tr>
        <td><strong>${room.token}</strong></td>
        <td>${room.caseNumber || 'Not provided'}</td>
        <td><strong>${room.caseTitle}</strong></td>
        <td>${room.lawyerName}</td>
        <td>${room.court}</td>
        <td>${room.nextHearing}</td>
        <td>
          <button type="button" class="btn btn-primary btn-sm" onclick="openClientRoom('${room.id}')">Enter Room</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openClientRoom(roomId) {
  showClientRoomPasswordGate(roomId);
}

function closeClientRoom() {
  selectedClientRoomId = null;
  pendingClientRoomId = null;
  cancelClientRoomPasswordGate();
  renderClientRoom();
}

function quickJoinCode(code) {
  const inp = document.getElementById('inpJoinCode');
  if (inp) inp.value = code;
  joinRoomByCode();
}

function joinRoomByCode() {
  const inp = document.getElementById('inpJoinCode');
  if (!inp) return;
  const code = inp.value.trim().toUpperCase();
  if (!code) {
    alert('Please enter a valid invitation code.');
    return;
  }
  const rooms = getAllRooms();
  const found = rooms.find(room => String(room.token || '').toUpperCase() === code || String(room.id || '').toUpperCase() === code);
  if (!found) {
    alert(`No case room found matching invitation code "${code}". Please verify the code with your advocate.`);
    return;
  }

  showClientRoomPasswordGate(found.id);
}

function showClientRoomPasswordGate(roomId) {
  if (!activeProfile || activeProfile.role !== 'citizen') return;
  const room = getRoomById(roomId);
  if (!room) return;
  pendingClientRoomId = room.id;
  selectedClientRoomId = null;
  const listView = document.getElementById('clientRoomsListView');
  const detailView = document.getElementById('clientRoomDetailView');
  const joinForm = document.getElementById('clientRoomAccessForm');
  const roomsPanel = document.getElementById('clientRoomsListPanel');
  const gate = document.getElementById('roomPasswordGate');
  const title = document.getElementById('roomPasswordGateTitle');
  const password = document.getElementById('inpRoomPassword');
  const error = document.getElementById('roomPasswordError');
  const recovery = document.getElementById('roomPasswordRecoveryView');
  const entryForm = document.getElementById('roomPasswordEntryForm');
  const confirmWrap = document.getElementById('roomPasswordConfirmWrap');
  const passwordLabel = document.getElementById('roomPasswordLabel');
  const submitButton = document.getElementById('roomPasswordSubmit');
  const savedClientPassword = room.clientPasswords && room.clientPasswords[activeProfile.id];
  if (confirmWrap) confirmWrap.style.display = savedClientPassword ? 'none' : 'block';
  if (passwordLabel) passwordLabel.innerText = savedClientPassword ? 'Room password:' : 'Create a room password:';
  if (submitButton) submitButton.innerText = savedClientPassword ? 'Open Case Room' : 'Set Password & Join';
  if (title) title.innerText = savedClientPassword ? `Password required for ${room.caseTitle}` : `Create a password to join ${room.caseTitle}`;

  if (listView) listView.style.display = 'block';
  if (detailView) detailView.style.display = 'none';
  if (joinForm) joinForm.style.display = 'none';
  if (roomsPanel) roomsPanel.style.display = 'none';
  if (gate) gate.style.display = 'block';
  if (password) { password.value = ''; password.focus(); }
  const confirmInput = document.getElementById('inpRoomPasswordConfirm');
  if (confirmInput) confirmInput.value = '';
  if (error) { error.style.display = 'none'; error.innerText = ''; }
  if (recovery) recovery.style.display = 'none';
  if (entryForm) entryForm.style.display = 'block';
}

function verifyClientRoomPassword() {
  const room = getRoomById(pendingClientRoomId);
  const password = document.getElementById('inpRoomPassword');
  const confirm = document.getElementById('inpRoomPasswordConfirm');
  const error = document.getElementById('roomPasswordError');
  if (!room || !password || !activeProfile || activeProfile.role !== 'citizen') return;
  const clientPasswords = room.clientPasswords || (room.clientPasswords = {});
  const savedPassword = clientPasswords[activeProfile.id];

  if (savedPassword) {
    if (password.value !== savedPassword) {
      if (error) { error.innerText = 'Incorrect room password. Please try again.'; error.style.display = 'block'; }
      password.select();
      return;
    }
  } else {
    if (password.value.length < 6) {
      if (error) { error.innerText = 'Choose a password with at least 6 characters.'; error.style.display = 'block'; }
      password.focus();
      return;
    }
    if (!confirm || password.value !== confirm.value) {
      if (error) { error.innerText = 'The password and confirmation do not match.'; error.style.display = 'block'; }
      if (confirm) confirm.select();
      return;
    }
    clientPasswords[activeProfile.id] = password.value;
    room.clientProfileIds = Array.isArray(room.clientProfileIds) ? room.clientProfileIds : [];
    if (!room.clientProfileIds.includes(activeProfile.id)) room.clientProfileIds.push(activeProfile.id);
    room.clientName = activeProfile.name;
    room.visibleToClient = true;
    const rooms = getAllRooms();
    const index = rooms.findIndex(item => item.id === room.id);
    if (index >= 0) { rooms[index] = room; saveAllRooms(rooms); }
  }

  const roomId = room.id;
  cancelClientRoomPasswordGate();
  selectedClientRoomId = roomId;
  renderClientRoom();
}
function showDigiLockerPasswordRecovery() {
  const entryForm = document.getElementById('roomPasswordEntryForm');
  const recovery = document.getElementById('roomPasswordRecoveryView');
  if (entryForm) entryForm.style.display = 'none';
  if (recovery) recovery.style.display = 'block';
}

function returnToRoomPasswordEntry() {
  const entryForm = document.getElementById('roomPasswordEntryForm');
  const recovery = document.getElementById('roomPasswordRecoveryView');
  if (entryForm) entryForm.style.display = 'block';
  if (recovery) recovery.style.display = 'none';
}

function cancelClientRoomPasswordGate() {
  pendingClientRoomId = null;
  const joinForm = document.getElementById('clientRoomAccessForm');
  const roomsPanel = document.getElementById('clientRoomsListPanel');
  const gate = document.getElementById('roomPasswordGate');
  const password = document.getElementById('inpRoomPassword');
  const error = document.getElementById('roomPasswordError');
  const recovery = document.getElementById('roomPasswordRecoveryView');
  const entryForm = document.getElementById('roomPasswordEntryForm');
  if (joinForm) joinForm.style.display = 'block';
  if (roomsPanel) roomsPanel.style.display = 'block';
  if (gate) gate.style.display = 'none';
  if (password) password.value = '';
  const confirmInput = document.getElementById('inpRoomPasswordConfirm');
  if (confirmInput) confirmInput.value = '';
  if (error) { error.style.display = 'none'; error.innerText = ''; }
  if (recovery) recovery.style.display = 'none';
  if (entryForm) entryForm.style.display = 'block';
}
function renderClientRoomDetail(roomId) {
  const room = getRoomById(roomId);
  if (!room) {
    closeClientRoom();
    return;
  }

  const titleEl = document.getElementById('clientRoomHeaderTitle');
  const lawyerEl = document.getElementById('clientRoomLawyerName');
  const courtEl = document.getElementById('clientRoomCourt');
  const hearingEl = document.getElementById('clientRoomNextHearing');
  const caseNumberEl = document.getElementById('clientRoomCaseNumber');
  const codeBadge = document.getElementById('clientRoomCodeBadge');
  const statusBadge = document.getElementById('clientRoomBadge');
  const container = document.getElementById('clientDocRequestsContainer');
  const chatLog = document.getElementById('clientChatLog');

  if (titleEl) titleEl.innerText = `Room #${room.id}: ${room.caseTitle}`;
  if (lawyerEl) lawyerEl.innerText = room.lawyerName;
  if (courtEl) courtEl.innerText = room.court;
  if (hearingEl) hearingEl.innerText = room.nextHearingDate || room.nextHearing;
  const caseEl = document.getElementById('lawyerRoomCaseNumber');
  const caseInput = document.getElementById('inpLawyerRoomCaseNumber');
  const hearingInput = document.getElementById('inpLawyerRoomNextHearing');
  if (caseEl) caseEl.innerText = room.caseNumber || 'Not provided';
  if (caseInput) caseInput.value = room.caseNumber || '';
  if (hearingInput) hearingInput.value = /^\d{4}-\d{2}-\d{2}$/.test(room.nextHearingDate || '') ? room.nextHearingDate : '';
  if (codeBadge) codeBadge.innerText = `Code: ${room.token}`;

  const pendingReview = room.documents.filter(d => d.status === 'uploaded').length;
  const pendingUpload = room.documents.filter(d => d.status === 'pending_upload' || d.status === 'rejected').length;

  if (statusBadge) {
    if (pendingUpload > 0) {
      statusBadge.className = 'badge badge-red';
      statusBadge.innerText = `${pendingUpload} Upload(s) Required`;
    } else if (pendingReview > 0) {
      statusBadge.className = 'badge badge-orange';
      statusBadge.innerText = `${pendingReview} Pending Review`;
    } else {
      statusBadge.className = 'badge badge-green';
      statusBadge.innerText = 'All Documents Verified';
    }
  }

  if (container) {
    if (room.documents.length === 0) {
      container.innerHTML = '<p style="color: #666; font-size: 12px;">No document requests currently issued by counsel.</p>';
    } else {
      let html = '';
      room.documents.forEach(doc => {
        let badgeHtml = '';
        if (doc.status === 'accepted') {
          badgeHtml = '<span class="badge badge-green">Accepted &amp; Verified by Counsel</span>';
        } else if (doc.status === 'uploaded') {
          badgeHtml = '<span class="badge badge-orange">Uploaded &mdash; Awaiting Counsel Review</span>';
        } else if (doc.status === 'rejected') {
          badgeHtml = '<span class="badge badge-red">Rejected by Counsel &mdash; Please Re-upload</span>';
        } else {
          badgeHtml = '<span class="badge badge-red">Pending Upload</span>';
        }

        let fileContent = '';
        if (doc.file) {
          const dlTag = doc.isDigiLockerVerified 
            ? '<span class="badge badge-green" style="font-size: 10px; margin-left: 6px; background: #dcfce7; color: #166534; border: 1px solid #86efac;">✓ DigiLocker Verified (SHA-256)</span>' 
            : '';
          fileContent = `
            <div style="font-size: 11px; margin-top: 4px; color: #333;">
              Attached: <a href="${doc.filePath}" target="_blank" style="font-weight: bold; text-decoration: underline;">${doc.file}</a>
              ${dlTag}
              <span style="color: #666; font-size: 10px;">(Uploaded: ${doc.uploadDate || 'Recently'})</span>
            </div>
          `;
        }

        let uploadControls = '';
        if (doc.status === 'pending_upload' || doc.status === 'rejected') {
          uploadControls = `
            <div style="margin-top: 10px; background: #f8fafc; border: 1px dashed var(--border-strong); border-radius: 6px; padding: 10px 12px;">
              <div style="font-size: 11.5px; font-weight: 600; color: #475569; margin-bottom: 6px;">Select Document to Submit:</div>
              <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <button type="button" class="btn btn-digilocker-fetch btn-sm" onclick="openDigiLockerVaultForUpload('${room.id}', ${doc.id})">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM10 17l-3.5-3.5 1.41-1.41L10 14.17 15.09 9.08l1.41 1.42L10 17z"/></svg>
                  Fetch from DigiLocker
                </button>
                <span style="font-size: 11px; color: #94a3b8;">or</span>
                <select id="exampleSel_${doc.id}" style="font-size: 12px; padding: 5px 8px; max-width: 220px;">
                  <option value="">-- Choose from Example_Files folder --</option>
                  <option value="Example_Files/2. Unit II -OFDM Transmitter Numericals_compressed.pdf">2. Unit II -OFDM Transmitter Numericals_compressed.pdf</option>
                  <option value="Example_Files/AI_in_Modeling_Unit II.pptx">AI_in_Modeling_Unit II.pptx</option>
                  <option value="Example_Files/Unit -1 AI in SDLC.pptx">Unit -1 AI in SDLC.pptx</option>
                </select>
                <span style="font-size: 11px; color: #94a3b8;">or</span>
                <input type="file" id="localFile_${doc.id}" style="font-size: 11px; width: 140px;">
                <button type="button" class="btn btn-primary btn-sm" onclick="handleClientUpload('${room.id}', ${doc.id})">Upload</button>
              </div>
            </div>
          `;
        }

        html += `
          <div style="border: 1px solid var(--border); border-radius: var(--radius-md); background: #ffffff; padding: 14px; margin-bottom: 12px; border-left: 4px solid ${doc.status === 'accepted' ? '#15803d' : (doc.status === 'rejected' ? '#dc2626' : '#0f2e59')}; box-shadow: var(--shadow-sm);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
              <div>
                <strong style="font-size: 13.5px; color: var(--primary);">${doc.name}</strong>
                <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">Requested Due Date: <strong>${doc.dueDate}</strong></div>
                ${fileContent}
              </div>
              <div>${badgeHtml}</div>
            </div>
            ${uploadControls}
          </div>
        `;
      });
      container.innerHTML = html;
    }
  }

  if (chatLog) {
    chatLog.innerHTML = room.messages.map(renderMatterChatMessage).join('');
    chatLog.scrollTop = chatLog.scrollHeight;
  }
}

function handleClientUpload(roomId, docId) {
  const rooms = getAllRooms();
  const room = rooms.find(r => r.id === roomId);
  if (!room) return;

  const doc = room.documents.find(d => d.id === docId);
  if (!doc) return;

  const exampleSel = document.getElementById(`exampleSel_${docId}`);
  const localFile = document.getElementById(`localFile_${docId}`);

  let chosenName = "";
  let chosenPath = "";

  if (exampleSel && exampleSel.value) {
    chosenPath = exampleSel.value;
    chosenName = chosenPath.split('/').pop();
  } else if (localFile && localFile.files && localFile.files[0]) {
    chosenName = localFile.files[0].name;
    chosenPath = `Example_Files/${chosenName}`;
  } else {
    chosenName = "Unit -1 AI in SDLC.pptx";
    chosenPath = "Example_Files/Unit -1 AI in SDLC.pptx";
  }

  doc.file = chosenName;
  doc.filePath = chosenPath;
  doc.status = "uploaded";
  doc.uploadDate = new Date().toLocaleDateString('en-GB');

  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  room.messages.push({
    sender: `${room.clientName} (Client)`,
    text: `Uploaded document for "${doc.name}": ${chosenName}`,
    time: time
  });

  saveAllRooms(rooms);
  alert(`Document "${chosenName}" uploaded successfully. It is now awaiting review by ${room.lawyerName}.`);
}

function handleClientChatEnter(e) {
  if (e.key === 'Enter') sendClientMessage();
}

function sendClientMessage() {
  const inp = document.getElementById('inpClientMsg');
  if (!inp || !selectedClientRoomId) return;
  const txt = inp.value.trim();
  if (!txt) return;

  const rooms = getAllRooms();
  const room = rooms.find(r => r.id === selectedClientRoomId);
  if (!room) return;

  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  room.messages.push({
    sender: `${room.clientName} (Client)`,
    text: txt,
    time: time
  });

  inp.value = '';
  saveAllRooms(rooms);
}

function renderLawyerRoom() {
  const listView = document.getElementById('lawyerRoomsListView');
  const detailView = document.getElementById('lawyerRoomDetailView');
  if (!listView || !detailView) return;

  if (selectedLawyerRoomId) {
    listView.style.display = 'none';
    detailView.style.display = 'block';
    renderLawyerRoomDetail(selectedLawyerRoomId);
  } else {
    listView.style.display = 'block';
    detailView.style.display = 'none';
    renderLawyerRoomsList();
  }
}

function renderLawyerRoomsList() {
  const tbody = document.getElementById('lawyerRoomsTableBody');
  const countBadge = document.getElementById('lawyerRoomsCountBadge');
  if (!tbody) return;

  const rooms = getAllRooms();
const lawyerRooms = rooms.filter(room => room.visibleToLawyer === true && activeProfile &&
    (room.lawyerProfileId === activeProfile.id || (!room.lawyerProfileId && String(room.lawyerName || '').replace(/^Adv\.\s*/, '') === activeProfile.name)));
  if (countBadge) countBadge.innerText = `${lawyerRooms.length} Rooms Available`;

  tbody.innerHTML = lawyerRooms.map(room => {
    const totalDocs = room.documents.length;
    const acceptedDocs = room.documents.filter(d => d.status === 'accepted').length;
    const pendingReviewDocs = room.documents.filter(d => d.status === 'uploaded').length;

    let docStatusStr = '';
    if (totalDocs === 0) {
      docStatusStr = '<span style="color: #666;">No requests</span>';
    } else if (pendingReviewDocs > 0) {
      docStatusStr = `<span class="badge badge-orange">${pendingReviewDocs} Pending Review</span> (${acceptedDocs}/${totalDocs} Verified)`;
    } else if (acceptedDocs === totalDocs) {
      docStatusStr = `<span class="badge badge-green">All ${totalDocs} Verified</span>`;
    } else {
      docStatusStr = `<span class="badge badge-blue">${acceptedDocs}/${totalDocs} Verified</span>`;
    }

    return `
      <tr>
        <td><strong>${room.token}</strong></td>
        <td>${room.caseNumber || 'Not provided'}</td>
        <td><strong>${room.caseTitle}</strong></td>
        <td>${room.clientName}</td>
        <td>${room.court}</td>
        <td>${docStatusStr}</td>
        <td>${room.nextHearing}</td>
        <td>
          <button type="button" class="btn btn-primary btn-sm" onclick="openLawyerRoom('${room.id}')">Open Chamber</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openLawyerRoom(roomId) {
  if (!activeProfile || activeProfile.role !== 'advocate') return;
  if (activeTab !== 'lawyerrooms') showTab('lawyerrooms');
  const room = getRoomById(roomId);
  if (!room || (room.lawyerProfileId && room.lawyerProfileId !== activeProfile.id)) return;
  pendingLawyerRoomId = room.id;
  selectedLawyerRoomId = null;
  const listView = document.getElementById('lawyerRoomsListView');
  const detailView = document.getElementById('lawyerRoomDetailView');
  const gate = document.getElementById('lawyerAuthenticatorGate');
  const secretBlock = document.getElementById('lawyerTotpSetup');
  const secretOutput = document.getElementById('lawyerTotpSecret');
  const input = document.getElementById('inpLawyerTotpCode');
  const title = document.getElementById('lawyerAuthenticatorTitle');
  const submit = document.getElementById('lawyerTotpSubmit');
  const error = document.getElementById('lawyerAuthenticatorError');
  const storageKey = `nyayasetu_advocate_totp_${activeProfile.id}`;
  let storedSecret = localStorage.getItem(storageKey);
  if (!storedSecret) {
    storedSecret = generateAdvocateTotpSecret();
    if (storedSecret) {
      localStorage.setItem(storageKey, storedSecret);
      localStorage.setItem(`${storageKey}_verified`, 'false');
    }
  }
  pendingAdvocateTotpSecret = storedSecret;
  if (listView) listView.style.display = 'none';
  if (detailView) detailView.style.display = 'none';
  if (gate) gate.style.display = 'block';
  // Never show the big setup key when entering the chamber:
  if (secretBlock) secretBlock.style.display = 'none';
  if (secretOutput) secretOutput.innerText = '';
  if (title) title.innerText = `Chamber Access — ${room.caseTitle}`;
  if (submit) submit.innerText = 'Verify & Enter Chamber';
  if (input) { input.value = ''; input.focus(); }
  if (error) { error.style.display = 'none'; error.innerText = ''; }
}

function generateAdvocateTotpSecret() {
  if (!window.crypto || !window.crypto.getRandomValues) return null;
  const bytes = new Uint8Array(20);
  window.crypto.getRandomValues(bytes);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0, value = 0, encoded = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) { encoded += alphabet[(value >>> (bits - 5)) & 31]; bits -= 5; value &= bits ? (1 << bits) - 1 : 0; }
  }
  if (bits > 0) encoded += alphabet[(value << (5 - bits)) & 31];
  return encoded;
}

function decodeAdvocateTotpSecret(secret) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0, value = 0;
  const bytes = [];
  for (const character of String(secret || '').toUpperCase().replace(/=+$/g, '')) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error('Invalid authenticator setup key.');
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) { bytes.push((value >>> (bits - 8)) & 255); bits -= 8; value &= bits ? (1 << bits) - 1 : 0; }
  }
  return new Uint8Array(bytes);
}

async function generateAdvocateTotpCode(secret, timestamp = Date.now()) {
  if (!window.crypto || !window.crypto.subtle) throw new Error('Time-based codes require localhost or HTTPS.');
  const key = await window.crypto.subtle.importKey('raw', decodeAdvocateTotpSecret(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const counter = Math.floor(timestamp / 30000);
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(0, Math.floor(counter / 0x100000000));
  view.setUint32(4, counter >>> 0);
  const digest = new Uint8Array(await window.crypto.subtle.sign('HMAC', key, buffer));
  const index = digest[digest.length - 1] & 15;
  const binary = ((digest[index] & 127) << 24) | ((digest[index + 1] & 255) << 16) | ((digest[index + 2] & 255) << 8) | (digest[index + 3] & 255);
  return String(binary % 1000000).padStart(6, '0');
}

async function verifyAdvocateTotp(secret, code) {
  if (!/^\d{6}$/.test(String(code).trim())) return false;
  return (await generateAdvocateTotpCode(secret)) === String(code).trim();
}

function updateBillingAuthenticatorPanel() {
  const panel = document.getElementById('billingAuthenticatorPanel');
  if (!panel) return;
  const isAdvocate = activeProfile && activeProfile.role === 'advocate';
  const isBillableTab = activeTab === 'billable';
  panel.style.display = (isAdvocate && isBillableTab) ? 'block' : 'none';
  if (!isAdvocate || !isBillableTab) return;

  const storageKey = `nyayasetu_advocate_totp_${activeProfile.id}`;
  let secret = localStorage.getItem(storageKey);
  if (!secret) {
    secret = generateAdvocateTotpSecret();
    if (!secret) return;
    localStorage.setItem(storageKey, secret);
    localStorage.setItem(`${storageKey}_verified`, 'false');
  }
  const label = encodeURIComponent(`NyayaSetu:${activeProfile.name}`);
  const link = document.getElementById('billingTotpLink');
  const secretOutput = document.getElementById('billingTotpSecret');
  if (link) link.href = `otpauth://totp/${label}?secret=${encodeURIComponent(secret)}&issuer=NyayaSetu&period=30&digits=6`;
  if (secretOutput) secretOutput.innerText = secret;
}
async function verifyLawyerRoomAuthenticator() {
  if (!activeProfile || activeProfile.role !== 'advocate') return;
  const room = getRoomById(pendingLawyerRoomId);
  const input = document.getElementById('inpLawyerTotpCode');
  const error = document.getElementById('lawyerAuthenticatorError');
  if (!room || !input) return;
  const showError = message => { if (error) { error.innerText = message; error.style.display = 'block'; } };
  const code = input.value.trim();
  if (!/^\d{6}$/.test(code)) { showError('Enter the current 6-digit Google Authenticator code.'); input.focus(); return; }
  try {
    const storageKey = `nyayasetu_advocate_totp_${activeProfile.id}`;
    const savedSecret = localStorage.getItem(storageKey);
    const secret = savedSecret || pendingAdvocateTotpSecret;
    if (!secret) { showError('Authenticator setup could not start. Use localhost or HTTPS and try again.'); return; }
    if (!await verifyAdvocateTotp(secret, code)) { showError('Code incorrect or expired. Enter the latest Google Authenticator code.'); input.select(); return; }
    if (!savedSecret) localStorage.setItem(storageKey, secret);
    localStorage.setItem(storageKey + '_verified', 'true');
    pendingAdvocateTotpSecret = null;
    pendingLawyerRoomId = null;
    const gate = document.getElementById('lawyerAuthenticatorGate');
    if (gate) gate.style.display = 'none';
    selectedLawyerRoomId = room.id;
    renderLawyerRoom();
  } catch (e) {
    showError(e && e.message ? e.message : 'Could not verify authenticator code. Try again.');
  }
}

function cancelLawyerRoomAuthenticator() {
  pendingLawyerRoomId = null;
  pendingAdvocateTotpSecret = null;
  const gate = document.getElementById('lawyerAuthenticatorGate');
  const list = document.getElementById('lawyerRoomsListView');
  if (gate) gate.style.display = 'none';
  if (list) list.style.display = 'block';
  const input = document.getElementById('inpLawyerTotpCode');
  if (input) input.value = '';
}

function closeLawyerRoom() {
  selectedLawyerRoomId = null;
  renderLawyerRoom();
}

function createNewCaseRoom() {
  const titleInp = document.getElementById('inpCreateTitle');
  const clientInp = document.getElementById('inpCreateClient');
  const courtInp = document.getElementById('inpCreateCourt');
  const caseNumberInp = document.getElementById('inpCreateCaseNumber');
  const hearingInp = document.getElementById('inpCreateNextHearing');

  const title = titleInp ? titleInp.value.trim() : '';
  const client = clientInp ? clientInp.value.trim() : '';
  const court = courtInp ? courtInp.value.trim() : '';
  const caseNumber = caseNumberInp ? caseNumberInp.value.trim().toUpperCase() : '';
  const nextHearingDate = hearingInp ? hearingInp.value : '';

  if (!title || !client) {
    alert("Please enter both the Case / Matter Title and the Client Name.");
    return;
  }

  const rooms = getAllRooms();
  const usedRoomIds = new Set(rooms.map(room => String(room.id)));
  const highestRoomNumber = rooms.reduce((highest, room) => {
    const match = String(room.id || '').match(/^NYAYA-(\d+)$/);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 705);
  let nextNum = highestRoomNumber + 1;
  while (usedRoomIds.has(`NYAYA-${nextNum}`) || LEGACY_DEFAULT_ROOM_IDS.has(`NYAYA-${nextNum}`)) nextNum++;
  const roomId = `NYAYA-${nextNum}`;
  const randomSuffix = Math.random().toString(36).substring(2, 4).toUpperCase();
  const token = `NYAYA-${nextNum}-${randomSuffix}`;
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newRoom = {
    id: roomId,
    token: token,
    caseTitle: title,
    caseNumber: caseNumber,
    clientName: client,
    lawyerName: "Adv. " + (activeProfile ? activeProfile.name : "Swati Kundu"),
    court: court || "High Court Commercial Division",
    nextHearing: nextHearingDate || 'To be scheduled',
    nextHearingDate: nextHearingDate,
    visibleToClient: false,
    visibleToLawyer: true,
    lawyerProfileId: activeProfile ? activeProfile.id : null,
    documents: [],
    messages: [
      {
        sender: "Adv. Swati Kundu",
        text: `Welcome to the secure case chamber for ${title}. Share invitation code ${token} with client ${client}.`,
        time: time
      }
    ]
  };

  rooms.push(newRoom);
  saveAllRooms(rooms);

  if (titleInp) titleInp.value = '';
  if (clientInp) clientInp.value = '';
  if (courtInp) courtInp.value = '';
  if (caseNumberInp) caseNumberInp.value = '';
  if (hearingInp) hearingInp.value = '';

  alert(`Case Room created successfully!\n\nRoom ID: ${roomId}\nInvitation Code: ${token}\n\nShare this code with client ${client} to join.`);
  openLawyerRoom(roomId);
}

function saveLawyerRoomCaseInfo(roomId) {
  if (!activeProfile || activeProfile.role !== 'advocate') return;
  const rooms = getAllRooms();
  const room = rooms.find(item => item.id === roomId && item.lawyerProfileId === activeProfile.id);
  if (!room) return;
  const caseInput = document.getElementById('inpLawyerRoomCaseNumber');
  const hearingInput = document.getElementById('inpLawyerRoomNextHearing');
  room.caseNumber = caseInput ? caseInput.value.trim().toUpperCase() : '';
  room.nextHearingDate = hearingInput ? hearingInput.value : '';
  room.nextHearing = room.nextHearingDate || 'To be scheduled';
  saveAllRooms(rooms);
  alert('Case number and next hearing saved. The client can see these details in the room and Compliance Calendar.');
}

function renderLawyerRoomDetail(roomId) {
  const room = getRoomById(roomId);
  if (!room) {
    closeLawyerRoom();
    return;
  }

  const shareCodeDisplay = document.getElementById('shareCodeDisplay');
  const titleEl = document.getElementById('lawyerRoomHeaderTitle');
  const clientEl = document.getElementById('lawyerRoomClientName');
  const courtEl = document.getElementById('lawyerRoomCourt');
  const hearingEl = document.getElementById('lawyerRoomNextHearing');
  const caseNumberEl = document.getElementById('lawyerRoomCaseNumber');
  const caseNumberInput = document.getElementById('inpLawyerRoomCaseNumber');
  const hearingInput = document.getElementById('inpLawyerRoomNextHearing');
  if (caseNumberInput) caseNumberInput.value = room.caseNumber || '';
  if (hearingInput) hearingInput.value = /^\d{4}-\d{2}-\d{2}$/.test(room.nextHearingDate || '') ? room.nextHearingDate : '';
  const reviewBadge = document.getElementById('lawyerRoomReviewBadge');
  const tbody = document.getElementById('lawyerDocTableBody');
  const chatLog = document.getElementById('lawyerChatLog');

  if (shareCodeDisplay) shareCodeDisplay.innerText = room.token;
  if (titleEl) titleEl.innerText = `Case Chamber: ${room.caseTitle}`;
  if (clientEl) clientEl.innerText = room.clientName;
  if (courtEl) courtEl.innerText = room.court;
  if (hearingEl) hearingEl.innerText = room.nextHearingDate || room.nextHearing;
  if (caseNumberEl) caseNumberEl.innerText = room.caseNumber || 'Not provided';

  const pendingReview = room.documents.filter(d => d.status === 'uploaded').length;
  if (reviewBadge) {
    if (pendingReview > 0) {
      reviewBadge.className = 'badge badge-orange';
      reviewBadge.innerText = `${pendingReview} Pending Review`;
    } else {
      reviewBadge.className = 'badge badge-green';
      reviewBadge.innerText = 'All Verified';
    }
  }

  if (tbody) {
    if (room.documents.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: #777; padding: 15px;">
            No documents requested yet for this room. Use the form above to issue a document request.
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = room.documents.map(doc => {
        let statusLabel = '';
        let actionButtons = '';

        if (doc.status === 'accepted') {
          statusLabel = '<span class="badge badge-green">Accepted</span>';
          actionButtons = `<button type="button" class="btn btn-danger btn-sm" onclick="rejectLawyerDoc('${room.id}', ${doc.id})">Reject</button>`;
        } else if (doc.status === 'rejected') {
          statusLabel = '<span class="badge badge-red">Rejected</span>';
          actionButtons = `<button type="button" class="btn btn-success btn-sm" onclick="acceptLawyerDoc('${room.id}', ${doc.id})">Accept</button>`;
        } else if (doc.status === 'uploaded') {
          statusLabel = '<span class="badge badge-orange">Awaiting Counsel Review</span>';
          actionButtons = `
            <button type="button" class="btn btn-success btn-sm" onclick="acceptLawyerDoc('${room.id}', ${doc.id})">Accept</button>
            <button type="button" class="btn btn-danger btn-sm" onclick="rejectLawyerDoc('${room.id}', ${doc.id})">Reject</button>
          `;
        } else {
          statusLabel = '<span class="badge badge-blue">Awaiting Client Upload</span>';
          actionButtons = '<span style="color: #888; font-size: 11px;">No file yet</span>';
        }

        const dlBadge = doc.isDigiLockerVerified
          ? `<br><span class="badge badge-green" style="font-size: 10px; background: #dcfce7; color: #166534; border: 1px solid #86efac;">✓ DigiLocker Verified (SHA-256 Validated)</span>`
          : '';
        const fileLink = doc.file 
          ? `<a href="${doc.filePath}" target="_blank" style="font-weight: bold;">${doc.file}</a>${dlBadge}<br><small style="color: #666;">Uploaded: ${doc.uploadDate || 'Recently'}</small>`
          : '<span style="color: #888;">Pending upload</span>';

        return `
          <tr>
            <td><strong>${doc.name}</strong></td>
            <td>${doc.dueDate}</td>
            <td>${fileLink}</td>
            <td>${statusLabel}</td>
            <td>${actionButtons}</td>
          </tr>
        `;
      }).join('');
    }
  }

  if (chatLog) {
    chatLog.innerHTML = room.messages.map(renderMatterChatMessage).join('');
    chatLog.scrollTop = chatLog.scrollHeight;
  }
}

function acceptLawyerDoc(roomId, docId) {
  const rooms = getAllRooms();
  const room = rooms.find(r => r.id === roomId);
  if (!room) return;

  const doc = room.documents.find(d => d.id === docId);
  if (!doc) return;

  doc.status = 'accepted';
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  room.messages.push({
    sender: room.lawyerName,
    text: `Verified and Accepted: "${doc.name}" (${doc.file || 'attached'}). Document verified for court submission.`,
    time: time
  });

  saveAllRooms(rooms);
  alert(`Document "${doc.name}" marked as ACCEPTED & VERIFIED.`);
}

function rejectLawyerDoc(roomId, docId) {
  const rooms = getAllRooms();
  const room = rooms.find(r => r.id === roomId);
  if (!room) return;

  const doc = room.documents.find(d => d.id === docId);
  if (!doc) return;

  const reason = prompt("Enter reason for rejection to notify client:", "Document copy is illegible / requires certified copy");
  if (reason === null) return;

  doc.status = 'rejected';
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  room.messages.push({
    sender: room.lawyerName,
    text: `Rejected: "${doc.name}". Reason: ${reason}. Please re-upload a clear copy.`,
    time: time
  });

  saveAllRooms(rooms);
  alert(`Document "${doc.name}" marked as REJECTED. Client notified to re-upload.`);
}

function addLawyerFileRequest() {
  if (!selectedLawyerRoomId) return;
  const inpName = document.getElementById('inpNewDocName');
  const inpDue = document.getElementById('inpNewDocDue');
  const name = inpName ? inpName.value.trim() : '';
  const due = inpDue ? (inpDue.value || '2026-09-24') : '2026-09-24';

  if (!name) {
    alert("Please enter a name for the document to request.");
    return;
  }

  const rooms = getAllRooms();
  const room = rooms.find(r => r.id === selectedLawyerRoomId);
  if (!room) return;

  const newId = Date.now();
  room.documents.push({
    id: newId,
    name: name,
    dueDate: due,
    file: null,
    filePath: null,
    status: "pending_upload",
    uploadDate: null
  });

  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  room.messages.push({
    sender: room.lawyerName,
    text: `New Document Request: "${name}" is required by ${due}.`,
    time: time
  });

  if (inpName) inpName.value = '';
  saveAllRooms(rooms);
  alert(`Document request for "${name}" sent to client in Room ${room.id}.`);
}

function handleLawyerChatEnter(e) {
  if (e.key === 'Enter') sendLawyerMessage();
}

function sendLawyerMessage() {
  const inp = document.getElementById('inpLawyerMsg');
  if (!inp || !selectedLawyerRoomId) return;
  const txt = inp.value.trim();
  if (!txt) return;

  const rooms = getAllRooms();
  const room = rooms.find(r => r.id === selectedLawyerRoomId);
  if (!room) return;

  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  room.messages.push({
    sender: room.lawyerName,
    text: txt,
    time: time
  });

  inp.value = '';
  saveAllRooms(rooms);
}

// ==========================================================================
// LEGAL & TAX LITERACY ASSISTANT
// ==========================================================================

// ==========================================================================
// API CONFIGURATION & KEY MANAGEMENT
// ==========================================================================

const API_KEY_STORAGE_KEY = 'nyayasetu_ai_api_key';
let currentAnalysisData = null;

function getStoredApiKey() {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
}

function initApiKeyUI() {
  const key = getStoredApiKey();
  const inp = document.getElementById('inpApiKey');
  if (inp && key) {
    inp.value = key;
  }
  updateApiKeyStatusBadge();
}

function updateApiKeyStatusBadge() {
  const badge = document.getElementById('apiKeyStatusBadge');
  if (!badge) return;
  const key = getStoredApiKey();
  if (key && key.trim().length > 0) {
    badge.className = 'badge badge-green';
    badge.innerText = 'Key Configured';
  } else {
    badge.className = 'badge badge-orange';
    badge.innerText = 'Key Not Set';
  }
}

function saveApiKey() {
  const inp = document.getElementById('inpApiKey');
  if (!inp) return;
  const key = inp.value.trim();
  if (!key) {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    updateApiKeyStatusBadge();
    alert('API key removed from local storage.');
    return;
  }
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
  updateApiKeyStatusBadge();
  alert('API Key saved successfully in local browser storage.');
}

function clearApiKey() {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
  const inp = document.getElementById('inpApiKey');
  if (inp) inp.value = '';
  updateApiKeyStatusBadge();
  alert('API Key removed.');
}

function toggleApiKeyVisibility() {
  const inp = document.getElementById('inpApiKey');
  const btn = document.getElementById('btnToggleApiKey');
  if (!inp || !btn) return;
  if (inp.type === 'password') {
    inp.type = 'text';
    btn.innerText = 'Hide';
  } else {
    inp.type = 'password';
    btn.innerText = 'Show';
  }
}

function onApiKeyInput() {
  // Real-time typing handler
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function clearQueryInput() {
  const inp = document.getElementById('txtUserQuery');
  if (inp) inp.value = '';
}

function renderInitialAnalysisState() {
  const container = document.getElementById('analysisResultArea');
  if (!container) return;
  container.innerHTML = `
    <div style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
      <h4 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">
        Awaiting Legal Problem
      </h4>
      <p style="font-size: 12.5px; color: var(--text-secondary); max-width: 440px; margin: 0 auto 16px auto; line-height: 1.55;">
        Describe your legal issue on the left and click <strong>Analyze Statutory Provisions</strong> to retrieve statutory provisions, limitation deadlines, and citizen remedies grounded in Indian law.
      </p>
      <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 5px 12px; border-radius: var(--radius-full); color: #166534;">
        <span>Statutory AI Legal Engine Active</span>
      </div>
    </div>
  `;
}

async function processLegalQuery() {
  const q = document.getElementById('txtUserQuery') ? document.getElementById('txtUserQuery').value.trim() : '';
  const container = document.getElementById('analysisResultArea');
  const btn = document.getElementById('btnAnalyzeQuery');

  if (!q) {
    alert("Please describe your legal problem or grievance in the text box first.");
    if (document.getElementById('txtUserQuery')) {
      document.getElementById('txtUserQuery').focus();
    }
    return;
  }

  // Loading state
  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Analyzing with Statutory AI...';
  }
  if (container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 50px 20px; color: var(--text-secondary);">
        <div style="display: inline-block; width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: var(--primary); border-radius: 50%; animation: spin 0.9s linear infinite; margin-bottom: 14px;"></div>
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14.5px; font-weight: 700; color: var(--primary);">Querying Statutory Legal AI Gateway...</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">Strictly referencing Constitution of India, statutory codes, limitation deadlines, and remedies</div>
      </div>
    `;
  }

  try {
    const analysisData = await fetchLegalAnalysisFromAPI(q);
    currentAnalysisData = analysisData;
    renderAnalysis(analysisData);
  } catch (err) {
    console.error('Statutory AI Gateway Error:', err);
    if (container) {
      container.innerHTML = `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #dc2626; border-radius: var(--radius-md); padding: 18px 20px;">
          <h4 style="font-family: 'Plus Jakarta Sans', sans-serif; color: #991b1b; margin-bottom: 6px; font-size: 14.5px; font-weight: 700;">
            Statutory AI Request Failed
          </h4>
          <p style="font-size: 12.5px; color: #7f1d1d; margin-bottom: 10px; line-height: 1.5;">
            ${escapeHtml(err.message || 'An error occurred while contacting the Statutory AI gateway.')}
          </p>
          <div style="font-size: 11.5px; color: #991b1b; margin-bottom: 12px;">
            Ensure the statutory advisory gateway service is running and network connectivity is active.
          </div>
          <button type="button" class="btn btn-default btn-sm" onclick="processLegalQuery()">Retry Request</button>
        </div>
      `;
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = 'Analyze Statutory Provisions';
    }
  }
}

async function fetchLegalAnalysisFromAPI(query) {
  const response = await fetch('/api/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const message = errorJson.error || `HTTP ${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  const result = await response.json();
  if (!result || !result.act) {
    throw new Error("Invalid statutory analysis format received from server.");
  }

  if (!Array.isArray(result.sections)) result.sections = [result.sections || 'General Statutory Provisions'];
  if (!Array.isArray(result.remedies)) result.remedies = [result.remedies || 'Consult competent legal counsel'];
  return result;
}

function renderAnalysis(item) {
  const container = document.getElementById('analysisResultArea');
  if (!container || !item) return;

  const sectionsHtml = (item.sections || []).map(s => `<span style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 3px 8px; font-family: ui-monospace, monospace; font-size: 11.5px; color: #0f2e59; font-weight: 600; margin-right: 6px; margin-bottom: 6px; display: inline-block;">${escapeHtml(s)}</span>`).join(' ');
  const stepsHtml = (item.remedies || []).map((r, i) => `<li style="margin-bottom: 8px;"><strong>Step ${i+1}:</strong> ${escapeHtml(r)}</li>`).join('');

  container.innerHTML = `
    <div style="margin-bottom: 14px;">
      <span style="font-size: 11px; font-weight: 600; color: #1e40af; text-transform: uppercase; letter-spacing: 0.04em; background: #eff6ff; border: 1px solid #dbeafe; padding: 3px 8px; border-radius: 4px;">${escapeHtml(item.act || 'Applicable Statutory Provisions')}</span>
      <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; font-weight: 700; color: #0f172a; margin: 8px 0 6px 0;">${escapeHtml(item.title || 'Legal Analysis')}</h3>
      <p style="font-size: 13px; color: #334155; line-height: 1.55;">${escapeHtml(item.summary || '')}</p>
      <div style="margin-top: 10px;">${sectionsHtml}</div>
    </div>

    <table class="gov-table" style="margin-bottom: 16px;">
      <tbody>
        <tr>
          <td style="width: 35%; font-weight: 600; color: #1e293b; background: #f8fafc;">Statutory Limitation</td>
          <td>${escapeHtml(item.limitation || 'As prescribed by Limitation Act, 1963')}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; color: #1e293b; background: #f8fafc;">Competent Forum</td>
          <td>${escapeHtml(item.court || 'Jurisdictional Civil / Criminal Court')}</td>
        </tr>
      </tbody>
    </table>

    <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px;">
      <div style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin-bottom: 10px;">Recommended Actionable Steps</div>
      <ol style="padding-left: 18px; font-size: 12.5px; color: #1e293b; line-height: 1.6; margin: 0;">
        ${stepsHtml}
      </ol>
    </div>
  `;
}

function transferToDrafter() {
  if (!currentAnalysisData) {
    alert("Please analyze a legal problem first using 'Analyze Statutory Provisions' before transferring to the Document Drafter.");
    return;
  }

  const item = currentAnalysisData;
  const select = document.getElementById('selectDocType');
  if (select) {
    select.value = item.docType || 'affidavit';
  }

  // Synchronize labels, placeholders & badge for selected template
  const drafter = (typeof window !== 'undefined' && window.NyayaDrafter) ? window.NyayaDrafter : null;
  const tpl = drafter && drafter.PLEADING_TEMPLATES ? drafter.PLEADING_TEMPLATES[select ? select.value : 'affidavit'] : null;
  if (tpl) {
    const lblSender = document.getElementById('lblSender');
    const lblRecipient = document.getElementById('lblRecipient');
    const lblParticulars = document.getElementById('lblParticulars');
    const lblGrievance = document.getElementById('lblGrievance');
    const lblPlace = document.getElementById('lblPlace');
    const badge = document.getElementById('drafterTemplateBadge');

    if (lblSender && tpl.labels.sender) lblSender.innerText = tpl.labels.sender;
    if (lblRecipient && tpl.labels.recipient) lblRecipient.innerText = tpl.labels.recipient;
    if (lblParticulars && tpl.labels.particulars) lblParticulars.innerText = tpl.labels.particulars;
    if (lblGrievance && tpl.labels.grievance) lblGrievance.innerText = tpl.labels.grievance;
    if (lblPlace && tpl.labels.place) lblPlace.innerText = tpl.labels.place;
    if (badge && tpl.badge) badge.innerText = tpl.badge;
  }

  if (document.getElementById('inpSender') && item.sender) {
    document.getElementById('inpSender').value = item.sender;
  }
  if (document.getElementById('inpRecipient') && item.recipient) {
    document.getElementById('inpRecipient').value = item.recipient;
  }
  if (document.getElementById('inpParticulars') && item.particulars) {
    document.getElementById('inpParticulars').value = item.particulars;
  }
  if (document.getElementById('inpGrievance') && (item.grievance || item.summary)) {
    document.getElementById('inpGrievance').value = item.grievance || item.summary;
  }

  showTab('autodraft');
}

// ==========================================================================
// COURT PLEADING DRAFTER
// ==========================================================================

let isDirectEditingActive = false;
let toastTimeout = null;

function showDrafterToast(msg) {
  const toast = document.getElementById('drafterToast');
  const txt = document.getElementById('drafterToastText');
  if (toast && txt) {
    txt.innerText = msg;
    toast.style.display = 'flex';
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.style.display = 'none';
    }, 4500);
  }
}

function hideDrafterToast() {
  const toast = document.getElementById('drafterToast');
  if (toast) toast.style.display = 'none';
}

function handleDocTypeChange() {
  const select = document.getElementById('selectDocType');
  if (!select) return;
  const type = select.value;

  const drafter = (typeof window !== 'undefined' && window.NyayaDrafter) ? window.NyayaDrafter : null;
  const tpl = drafter && drafter.PLEADING_TEMPLATES ? drafter.PLEADING_TEMPLATES[type] : null;

  if (tpl) {
    // Update Labels
    const lblSender = document.getElementById('lblSender');
    const lblRecipient = document.getElementById('lblRecipient');
    const lblParticulars = document.getElementById('lblParticulars');
    const lblGrievance = document.getElementById('lblGrievance');
    const lblPlace = document.getElementById('lblPlace');
    const badge = document.getElementById('drafterTemplateBadge');

    if (lblSender && tpl.labels.sender) lblSender.innerText = tpl.labels.sender;
    if (lblRecipient && tpl.labels.recipient) lblRecipient.innerText = tpl.labels.recipient;
    if (lblParticulars && tpl.labels.particulars) lblParticulars.innerText = tpl.labels.particulars;
    if (lblGrievance && tpl.labels.grievance) lblGrievance.innerText = tpl.labels.grievance;
    if (lblPlace && tpl.labels.place) lblPlace.innerText = tpl.labels.place;
    if (badge && tpl.badge) badge.innerText = tpl.badge;

    // Update Placeholders
    const inpSender = document.getElementById('inpSender');
    const inpRecipient = document.getElementById('inpRecipient');
    const inpParticulars = document.getElementById('inpParticulars');
    const inpGrievance = document.getElementById('inpGrievance');
    const inpPlace = document.getElementById('inpPlace');

    if (inpSender && tpl.placeholders.sender) inpSender.placeholder = tpl.placeholders.sender;
    if (inpRecipient && tpl.placeholders.recipient) inpRecipient.placeholder = tpl.placeholders.recipient;
    if (inpParticulars && tpl.placeholders.particulars) inpParticulars.placeholder = tpl.placeholders.particulars;
    if (inpGrievance && tpl.placeholders.grievance) inpGrievance.placeholder = tpl.placeholders.grievance;
    if (inpPlace && tpl.placeholders.place) inpPlace.placeholder = tpl.placeholders.place;
  }

  // Turn off manual editing mode when switching templates to show clean preview
  if (isDirectEditingActive) {
    toggleEditPreview();
  }

  renderPleading();
}

function resetDrafterDefaults() {
  const select = document.getElementById('selectDocType');
  const type = select ? select.value : 'sec138';
  const drafter = (typeof window !== 'undefined' && window.NyayaDrafter) ? window.NyayaDrafter : null;
  const tpl = drafter && drafter.PLEADING_TEMPLATES ? drafter.PLEADING_TEMPLATES[type] : null;

  if (tpl) {
    const inpSender = document.getElementById('inpSender');
    const inpRecipient = document.getElementById('inpRecipient');
    const inpParticulars = document.getElementById('inpParticulars');
    const inpGrievance = document.getElementById('inpGrievance');
    const inpPlace = document.getElementById('inpPlace');

    if (inpSender) inpSender.value = '';
    if (inpRecipient) inpRecipient.value = '';
    if (inpParticulars) inpParticulars.value = '';
    if (inpGrievance) inpGrievance.value = '';
    if (inpPlace) inpPlace.value = '';
  }

  if (isDirectEditingActive) {
    toggleEditPreview();
  }

  renderPleading();
  showDrafterToast("Cleared drafter inputs to general template defaults.");
}

function toggleEditPreview() {
  const paper = document.getElementById('pleadingPaper');
  const banner = document.getElementById('drafterEditBanner');
  const btn = document.getElementById('btnToggleEditPreview');
  if (!paper) return;

  isDirectEditingActive = !isDirectEditingActive;

  if (isDirectEditingActive) {
    paper.contentEditable = "true";
    paper.classList.add('is-editing');
    if (banner) banner.style.display = 'flex';
    if (btn) {
      btn.innerText = "Lock Preview";
      btn.classList.add('btn-primary');
      btn.classList.remove('btn-default');
    }
    paper.focus();
  } else {
    paper.contentEditable = "false";
    paper.classList.remove('is-editing');
    if (banner) banner.style.display = 'none';
    if (btn) {
      btn.innerText = "Edit Draft Directly";
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-default');
    }
  }
}

function renderPleading() {
  const paper = document.getElementById('pleadingPaper');
  if (!paper) return;

  // Don't overwrite in-flight direct edits unless user has locked preview
  if (isDirectEditingActive) {
    return;
  }

  const select = document.getElementById('selectDocType');
  const type = select ? select.value : 'sec138';

  const sender = document.getElementById('inpSender') ? document.getElementById('inpSender').value.trim() : '';
  const recipient = document.getElementById('inpRecipient') ? document.getElementById('inpRecipient').value.trim() : '';
  const particulars = document.getElementById('inpParticulars') ? document.getElementById('inpParticulars').value.trim() : '';
  const grievance = document.getElementById('inpGrievance') ? document.getElementById('inpGrievance').value.trim() : '';
  const place = document.getElementById('inpPlace') ? document.getElementById('inpPlace').value.trim() : '';
  const dlUser = (typeof getDigiLockerUser === 'function') ? getDigiLockerUser() : null;

  const drafter = (typeof window !== 'undefined' && window.NyayaDrafter) ? window.NyayaDrafter : null;

  if (drafter && typeof drafter.generatePleadingHtml === 'function') {
    paper.innerHTML = drafter.generatePleadingHtml({
      type,
      sender,
      recipient,
      particulars,
      grievance,
      place,
      dlUser
    });
  } else {
    // Basic fallback if drafter_logic hasn't loaded
    paper.innerHTML = `
      <div class="pleading-header">${type.toUpperCase()} PLEADING BRIEF</div>
      <p><strong>FROM:</strong> ${sender}</p>
      <p><strong>TO:</strong> ${recipient}</p>
      <p><strong>PARTICULARS:</strong> ${particulars}</p>
      <p><strong>GRIEVANCE:</strong> ${grievance}</p>
      <p><strong>STATION:</strong> ${place}</p>
    `;
  }
}

function printPleadingPaper() {
  window.print();
}

function copyPleadingText() {
  const paper = document.getElementById('pleadingPaper');
  if (!paper) return;
  const text = paper.innerText || paper.textContent || "";

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showDrafterToast("Statutory pleading text copied to clipboard.");
    }).catch(() => {
      fallbackCopyText(text);
    });
  } else {
    fallbackCopyText(text);
  }
}

function fallbackCopyText(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showDrafterToast("Statutory pleading text copied to clipboard.");
  } catch (err) {
    showDrafterToast("Could not copy automatically. Please select text manually.");
  }
}

function downloadPleadingDoc() {
  const paper = document.getElementById('pleadingPaper');
  if (!paper) return;

  const select = document.getElementById('selectDocType');
  const type = select ? select.value : 'notice';

  const fullHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>NyayaSetu Statutory Legal Pleading</title>
      <style>
        body { font-family: 'Times New Roman', Georgia, serif; font-size: 12pt; line-height: 1.6; color: #000; margin: 1in; }
        .pleading-header { text-align: center; font-weight: bold; font-size: 14pt; border-bottom: 2px solid #000; padding-bottom: 6pt; margin-bottom: 14pt; }
        .pleading-seal { text-align: right; font-size: 9pt; font-weight: bold; color: #881337; margin-bottom: 8pt; }
        .pleading-digilocker-stamp { border: 1.5px dashed #16a34a; background-color: #f0fdf4; padding: 10pt; margin-top: 18pt; font-size: 10pt; color: #166534; }
      </style>
    </head>
    <body>
      ${paper.innerHTML}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `NyayaSetu_${type.toUpperCase()}_Pleading_${Date.now()}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showDrafterToast("Pleading brief downloaded (.doc).");
}

function downloadPleadingText() {
  const paper = document.getElementById('pleadingPaper');
  if (!paper) return;
  const select = document.getElementById('selectDocType');
  const type = select ? select.value : 'notice';

  const blob = new Blob([paper.innerText], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `NyayaSetu_${type.toUpperCase()}_Pleading_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showDrafterToast("Pleading brief downloaded (.txt).");
}

// ==========================================================================
// BHASHINI INDIC VOICE ASSISTANT
// ==========================================================================

let speechLang = 'hi-IN';
let recording = false;
let activeMediaRecorder = null;
let recordedAudioChunks = [];
let isGrievanceRecording = false;

function setSpeechLanguage() {
  speechLang = document.getElementById('selectLang').value;
}

async function startAudioCapture() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("Microphone access is not supported by your browser.");
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  recordedAudioChunks = [];
  activeMediaRecorder = new MediaRecorder(stream);
  activeMediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedAudioChunks.push(e.data);
    }
  };
  activeMediaRecorder.start();
  return activeMediaRecorder;
}

async function stopAudioCaptureAndDetect(targetLang = 'unknown') {
  return new Promise((resolve, reject) => {
    if (!activeMediaRecorder || activeMediaRecorder.state === 'inactive') {
      return reject(new Error("No active recording session."));
    }

    activeMediaRecorder.onstop = async () => {
      if (activeMediaRecorder.stream) {
        activeMediaRecorder.stream.getTracks().forEach(t => t.stop());
      }

      const mimeType = activeMediaRecorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(recordedAudioChunks, { type: mimeType });

      if (audioBlob.size < 100) {
        return resolve({ transcript: '', language_code: targetLang });
      }

      try {
        const response = await fetch(`/api/ai/voice-detect?lang=${encodeURIComponent(targetLang)}`, {
          method: 'POST',
          headers: {
            'Content-Type': mimeType
          },
          body: audioBlob
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.details || err.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };

    activeMediaRecorder.stop();
  });
}

async function toggleRecordVoice() {
  const btn = document.getElementById('btnRecord');
  const status = document.getElementById('micStatus');

  if (!recording) {
    try {
      await startAudioCapture();
      recording = true;
      if (btn) {
        btn.innerText = 'Stop & Detect Voice';
        btn.className = 'btn btn-danger btn-sm';
      }
      if (status) {
        status.style.display = 'block';
        status.innerText = 'Listening to microphone... Speak in your regional language (Hindi, Marathi, English, Tamil).';
      }
    } catch (err) {
      console.error('Mic access error:', err);
      alert('Could not access microphone: ' + err.message);
    }
  } else {
    recording = false;
    if (btn) {
      btn.innerText = 'Detecting Voice...';
      btn.disabled = true;
    }
    if (status) {
      status.innerText = 'Detecting Indic voice...';
    }

    try {
      const result = await stopAudioCaptureAndDetect(speechLang || 'unknown');
      if (status) status.style.display = 'none';

      if (result.transcript && result.transcript.trim()) {
        addVoiceBubble(result.transcript.trim(), true);
      } else {
        alert("No clear speech detected. Please speak into your microphone and try again.");
      }
    } catch (err) {
      console.error('Voice detect error:', err);
      if (status) status.style.display = 'none';
      alert('Voice detection error: ' + err.message);
    } finally {
      if (btn) {
        btn.innerText = 'Record Voice';
        btn.className = 'btn btn-primary btn-sm';
        btn.disabled = false;
      }
    }
  }
}

async function toggleRecordGrievance() {
  const btn = document.getElementById('btnRecordGrievance');
  const status = document.getElementById('grievanceMicStatus');
  const txt = document.getElementById('txtUserQuery');

  if (!isGrievanceRecording) {
    try {
      await startAudioCapture();
      isGrievanceRecording = true;
      if (btn) {
        btn.innerHTML = 'Stop & Detect Voice';
        btn.className = 'btn btn-danger';
      }
      if (status) {
        status.style.display = 'inline-block';
        status.innerText = 'Listening to microphone... Speak your legal problem.';
      }
    } catch (err) {
      alert('Microphone error: ' + err.message);
    }
  } else {
    isGrievanceRecording = false;
    if (btn) {
      btn.innerHTML = 'Detecting Voice...';
      btn.disabled = true;
    }
    if (status) {
      status.innerText = 'Detecting speech...';
    }

    try {
      const result = await stopAudioCaptureAndDetect('unknown');
      if (status) status.style.display = 'none';

      if (result.transcript && result.transcript.trim()) {
        if (txt) {
          txt.value = (txt.value ? txt.value + ' ' : '') + result.transcript.trim();
        }
      } else {
        alert("No clear speech detected. Please try speaking again.");
      }
    } catch (err) {
      if (status) status.style.display = 'none';
      alert('Voice detection error: ' + err.message);
    } finally {
      if (btn) {
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: -2px; margin-right: 4px;"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg> Speak Grievance`;
        btn.className = 'btn btn-default';
        btn.disabled = false;
      }
    }
  }
}

function handleVoiceEnter(e) {
  if (e.key === 'Enter') {
    sendVoiceMessage();
  }
}

function sendVoiceMessage() {
  const inp = document.getElementById('inpVoiceText');
  const text = inp.value.trim();
  if (!text) return;

  addVoiceBubble(text, false);
  inp.value = '';
}

function triggerVoiceSample(lang, text) {
  if (lang === 'mr') speechLang = 'mr-IN';
  else if (lang === 'hi') speechLang = 'hi-IN';
  else speechLang = 'en-IN';

  document.getElementById('selectLang').value = speechLang;
  addVoiceBubble(text, true);
}

async function addVoiceBubble(userText, isVoice) {
  const log = document.getElementById('voiceChatLog');
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const userRow = document.createElement('div');
  userRow.className = 'chat-row user';
  userRow.innerHTML = `
    ${isVoice ? '<strong>[Voice Input]</strong> ' : ''}${escapeHtml(userText)}
    <div class="chat-time">${time}</div>
  `;
  log.appendChild(userRow);
  log.scrollTop = log.scrollHeight;

  // Add temporary typing indicator
  const typingRow = document.createElement('div');
  typingRow.className = 'chat-row bot';
  typingRow.id = 'botTypingIndicator';
  typingRow.innerHTML = `<em>Consulting Statutory Legal Assistant...</em>`;
  log.appendChild(typingRow);
  log.scrollTop = log.scrollHeight;

  try {
    const response = await fetch('/api/ai/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: userText, lang: speechLang })
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP ${response.status}`);
    }

    const resJson = await response.json();
    const botText = resJson.reply || "No response received from statutory AI service.";

    typingRow.remove();
    appendBotResponse(botText.replace(/\n/g, '<br>'), botText.replace(/[*_#]/g, ''));
  } catch (err) {
    typingRow.remove();
    appendBotResponse(
      `<strong>Statutory Gateway Notice:</strong> ${escapeHtml(err.message)}<br><small>Please retry your query or check server connectivity.</small>`,
      `Statutory AI request failed. Please retry.`
    );
  }
}

function appendBotResponse(replyHtml, spokenText) {
  const log = document.getElementById('voiceChatLog');
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const botRow = document.createElement('div');
  botRow.className = 'chat-row bot';
  botRow.innerHTML = `
    <div>${replyHtml}</div>
    <div style="margin-top: 6px;">
      <button type="button" class="btn btn-default btn-sm" onclick="speakAudio('${encodeURIComponent(spokenText)}')">Play Voice (TTS)</button>
    </div>
    <div class="chat-time">${time}</div>
  `;
  log.appendChild(botRow);
  log.scrollTop = log.scrollHeight;

  speakAudio(encodeURIComponent(spokenText));
}

async function speakAudio(encoded) {
  const text = decodeURIComponent(encoded);
  if (!text) return;

  try {
    const res = await fetch('/api/ai/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang: speechLang || 'hi-IN' })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audio) {
        const audio = new Audio('data:audio/wav;base64,' + data.audio);
        audio.play().catch(e => console.warn('Autoplay audio blocked:', e));
        return;
      }
    }
  } catch (err) {
    console.warn('Voice synthesis error, falling back to speech synthesis:', err);
  }

  // Graceful browser fallback
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = speechLang || 'hi-IN';
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }
}

// ==========================================================================
// REAL-TIME eCOURTS DISTRICT PORTAL CNR SEARCH & VISITOR CAPTCHA SOLVER
// ==========================================================================

const RECENT_CASES_STORAGE_KEY = 'nyayasetu_recent_cases';
const TRACKED_CASES_STORAGE_KEY = 'nyayasetu_tracked_cases';
function getTrackedCasesStorageKey() { return activeProfile ? TRACKED_CASES_STORAGE_KEY + '_' + activeProfile.id : TRACKED_CASES_STORAGE_KEY; }
function getRecentCasesStorageKey() { return activeProfile && activeProfile.role === 'advocate' ? `${RECENT_CASES_STORAGE_KEY}_advocate_${activeProfile.id}` : RECENT_CASES_STORAGE_KEY; }
let currentEcourtSessionId = null;
let currentSnapshotCnr = null;

function initEcourtsCaseSearch() {
  renderRecentSearches();
}

function showEcourtAlert(msg, type = 'error') {
  const banner = document.getElementById('ecourtsStatusBanner');
  if (!banner) return;
  if (!msg) {
    banner.style.display = 'none';
    banner.innerHTML = '';
    return;
  }
  banner.className = `ecourts-alert ecourts-alert-${type}`;
  banner.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
    <span>${msg}</span>
  `;
  banner.style.display = 'flex';
}

function showEcourtLoading(msg) {
  const banner = document.getElementById('ecourtsStatusBanner');
  if (!banner) return;
  banner.className = 'ecourts-alert ecourts-alert-info';
  banner.innerHTML = `
    <svg class="rotating" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>
    <span>${msg}</span>
  `;
  banner.style.display = 'flex';
}

function fillCNR(cnr) {
  const inp = document.getElementById('inpCNR');
  if (inp) {
    inp.value = cnr;
    startCnrSearch();
  }
}

function clearCnrSearch() {
  const inp = document.getElementById('inpCNR');
  if (inp) inp.value = '';
  const captchaBox = document.getElementById('ecourtsCaptchaBox');
  if (captchaBox) captchaBox.style.display = 'none';
  const statusBanner = document.getElementById('ecourtsStatusBanner');
  if (statusBanner) statusBanner.style.display = 'none';
  const snapBanner = document.getElementById('ecourtsSnapshotBanner');
  if (snapBanner) snapBanner.style.display = 'none';
  const resultsContainer = document.getElementById('ecourtsResultsContainer');
  if (resultsContainer) resultsContainer.style.display = 'none';
  const emptyState = document.getElementById('ecourtsEmptyState');
  if (emptyState) emptyState.style.display = 'block';
  currentEcourtSessionId = null;
  currentSnapshotCnr = null;
}

function toggleCaptchaZoom() {
  const wrapper = document.getElementById('captchaImgWrapper');
  const btn = document.getElementById('btnZoomCaptcha');
  if (!wrapper) return;
  wrapper.classList.toggle('zoomed');
  const isZoomed = wrapper.classList.contains('zoomed');
  if (btn) {
    btn.innerHTML = isZoomed ? 'Zoom Out' : 'Zoom In';
  }
}

function cancelEcourtCaptcha() {
  const wrapper = document.getElementById('captchaImgWrapper');
  if (wrapper) wrapper.classList.remove('zoomed');
  const btn = document.getElementById('btnZoomCaptcha');
  if (btn) btn.innerHTML = 'Zoom In';
  const captchaBox = document.getElementById('ecourtsCaptchaBox');
  if (captchaBox) captchaBox.style.display = 'none';
  const statusBanner = document.getElementById('ecourtsStatusBanner');
  if (statusBanner) statusBanner.style.display = 'none';
  currentEcourtSessionId = null;
}

async function startCnrSearch() {
  const inp = document.getElementById('inpCNR');
  const rawCnr = (inp ? inp.value : '').trim();
  const cnr = rawCnr.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  if (!cnr || cnr.length !== 16) {
    showEcourtAlert('Please enter a valid 16-character CNR number (e.g. MHNG010045212024).', 'error');
    if (inp) inp.focus();
    return;
  }

  // Update input with clean formatting
  inp.value = cnr;

  // Reset UI
  showEcourtLoading('Connecting to official eCourts portal (services.ecourts.gov.in)...');
  const captchaBox = document.getElementById('ecourtsCaptchaBox');
  if (captchaBox) captchaBox.style.display = 'none';
  const snapBanner = document.getElementById('ecourtsSnapshotBanner');
  if (snapBanner) snapBanner.style.display = 'none';
  const btn = document.getElementById('btnStartCnrSearch');
  if (btn) btn.disabled = true;

  try {
    const res = await fetch('/api/search/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cnr })
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.error === 'RATE_LIMITED') {
        showEcourtAlert('Search limit exceeded (max 10 searches per minute). Please wait 60 seconds.', 'error');
      } else {
        showEcourtAlert(data.message || 'Unable to connect to eCourts portal. Please try again.', 'error');
      }
      return;
    }

    // Success: save sessionId and display captcha image
    currentEcourtSessionId = data.sessionId;
    const captchaImg = document.getElementById('ecourtsCaptchaImg');
    if (captchaImg) {
      captchaImg.src = data.captchaImage;
    }

    // Hide loading banner and display captcha box
    showEcourtAlert('');
    if (captchaBox) {
      captchaBox.style.display = 'block';
      const captchaInp = document.getElementById('inpCaptchaCode');
      if (captchaInp) {
        captchaInp.value = '';
        captchaInp.focus();
      }
    }
  } catch (err) {
    showEcourtAlert('Network error connecting to local eCourts proxy. Is the server running?', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function refreshEcourtCaptcha() {
  if (!currentEcourtSessionId) {
    startCnrSearch();
    return;
  }

  const btn = document.getElementById('btnRefreshCaptcha');
  if (btn) btn.disabled = true;
  showEcourtLoading('Fetching fresh security captcha from official portal...');

  try {
    const res = await fetch('/api/search/refresh-captcha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: currentEcourtSessionId })
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.error === 'SESSION_EXPIRED') {
        showEcourtAlert('Session expired. Starting a fresh search session...', 'error');
        startCnrSearch();
      } else {
        showEcourtAlert(data.message || 'Failed to refresh captcha. Please try again.', 'error');
      }
      return;
    }

    const captchaImg = document.getElementById('ecourtsCaptchaImg');
    if (captchaImg) {
      captchaImg.src = data.captchaImage;
    }
    showEcourtAlert('');
    const captchaInp = document.getElementById('inpCaptchaCode');
    if (captchaInp) {
      captchaInp.value = '';
      captchaInp.focus();
    }
  } catch (err) {
    showEcourtAlert('Error refreshing captcha. Please click Search again.', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function submitEcourtCaptcha() {
  if (!currentEcourtSessionId) {
    showEcourtAlert('Session expired. Please click "Search eCourts" to start a new search.', 'error');
    return;
  }

  const captchaInp = document.getElementById('inpCaptchaCode');
  const captcha = (captchaInp ? captchaInp.value : '').trim();

  if (!captcha) {
    showEcourtAlert('Please enter the captcha text shown in the image.', 'error');
    if (captchaInp) captchaInp.focus();
    return;
  }

  const submitBtn = document.getElementById('btnSubmitCaptcha');
  if (submitBtn) submitBtn.disabled = true;
  showEcourtLoading('Querying official eCourts National Judicial Data Grid...');

  try {
    const res = await fetch('/api/search/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: currentEcourtSessionId,
        captcha: captcha
      })
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.error === 'WRONG_CAPTCHA') {
        showEcourtAlert('eCourts rejected the previous entry. The image below is a NEW captcha and the entry field was cleared. Type the new image exactly, preserving letter case. Click "Zoom In" to distinguish similar characters.', 'error');
        if (data.captchaImage) {
          const captchaImg = document.getElementById('ecourtsCaptchaImg');
          if (captchaImg) captchaImg.src = data.captchaImage;
        } else {
          refreshEcourtCaptcha();
        }
        if (captchaInp) {
          captchaInp.value = '';
          captchaInp.focus();
        }
      } else if (data.error === 'CASE_NOT_FOUND') {
        showEcourtAlert(data.message || 'No case record found for this CNR in eCourts database.', 'error');
        const captchaBox = document.getElementById('ecourtsCaptchaBox');
        if (captchaBox) captchaBox.style.display = 'none';
        const resultsContainer = document.getElementById('ecourtsResultsContainer');
        if (resultsContainer) resultsContainer.style.display = 'none';
        const emptyState = document.getElementById('ecourtsEmptyState');
        if (emptyState) emptyState.style.display = 'block';
      } else if (data.error === 'SESSION_EXPIRED') {
        showEcourtAlert('Your 10-minute session has expired. Click Search to start a new lookup.', 'error');
        const captchaBox = document.getElementById('ecourtsCaptchaBox');
        if (captchaBox) captchaBox.style.display = 'none';
        currentEcourtSessionId = null;
      } else if (data.error === 'RATE_LIMITED') {
        showEcourtAlert('Rate limit reached (max 10 searches per minute). Please wait.', 'error');
      } else if (['PORTAL_SESSION_REJECTED', 'PORTAL_SEARCH_REJECTED', 'PORTAL_UNAVAILABLE'].includes(data.error)) {
        // The official site may invalidate its session or change its response
        // format after displaying a captcha. Do not leave the visitor retrying
        // against a stale captcha/session; they must start a fresh search.
        currentEcourtSessionId = null;
        if (captchaInp) captchaInp.value = '';
        const captchaBox = document.getElementById('ecourtsCaptchaBox');
        if (captchaBox) captchaBox.style.display = 'none';
        showEcourtAlert(`${data.message || 'The official eCourts request could not be completed.'} Click Search eCourts to start a fresh session and receive a new captcha.`, 'error');
      } else {
        showEcourtAlert(data.message || 'Official eCourts portal returned an error. Please try again.', 'error');
      }
      return;
    }

    // Success!
    showEcourtAlert('');
    const captchaBox = document.getElementById('ecourtsCaptchaBox');
    if (captchaBox) captchaBox.style.display = 'none';
    const snapBanner = document.getElementById('ecourtsSnapshotBanner');
    if (snapBanner) snapBanner.style.display = 'none';

    // Render normalized case details
    renderCaseDetails(data, false);

    // Save snapshot to localStorage
    saveCaseSnapshot(data);

  } catch (err) {
    showEcourtAlert('Failed to communicate with eCourts backend. Please check network connection.', 'error');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

function renderCaseDetails(data, isSnapshot = false, savedAt = null) {
  // Title & Status
  const title = data.caseType || `Case Record (CNR: ${data.cnr})`;
  const titleDisplay = document.getElementById('caseTitleDisplay');
  if (titleDisplay) titleDisplay.innerText = title;

  const statusBadge = document.getElementById('caseStatusBadge');
  const status = data.status || 'Active';
  if (statusBadge) {
    statusBadge.innerText = status;
    statusBadge.className = status.toLowerCase().includes('disposed') ? 'badge badge-green' : 'badge badge-orange';
  }

  // Key Fields
  const courtAndJudgeDisplay = document.getElementById('courtAndJudgeDisplay');
  if (courtAndJudgeDisplay) courtAndJudgeDisplay.innerText = data.courtAndJudge || 'District Court Complex';

  const caseTypeDisplay = document.getElementById('caseTypeDisplay');
  if (caseTypeDisplay) caseTypeDisplay.innerText = data.caseType || '—';

  const filingText = data.filingNumber ? `${data.filingNumber} (Filed: ${data.filingDate || '—'})` : (data.filingDate ? `Filed on ${data.filingDate}` : '—');
  const filingDetailsDisplay = document.getElementById('filingDetailsDisplay');
  if (filingDetailsDisplay) filingDetailsDisplay.innerText = filingText;

  const regText = data.registrationNumber ? `${data.registrationNumber} (Reg: ${data.registrationDate || '—'})` : (data.registrationDate ? `Registered on ${data.registrationDate}` : '—');
  const registrationDetailsDisplay = document.getElementById('registrationDetailsDisplay');
  if (registrationDetailsDisplay) registrationDetailsDisplay.innerText = regText;

  const petitionerDisplay = document.getElementById('petitionerDisplay');
  if (petitionerDisplay) petitionerDisplay.innerText = data.petitioner || '—';

  const respondentDisplay = document.getElementById('respondentDisplay');
  if (respondentDisplay) respondentDisplay.innerText = data.respondent || '—';

  const stageDisplay = document.getElementById('stageDisplay');
  if (stageDisplay) stageDisplay.innerText = data.stage || '-';

  const nextHearing = data.nextHearingDate || 'Not Scheduled / Listed';
  const nextHearingDisplay = document.getElementById('nextHearingDisplay');
  if (nextHearingDisplay) nextHearingDisplay.innerText = nextHearing;

  const cnrNumberDisplay = document.getElementById('cnrNumberDisplay');
  if (cnrNumberDisplay) cnrNumberDisplay.innerText = data.cnr;

  // Hearing History Table
  const tbody = document.getElementById('historyTableBody');
  const noHist = document.getElementById('noHistoryNotice');

  if (tbody) {
    if (Array.isArray(data.history) && data.history.length > 0) {
      tbody.innerHTML = data.history.map(h => `
        <tr>
          <td style="font-weight: bold; color: #003366;">${h.date || '—'}</td>
          <td>${h.purpose || '—'}</td>
          <td style="font-size: 11.5px; color: #334155;">${h.businessOnDate || '—'}</td>
        </tr>
      `).join('');
      if (noHist) noHist.style.display = 'none';
    } else {
      tbody.innerHTML = '';
      if (noHist) noHist.style.display = 'block';
    }
  }

  // Display results, hide empty state
  const emptyState = document.getElementById('ecourtsEmptyState');
  if (emptyState) emptyState.style.display = 'none';
  const resultsContainer = document.getElementById('ecourtsResultsContainer');
  if (resultsContainer) resultsContainer.style.display = 'flex';

  // Snapshot Banner handling
  const snapBanner = document.getElementById('ecourtsSnapshotBanner');
  if (snapBanner) {
    if (isSnapshot && savedAt) {
      currentSnapshotCnr = data.cnr;
      const formattedDate = new Date(savedAt).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const snapLabel = document.getElementById('snapshotBannerLabel');
      if (snapLabel) {
        snapLabel.innerHTML = `Saved snapshot from ${formattedDate}, may be out of date.`;
      }
      snapBanner.style.display = 'flex';
    } else {
      snapBanner.style.display = 'none';
    }
  }
}

function saveCaseSnapshot(data) {
  try {
    const raw = localStorage.getItem(getRecentCasesStorageKey());
    let list = raw ? JSON.parse(raw) : [];

    // Filter out existing item for same CNR
    list = list.filter(item => item.cnr !== data.cnr);

    const parties = (data.petitioner && data.respondent)
      ? `${data.petitioner.split('\n')[0].substring(0, 25)} v. ${data.respondent.split('\n')[0].substring(0, 25)}`
      : (data.petitioner || data.respondent || 'Litigants recorded');

    // Add new snapshot at the beginning
    list.unshift({
      cnr: data.cnr,
      status: data.status || 'Active',
      nextHearingDate: data.nextHearingDate || '—',
      parties: parties,
      savedAt: new Date().toISOString(),
      data: data
    });

    // Cap at 10 recent searches
    if (list.length > 10) list = list.slice(0, 10);

    localStorage.setItem(getRecentCasesStorageKey(), JSON.stringify(list));
    const tracked = getTrackedCases();
    const trackedItem = tracked.find(item => item.cnr === data.cnr);
    if (trackedItem) {
      trackedItem.data = data;
      trackedItem.savedAt = list[0].savedAt;
      trackedItem.parties = list[0].parties;
      localStorage.setItem(getTrackedCasesStorageKey(), JSON.stringify(tracked));
    }
    renderRecentSearches();
    renderTrackedCases();
  } catch (e) {
    console.error('Failed to save case snapshot:', e);
  }
}

function renderRecentSearches() {
  const container = document.getElementById('ecourtsRecentContainer');
  const chipsWrapper = document.getElementById('ecourtsRecentChips');
  if (!container || !chipsWrapper) return;

  try {
    const raw = localStorage.getItem(getRecentCasesStorageKey());
    const list = raw ? JSON.parse(raw) : [];

    if (list.length === 0) {
      container.style.display = 'none';
      chipsWrapper.innerHTML = '';
      return;
    }

    container.style.display = 'block';
    chipsWrapper.innerHTML = list.map(item => {
      const tracked = isCaseTracked(item.cnr);
      const status = String(item.status || 'Unknown');
      const trackingButton = `<button type="button" class="btn btn-default btn-sm" onclick="toggleCaseTracking('${escapeHtml(item.cnr)}', event)">${tracked ? 'Stop tracking' : 'Start tracking'}</button>`;
      return `
        <div class="recent-case-chip" onclick="loadRecentSnapshot('${escapeHtml(item.cnr)}')" title="Click to view saved snapshot (${escapeHtml(item.savedAt || '')})">
          <strong>${escapeHtml(item.cnr)}</strong>
          <span class="badge badge-mini ${status.toLowerCase().includes('disposed') ? 'badge-green' : 'badge-orange'}">${escapeHtml(status)}</span>
          <span style="color: #64748b;">${escapeHtml(item.parties || '')}</span>
          <span style="font-size: 10px; color: #0284c7;">(${escapeHtml(item.nextHearingDate || 'Not scheduled')})</span>
          ${trackingButton}
        </div>
      `;
    }).join('');
  } catch (e) {
    container.style.display = 'none';
  }
}

function loadRecentSnapshot(cnr) {
  try {
    const raw = localStorage.getItem(getRecentCasesStorageKey());
    const list = raw ? JSON.parse(raw) : [];
    const item = list.find(s => s.cnr === cnr);
    if (!item) return;

    // Fill input field
    const inp = document.getElementById('inpCNR');
    if (inp) inp.value = item.cnr;

    // Hide captcha box and errors
    const captchaBox = document.getElementById('ecourtsCaptchaBox');
    if (captchaBox) captchaBox.style.display = 'none';
    showEcourtAlert('');

    // Render snapshot
    renderCaseDetails(item.data, true, item.savedAt);
  } catch (e) {
    console.error('Failed to load recent snapshot:', e);
  }
}

function refreshCurrentSnapshot() {
  if (currentSnapshotCnr) {
    fillCNR(currentSnapshotCnr);
  }
}

function clearRecentSearches() {
  localStorage.removeItem(getRecentCasesStorageKey());
  renderRecentSearches();
}
function getTrackedCases() {
  try {
    const key = getTrackedCasesStorageKey();
    let raw = localStorage.getItem(key);
    if (raw === null && activeProfile && activeProfile.role === 'citizen') {
      raw = localStorage.getItem(TRACKED_CASES_STORAGE_KEY);
      if (raw !== null) localStorage.setItem(key, raw);
    }
    const tracked = JSON.parse(raw || '[]');
    return Array.isArray(tracked) ? tracked.filter(item => item && item.cnr && item.data) : [];
  } catch (e) {
    console.error('Failed to read tracked eCourts cases:', e);
    return [];
  }
}

function isCaseTracked(cnr) {
  return getTrackedCases().some(item => item.cnr === cnr);
}

function toggleCaseTracking(cnr, event) {
  if (event) event.stopPropagation();
  try {
    const tracked = getTrackedCases();
    const existingIndex = tracked.findIndex(item => item.cnr === cnr);
    if (existingIndex >= 0) {
      tracked.splice(existingIndex, 1);
    } else {
      const snapshots = JSON.parse(localStorage.getItem(getRecentCasesStorageKey()) || '[]');
      const snapshot = snapshots.find(item => item.cnr === cnr);
      if (!snapshot || !snapshot.data) return;
      tracked.push({ cnr: snapshot.cnr, data: snapshot.data, parties: snapshot.parties, savedAt: snapshot.savedAt, startedAt: new Date().toISOString() });
    }
    localStorage.setItem(getTrackedCasesStorageKey(), JSON.stringify(tracked));
    renderRecentSearches();
    renderTrackedCases();
  } catch (e) {
    console.error('Failed to update tracked eCourts cases:', e);
  }
}

function parseEcourtsDate(value) {
  const text = String(value || '').trim();
  let match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), 12);
  match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  return null;
}

function getHearingCountdown(value) {
  const hearingDate = parseEcourtsDate(value);
  if (!hearingDate) return { label: 'No hearing date', className: 'badge-blue' };
  hearingDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((hearingDate - today) / 86400000);
  if (days === 0) return { label: 'Today', className: 'badge-orange' };
  if (days === 1) return { label: '1 day left', className: 'badge-orange' };
  if (days > 1) return { label: `${days} days left`, className: 'badge-green' };
  if (days === -1) return { label: '1 day overdue', className: 'badge-red' };
  return { label: `${Math.abs(days)} days overdue`, className: 'badge-red' };
}
function openRoomFromCalendar(roomId) {
  if (!activeProfile) return;
  if (activeProfile.role === 'advocate') {
    showTab('lawyerrooms');
    openLawyerRoom(roomId);
  } else {
    showTab('clientroom');
    openClientRoom(roomId);
  }
}

function openEcourtsSnapshotFromCalendar(cnr) {
  showTab('ecourts');
  loadRecentSnapshot(cnr);
}

function renderTrackedCases() {
  const tbody = document.getElementById('trackedCasesTableBody');
  const emptyState = document.getElementById('trackedCasesEmptyState');
  if (!tbody) return;
  const description = document.getElementById('trackedCasesDescription');
  const isAdvocate = activeProfile && activeProfile.role === 'advocate';
  if (description) description.innerText = isAdvocate
    ? 'Your tracked eCourts cases, saved case searches, and assigned private chambers appear here, sorted by the soonest hearing date.'
    : 'Tracked eCourts cases and private rooms joined by you appear here, sorted by the soonest hearing date.';

  const tracked = getTrackedCases().map(item => ({ ...item, type: 'ecourts', hearingDate: parseEcourtsDate(item.data.nextHearingDate) }));
  const trackedCnrs = new Set(tracked.map(item => item.cnr));
  let savedSearches = [];
  if (isAdvocate) {
    try {
      const recent = JSON.parse(localStorage.getItem(getRecentCasesStorageKey()) || '[]');
      savedSearches = (Array.isArray(recent) ? recent : []).filter(item => item && item.cnr && item.data && !trackedCnrs.has(item.cnr))
        .map(item => ({ ...item, type: 'recent', hearingDate: parseEcourtsDate(item.data.nextHearingDate || item.nextHearingDate) }));
    } catch (e) { savedSearches = []; }
  }

  const rooms = getAllRooms().filter(room => isAdvocate
    ? room.visibleToLawyer === true && (room.lawyerProfileId === activeProfile.id || (!room.lawyerProfileId && String(room.lawyerName || '').replace(/^Adv\.\s*/, '') === activeProfile.name))
    : room.visibleToClient === true && ((Array.isArray(room.clientProfileIds) && room.clientProfileIds.includes(activeProfile.id)) || (!Array.isArray(room.clientProfileIds) && room.clientName === activeProfile.name)))
    .map(room => ({ type: 'room', roomId: room.id, cnr: room.caseNumber || room.token, parties: room.caseTitle,
      data: { status: 'Private case room', nextHearingDate: room.nextHearingDate || room.nextHearing, stage: 'Case room' },
      hearingDate: parseEcourtsDate(room.nextHearingDate || room.nextHearing), startedAt: room.joinedAt || '' }));

  const items = [...tracked, ...savedSearches, ...rooms].sort((a, b) => {
    if (a.hearingDate && b.hearingDate) return a.hearingDate - b.hearingDate;
    if (a.hearingDate) return -1;
    if (b.hearingDate) return 1;
    return String(a.startedAt || a.savedAt || '').localeCompare(String(b.startedAt || b.savedAt || ''));
  });
  if (!items.length) { tbody.innerHTML = ''; if (emptyState) emptyState.style.display = 'block'; return; }
  if (emptyState) emptyState.style.display = 'none';
  tbody.innerHTML = items.map(item => {
    const data = item.data;
    const title = item.parties || data.caseType || 'eCourts case';
    const status = data.status || 'Unknown';
    const hearing = data.nextHearingDate || item.nextHearingDate || 'Not scheduled';
    const countdown = getHearingCountdown(hearing);
    let action;
    if (item.type === 'room') action = `<button type="button" class="btn btn-default btn-sm" onclick="openRoomFromCalendar('${escapeHtml(item.roomId)}')">Open Room</button>`;
    else if (item.type === 'recent') action = `<button type="button" class="btn btn-default btn-sm" onclick="openEcourtsSnapshotFromCalendar('${escapeHtml(item.cnr)}')">Open Search</button> <button type="button" class="btn btn-primary btn-sm" onclick="toggleCaseTracking('${escapeHtml(item.cnr)}')">Start tracking</button>`;
    else action = `<button type="button" class="btn btn-default btn-sm" onclick="toggleCaseTracking('${escapeHtml(item.cnr)}')">Stop tracking</button>`;
    return `<tr><td><strong>${escapeHtml(title)}</strong><br><code>${escapeHtml(item.cnr)}</code></td><td>${escapeHtml(status)}</td><td>${escapeHtml(hearing)}</td><td><span class="badge ${countdown.className}">${escapeHtml(countdown.label)}</span></td><td>${escapeHtml(data.stage || '-')}</td><td>${action}</td></tr>`;
  }).join('');
}

function renderMatterChatMessage(message) {
  if (message.type === 'billing_session' && message.session) {
    const session = message.session;
    return `
      <div class="chat-row billing-session-card" style="background:#eff6ff;border:1px solid #93c5fd;border-left:4px solid #2563eb;border-radius:8px;padding:12px;margin:10px 0;">
        <strong>Billable matter session</strong>
        <div style="margin-top:6px;">${escapeHtml(session.activity || 'Legal work')}</div>
        <div style="font-size:12px;color:#334155;margin-top:5px;">${escapeHtml(session.date || '')} | ${escapeHtml(session.startTime || '')} | ${escapeHtml(session.duration || '')}</div>
        <div style="font-weight:700;color:#0f3b70;margin-top:6px;">Amount: INR ${Number(session.amount || 0).toLocaleString('en-IN')} at INR ${Number(session.hourlyRate || 2500).toLocaleString('en-IN')}/hour</div>
        <div class="chat-time">Recorded by ${escapeHtml(message.sender || 'Advocate')} | ${escapeHtml(message.time || '')}</div>
      </div>
    `;
  }
  const sender = String(message.sender || '');
  const isClient = sender.includes('Client');
  const alignment = isClient ? 'user' : 'bot';
  return `<div class="chat-row ${alignment}"><strong>${escapeHtml(sender)}:</strong><br>${escapeHtml(message.text || '')}<div class="chat-time">${escapeHtml(message.time || '')}</div></div>`;
}
// ADVOCATE PRACTICE MANAGEMENT & BILLABLE STOPWATCH
// ==========================================================================

function renderPracticeDocket() {
  updateBillingAuthenticatorPanel();
  const tbody = document.getElementById('tbodyMatters');
  if (!tbody || !activeProfile || activeProfile.role !== 'advocate') return;
  const rooms = getAllRooms().filter(room => room.visibleToLawyer &&
    (room.lawyerProfileId === activeProfile.id || (!room.lawyerProfileId && String(room.lawyerName || '').replace(/^Adv\.\s*/, '') === activeProfile.name)));
  const matterSelect = document.getElementById('selTimerMatter');
  if (matterSelect) matterSelect.innerHTML = rooms.length
    ? rooms.map(room => `<option value="${escapeHtml(room.id)}">${escapeHtml(room.caseTitle)}</option>`).join('')
    : '<option value="">No case rooms available</option>';
  if (!rooms.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#64748b; padding:20px;">No case rooms yet. Create a room from Advocate Case Rooms.</td></tr>';
    return;
  }
  tbody.innerHTML = rooms.map(room => `
    <tr>
      <td><strong>${escapeHtml(room.caseTitle)}</strong><br><span style="font-size:10px;color:#64748b;">Private case room</span></td>
      <td><code>${escapeHtml(room.token)}</code></td>
      <td>${escapeHtml(room.clientName)}</td>
      <td>${escapeHtml(room.court)}</td>
      <td>${escapeHtml(room.nextHearing)}</td>
      <td><span class="badge badge-blue">Case room</span></td>
      <td><button type="button" class="btn btn-default btn-sm" onclick="openLawyerRoom('${escapeHtml(room.id)}')">Open Room</button></td>
    </tr>
  `).join('');
}
function promptNewCase() {
  showTab('lawyerrooms');
}

let timer = null;
let seconds = 0;
let running = false;
let timerMatterId = null;
let timerStartedAt = null;
const BILLABLE_HOURLY_RATE = 2500;

function startTimer() {
  const matterSelect = document.getElementById('selTimerMatter');
  if (!timerMatterId) {
    timerMatterId = matterSelect ? matterSelect.value : '';
    if (!timerMatterId) { alert('Select a case room before starting a billable session.'); return; }
    timerStartedAt = new Date();
    if (matterSelect) matterSelect.disabled = true;
  }
  if (!running) {
    running = true;
    const button = document.getElementById('btnTimerStart');
    if (button) button.innerText = 'Running...';
    timer = setInterval(() => { seconds++; updateTimerDisplay(); }, 1000);
  }
}

function pauseTimer() {
  if (!running) return;
  running = false;
  clearInterval(timer);
  timer = null;
  const button = document.getElementById('btnTimerStart');
  if (button) button.innerText = 'Resume';
}

function updateTimerDisplay() {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const display = document.getElementById('timerDisplay');
  if (display) display.innerText = `${String(h).padStart(2,'0')} : ${String(m).padStart(2,'0')} : ${String(s).padStart(2,'0')}`;
}

function recordBillableTime() {
  pauseTimer();
  if (!timerMatterId || !timerStartedAt || seconds <= 0) {
    alert('Start a case-specific timer and record some time before saving the session.');
    return;
  }
  const rooms = getAllRooms();
  const room = rooms.find(item => item.id === timerMatterId && item.visibleToLawyer &&
    (item.lawyerProfileId === activeProfile?.id || (!item.lawyerProfileId && String(item.lawyerName || '').replace(/^Adv\.\s*/, '') === activeProfile?.name)));
  if (!room) { alert('The selected matter is no longer available in your docket.'); return; }
  const activitySelect = document.getElementById('selTimerActivity');
  const activity = activitySelect ? activitySelect.value : 'Legal work';
  const endTime = new Date();
  const hours = seconds / 3600;
  const duration = `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m ${seconds % 60}s`;
  const amount = Math.round(hours * BILLABLE_HOURLY_RATE);
  room.messages = Array.isArray(room.messages) ? room.messages : [];
  room.messages.push({
    type: 'billing_session',
    sender: room.lawyerName || `Adv. ${activeProfile?.name || ''}`,
    text: 'Billable matter session recorded.',
    time: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    session: {
      date: timerStartedAt.toLocaleDateString('en-GB'),
      startTime: timerStartedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration,
      durationSeconds: seconds,
      activity,
      hourlyRate: BILLABLE_HOURLY_RATE,
      amount
    }
  });
  saveAllRooms(rooms);
  if (selectedLawyerRoomId === room.id) renderLawyerRoomDetail(room.id);
  if (selectedClientRoomId === room.id) renderClientRoomDetail(room.id);
  alert(`Saved billable session for ${room.caseTitle}: ${duration}, INR ${amount.toLocaleString('en-IN')}.`);
  seconds = 0;
  timerMatterId = null;
  timerStartedAt = null;
  updateTimerDisplay();
  const matterSelect = document.getElementById('selTimerMatter');
  if (matterSelect) matterSelect.disabled = false;
  const button = document.getElementById('btnTimerStart');
  if (button) button.innerText = 'Start Timer';
  renderPracticeDocket();
}
// Initial page setup
document.addEventListener('DOMContentLoaded', () => {
  initTextSizeControls();
  initPortalLogin();
  initApiKeyUI();
  initDigiLocker();
  renderInitialAnalysisState();
  renderPleading();
  initEcourtsCaseSearch();
  renderRecentSearches();
  renderTrackedCases();
  renderClientRoom();
  renderLawyerRoom();
  setInterval(() => { if (activeTab === 'calendar') renderTrackedCases(); }, 60000);
});

// ==========================================================================
// DIGILOCKER NATIONAL DIGITAL IDENTITY & e-KYC SYSTEM (MeitY / NeGD)
// Compliant with Section 4 Aadhaar Act 2016 & Digital Personal Data Protection Act 2023
// ==========================================================================

const DIGILOCKER_STORAGE_KEY = 'nyayasetu_digilocker_user';
let activeDlPersona = 'citizen';
let currentOtpCode = '120645';
let otpCountdownTimer = null;
let currentDlUploadContext = null; // { roomId, docId }

const DIGILOCKER_PROFILES = {
  dev:{id:'dev',name:'Dev Jain',role:'citizen',roleLabel:'Client (demo account)',identifier:'XXXX0000',maskedUid:'XXXX XXXX 0000',mobile:'+91 XXXXXX0000',digilockerId:'demo://dev-jain',gender:'',dob:'',address:'No live DigiLocker identity was verified.',consentId:'DEMO-ONLY',authMethod:'Local demo simulation',authenticatedAt:'Demo session',disputeType:'General Legal Assistance',documents:[]},
  mansvi: {
    id: 'mansvi',
    name: 'Mansvi Khupse',
    role: 'citizen',
    roleLabel: 'Client (demo account)',
    identifier: 'XXXX1111',
    maskedUid: 'XXXX XXXX 1111',
    mobile: '+91 XXXXXX1111',
    digilockerId: 'demo://mansvi-khupse',
    gender: 'Female',
    dob: '24/11/2002',
    address: 'Civil Lines, Nagpur, Maharashtra - 440001',
    consentId: 'DEMO-ONLY',
    authMethod: 'Local demo simulation',
    authenticatedAt: 'Demo session',
    disputeType: 'Land & Property Title Dispute',
    documents: [
      {
        id: 'doc-land-mansvi',
        name: 'Mahabhumi 7/12 Land Rights Extract',
        issuer: 'Revenue Department, Govt of Maharashtra',
        docType: 'Land Title & Mutation Record',
        docNumber: 'Survey #142/2, Mouza Wadi, Nagpur Rural',
        issueDate: '04/07/2026',
        status: 'Digitally Certified by Tahsildar (e-Mutation)',
        hash: 'SHA256: 3f79bb7b435b05321651daefd374cd681fde49965df612c4146fffa6f600114d',
        file: 'Mahabhumi_7_12_Extract_Wadi_142_2.pdf',
        filePath: 'Example_Files/Unit -1 AI in SDLC.pptx',
        icon: 'DOC'
      },
      {
        id: 'doc-aadhaar-mansvi',
        name: 'Aadhaar e-KYC Credential',
        issuer: 'UIDAI (Unique Identification Authority of India)',
        docType: 'Identity & Address Proof',
        docNumber: 'XXXX-XXXX-9182',
        issueDate: '12/04/2021',
        status: 'Digitally Signed by UIDAI CCA',
        hash: 'SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        file: 'Aadhaar_eKYC_MansviKhupse.pdf',
        filePath: 'Example_Files/AI_in_Modeling_Unit II.pptx',
        icon: 'UID'
      },
      {
        id: 'doc-pan-mansvi',
        name: 'Permanent Account Number (PAN Card)',
        issuer: 'Income Tax Department (ITD)',
        docType: 'Tax & Financial Identity',
        docNumber: 'MKHUP9182E',
        issueDate: '22/08/2022',
        status: 'Digitally Signed by ITD',
        hash: 'SHA256: 4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
        file: 'PAN_Card_MansviKhupse.pdf',
        filePath: 'Example_Files/2. Unit II -OFDM Transmitter Numericals_compressed.pdf',
        icon: 'PAN'
      },
      {
        id: 'doc-tax-mansvi',
        name: 'NMC Property Tax & Assessment Extract',
        issuer: 'Nagpur Municipal Corporation (NMC)',
        docType: 'Municipal Property Assessment',
        docNumber: 'NMC-PROP-2026-8819',
        issueDate: '10/01/2026',
        status: 'Digitally Verified Municipality Record',
        hash: 'SHA256: 82b9a7852f82956cf57f722a4b868d447d96901844b7d142171542f7415ab5eb',
        file: 'NMC_Property_Tax_Assessment.pdf',
        filePath: 'Example_Files/Unit -1 AI in SDLC.pptx',
        icon: 'TAX'
      },
      {
        id: 'doc-dl-mansvi',
        name: 'Driving Licence (Smart Card)',
        issuer: 'Ministry of Road Transport & Highways (MoRTH)',
        docType: 'Motor Vehicle Identity',
        docNumber: 'MH-31-2023009182',
        issueDate: '15/05/2023',
        status: 'Digitally Signed by Transport Dept',
        hash: 'SHA256: 9e107d9d372bb6826bd81d3542a419d6dae2ee1adc4f5ac011045f01f423409',
        file: 'Driving_Licence_MansviKhupse.pdf',
        filePath: 'Example_Files/AI_in_Modeling_Unit II.pptx',
        icon: 'DL'
      }
    ]
  },
  swati: {
    id: 'swati',
    name: 'Swati Kundu',
    role: 'advocate',
    roleLabel: 'Advocate (demo account)',
    identifier: 'XXXX2222',
    maskedUid: 'XXXX XXXX 2222',
    mobile: '+91 XXXXXX2222',
    digilockerId: 'demo://swati-kundu',
    gender: 'Female',
    dob: '18/09/2003',
    address: 'Dharampeth, Nagpur, Maharashtra - 440010',
    consentId: 'DEMO-ONLY',
    authMethod: 'Local demo simulation',
    authenticatedAt: 'Demo session',
    disputeType: 'Section 138 NI Act Cheque Dishonour',
    documents: [
      {
        id: 'doc-cheque-swati',
        name: 'Original Cheque Dishonour Memo & Slip',
        issuer: 'HDFC Bank Ltd / RBI CTS Clearing',
        docType: 'Negotiable Instrument Return Record',
        docNumber: 'Cheque #448912 (Memo Ref: HDFC-CLR-901)',
        issueDate: '14/08/2026',
        status: 'Digitally Validated Bank Record',
        hash: 'SHA256: 82b9a7852f82956cf57f722a4b868d447d96901844b7d142171542f7415ab5eb',
        file: 'Cheque_Dishonour_Memo_HDFC.pdf',
        filePath: 'Example_Files/2. Unit II -OFDM Transmitter Numericals_compressed.pdf',
        icon: 'BNK'
      },
      {
        id: 'doc-aadhaar-swati',
        name: 'Aadhaar e-KYC Credential',
        issuer: 'UIDAI (Unique Identification Authority of India)',
        docType: 'Identity & Address Proof',
        docNumber: 'XXXX-XXXX-7721',
        issueDate: '10/02/2021',
        status: 'Digitally Signed by UIDAI CCA',
        hash: 'SHA256: 3f79bb7b435b05321651daefd374cd681fde49965df612c4146fffa6f600114d',
        file: 'Aadhaar_eKYC_SwatiKundu.pdf',
        filePath: 'Example_Files/AI_in_Modeling_Unit II.pptx',
        icon: 'UID'
      },
      {
        id: 'doc-pan-swati',
        name: 'Permanent Account Number (PAN Card)',
        issuer: 'Income Tax Department (ITD)',
        docType: 'Tax & Financial Identity',
        docNumber: 'SKUND7721F',
        issueDate: '11/03/2022',
        status: 'Digitally Signed by ITD',
        hash: 'SHA256: 4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
        file: 'PAN_Card_SwatiKundu.pdf',
        filePath: 'Example_Files/Unit -1 AI in SDLC.pptx',
        icon: 'PAN'
      },
      {
        id: 'doc-bank-swati',
        name: 'Certified Bank Account Ledger Statement',
        issuer: 'HDFC Bank Ltd (Dharampeth Branch)',
        docType: 'Banker Books Evidence Act Record',
        docNumber: 'AC-5010049218201',
        issueDate: '20/08/2026',
        status: 'Certified under Section 2A Bankers Books Evidence',
        hash: 'SHA256: 5e2b4d121d3fd328cb08b5531fcacdabf8a7f83b1657ff1fc53b92dc18148a1d',
        file: 'Bank_Statement_HDFC_Certified.pdf',
        filePath: 'Example_Files/2. Unit II -OFDM Transmitter Numericals_compressed.pdf',
        icon: 'FIN'
      },
      {
        id: 'doc-dl-swati',
        name: 'Driving Licence (Smart Card)',
        issuer: 'Ministry of Road Transport & Highways (MoRTH)',
        docType: 'Motor Vehicle Identity',
        docNumber: 'MH-31-2022007721',
        issueDate: '18/11/2022',
        status: 'Digitally Signed by Transport Dept',
        hash: 'SHA256: 9e107d9d372bb6826bd81d3542a419d6dae2ee1adc4f5ac011045f01f423409',
        file: 'Driving_Licence_SwatiKundu.pdf',
        filePath: 'Example_Files/AI_in_Modeling_Unit II.pptx',
        icon: 'DL'
      }
    ]
  },
  bhoomi: {
    id: 'bhoomi',
    name: 'Chinta Bhumika Reddy (Bhoomi)',
    role: 'citizen',
    roleLabel: 'Client (demo account)',
    identifier: 'XXXXXX32',
    maskedUid: 'XXXX-XXXX-XX29',
    mobile: '+91 XXXXX XXX32',
    digilockerId: 'demo://bhoomi-reddy',
    gender: 'Female',
    dob: '05/08/2003',
    address: 'Ramdaspeth, Nagpur, Maharashtra - 440012',
    consentId: 'DEMO-ONLY',
    authMethod: 'Local demo simulation',
    authenticatedAt: 'Demo session',
    disputeType: 'Tenancy & Consumer Grievance',
    documents: [
      {
        id: 'doc-lease-bhoomi',
        name: 'Registered Tenancy Agreement / Lease Deed',
        issuer: 'Inspector General of Registration (IGR Maharashtra)',
        docType: 'Registered Lease Contract Evidence',
        docNumber: 'Reg. No. NGP-4-10492-2025',
        issueDate: '01/04/2025',
        status: 'Digitally Signed by Sub-Registrar Nagpur-IV',
        hash: 'SHA256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
        file: 'Registered_Lease_Agreement_Bhoomi.pdf',
        filePath: 'Example_Files/Unit -1 AI in SDLC.pptx',
        icon: 'LSE'
      },
      {
        id: 'doc-aadhaar-bhoomi',
        name: 'Aadhaar e-KYC Credential',
        issuer: 'UIDAI (Unique Identification Authority of India)',
        docType: 'Identity & Address Proof',
        docNumber: 'XXXX-XXXX-4529',
        issueDate: '14/09/2021',
        status: 'Digitally Signed by UIDAI CCA',
        hash: 'SHA256: 4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
        file: 'Aadhaar_eKYC_BhoomiReddy.pdf',
        filePath: 'Example_Files/AI_in_Modeling_Unit II.pptx',
        icon: 'UID'
      },
      {
        id: 'doc-pan-bhoomi',
        name: 'Permanent Account Number (PAN Card)',
        issuer: 'Income Tax Department (ITD)',
        docType: 'Tax & Financial Identity',
        docNumber: 'CBRED4529G',
        issueDate: '19/01/2023',
        status: 'Digitally Signed by ITD',
        hash: 'SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        file: 'PAN_Card_BhoomiReddy.pdf',
        filePath: 'Example_Files/2. Unit II -OFDM Transmitter Numericals_compressed.pdf',
        icon: 'PAN'
      },
      {
        id: 'doc-elec-bhoomi',
        name: 'Electricity Utility Consumer Bill',
        issuer: 'MSEDCL (Maharashtra State Electricity Distribution)',
        docType: 'Statutory Address Verification',
        docNumber: 'Consumer #41029810482',
        issueDate: '01/09/2026',
        status: 'Digitally Certified Utility Proof',
        hash: 'SHA256: 9e107d9d372bb6826bd81d3542a419d6dae2ee1adc4f5ac011045f01f423409',
        file: 'MSEDCL_Electricity_Bill.pdf',
        filePath: 'Example_Files/AI_in_Modeling_Unit II.pptx',
        icon: 'UTL'
      },
      {
        id: 'doc-tax-bhoomi',
        name: 'Municipal Water & Property Tax Bill',
        issuer: 'Nagpur Municipal Corporation (NMC)',
        docType: 'Municipal Assessment Record',
        docNumber: 'NMC-WAT-2026-4412',
        issueDate: '15/06/2026',
        status: 'Digitally Signed by NMC Tax Assessor',
        hash: 'SHA256: 82b9a7852f82956cf57f722a4b868d447d96901844b7d142171542f7415ab5eb',
        file: 'NMC_Water_Tax_Invoice.pdf',
        filePath: 'Example_Files/Unit -1 AI in SDLC.pptx',
        icon: 'TAX'
      }
    ]
  }
};

function getDigiLockerUser() {
  const data = localStorage.getItem(DIGILOCKER_STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {}
  }
  return null;
}

function setDigiLockerUser(user) {
  if (!user) {
    localStorage.removeItem(DIGILOCKER_STORAGE_KEY);
  } else {
    localStorage.setItem(DIGILOCKER_STORAGE_KEY, JSON.stringify(user));
  }
  renderDigiLockerHeaderUI();
  renderPleading();
  if (activeTab === 'clientroom') renderClientRoom();
  if (activeTab === 'lawyerrooms') renderLawyerRoom();
}

function initDigiLocker() {
  renderDigiLockerHeaderUI();
  fetchDigiLockerServerConfig();
  
  // Close dropdown menu on outside click
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('digilockerDropdownMenu');
    const pill = document.getElementById('digilockerUserPill');
    if (menu && menu.style.display !== 'none' && !menu.contains(e.target) && (!pill || !pill.contains(e.target))) {
      menu.style.display = 'none';
    }
  });
}

function renderDigiLockerHeaderUI() {
  const container = document.getElementById('digilockerHeaderWidget');
  const topStripStatus = document.getElementById('topStripDigiLockerStatus');
  const topStripSep = document.getElementById('topStripSeparator');
  const drafterStatusText = document.getElementById('dlDrafterStatusText');
  const user = getDigiLockerUser();

  if (topStripStatus) {
    if (user) {
      topStripStatus.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#22c55e"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        <span>DigiLocker: <strong>${user.name}</strong></span>
      `;
      if (topStripSep) topStripSep.style.display = 'inline';
    } else {
      topStripStatus.innerHTML = `
        <a href="javascript:void(0)" onclick="openDigiLockerModal()" style="color: #93c5fd; text-decoration: underline;">
          DigiLocker Sign In
        </a>
      `;
      if (topStripSep) topStripSep.style.display = 'inline';
    }
  }

  if (drafterStatusText) {
    if (user) {
      drafterStatusText.innerHTML = `Connected as <strong>${user.name}</strong> (${user.maskedUid || user.bciReg}). Click to auto-fill.`;
    } else {
      drafterStatusText.innerText = 'Authenticate via DigiLocker to auto-fill verified identity & address.';
    }
  }

  if (!container) return;

  if (user) {
    const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    container.innerHTML = `
      <div class="digilocker-user-pill" id="digilockerUserPill" onclick="toggleDigiLockerDropdown(event)" title="Click to view DigiLocker Digital Identity">
        <div class="dl-avatar">${initials}</div>
        <div class="dl-user-meta">
          <div class="dl-user-name">${user.name} <span class="dl-check-badge">✓</span></div>
          <div class="dl-user-id">${user.isDemo?'Demo profile — not verified':'DigiLocker Verified'}</div>
        </div>
        <span class="dl-dropdown-arrow">▼</span>
      </div>

      <div class="digilocker-dropdown-menu" id="digilockerDropdownMenu" style="display: none;">
        <div class="dl-dropdown-header">
          <div class="dl-auth-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#003366"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            ${user.isDemo?'Demo Profile (Not Verified)':'Verified Digital Identity'}
          </div>
          <div class="dl-dropdown-meta-item">Name: <strong>${user.name}</strong></div>
          <div class="dl-dropdown-meta-item">ID: <strong>${user.maskedUid || user.bciReg}</strong></div>
          <div class="dl-dropdown-meta-item">URI: <span style="font-family: monospace; font-size: 10px;">${user.digilockerId}</span></div>
          <div class="dl-dropdown-meta-item" style="color: #16a34a; font-weight: 600; font-size: 10.5px;">✓ e-KYC Certified (Sec 4 Aadhaar Act)</div>
        </div>

        <div class="dl-dropdown-actions">
          <button type="button" class="dl-dropdown-btn" onclick="showDpdpAuditModal()">
            DPDP Act 2023 Consent Audit Trail
          </button>
          <button type="button" class="dl-dropdown-btn btn-danger-link" onclick="logoutDigiLocker()">
            Sign Out of DigiLocker
          </button>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button class="btn-digilocker-header" onclick="openDigiLockerModal()" id="btnDigiLockerLogin" title="Sign in with DigiLocker National e-Governance Division">
        <svg class="dl-icon-svg" viewBox="0 0 24 24" fill="none">
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#0099FF"/>
          <path d="M12 11c-1.66 0-3 1.34-3 3 0 1.3.84 2.4 2 2.82V18c0 .55.45 1 1 1s1-.45 1-1v-1.18c1.16-.42 2-1.52 2-2.82 0-1.66-1.34-3-3-3z" fill="#FFFFFF"/>
        </svg>
        <span class="dl-badge-labels">
          <span class="dl-primary-lbl">DigiLocker</span>
          <span class="dl-sub-lbl">Sign In / e-KYC</span>
        </span>
      </button>
    `;
  }
}

function toggleDigiLockerDropdown(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('digilockerDropdownMenu');
  if (!menu) return;
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function handleModalOverlayClick(e, modalId) {
  if (e.target.id === modalId) {
    if (modalId === 'modalDigiLockerLogin') closeDigiLockerModal();
    else if (modalId === 'modalDigiLockerVault') closeDigiLockerVault();
    else if (modalId === 'modalDocPreview') closeDocPreview();
  }
}

let activeTeamMember = 'dev';

function openDigiLockerModal(step = 1, requestedMode = null) {
  const modal = document.getElementById('modalDigiLockerLogin');
  if (!modal) return;
  modal.style.display = 'flex';
  
  selectTeamMember(activeTeamMember || 'dev');
  switchDlGatewayMode(requestedMode || (activeProfile ? activeDlGatewayMode : 'sandbox'));
  showDlStep(step);
}

function closeDigiLockerModal() {
  const modal = document.getElementById('modalDigiLockerLogin');
  if (modal) modal.style.display = 'none';
  if (otpCountdownTimer) clearInterval(otpCountdownTimer);
  if (currentDlUploadContext && getDigiLockerUser()) openDigiLockerVault();
  if (!activeProfile && !getDigiLockerUser()) showWelcomePage();
}

function showDlStep(stepNum) {
  document.getElementById('dlStep1View').style.display = stepNum === 1 ? 'block' : 'none';
  document.getElementById('dlStep2View').style.display = stepNum === 2 ? 'block' : 'none';
  document.getElementById('dlStep3View').style.display = stepNum === 3 ? 'block' : 'none';
}

function selectTeamMember(memberKey) {
  if (!DIGILOCKER_PROFILES[memberKey]) return;
  activeTeamMember = memberKey;
  const profile = DIGILOCKER_PROFILES[memberKey];

  // Update card highlights
  ['dev', 'mansvi', 'swati'].forEach(key => {
    const card = document.getElementById(`cardMember_${key}`);
    if (card) {
      if (key === memberKey) card.classList.add('active');
      else card.classList.remove('active');
    }
  });

  // Pre-fill inputs
  const consentName = document.getElementById('lblSelectedLitigantConsent');
  const maskedPhone = document.getElementById('lblDlMaskedPhone');

  if (consentName) consentName.innerText = profile.name;
  if (maskedPhone) maskedPhone.innerText = profile.mobile;
}

function instantTeamLogin(memberKey) {
  const key = memberKey || activeTeamMember || 'dev';
  const profile = DIGILOCKER_PROFILES[key];
  if (!profile) return;

  // Save to storage
  setDigiLockerUser({ ...profile, isDemo:true });

  // Populate step 3 preview card
  const initials = profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const elAvatar = document.getElementById('dlVerifiedAvatar');
  const elName = document.getElementById('dlVerifiedName');
  const elRole = document.getElementById('dlVerifiedRoleTag');
  const elUid = document.getElementById('dlVerifiedUid');
  const elUri = document.getElementById('dlVerifiedUri');
  const elMobile = document.getElementById('dlVerifiedMobile');
  const elAddress = document.getElementById('dlVerifiedAddress');
  const elConsent = document.getElementById('dlVerifiedConsentRef');

  if (elAvatar) elAvatar.innerText = initials;
  if (elName) elName.innerText = profile.name;
  if (elRole) elRole.innerText = profile.roleLabel;
  if (elUid) elUid.innerText = profile.maskedUid;
  if (elUri) elUri.innerText = profile.digilockerId;
  if (elMobile) elMobile.innerText = profile.mobile;
  if (elAddress) elAddress.innerText = profile.address;
  if (elConsent) elConsent.innerText = profile.consentId;

  // Advance straight to step 3
  showDlStep(3);
  activatePortalProfile(key);
}

function sendDigiLockerOtp() {
  const profile = DIGILOCKER_PROFILES[activeTeamMember || 'dev'];
  const maskedPhone = profile ? profile.mobile : '+91 94221 88990';
  const lblPhone = document.getElementById('lblDlMaskedPhone');
  if (lblPhone) lblPhone.innerText = maskedPhone;

  // Clear OTP boxes
  for (let i = 0; i < 6; i++) {
    const el = document.getElementById(`otp_${i}`);
    if (el) el.value = '';
  }

  showDlStep(2);

  // Focus first OTP input
  setTimeout(() => {
    const firstOtp = document.getElementById('otp_0');
    if (firstOtp) firstOtp.focus();
  }, 100);

  // Trigger floating simulated SMS toast
  showSimulatedSmsToast();

  // Start 60s timer
  let remaining = 58;
  const timerDisplay = document.getElementById('otpTimerDisplay');
  if (otpCountdownTimer) clearInterval(otpCountdownTimer);
  otpCountdownTimer = setInterval(() => {
    remaining--;
    if (timerDisplay) timerDisplay.innerText = remaining;
    if (remaining <= 0) clearInterval(otpCountdownTimer);
  }, 1000);
}

function backToDlStep1() {
  showDlStep(1);
}

function handleOtpInput(index, event) {
  const input = event.target;
  const val = input.value;
  if (val.length === 1 && index < 5) {
    const next = document.getElementById(`otp_${index + 1}`);
    if (next) next.focus();
  }
}

function handleOtpKey(index, event) {
  if (event.key === 'Backspace' && !event.target.value && index > 0) {
    const prev = document.getElementById(`otp_${index - 1}`);
    if (prev) {
      prev.focus();
      prev.value = '';
    }
  }
}

function autoFillOtpDemo() {
  const code = '120645';
  for (let i = 0; i < 6; i++) {
    const el = document.getElementById(`otp_${i}`);
    if (el) el.value = code[i];
  }
  const last = document.getElementById('otp_5');
  if (last) last.focus();
}

function showSimulatedSmsToast() {
  const toast = document.getElementById('digilockerSmsToast');
  if (!toast) return;
  toast.style.display = 'block';
  
  // Auto-dismiss toast after 10 seconds
  setTimeout(() => {
    toast.style.display = 'none';
  }, 10000);
}

function dismissSmsToast() {
  const toast = document.getElementById('digilockerSmsToast');
  if (toast) toast.style.display = 'none';
}

function autoFillOtpFromToast() {
  dismissSmsToast();
  autoFillOtpDemo();
}

function verifyDigiLockerOtp() {
  let enteredOtp = '';
  for (let i = 0; i < 6; i++) {
    const el = document.getElementById(`otp_${i}`);
    enteredOtp += (el ? el.value.trim() : '');
  }

  if (enteredOtp.length !== 6) {
    alert('Please enter all 6 digits of the OTP received on your mobile.');
    return;
  }

  const chkConsent = document.getElementById('chkDlDpdpConsent');
  if (chkConsent && !chkConsent.checked) {
    alert('You must provide statutory consent under the DPDP Act, 2023 to proceed with authentication.');
    return;
  }

  // Get active team member profile
  const user = DIGILOCKER_PROFILES[activeTeamMember || 'dev'];

  // This is a local demo OTP, not a live DigiLocker OTP.
  setDigiLockerUser({ ...user, isDemo:true });

  // Populate step 3 preview card
  const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  document.getElementById('dlVerifiedAvatar').innerText = initials;
  document.getElementById('dlVerifiedName').innerText = user.name;
  document.getElementById('dlVerifiedRoleTag').innerText = user.roleLabel;
  document.getElementById('dlVerifiedUid').innerText = user.maskedUid;
  document.getElementById('dlVerifiedUri').innerText = user.digilockerId;
  document.getElementById('dlVerifiedMobile').innerText = user.mobile;
  document.getElementById('dlVerifiedAddress').innerText = user.address;
  document.getElementById('dlVerifiedConsentRef').innerText = user.consentId;
  activatePortalProfile(activeTeamMember || 'dev');
}

function logoutDigiLocker() {
  const user = getDigiLockerUser();
  const userName = user ? user.name : 'User';
  localStorage.removeItem(PORTAL_SESSION_KEY);
  activeProfile = null;
  setDigiLockerUser(null);
  
  const menu = document.getElementById('digilockerDropdownMenu');
  if (menu) menu.style.display = 'none';

  alert(`Signed out of DigiLocker (${userName}). Your local session has been cleared.`);
  openDigiLockerModal(1,'sandbox');
}

function openDigiLockerVault() {
  let user = getDigiLockerUser();
  if (!user) {
    // If not logged in, prompt to log in first
    openDigiLockerModal(1);
    return;
  }

  const modal = document.getElementById('modalDigiLockerVault');
  const countBadge = document.getElementById('dlVaultDocCount');
  const subtitle = document.getElementById('dlVaultOwnerSubtitle');
  const container = document.getElementById('dlVaultListContainer');
  const uploadNotice = document.getElementById('dlVaultUploadNotice');

  if (subtitle) subtitle.innerText = `Verified Identity Vault: ${user.name} (${user.maskedUid || user.bciReg})`;
  if (countBadge) countBadge.innerText = `${(user.documents && user.documents.length) || 0} Issued Documents`;

  if (uploadNotice) {
    if (currentDlUploadContext) {
      uploadNotice.style.display = 'block';
      document.getElementById('dlTargetRoomBadge').innerText = `#${currentDlUploadContext.roomId}`;
    } else {
      uploadNotice.style.display = 'none';
    }
  }

  if (container && user.documents) {
    container.innerHTML = user.documents.map((doc, idx) => {
      const attachLabel = currentDlUploadContext && currentDlUploadContext.mode === 'send' ? 'Send to Case Room' : 'Attach to Request';
      const attachBtn = currentDlUploadContext ? `
        <button type="button" class="btn btn-success btn-sm" onclick="attachDigiLockerDocToRoom(${idx})" style="padding: 4px 10px;">
          ${attachLabel}
        </button>
      ` : '';
      return `
        <div class="dl-vault-card">
          <div class="dl-vault-doc-info">
            <div class="dl-vault-icon-badge" style="font-weight: 700; font-size: 11px;">${doc.icon || 'DOC'}</div>
            <div>
              <div class="dl-vault-title">${doc.name}</div>
              <div class="dl-vault-meta">
                <strong>Issuer:</strong> ${doc.issuer} &bull; <strong>Issued:</strong> ${doc.issueDate}
              </div>
              <div class="dl-vault-hash">${doc.hash}</div>
            </div>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            ${attachBtn}
            <button type="button" class="btn btn-default btn-sm" onclick="previewDigiLockerDoc(${idx})">
              Preview
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  if (modal) modal.style.display = 'flex';
}

function closeDigiLockerVault() {
  const modal = document.getElementById('modalDigiLockerVault');
  if (modal) modal.style.display = 'none';
  currentDlUploadContext = null;
}

function openDigiLockerVaultForUpload(roomId, docId) {
  currentDlUploadContext = { roomId, docId, mode: 'request' };
  if (!getDigiLockerUser()) {
    openDigiLockerModal(1);
    return;
  }
  openDigiLockerVault();
}

function openDigiLockerVaultForRoomSend(roomId) {
  if (!roomId) return;
  currentDlUploadContext = { roomId, mode: 'send' };
  if (!getDigiLockerUser()) {
    openDigiLockerModal(1);
    return;
  }
  openDigiLockerVault();
}

function attachDigiLockerDocToRoom(docIndex) {
  if (!currentDlUploadContext) return;
  const { roomId, docId, mode } = currentDlUploadContext;
  const user = getDigiLockerUser();
  if (!user || !user.documents || !user.documents[docIndex]) return;

  const docData = user.documents[docIndex];
  const rooms = getAllRooms();
  const room = rooms.find(item => item.id === roomId);
  if (!room) return;

  if (mode === 'send') {
    const nextId = room.documents.reduce((maxId, item) => Math.max(maxId, Number(item.id) || 0), 0) + 1;
    room.documents.push({
      id: nextId,
      name: docData.name,
      dueDate: 'Shared by client',
      file: docData.file,
      filePath: docData.filePath || '',
      status: 'uploaded',
      uploadDate: new Date().toLocaleDateString('en-GB'),
      source: 'DigiLocker profile vault',
      isDigiLockerVerified: false
    });
    room.messages.push({
      sender: `${user.name} (Client)`,
      text: `Shared a document from the signed-in DigiLocker profile vault: "${docData.name}" (${docData.issuer}).`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    saveAllRooms(rooms);
    closeDigiLockerVault();
    alert(`Shared "${docData.name}" with Case Room #${roomId}.`);
    return;
  }

  const targetDoc = room.documents.find(item => item.id === docId);
  if (!targetDoc) return;
  targetDoc.file = docData.file;
  targetDoc.filePath = docData.filePath || 'Example_Files/2. Unit II -OFDM Transmitter Numericals_compressed.pdf';
  targetDoc.status = 'uploaded';
  targetDoc.uploadDate = new Date().toLocaleDateString('en-GB');
  targetDoc.isDigiLockerVerified = true;
  targetDoc.digiLockerDocName = docData.name;
  targetDoc.digiLockerHash = docData.hash;
  room.messages.push({
    sender: `${user.name} (Client)`,
    text: `Attached verified DigiLocker document: "${docData.name}" (${docData.issuer}) with cryptographic SHA-256 seal.`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
  saveAllRooms(rooms);
  closeDigiLockerVault();
  alert(`Successfully attached "${docData.name}" from DigiLocker Vault into Case Room #${roomId}!`);
}
function previewDigiLockerDoc(docIndex) {
  const user = getDigiLockerUser();
  if (!user || !user.documents || !user.documents[docIndex]) return;
  const doc = user.documents[docIndex];

  const modal = document.getElementById('modalDocPreview');
  const title = document.getElementById('docPreviewTitle');
  const subtitle = document.getElementById('docPreviewSubtitle');
  const body = document.getElementById('docPreviewBody');

  if (title) title.innerText = doc.name;
  if (subtitle) subtitle.innerText = `Issued by ${doc.issuer}`;

  if (body) {
    body.innerHTML = `
      <div style="background: #ffffff; border: 2px solid #cbd5e1; border-radius: 8px; padding: 20px; box-shadow: var(--shadow-sm); font-family: 'Inter', sans-serif;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #003366; padding-bottom: 12px; margin-bottom: 14px;">
          <div>
            <div style="font-size: 11px; color: #ff9933; font-weight: 700;">GOVERNMENT OF INDIA • DIGILOCKER</div>
            <h3 style="font-size: 16px; color: #003366; margin: 2px 0 0 0;">${doc.name}</h3>
            <div style="font-size: 11.5px; color: #64748b;">${doc.issuer}</div>
          </div>
          <div style="text-align: right;">
            <span class="badge badge-green" style="font-size: 11px;">✓ CCA Digitally Certified</span>
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 6px; padding: 14px; margin-bottom: 14px; font-size: 12px; line-height: 1.6;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div><strong>Document Holder:</strong> ${user.name}</div>
            <div><strong>Document Identifier:</strong> ${doc.docNumber || 'DL-RECORD-901'}</div>
            <div><strong>Issue Date:</strong> ${doc.issueDate}</div>
            <div><strong>Document Category:</strong> ${doc.docType}</div>
            <div style="grid-column: span 2;"><strong>Digital Signature Hash:</strong><br><span style="font-family: monospace; font-size: 10px; color: #003366;">${doc.hash}</span></div>
          </div>
        </div>

        <div style="border-left: 3px solid #16a34a; background: #f0fdf4; padding: 10px 12px; font-size: 11px; color: #166534; line-height: 1.45;">
          <strong>Legal Admissibility &amp; Statutory Validity:</strong><br>
          This electronically generated document is legally recognized under Section 4 of the Information Technology Act, 2000 and admissible as primary evidence under Section 65B of the Indian Evidence Act, 1872 / Section 61 Bharatiya Sakshya Adhiniyam, 2023.
        </div>
      </div>

      <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 11px; color: #64748b;">Filename: <code>${doc.file}</code></span>
        <button type="button" class="btn btn-default" onclick="closeDocPreview()">Close Preview</button>
      </div>
    `;
  }

  if (modal) modal.style.display = 'flex';
}

function closeDocPreview() {
  const modal = document.getElementById('modalDocPreview');
  if (modal) modal.style.display = 'none';
}

function autofillFromDigiLocker() {
  const user = getDigiLockerUser();
  if (!user) {
    alert('Please sign in with DigiLocker to auto-populate your verified identity and territorial address.');
    openDigiLockerModal(1);
    return;
  }

  const inpSender = document.getElementById('inpSender');
  const inpPlace = document.getElementById('inpPlace');
  if (inpSender) inpSender.value = user.name;
  if (inpPlace) inpPlace.value = user.address || 'Nagpur, Maharashtra';

  renderPleading();
  showDrafterToast(`Auto-filled verified identity: ${user.name} (${user.maskedUid || user.bciReg || 'e-KYC Verified'})`);
}


function showDpdpAuditModal() {
  const user = getDigiLockerUser();
  if (!user) return;
  alert(
    `DPDP Act 2023 Statutory Consent Audit Log:\n\n` +
    `• Consent Ref ID: ${user.consentId}\n` +
    `• Data Principal: ${user.name}\n` +
    `• Identity Provider: Licensed DigiLocker / NeGD Gateway\n` +
    `• Authentication Mode: ${user.authMethod}\n` +
    `• Timestamp: ${user.authenticatedAt}\n` +
    `• Governing Provisions: Section 4 Aadhaar Act 2016 & Section 6 DPDP Act 2023\n` +
    `• Audit Status: Tamper-proof, Zero Biometric Storage Verified.`
  );
}

// ==========================================================================
// REAL DIGILOCKER OAUTH 2.0 GATEWAY & PARTNER INTEGRATION
// ==========================================================================

let activeDlGatewayMode = 'live';
let currentDigiLockerServerConfig = null;

function switchDlGatewayMode(mode) {
  activeDlGatewayMode = mode;

  const btnLive = document.getElementById('btnModeLiveOAuth');
  const btnSandbox = document.getElementById('btnModeSandbox');

  const viewLive = document.getElementById('dlModeLiveView');
  const viewSandbox = document.getElementById('dlModeSandboxView');

  if (btnLive) btnLive.className = mode === 'live' ? 'dl-mode-tab active' : 'dl-mode-tab';
  if (btnSandbox) btnSandbox.className = mode === 'sandbox' ? 'dl-mode-tab active' : 'dl-mode-tab';

  if (viewLive) viewLive.style.display = mode === 'live' ? 'block' : 'none';
  if (viewSandbox) viewSandbox.style.display = mode === 'sandbox' ? 'block' : 'none';

  if (mode === 'live') {
    fetchDigiLockerServerConfig();
  } else if (mode === 'sandbox') {
    selectTeamMember(activeTeamMember || 'dev');
  }
}

async function fetchDigiLockerServerConfig() {
  try {
    const res = await fetch('/api/digilocker/config');
    if (res.ok) {
      const data = await res.json();
      currentDigiLockerServerConfig = data;

      const lblClientId = document.getElementById('lblLiveClientId');
      const lblEndpoint = document.getElementById('lblLiveEndpoint');
      const inpClientId = document.getElementById('inpCfgClientId');
      const inpRedirect = document.getElementById('inpCfgRedirectUri');
      const selEnv = document.getElementById('selDlEnv');
      const noticeBox = document.getElementById('dlLiveNoticeBox');

      const currentOrigin = window.location.origin;
      const liveCallback = currentOrigin + '/callback.html';

      if (inpRedirect) {
        inpRedirect.value = liveCallback;
      }

      if (lblClientId) {
        lblClientId.innerText = data.clientId || 'Not Configured (Default Requester ID)';
        lblClientId.style.color = data.clientId ? '#16a34a' : '#d97706';
      }

      if (lblEndpoint) {
        lblEndpoint.innerText = data.environment === 'sandbox'
          ? 'https://api.digitallocker.gov.in/public/oauth2/1/authorize'
          : 'https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize';
      }

      if (inpClientId && !inpClientId.value) inpClientId.value = data.clientId || '';
      if (selEnv) selEnv.value = data.environment || 'production';

      if (noticeBox) {
        if (data.clientId) {
          noticeBox.style.background = '#f0fdf4';
          noticeBox.style.borderColor = '#86efac';
          noticeBox.style.color = '#166534';
          noticeBox.innerHTML = `<strong>✓ Government Partner Credentials Configured:</strong><br>Using Client ID: <code>${data.clientId}</code> with Redirect URI: <code>${liveCallback}</code>.`;
        } else {
          noticeBox.style.background = '#fffbeb';
          noticeBox.style.borderColor = '#fde68a';
          noticeBox.style.color = '#92400e';
          noticeBox.innerHTML = `
            <strong>NeGD Government Partner Client ID Notice:</strong><br>
            DigiLocker requires an approved <code>client_id</code> issued by the <strong>National e-Governance Division (NeGD) / API Setu</strong>. Without an approved Client ID, DigiLocker's real OAuth server will show <em>'Invalid Client ID'</em>.<br><br>
            • To enter your approved keys, click <strong>"API Keys &amp; Partner Setup"</strong>.<br>
            • For step-by-step onboarding for your university, click <strong>"Academic Registration Guide"</strong> below.
          `;
        }
      }
    }
  } catch (e) {
    console.warn('Backend DigiLocker API not reachable; operating in static mode', e);
  }
}

async function saveDigiLockerServerConfig() {
  const clientId = (document.getElementById('inpCfgClientId') ? document.getElementById('inpCfgClientId').value.trim() : '');
  const clientSecret = (document.getElementById('inpCfgClientSecret') ? document.getElementById('inpCfgClientSecret').value.trim() : '');
  const environment = (document.getElementById('selDlEnv') ? document.getElementById('selDlEnv').value : 'production');
  const redirectUri = (document.getElementById('inpCfgRedirectUri') ? document.getElementById('inpCfgRedirectUri').value.trim() : (window.location.origin + '/callback.html'));

  try {
    const res = await fetch('/api/digilocker/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret, environment, redirectUri })
    });
    const data = await res.json();
    if (data.success) {
      alert(data.message || 'DigiLocker API credentials saved successfully.');
      fetchDigiLockerServerConfig();
      switchDlGatewayMode('live');
    } else {
      alert('Error saving credentials: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Failed to connect to backend proxy server: ' + err.message);
  }
}

async function launchRealDigiLockerOAuth() {
  const liveCallback = window.location.origin + '/callback.html';
  try {
    const res = await fetch('/api/digilocker/authorize-url?redirect_uri=' + encodeURIComponent(liveCallback));
    if (!res.ok) throw new Error('Server returned HTTP ' + res.status);
    const data = await res.json();

    // Store CSRF state
    sessionStorage.setItem('digilocker_oauth_state', data.state);

    // Redirect to real official DigiLocker OAuth2 endpoint!
    window.location.href = data.authUrl;
  } catch (err) {
    // Fallback if direct fetch fails
    const cfg = currentDigiLockerServerConfig || {};
    const clientId = cfg.clientId || 'NYAYASETU_RBU_GOV';
    const redirectUri = encodeURIComponent(liveCallback);
    const state = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('digilocker_oauth_state', state);

    const liveUrl = `https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${redirectUri}&state=${state}&scope=openid%20profile`;
    window.location.href = liveUrl;
  }
}

function copyRedirectUri() {
  const inp = document.getElementById('inpCfgRedirectUri');
  if (inp) {
    navigator.clipboard.writeText(inp.value).then(() => {
      alert('Copied callback redirect URI to clipboard: ' + inp.value);
    });
  }
}

function openPartnerRegistrationGuide() {
  const modal = document.getElementById('modalPartnerRegistrationGuide');
  if (modal) modal.style.display = 'flex';
}

function closePartnerRegistrationGuide() {
  const modal = document.getElementById('modalPartnerRegistrationGuide');
  if (modal) modal.style.display = 'none';
}
