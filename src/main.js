import { Api, Config } from './api.js';

const STORAGE_KEY_SESSIONS = 'autoreel_video_sessions';
const STORAGE_KEY_SESSION_PREFIX = 'autoreel_video_session_';
const STORAGE_KEY_VIDEOS = 'autoreel_generated_videos';
const STORAGE_KEY_PREFS = 'autoreel_user_preferences';
const AUTOCOMPLETE_SUGGESTIONS = [
  'Create a luxury walkaround script for this vehicle',
  'Make the tone confident, premium, and dealership-ready',
  'Highlight exterior condition, interior features, and performance',
  'Write a short social media caption for this vehicle',
  'Generate a 30-second walkaround narration',
  'Make this sound professional but natural',
  'Focus on safety features, technology, and comfort',
  'Create a high-energy sales video script',
  'Mention the mileage, trim, and standout options',
  'Ask me follow-up questions before generating the video'
];
const BUILT_IN_VIDEOS = [
  {
    id: 'camaro-ss',
    title: 'Camaro SS Walkaround',
    url: '/walk-around-videos/camaro-ss.mp4',
    createdAt: '2026-05-12T12:00:00.000Z'
  },
  {
    id: 'ferrari-sf90-stradale',
    title: 'Ferrari SF90 Stradale Walkaround',
    url: '/walk-around-videos/ferrari-sf90-stradale.mp4',
    createdAt: '2026-05-13T12:00:00.000Z'
  },
  {
    id: 'generated-walkaround',
    title: 'Generated Walkaround',
    url: '/walk-around-videos/generated-walkaround.mp4',
    createdAt: '2026-05-12T12:00:00.000Z'
  },
  {
    id: 'lamborghini-revuelto',
    title: 'Lamborghini Revuelto Walkaround',
    url: '/walk-around-videos/lamborghini-revuelto.mp4',
    createdAt: '2026-05-12T12:00:00.000Z'
  },
  {
    id: 'walkaround-demo',
    title: 'Walkaround Demo',
    url: '/walk-around-videos/walkaround-demo.mp4',
    createdAt: '2026-05-12T12:00:00.000Z'
  }
];

// --- State ---
const State = {
  sessions: [],
  videos: [],
  preferences: {},
  currentSessionId: null,
  editingSessionId: null,
  files: [],
  activeJobId: null,
  currentMessage: '',
  lastUserPrompt: '',
  chatMessages: [],
  pendingGenerationRequest: null,
  generationApproved: false,
  submittedPrompt: '',
  isProcessing: false,
  engineConnected: false,
  pollInterval: null,
  pollFailures: 0,
  autocompleteMatches: [],
  activeAutocompleteIndex: 0
};

