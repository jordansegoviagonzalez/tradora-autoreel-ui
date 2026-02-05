import { Api, Config } from './api.js';

// --- State ---
const State = {
  sessions: [], // [{ id, title, timestamp }]
  currentSessionId: null,
  currentFiles: [], // Array of File objects (Memory only)
  isProcessing: false,
  
  get currentSession() {
    return this.sessions.find(s => s.id === this.currentSessionId);
  }
};

// --- DOM Elements ---
const DOM = {
  sidebar: document.getElementById('sidebar'),
  sessionList: document.getElementById('session-list'),
  newChatBtn: document.getElementById('new-chat-btn'),
  chatStream: document.getElementById('chat-stream'),
  welcomeScreen: document.getElementById('welcome-screen'),
  
  // Composer
  chatInput: document.getElementById('chat-input'),
  sendBtn: document.getElementById('send-btn'),
  generateBtn: document.getElementById('generate-btn'),
  attachBtn: document.getElementById('attach-btn'),
  fileInput: document.getElementById('file-input'),
  attachmentBar: document.getElementById('attachment-bar'),
  photoBadge: document.getElementById('photo-badge'),
  
  // Settings
  settingsTrigger: document.getElementById('settings-trigger'),
  settingsModal: document.getElementById('settings-modal'),
  closeModal: document.querySelector('.close-modal'),
  saveSettingsBtn: document.getElementById('save-settings-btn'),
  engineUrlInput: document.getElementById('engine-url'),
  apiKeyInput: document.getElementById('api-key'),
  testConnectionBtn: document.getElementById('test-connection-btn'),
  connectionStatus: document.getElementById('connection-status'),
  
  // Mobile
  mobileMenuBtn: document.getElementById('mobile-menu-btn')
};

// --- Initialization ---

function init() {
  loadSessions();
  
  // Setup Listeners
  DOM.newChatBtn.addEventListener('click', createNewSession);
  DOM.sendBtn.addEventListener('click', handleSend);
  DOM.chatInput.addEventListener('keydown', handleInputKey);
  
  // Files
  DOM.attachBtn.addEventListener('click', () => DOM.fileInput.click());
  DOM.fileInput.addEventListener('change', handleFileSelect);
  
  // Generate
  DOM.generateBtn.addEventListener('click', handleGenerate);
  
  // Settings
  DOM.settingsTrigger.addEventListener('click', () => DOM.settingsModal.classList.remove('hidden'));
  DOM.closeModal.addEventListener('click', () => DOM.settingsModal.classList.add('hidden'));
  DOM.saveSettingsBtn.addEventListener('click', saveSettings);
  DOM.testConnectionBtn.addEventListener('click', testConnection);

  // Mobile
  DOM.mobileMenuBtn.addEventListener('click', () => DOM.sidebar.classList.toggle('open'));
  
  // Load Settings
  DOM.engineUrlInput.value = Config.getEngineUrl();
  DOM.apiKeyInput.value = Config.getApiKey();

  // If no sessions, create one
  if (State.sessions.length === 0) {
    createNewSession();
  } else {
    // Load most recent
    switchSession(State.sessions[0].id);
  }
  
  // Auto-resize textarea
  DOM.chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if(this.value === '') this.style.height = 'auto';
  });
}

// --- Session Management ---

function loadSessions() {
  const raw = localStorage.getItem('autoreel_sessions');
  State.sessions = raw ? JSON.parse(raw) : [];
  renderSessionList();
}

function saveSessions() {
  localStorage.setItem('autoreel_sessions', JSON.stringify(State.sessions));
  renderSessionList();
}

function createNewSession() {
  const id = Date.now().toString();
  const newSession = {
    id,
    title: 'New Session',
    timestamp: Date.now()
  };
  
  State.sessions.unshift(newSession);
  saveSessions();
  switchSession(id);
  
  // Clear files on new session
  State.currentFiles = [];
  renderAttachments();
}

function switchSession(id) {
  State.currentSessionId = id;
  
  // Highlight in sidebar
  document.querySelectorAll('.session-item').forEach(el => {
    el.classList.toggle('active', el.dataset.id === id);
  });
  
  // Load History
  const history = getSessionHistory(id);
  renderChat(history);
  
  // Mobile: close sidebar
  DOM.sidebar.classList.remove('open');
}

function getSessionHistory(id) {
  const raw = localStorage.getItem(`autoreel_session_${id}`);
  return raw ? JSON.parse(raw) : [];
}

function saveSessionHistory(id, messages) {
  localStorage.setItem(`autoreel_session_${id}`, JSON.stringify(messages));
  
  // Update Title if it's the first user message
  const session = State.sessions.find(s => s.id === id);
  if (session && session.title === 'New Session' && messages.length > 0) {
    const firstUserMsg = messages.find(m => m.role === 'user');
    if (firstUserMsg) {
      session.title = firstUserMsg.content.slice(0, 30) + '...';
      saveSessions();
    }
  }
}