// --- DOM Elements ---
const DOM = {
  // App Bar
  engineStatus: document.getElementById('engine-status'),
  statusText: document.querySelector('.status-text'),
  brandHome: document.getElementById('brand-home'),
  profileMenuTrigger: document.getElementById('profile-menu-trigger'),
  profileMenu: document.getElementById('profile-menu'),
  menuMyVideos: document.getElementById('menu-my-videos'),
  menuSettings: document.getElementById('menu-settings'),
  menuEngineMonitor: document.getElementById('menu-engine-monitor'),
  
  // Views
  createView: document.getElementById('create-view'),
  myVideosView: document.getElementById('my-videos-view'),
  videoLibraryGrid: document.getElementById('video-library-grid'),
  videoPlayerModal: document.getElementById('video-player-modal'),
  playerVideoTitle: document.getElementById('player-video-title'),
  playerVideoElement: document.getElementById('player-video-element'),
  playerDownloadLink: document.getElementById('player-download-link'),
  closePlayerModalBtn: document.getElementById('close-player-modal'),
  engineMonitorView: document.getElementById('engine-monitor-view'),
  backToCreateBtns: document.querySelectorAll('.back-to-create'),

  // Chat & Generate
  chatAndGenerateView: document.getElementById('chat-and-generate-view'),
  chatHistory: document.getElementById('chat-history'),
  chatHero: document.getElementById('chat-hero'),
  sessionList: document.getElementById('session-list'),
  newChatBtn: document.getElementById('new-chat-btn'),
  sidebarBrand: document.getElementById('sidebar-brand'),
  projectLinks: document.querySelectorAll('.project-link'),
  
  // Composer
  dropZone: document.getElementById('drop-zone'),
  attachTrigger: document.getElementById('attach-trigger'),
  fileInput: document.getElementById('file-input'),
  previewGrid: document.getElementById('preview-grid'),
  photoCountLabel: document.getElementById('photo-count-label'),
  instructionsInput: document.getElementById('instructions-input'),
  autocompletePanel: document.getElementById('autocomplete-panel'),
  reviewBtn: document.getElementById('review-job-btn'),
  sendChatBtn: document.getElementById('send-chat-btn'),

  // Review & Submit
  axiaReviewCard: document.getElementById('axia-review-card'),
  axiaReviewDetails: document.getElementById('axia-review-details'),
  submitBtn: document.getElementById('submit-job-btn'),
  
  // Results
  resultsView: document.getElementById('results-view'),
  pipelineCard: document.getElementById('pipeline-card'),
  jobIdDisplay: document.getElementById('job-id-display'),
  pipelineEmptyState: document.getElementById('pipeline-empty-state'),
  pipelineStages: document.getElementById('pipeline-stages'),
  pipelineError: document.getElementById('pipeline-error'),
  artifactsCard: document.getElementById('artifacts-card'),
  videoPreview: document.getElementById('primary-video-preview'),
  scriptPreview: document.getElementById('script-preview'),
  artifactLinks: document.getElementById('artifact-links'),
  generateAnotherBtn: document.getElementById('generate-another-btn'),

  // Engine Monitor
  monitorEngineUrl: document.getElementById('monitor-engine-url'),
  monitorAuthState: document.getElementById('monitor-auth-state'),
  monitorRequestType: document.getElementById('monitor-request-type'),
  monitorRequestUrl: document.getElementById('monitor-request-url'),
  monitorResponseStatus: document.getElementById('monitor-response-status'),
  monitorErrorSummary: document.getElementById('monitor-error-summary'),

  // Settings Modal
  settingsModal: document.getElementById('settings-modal'),
  closeModal: document.querySelector('.close-modal'),
  saveSettingsBtn: document.getElementById('save-settings-btn'),
  engineUrlInput: document.getElementById('engine-url'),
  apiKeyInput: document.getElementById('api-key'),
  testConnectionBtn: document.getElementById('test-connection-btn'),
  connectionStatusModal: document.getElementById('connection-status-modal'),
  settingsUserName: document.getElementById('settings-user-name'),
  settingsUserEmail: document.getElementById('settings-user-email'),
  prefDealerFocused: document.getElementById('pref-dealer-focused'),
  prefConciseScripts: document.getElementById('pref-concise-scripts'),
  prefMemoryEnabled: document.getElementById('pref-memory-enabled'),
  prefEmailCompleted: document.getElementById('pref-email-completed'),
  prefNotifyErrors: document.getElementById('pref-notify-errors'),
  exportDataBtn: document.getElementById('export-data-btn'),
  clearHistoryBtn: document.getElementById('clear-history-btn'),
  archivedVideosList: document.getElementById('archived-videos-list'),
};

// --- Initialization ---
function init() {
  setupEventListeners();
  loadSessions();
  loadVideos();
  loadSettings();
  checkEngineConnection();
  showCreateView();
  renderSessionList();
  renderChatMessages();
  updateComposerState();
}

function setupEventListeners() {
  DOM.brandHome.addEventListener('click', showCreateView);
  DOM.sidebarBrand.addEventListener('click', showCreateView);
  DOM.newChatBtn.addEventListener('click', startNewSession);
  DOM.projectLinks.forEach(btn => btn.addEventListener('click', () => selectProject(btn.dataset.project)));
  DOM.backToCreateBtns.forEach(btn => btn.addEventListener('click', showCreateView));
  
  DOM.profileMenuTrigger.addEventListener('click', toggleProfileMenu);
  DOM.menuMyVideos.addEventListener('click', () => { closeProfileMenu(); showMyVideosView(); });
  DOM.menuSettings.addEventListener('click', () => { closeProfileMenu(); DOM.settingsModal.classList.remove('hidden'); });
  DOM.menuEngineMonitor.addEventListener('click', () => { closeProfileMenu(); showEngineMonitor(); });
  
  document.addEventListener('click', (e) => {
    if (!DOM.profileMenu.contains(e.target) && !DOM.profileMenuTrigger.contains(e.target)) {
      closeProfileMenu();
    }
  });

  DOM.closeModal.addEventListener('click', () => DOM.settingsModal.classList.add('hidden'));
  DOM.saveSettingsBtn.addEventListener('click', saveAndCloseSettings);
  DOM.testConnectionBtn.addEventListener('click', testConnectionModal);

  DOM.closePlayerModalBtn.addEventListener('click', closeVideoPlayer);
  DOM.videoPlayerModal.addEventListener('click', (e) => {
    if (e.target === DOM.videoPlayerModal) closeVideoPlayer();
  });
  DOM.exportDataBtn.addEventListener('click', exportLocalData);
  DOM.clearHistoryBtn.addEventListener('click', clearLocalHistory);

  DOM.dropZone.addEventListener('click', () => DOM.fileInput.click());
  DOM.attachTrigger.addEventListener('click', () => DOM.fileInput.click());
  DOM.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); DOM.dropZone.classList.add('dragover'); });
  DOM.dropZone.addEventListener('dragleave', () => DOM.dropZone.classList.remove('dragover'));
  DOM.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    DOM.dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  });
  DOM.fileInput.addEventListener('change', (e) => { if (e.target.files.length) handleFiles(e.target.files); });
  DOM.previewGrid.addEventListener('click', (event) => {
    const button = event.target.closest('.remove-thumb');
    if (!button) return;
    const index = parseInt(button.dataset.index, 10);
    State.files.splice(index, 1);
    renderFilePreviews();
    updateComposerState();
  });

  DOM.instructionsInput.addEventListener('input', () => {
    autoResizeTextarea();
    updateComposerState();
    updateAutocomplete();
  });
  DOM.instructionsInput.addEventListener('keydown', (event) => {
    if (handleAutocompleteKeydown(event)) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (State.files.length === 0) handleChatSend();
    }
  });
  DOM.autocompletePanel.addEventListener('mousedown', (event) => {
    const option = event.target.closest('.autocomplete-option');
    if (!option) return;
    event.preventDefault();
    applyAutocomplete(parseInt(option.dataset.index, 10));
  });
  
  DOM.sendChatBtn.addEventListener('click', handleChatSend);
  DOM.reviewBtn.addEventListener('click', handleReview);
  DOM.submitBtn.addEventListener('click', submitJob);
  DOM.generateAnotherBtn.addEventListener('click', resetCreateFlow);

  // API instrumentation listeners
  window.addEventListener('api-request', (e) => {
      DOM.monitorRequestType.textContent = e.detail.type;
      DOM.monitorRequestUrl.textContent = e.detail.url;
      DOM.monitorAuthState.textContent = e.detail.authState;
      DOM.monitorEngineUrl.textContent = Config.getEngineUrl();
      DOM.monitorResponseStatus.textContent = 'Pending...';
      DOM.monitorErrorSummary.textContent = 'None';
  });
  window.addEventListener('api-response', (e) => {
      DOM.monitorResponseStatus.textContent = e.detail.status;
      DOM.monitorErrorSummary.textContent = e.detail.error || 'None';
  });
}

function handleFiles(files) {
    State.files = [...State.files, ...Array.from(files).filter(f => f.type.startsWith('image/'))];
    DOM.fileInput.value = '';
    renderFilePreviews();
    updateComposerState();
}

function renderFilePreviews() {
    DOM.previewGrid.innerHTML = '';
    State.files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement('div');
            div.className = 'preview-thumb';
            div.innerHTML = `<img src="${e.target.result}" alt="preview"><button class="remove-thumb" data-index="${index}">&times;</button>`;
            DOM.previewGrid.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
    DOM.photoCountLabel.textContent = State.files.length ? `${State.files.length} Photos` : '';
}

function updateComposerState() {
    const hasText = DOM.instructionsInput.value.trim().length > 0;
    const hasFiles = State.files.length > 0;
    DOM.sendChatBtn.classList.toggle('hidden', hasFiles);
    DOM.reviewBtn.classList.toggle('hidden', !hasFiles);
    DOM.sendChatBtn.disabled = !hasText || State.isProcessing;
    DOM.reviewBtn.disabled = !hasText || State.isProcessing;
    DOM.dropZone.classList.toggle('has-files', hasFiles);
}

async function handleChatSend() {
    const content = normalizePromptText(DOM.instructionsInput.value);
    if (!content) return;
    hideAutocomplete();
    ensureCurrentSession(content);
    addMessageToHistory('user', content);
    saveCurrentSession();
    DOM.instructionsInput.value = '';
    autoResizeTextarea();
    State.isProcessing = true;
    updateComposerState();
    const loadingMsg = addMessageToHistory('assistant', 'Thinking...', { loading: true });
    try {
        const history = [
            {
                role: 'system',
                content: 'You are AutoReel AI, an expert automotive video assistant. Help users refine vehicle walkaround ideas, scripts, and generation instructions. Be concise and practical.'
            },
            ...State.chatMessages.map(m => ({ role: m.role, content: m.content }))
        ];
        const response = await Api.chat(history);
        const assistantContent = getAssistantContent(response);
        updateMessageInHistory(loadingMsg, assistantContent);
        State.chatMessages.push({ role: 'assistant', content: assistantContent });
        saveCurrentSession();
    } catch (err) {
        const errorContent = `Error: ${err.message}`;
        updateMessageInHistory(loadingMsg, errorContent);
        State.chatMessages.push({ role: 'assistant', content: errorContent });
        saveCurrentSession();
    } finally {
        State.isProcessing = false;
        updateComposerState();
    }
}