function renderSessionList() {
  DOM.sessionList.innerHTML = '';
  State.sessions.forEach(s => {
    const div = document.createElement('div');
    div.className = 'session-item';
    div.dataset.id = s.id;
    div.innerHTML = `<i class="far fa-comments"></i> ${s.title}`;
    div.onclick = () => switchSession(s.id);
    DOM.sessionList.appendChild(div);
  });
}

// --- Chat Logic ---

function renderChat(messages) {
  DOM.chatStream.innerHTML = '';
  
  if (messages.length === 0) {
    DOM.chatStream.appendChild(DOM.welcomeScreen);
    DOM.welcomeScreen.classList.remove('hidden');
    return;
  } else {
    DOM.welcomeScreen.classList.add('hidden');
  }

  messages.forEach(msg => appendMessageToDOM(msg));
  scrollToBottom();
}

function appendMessageToDOM(msg) {
  const div = document.createElement('div');
  div.className = `message ${msg.role}`;
  
  const contentHtml = msg.role === 'assistant' ? formatAssistantMessage(msg.content) : escapeHtml(msg.content);
  
  div.innerHTML = `
    <div class="msg-content">
      <div class="avatar">
        ${msg.role === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>'}
      </div>
      <div class="text">${contentHtml}</div>
    </div>
  `;
  
  DOM.chatStream.appendChild(div);
}

function formatAssistantMessage(text) {
  // Simple markdown-like parser or just text for now
  // If it contains JSON/Video result, render that differently?
  // For now just line breaks
  return text.replace(/\n/g, '<br>');
}

function scrollToBottom() {
  DOM.chatStream.scrollTop = DOM.chatStream.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function handleSend() {
  const text = DOM.chatInput.value.trim();
  if (!text) return;

  DOM.chatInput.value = '';
  DOM.chatInput.style.height = 'auto'; // Reset height
  
  // 1. Add User Message
  const userMsg = { role: 'user', content: text };
  const history = getSessionHistory(State.currentSessionId);
  history.push(userMsg);
  saveSessionHistory(State.currentSessionId, history);
  
  DOM.welcomeScreen.classList.add('hidden');
  appendMessageToDOM(userMsg);
  scrollToBottom();
  
  // 2. Add Loading Indicator
  const loadingId = 'loading-' + Date.now();
  appendLoadingIndicator(loadingId);
  
  try {
    // 3. Call API
    // Construct context: system prompt + history
    const apiMessages = [
      { role: 'system', content: 'You are an expert video director. Help the user refine their narration instructions for a car walkaround video. Be concise and professional.' },
      ...history
    ];
    
    const response = await Api.chat(apiMessages);
    
    // 4. Remove Loading, Add Assistant Message
    removeLoadingIndicator(loadingId);
    
    const assistantMsg = { role: 'assistant', content: response.content || response.message || "I didn't get a response." };
    // Handle if response structure differs (e.g. choices[0].message)
    // Assuming Api.chat returns { role, content } or similar
    if (response.choices && response.choices[0]) {
       assistantMsg.content = response.choices[0].message.content;
    }
    
    history.push(assistantMsg);
    saveSessionHistory(State.currentSessionId, history);
    appendMessageToDOM(assistantMsg);
    scrollToBottom();

  } catch (err) {
    removeLoadingIndicator(loadingId);
    appendMessageToDOM({ role: 'assistant', content: `Error: ${err.message}` });
  }
}

function handleInputKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

function appendLoadingIndicator(id) {
  const div = document.createElement('div');
  div.id = id;
  div.className = 'message assistant';
  div.innerHTML = `
    <div class="msg-content">
      <div class="avatar"><i class="fas fa-robot"></i></div>
      <div class="text"><i class="fas fa-circle-notch fa-spin"></i> Thinking...</div>
    </div>
  `;
  DOM.chatStream.appendChild(div);
  scrollToBottom();
}

function removeLoadingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// --- File Handling ---

function handleFileSelect(e) {
  if (e.target.files.length) {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    State.currentFiles = [...State.currentFiles, ...files];
    DOM.fileInput.value = ''; // Reset
    renderAttachments();
  }
}

function renderAttachments() {
  DOM.attachmentBar.innerHTML = '';
  
  if (State.currentFiles.length === 0) {
    DOM.attachmentBar.classList.add('hidden');
    DOM.photoBadge.classList.add('hidden');
    DOM.generateBtn.disabled = true;
    DOM.generateBtn.classList.add('hidden');
  } else {
    DOM.attachmentBar.classList.remove('hidden');
    DOM.photoBadge.classList.remove('hidden');
    DOM.photoBadge.textContent = State.currentFiles.length;
    DOM.generateBtn.classList.remove('hidden');
    
    // Check if enough photos to generate
    DOM.generateBtn.disabled = State.currentFiles.length < 3;
    
    State.currentFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      const img = document.createElement('img');
      img.src = url;
      img.className = 'thumb-preview';
      img.onload = () => URL.revokeObjectURL(url);
      DOM.attachmentBar.appendChild(img);
    });
  }
}