function updateAutocomplete() {
    const value = DOM.instructionsInput.value.trim();
    if (value.length < 3 || State.files.length > 0) {
        hideAutocomplete();
        return;
    }

    const query = value.toLowerCase();
    State.autocompleteMatches = AUTOCOMPLETE_SUGGESTIONS
        .filter(suggestion => suggestion.toLowerCase().includes(query) && suggestion.toLowerCase() !== query)
        .slice(0, 4);
    State.activeAutocompleteIndex = 0;

    if (State.autocompleteMatches.length === 0) {
        hideAutocomplete();
        return;
    }

    DOM.autocompletePanel.innerHTML = State.autocompleteMatches.map((suggestion, index) => `
        <button class="autocomplete-option${index === State.activeAutocompleteIndex ? ' active' : ''}" type="button" data-index="${index}">
            <i class="fas fa-wand-magic-sparkles"></i>
            <span>${escapeHtml(suggestion)}</span>
        </button>
    `).join('');
    DOM.autocompletePanel.classList.remove('hidden');
}

function handleAutocompleteKeydown(event) {
    if (DOM.autocompletePanel.classList.contains('hidden')) return false;
    if (event.key === 'Tab') {
        event.preventDefault();
        applyAutocomplete(State.activeAutocompleteIndex);
        return true;
    }
    if (event.key === 'Escape') {
        event.preventDefault();
        hideAutocomplete();
        return true;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        const count = State.autocompleteMatches.length;
        State.activeAutocompleteIndex = (State.activeAutocompleteIndex + direction + count) % count;
        updateAutocompleteActiveOption();
        return true;
    }
    return false;
}

function updateAutocompleteActiveOption() {
    DOM.autocompletePanel.querySelectorAll('.autocomplete-option').forEach((option, index) => {
        option.classList.toggle('active', index === State.activeAutocompleteIndex);
    });
}

function applyAutocomplete(index) {
    const suggestion = State.autocompleteMatches[index];
    if (!suggestion) return;
    DOM.instructionsInput.value = suggestion;
    autoResizeTextarea();
    updateComposerState();
    hideAutocomplete();
    DOM.instructionsInput.focus();
}

function hideAutocomplete() {
    State.autocompleteMatches = [];
    State.activeAutocompleteIndex = 0;
    DOM.autocompletePanel.classList.add('hidden');
    DOM.autocompletePanel.innerHTML = '';
}

function normalizePromptText(value) {
    return value
        .replace(/\s+/g, ' ')
        .replace(/\s+([,.!?;:])/g, '$1')
        .replace(/([.!?])([A-Za-z])/g, '$1 $2')
        .trim()
        .replace(/^([a-z])/, match => match.toUpperCase());
}

function addMessageToHistory(role, content, options = {}) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${role}${options.loading ? ' is-loading' : ''}`;
    const contentMarkup = options.loading
        ? `<div class="message-body"><div class="message-author">Axia</div><div class="content thinking-indicator"><span>Thinking</span><span class="thinking-dots"><i></i><i></i><i></i></span></div></div>`
        : role === 'assistant'
            ? `<div class="message-body"><div class="message-author">Axia</div><div class="content">${escapeHtml(content)}</div></div>`
            : `<div class="content">${escapeHtml(content)}</div>`;
    msgDiv.innerHTML = `<div class="avatar"></div>${contentMarkup}`;
    DOM.chatHistory.appendChild(msgDiv);
    DOM.chatHistory.scrollTop = DOM.chatHistory.scrollHeight;
    DOM.chatHero.classList.add('hidden');
    if (!options.loading) {
      State.chatMessages.push({ role, content });
    }
    return msgDiv;
}

function updateMessageInHistory(msgDiv, newContent) {
    msgDiv.classList.remove('is-loading');
    const contentEl = msgDiv.querySelector('.content');
    contentEl.className = 'content';
    contentEl.textContent = newContent;
}

function getAssistantContent(response) {
    if (typeof response === 'string') return response;
    if (typeof response?.content === 'string') return response.content;
    if (typeof response?.message === 'string') return response.message;
    if (typeof response?.message?.content === 'string') return response.message.content;
    if (typeof response?.choices?.[0]?.message?.content === 'string') return response.choices[0].message.content;
    if (typeof response?.choices?.[0]?.text === 'string') return response.choices[0].text;
    return "I received a response from the engine, but couldn't read the message content.";
}

function loadSessions() {
    try {
        State.sessions = JSON.parse(localStorage.getItem(STORAGE_KEY_SESSIONS) || '[]');
    } catch {
        State.sessions = [];
    }
}

function loadVideos() {
    try {
        State.videos = JSON.parse(localStorage.getItem(STORAGE_KEY_VIDEOS) || '[]');
    } catch {
        State.videos = [];
    }
}

function persistVideos() {
    localStorage.setItem(STORAGE_KEY_VIDEOS, JSON.stringify(State.videos));
}

function persistSessionIndex() {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(State.sessions));
}

function ensureCurrentSession(firstPrompt = '') {
    if (State.currentSessionId) return;
    const now = new Date().toISOString();
    const title = firstPrompt ? makeSessionTitle(firstPrompt) : 'New chat';
    const session = {
        id: crypto.randomUUID(),
        title,
        workspace: 'AutoReel',
        createdAt: now,
        updatedAt: now
    };
    State.sessions.unshift(session);
    State.currentSessionId = session.id;
    persistSessionIndex();
    localStorage.setItem(`${STORAGE_KEY_SESSION_PREFIX}${session.id}`, JSON.stringify([]));
    renderSessionList();
}

function saveCurrentSession() {
    if (!State.currentSessionId) return;
    const session = State.sessions.find(item => item.id === State.currentSessionId);
    if (session) {
        session.updatedAt = new Date().toISOString();
        if (!session.isCustomTitle && State.chatMessages[0]?.content) {
            session.title = makeSessionTitle(State.chatMessages[0].content);
        }
        State.sessions = [session, ...State.sessions.filter(item => item.id !== session.id)];
        persistSessionIndex();
    }
    localStorage.setItem(`${STORAGE_KEY_SESSION_PREFIX}${State.currentSessionId}`, JSON.stringify(State.chatMessages));
    renderSessionList();
}

function renderSessionList() {
    DOM.sessionList.innerHTML = '';
    const visibleSessions = State.sessions;
    
    if (visibleSessions.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'history-empty';
        empty.textContent = 'No chats yet';
        DOM.sessionList.appendChild(empty);
        return;
    }

    visibleSessions.forEach(session => {
        const item = document.createElement('div');
        item.className = `session-item${session.id === State.currentSessionId ? ' active' : ''}`;
        
        const isEditing = State.editingSessionId === session.id;

        if (isEditing) {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'session-title-input';
            input.value = session.title;
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    saveSessionTitle(session.id, input.value);
                } else if (e.key === 'Escape') {
                    State.editingSessionId = null;
                    renderSessionList();
                }
            });
            input.addEventListener('blur', () => {
                saveSessionTitle(session.id, input.value);
            });
            item.appendChild(input);
            setTimeout(() => input.focus(), 0);
        } else {
            const titleSpan = document.createElement('span');
            titleSpan.textContent = session.title;
            item.appendChild(titleSpan);

            const dateSmall = document.createElement('small');
            dateSmall.textContent = formatSessionDate(session.updatedAt);
            item.appendChild(dateSmall);

            const actions = document.createElement('div');
            actions.className = 'session-actions';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'session-action-btn';
            editBtn.innerHTML = '<i class="fas fa-pen"></i>';
            editBtn.title = 'Rename';
            editBtn.onclick = (e) => {
                e.stopPropagation();
                State.editingSessionId = session.id;
                renderSessionList();
            };

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'session-action-btn delete-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Delete';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deleteSession(session.id);
            };

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
            item.appendChild(actions);

            item.addEventListener('click', () => loadSession(session.id));
        }

        DOM.sessionList.appendChild(item);
    });
}

function saveSessionTitle(sessionId, newTitle) {
    const session = State.sessions.find(s => s.id === sessionId);
    if (session && newTitle.trim()) {
        session.title = newTitle.trim();
        session.isCustomTitle = true;
        persistSessionIndex();
    }
    State.editingSessionId = null;
    renderSessionList();
}

function deleteSession(sessionId) {
    if (!confirm('Are you sure you want to delete this chat?')) return;
    
    State.sessions = State.sessions.filter(s => s.id !== sessionId);
    persistSessionIndex();
    localStorage.removeItem(`${STORAGE_KEY_SESSION_PREFIX}${sessionId}`);
    
    if (State.currentSessionId === sessionId) {
        startNewSession();
    } else {
        renderSessionList();
    }
}

function saveGeneratedVideo(job, videoUrl, scriptText) {
    const createdAt = new Date().toISOString();
    const promptTitle = makeSessionTitle(State.submittedPrompt || 'Generated walkaround video');
    const existing = State.videos.find(video => video.jobId === job.job_id);
    const record = {
        id: existing?.id || crypto.randomUUID(),
        jobId: job.job_id,
        title: existing?.title || promptTitle,
        prompt: State.submittedPrompt,
        videoUrl,
        scriptText,
        status: 'Ready',
        imageCount: State.files.length,
        createdAt: existing?.createdAt || createdAt,
        updatedAt: createdAt,
        archived: existing?.archived || false
    };
    State.videos = [record, ...State.videos.filter(video => video.jobId !== job.job_id)];
    persistVideos();
    renderArchivedVideos();
}

function renderArchivedVideos() {
    const archived = State.videos.filter(video => video.archived);
    if (archived.length === 0) {
        DOM.archivedVideosList.textContent = 'No archived videos yet.';
        return;
    }
    DOM.archivedVideosList.innerHTML = archived.map(video => `
        <div class="archived-video-row">
            <span>${escapeHtml(video.title)}</span>
            <small>${escapeHtml(formatSessionDate(video.updatedAt))}</small>
        </div>
    `).join('');
}

function loadSession(sessionId) {
    State.currentSessionId = sessionId;
    try {
        State.chatMessages = JSON.parse(localStorage.getItem(`${STORAGE_KEY_SESSION_PREFIX}${sessionId}`) || '[]');
    } catch {
        State.chatMessages = [];
    }
    State.files = [];
    renderFilePreviews();
    renderChatMessages();
    renderSessionList();
    showCreateView();
    updateComposerState();
}

function renderChatMessages() {
    DOM.chatHistory.innerHTML = '';
    DOM.chatHero.classList.toggle('hidden', State.chatMessages.length > 0);
    State.chatMessages.forEach(message => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${message.role}`;
        const contentMarkup = message.role === 'assistant'
            ? `<div class="message-body"><div class="message-author">Axia</div><div class="content">${escapeHtml(message.content)}</div></div>`
            : `<div class="content">${escapeHtml(message.content)}</div>`;
        msgDiv.innerHTML = `<div class="avatar"></div>${contentMarkup}`;
        DOM.chatHistory.appendChild(msgDiv);
    });
    DOM.chatHistory.scrollTop = DOM.chatHistory.scrollHeight;
}