// --- Job Generation ---

async function handleGenerate() {
  if (State.currentFiles.length < 3) return;
  
  // 1. Get Instructions from Chat
  const history = getSessionHistory(State.currentSessionId);
  const lastMsg = history.length > 0 ? history[history.length - 1].content : "Default narration.";
  
  // 2. Add System Message "Generating..."
  const genMsgId = 'gen-' + Date.now();
  appendMessageToDOM({ role: 'assistant', content: '🎬 **Starting Generation**\nUploading photos and creating your walkaround...' });
  scrollToBottom();

  try {
    // 3. Create Job
    const res = await Api.createJob(State.currentFiles, lastMsg);
    const jobId = res.job_id;
    
    // 4. Poll
    pollJob(jobId, genMsgId);
    
  } catch (err) {
    appendMessageToDOM({ role: 'assistant', content: `❌ **Generation Failed**\n${err.message}` });
  }
}

async function pollJob(jobId, msgId) {
  // We can update a status message bubble or just wait
  // Let's create a dynamic status bubble
  const statusDiv = document.createElement('div');
  statusDiv.className = 'message assistant';
  statusDiv.innerHTML = `
    <div class="msg-content">
      <div class="avatar"><i class="fas fa-video"></i></div>
      <div class="text" id="status-${jobId}">Initializing...</div>
    </div>
  `;
  DOM.chatStream.appendChild(statusDiv);
  scrollToBottom();
  
  const statusText = document.getElementById(`status-${jobId}`);
  
  const interval = setInterval(async () => {
    try {
      const job = await Api.getJob(jobId);
      
      if (job.status === 'error') {
        clearInterval(interval);
        statusText.innerHTML = `❌ Error: ${job.error?.message}`;
        return;
      }
      
      statusText.textContent = `Processing: ${job.stage.toUpperCase()}...`;
      
      if (job.status === 'done') {
        clearInterval(interval);
        renderResult(job, statusDiv);
      }
    } catch (err) {
      console.error(err);
      // Don't clear interval immediately on network blip
    }
  }, 1000);
}

function renderResult(job, containerDiv) {
  const result = job.result;
  const videoUrl = Api.getArtifactUrl(job.job_id, 'final.mp4'); // Or result.video_url logic
  const jsonUrl = Api.getArtifactUrl(job.job_id, 'result.json');
  
  containerDiv.innerHTML = `
    <div class="msg-content">
      <div class="avatar" style="background:var(--accent-neon); color:#000;"><i class="fas fa-check"></i></div>
      <div class="text">
        <div style="margin-bottom:1rem; font-weight:bold;">Walkaround Ready!</div>
        
        <video controls style="width:100%; max-width:400px; border-radius:8px; margin-bottom:1rem;">
          <source src="${videoUrl}" type="video/mp4">
          Your browser does not support video.
        </video>
        
        <div style="background:#222; padding:1rem; border-radius:6px; font-size:0.85rem; margin-bottom:1rem; max-height:150px; overflow-y:auto; font-family:monospace; color:#ccc;">
          ${result.script_text || 'No script available.'}
        </div>
        
        <div style="display:flex; gap:0.5rem;">
          <a href="${videoUrl}" download class="btn-primary" style="text-decoration:none; font-size:0.9rem;">Download Video</a>
          <a href="${jsonUrl}" download class="btn-secondary" style="text-decoration:none; font-size:0.9rem;">JSON</a>
        </div>
      </div>
    </div>
  `;
  
  // Save this event to history? Complex because of HTML. 
  // For now, we leave it as ephemeral DOM state or we could save a special "result" message type.
  // To keep "no mock" simple: we don't persist the RESULT HTML in localStorage, only the chat text.
  // If user reloads, they see history but loose the result player.
}

// --- Settings ---

function saveSettings() {
  const url = DOM.engineUrlInput.value.trim();
  const key = DOM.apiKeyInput.value.trim();
  Config.save(url, key);
  DOM.settingsModal.classList.add('hidden');
}

async function testConnection() {
  DOM.connectionStatus.textContent = 'Testing...';
  DOM.connectionStatus.style.color = '#999';
  try {
    await Api.testConnection();
    DOM.connectionStatus.textContent = 'Connected';
    DOM.connectionStatus.style.color = 'var(--accent-neon)';
  } catch (err) {
    DOM.connectionStatus.textContent = 'Failed';
    DOM.connectionStatus.style.color = '#ff4444';
  }
}

// Start
init();