function startNewSession() {
    State.currentSessionId = null;
    State.files = [];
    State.chatMessages = [];
    State.submittedPrompt = '';
    DOM.instructionsInput.value = '';
    renderFilePreviews();
    renderChatMessages();
    renderSessionList();
    showCreateView();
    updateComposerState();
}

function selectProject(projectName, shouldStartNew = true) {
    State.activeProject = projectName;
    DOM.projectLinks.forEach(btn => btn.classList.toggle('active', btn.dataset.project === projectName));
    
    if (projectName === 'My Videos') {
        showMyVideosView();
    } else {
        if (shouldStartNew) startNewSession();
        renderSessionList();
    }
}

function makeSessionTitle(prompt) {
    return prompt.replace(/\s+/g, ' ').trim().slice(0, 48) || 'New chat';
}

function formatSessionDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function handleReview() {
    State.submittedPrompt = DOM.instructionsInput.value.trim();
    DOM.chatAndGenerateView.classList.add('hidden');
    DOM.axiaReviewCard.classList.remove('hidden');
    DOM.axiaReviewDetails.textContent = State.submittedPrompt;
}

async function submitJob() {
  DOM.axiaReviewCard.classList.add('hidden');
  DOM.resultsView.classList.remove('hidden');
  DOM.pipelineCard.classList.remove('hidden');
  DOM.artifactsCard.classList.add('hidden');
  DOM.pipelineEmptyState.classList.add('hidden');
  DOM.pipelineError.classList.add('hidden');
  State.isProcessing = true;
  updateComposerState();
  try {
    const res = await Api.createJob(State.files, State.submittedPrompt);
    State.activeJobId = res.job_id;
    DOM.jobIdDisplay.textContent = `Job ID: ${State.activeJobId}`;
    pollJob(State.activeJobId);
  } catch(err) {
    DOM.pipelineError.textContent = `Failed to start job: ${err.message}`;
    DOM.pipelineError.classList.remove('hidden');
    State.isProcessing = false;
    updateComposerState();
  }
}

function pollJob(jobId) {
    State.pollInterval = setInterval(async () => {
        try {
            const job = await Api.getJob(jobId);
            updatePipelineUI(job.stage, job.status);
            if (job.status === 'done' || job.status === 'error') {
                clearInterval(State.pollInterval);
                State.isProcessing = false;
                updateComposerState();
                if (job.status === 'done') displayArtifacts(job);
                else {
                    DOM.pipelineError.textContent = `Job failed: ${job.error || 'Unknown error'}`;
                    DOM.pipelineError.classList.remove('hidden');
                }
            }
        } catch (err) { console.error("Polling error:", err); }
    }, 2000);
}

function updatePipelineUI(stage, status) {
    const stagesOrder = ['ingest', 'vision', 'script', 'tts', 'render'];
    document.querySelectorAll('.stage').forEach(el => {
        el.classList.remove('active', 'done');
        const elStage = el.dataset.stage;
        if (elStage === stage && status === 'running') el.classList.add('active');
        else if (stagesOrder.indexOf(elStage) < stagesOrder.indexOf(stage)) el.classList.add('done');
    });
    if (status === 'done') document.querySelectorAll('.stage').forEach(el => el.classList.add('done'));
}

function displayArtifacts(job) {
    DOM.pipelineCard.classList.add('hidden');
    DOM.artifactsCard.classList.remove('hidden');
    const videoUrl = job.result?.video_url
        ? new URL(job.result.video_url, Config.getEngineUrl()).toString()
        : Api.getArtifactUrl(job.job_id, 'walkaround.mp4');
    const scriptText = job.result?.script_text || 'No script generated.';
    DOM.videoPreview.src = videoUrl;
    DOM.scriptPreview.textContent = scriptText;
    DOM.artifactLinks.innerHTML = `
        <a href="${videoUrl}" download>Download Video (walkaround.mp4)</a>
        <a href="${Api.getArtifactUrl(job.job_id, 'script.txt')}" download>Download Script (script.txt)</a>
        <a href="${Api.getArtifactUrl(job.job_id, 'manifest.json')}" download>Download Manifest (manifest.json)</a>
        <a href="${Api.getArtifactUrl(job.job_id, 'retrieval_context.json')}" download>Download Context (retrieval_context.json)</a>`;
    DOM.generateAnotherBtn.classList.remove('hidden');
    saveGeneratedVideo(job, videoUrl, scriptText);
}

function showCreateView() {
  hideAllViews();
  DOM.createView.classList.remove('hidden');
}

function escapeHtml(value) {
    if (typeof value !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
}

function showMyVideosView() { 
    hideAllViews(); 
    DOM.myVideosView.classList.remove('hidden'); 
    renderVideoLibrary();
}
function renderVideoLibrary() {
    const generatedVideos = (State.videos || []).filter(video => !video.archived).map(v => ({
        id: v.id,
        title: v.title,
        url: v.videoUrl,
        type: 'generated',
        date: v.createdAt
    }));
    const builtInVideos = BUILT_IN_VIDEOS.map(video => ({
        ...video,
        type: 'library',
        date: video.createdAt
    }));
    const allVideos = [...generatedVideos, ...builtInVideos];

    DOM.videoLibraryGrid.innerHTML = '';
    
    if (allVideos.length === 0) {
        DOM.videoLibraryGrid.innerHTML = '<div class="history-empty">No videos found.</div>';
        return;
    }

    allVideos.forEach(video => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `
            <div class="video-thumb-container">
                <video src="${video.url}" muted playsinline preload="metadata"></video>
                <div class="video-card-overlay">
                    <div class="play-icon"><i class="fas fa-play"></i></div>
                </div>
            </div>
            <div class="video-card-content">
                <h3 class="video-card-title">${escapeHtml(video.title)}</h3>
                <div class="video-card-meta">
                    <i class="fas fa-calendar"></i>
                    <span>${escapeHtml(formatSessionDate(video.date))}</span>
                    <span>·</span>
                    <span>${video.type === 'generated' ? 'Generated' : 'Library'}</span>
                </div>
                <div class="video-card-actions">
                    <button class="card-play-btn" data-id="${video.id}">
                        <i class="fas fa-play"></i> Play Video
                    </button>
                    <a href="${video.url}" download="${video.title}.mp4" class="card-download-btn">
                        <i class="fas fa-download"></i> Download
                    </a>
                </div>
            </div>
        `;
        
        card.querySelector('.video-thumb-container').addEventListener('click', () => openVideoPlayer(video));
        card.querySelector('.card-play-btn').addEventListener('click', () => openVideoPlayer(video));
        
        const videoEl = card.querySelector('video');
        card.addEventListener('mouseenter', () => videoEl.play().catch(() => {}));
        card.addEventListener('mouseleave', () => {
            videoEl.pause();
            videoEl.currentTime = 0;
        });

        DOM.videoLibraryGrid.appendChild(card);
    });
}

function openVideoPlayer(video) {
    DOM.playerVideoTitle.textContent = video.title;
    DOM.playerVideoElement.src = video.url;
    DOM.playerDownloadLink.href = video.url;
    DOM.playerDownloadLink.download = `${video.title}.mp4`;
    DOM.videoPlayerModal.classList.remove('hidden');
}

function closeVideoPlayer() {
    DOM.videoPlayerModal.classList.add('hidden');
    DOM.playerVideoElement.pause();
    DOM.playerVideoElement.src = '';
}

function showEngineMonitor() { hideAllViews(); DOM.engineMonitorView.classList.remove('hidden'); }
function hideAllViews() {
  DOM.createView.classList.add('hidden');
  DOM.myVideosView.classList.add('hidden');
  DOM.engineMonitorView.classList.add('hidden');
}

function resetCreateFlow() {
    State.files = [];
    State.chatMessages = [];
    State.submittedPrompt = '';
    State.activeJobId = null;
    DOM.instructionsInput.value = '';
    DOM.chatHistory.innerHTML = '';
    renderFilePreviews();
    updateComposerState();
    DOM.chatAndGenerateView.classList.remove('hidden');
    DOM.axiaReviewCard.classList.add('hidden');
    DOM.resultsView.classList.add('hidden');
}

function autoResizeTextarea() {
  const el = DOM.instructionsInput;
  el.style.height = 'auto';
  el.style.height = (el.scrollHeight) + 'px';
}

function toggleProfileMenu() { DOM.profileMenu.classList.toggle('hidden'); }
function closeProfileMenu() { DOM.profileMenu.classList.add('hidden'); }

async function checkEngineConnection() {
    try {
        await Api.testConnection();
        DOM.engineStatus.classList.add('connected');
        DOM.statusText.textContent = 'Engine Connected';
    } catch (e) {
        DOM.engineStatus.classList.remove('connected');
        DOM.statusText.textContent = 'Engine Disconnected';
    }
}

async function testConnectionModal() {
  DOM.connectionStatusModal.textContent = 'Testing...';
  try {
    await Api.testConnection();
    DOM.connectionStatusModal.textContent = 'Connected!';
  } catch (err) {
    DOM.connectionStatusModal.textContent = `Failed: ${err.message}`;
  }
}

function loadSettings() {
    DOM.engineUrlInput.value = Config.getEngineUrl();
    DOM.apiKeyInput.value = Config.getApiKey();
    try {
        State.preferences = JSON.parse(localStorage.getItem(STORAGE_KEY_PREFS) || '{}');
    } catch {
        State.preferences = {};
    }
    const prefs = {
        userName: 'Tradora User',
        userEmail: 'user@tradora.ai',
        dealerFocused: true,
        conciseScripts: true,
        memoryEnabled: true,
        emailCompleted: false,
        notifyErrors: true,
        ...State.preferences
    };
    State.preferences = prefs;
    DOM.settingsUserName.value = prefs.userName;
    DOM.settingsUserEmail.value = prefs.userEmail;
    DOM.prefDealerFocused.checked = prefs.dealerFocused;
    DOM.prefConciseScripts.checked = prefs.conciseScripts;
    DOM.prefMemoryEnabled.checked = prefs.memoryEnabled;
    DOM.prefEmailCompleted.checked = prefs.emailCompleted;
    DOM.prefNotifyErrors.checked = prefs.notifyErrors;
    renderArchivedVideos();
}

function saveAndCloseSettings() {
    Config.save(DOM.engineUrlInput.value, DOM.apiKeyInput.value);
    State.preferences = {
        userName: DOM.settingsUserName.value.trim() || 'Tradora User',
        userEmail: DOM.settingsUserEmail.value.trim() || 'user@tradora.ai',
        dealerFocused: DOM.prefDealerFocused.checked,
        conciseScripts: DOM.prefConciseScripts.checked,
        memoryEnabled: DOM.prefMemoryEnabled.checked,
        emailCompleted: DOM.prefEmailCompleted.checked,
        notifyErrors: DOM.prefNotifyErrors.checked
    };
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(State.preferences));
    DOM.settingsModal.classList.add('hidden');
    checkEngineConnection();
}

function exportLocalData() {
    const data = {
        exportedAt: new Date().toISOString(),
        preferences: State.preferences,
        sessions: State.sessions,
        videos: State.videos
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `autoreel-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function clearLocalHistory() {
    if (!confirm('Clear local chat history and generated video records? This will not delete engine artifacts.')) return;
    State.sessions.forEach(session => localStorage.removeItem(`${STORAGE_KEY_SESSION_PREFIX}${session.id}`));
    State.sessions = [];
    State.videos = [];
    persistSessionIndex();
    persistVideos();
    startNewSession();
    renderVideoLibrary();
    renderArchivedVideos();
}

document.addEventListener('DOMContentLoaded', init);
