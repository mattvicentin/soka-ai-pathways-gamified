import { tracker } from './tracking.js';
import { loadConfig, loadNodesWithConfig, applyColorsToDOM } from './config-loader.js';

async function loadNodes(){ 
  try {
    // Use new config-aware loader
    return await loadNodesWithConfig();
  } catch (error) {
    console.error('Error loading nodes:', error);
    throw error;
  }
}
function getParam(name){
  const m = location.hash.match(new RegExp(name+'=([^&]+)'));
  return m ? decodeURIComponent(m[1]) : '';
}
function getNodeFromHash(){ return getParam('node') || 'D1'; }
function getTrailFromHash(){ return getParam('trail'); }
function setHash(node, trail){ location.hash = 'node='+encodeURIComponent(node) + (trail ? '&trail='+encodeURIComponent(trail) : ''); }

function pathClass(path){
  switch(path){
    case 'ignore': return 'path-ignore';
    case 'prohibitive': return 'path-prohibitive';
    case 'balanced': return 'path-balanced';
    case 'embracing': return 'path-embracing';
    case 'collaborative': return 'path-collaborative';
    default: return 'path-shared';
  }
}

async function showWelcomeScreen(config, callback) {
  const app = document.getElementById('app');
  const user = tracker.getUser();
  
  // Only show welcome if they haven't set a name yet
  if (user.name || sessionStorage.getItem('welcomed')) {
    callback();
    return;
  }

  const siteName = config.metadata.siteName || 'AI Pathways Explorer';
  app.innerHTML = `
    <div class="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-lg border-2" style="border-color: var(--color-primary)">
      <h1 class="font-serif text-3xl font-bold mb-4" style="color: var(--color-primary)">Welcome to ${siteName}</h1>
      <p class="text-lg text-gray-700 leading-relaxed mb-6">
        This interactive experience explores different approaches to AI in the classroom. 
        Your journey will be tracked locally in your browser to help us improve the workshop.
      </p>
      <div class="bg-blue-50 p-5 rounded-lg mb-6">
        <label class="block font-medium text-gray-700 mb-2">Enter your name (optional):</label>
        <input type="text" id="user-name-input" 
          class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none"
          style="border-color: #D1D5DB; focus:border-color: var(--color-primary)"
          placeholder="e.g., Professor Smith">
        <p class="text-sm text-gray-500 mt-2">Or skip to continue anonymously</p>
      </div>
      <div class="flex gap-3">
        <button id="submit-name" class="flex-1 px-6 py-3 text-white rounded-xl font-medium shadow-sm hover:shadow-md transition-all" style="background-color: var(--color-primary)">
          Continue
        </button>
        <button id="skip-name" class="px-6 py-3 border-2 border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 font-medium transition-all">
          Skip
        </button>
      </div>
      <p class="text-xs text-gray-500 mt-4">
        ℹ️ Your data stays in your browser only. No information is sent to a server.
      </p>
    </div>
  `;

  document.getElementById('submit-name').onclick = () => {
    const name = document.getElementById('user-name-input').value;
    if (name.trim()) {
      tracker.setUserName(name);
    }
    sessionStorage.setItem('welcomed', 'true');
    callback();
  };

  document.getElementById('skip-name').onclick = () => {
    sessionStorage.setItem('welcomed', 'true');
    callback();
  };

  // Allow Enter key to submit
  document.getElementById('user-name-input').onkeypress = (e) => {
    if (e.key === 'Enter') {
      document.getElementById('submit-name').click();
    }
  };
}

function renderNode(node, trail=''){
  const app = document.getElementById('app');
  if(!node){
    app.innerHTML = '<div class="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-lg border-2 border-gray-200"><h1 class="font-serif text-3xl font-bold" style="color: var(--color-primary)">Node not found</h1><p class="mt-3 text-gray-600">Please check the URL or restart from the beginning.</p></div>';
    return;
  }
  
  // Track this visit
  tracker.logVisit(node.id, node.path, node.title);
  
  const newTrail = trail ? (trail + '>' + node.id) : node.id;
  const user = tracker.getUser();
  app.innerHTML = `
    <article class="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-lg border-2 border-gray-100 transition-all">
      <header class="flex items-start justify-between gap-4 mb-6">
        <div class="flex-1">
          ${user.name ? `<p class="text-sm text-gray-500 mb-2">👋 ${user.name}</p>` : ''}
          <p class="badge ${pathClass(node.path)} mb-3">${(node.pathLabel||'')}</p>
          <h1 id="page-title" tabindex="-1" class="font-serif text-4xl font-bold leading-tight tracking-tight" style="color: var(--color-primary)">${node.title}</h1>
        </div>
        <div class="text-right text-xs text-gray-400 font-mono">
          <div>Node: <code class="bg-gray-100 px-2 py-1 rounded">${node.id}</code></div>
          <div class="mt-1">Trail: ${newTrail.split('>').length}</div>
          <div class="mt-1">Visits: ${tracker.getJourney().length}</div>
        </div>
      </header>
      <div class="text-lg leading-relaxed text-gray-700 space-y-4">
        ${node.narrative.split('\n\n').map(para => `<p>${para}</p>`).join('')}
      </div>

      ${node.resources && node.resources.length ? `
        <section class="mt-8">
          <h2 class="font-serif text-xl font-semibold mb-3" style="color: var(--color-primary)">Resources</h2>
          <ul class="space-y-3 bg-blue-50 rounded-xl p-5 border border-blue-100">
            ${node.resources.map(r=>`<li class="flex items-start gap-2">
              <span class="mt-1" style="color: var(--color-primary)">→</span>
              <div>
                <a class="font-medium underline decoration-2 transition-colors" style="color: var(--color-primary); text-decoration-color: var(--color-accent)" href="${r.url}" target="_blank" rel="noopener noreferrer">
                  ${r.label}
                  <span class="sr-only">(opens in new tab)</span>
                </a>
                ${r.why ? `<span class="block text-sm text-gray-600 mt-1">${r.why}</span>` : ''}
              </div>
            </li>`).join('')}
          </ul>
        </section>` : ''}

      ${node.id === 'R1' ? `
        <section class="mt-8 rounded-xl p-6 border-2" style="background-color: rgba(252, 212, 59, 0.1); border-color: var(--color-accent)">
          <h2 class="font-serif text-2xl font-semibold mb-4" style="color: var(--color-primary)">📝 Share Your Reflection (Optional)</h2>
          <p class="text-gray-700 mb-6">Help us improve this workshop by sharing your insights. Your response will be sent to the workshop organizers.</p>
          
          <div id="reflection-form" class="space-y-4">
            <div>
              <label class="block font-medium text-gray-700 mb-2">What did you protect?</label>
              <textarea id="protected" rows="2" class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none" placeholder="e.g., Academic integrity, student trust..."></textarea>
            </div>
            <div>
              <label class="block font-medium text-gray-700 mb-2">What did you risk?</label>
              <textarea id="risked" rows="2" class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none" placeholder="e.g., Student engagement, workload..."></textarea>
            </div>
            <div>
              <label class="block font-medium text-gray-700 mb-2">What did you learn?</label>
              <textarea id="learned" rows="2" class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none" placeholder="e.g., The importance of dialogue..."></textarea>
            </div>
            <div>
              <label class="block font-medium text-gray-700 mb-2">What is one concrete next step?</label>
              <textarea id="nextStep" rows="2" class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none" placeholder="e.g., Add AI literacy unit to my syllabus..."></textarea>
            </div>
            <button id="submit-reflection" class="w-full px-6 py-3 text-white rounded-xl font-medium shadow-sm hover:shadow-md transition-all" style="background-color: var(--color-primary)">
              Submit Reflection
            </button>
          </div>
          
          <div id="reflection-thanks" class="hidden text-center py-8">
            <div class="text-6xl mb-4">✅</div>
            <h3 class="font-serif text-2xl font-bold mb-2" style="color: var(--color-primary)">Thank You!</h3>
            <p class="text-gray-700">Your reflection has been recorded.</p>
          </div>
        </section>` : ''}

      <section class="mt-8">
        <h2 class="font-serif text-xl font-semibold mb-4" style="color: var(--color-primary)">Choose Your Path</h2>
        <div class="grid gap-3">
          ${node.choices.map(c=>`<a class="block px-6 py-4 rounded-xl border-2 bg-white font-medium shadow-sm hover:shadow-md transition-all duration-200 text-center choice-button"
              style="border-color: var(--color-primary); color: var(--color-primary)"
              href="#node=${encodeURIComponent(c.to)}&trail=${encodeURIComponent(newTrail)}">${c.label}</a>`).join('')}
        </div>
      </section>

      <section class="mt-8 pt-6 border-t border-gray-200">
        <div class="flex flex-wrap items-center gap-4 text-sm">
          <a class="text-gray-500 underline transition-colors hover-primary" href="#node=D1">← Restart from Beginning</a>
          <button onclick="window.tracker.downloadJourney()" class="text-gray-500 underline transition-colors hover-primary">
            Download My Journey
          </button>
          ${user.name ? `<span class="text-gray-400">•</span>
          <button onclick="if(confirm('Clear your name and journey data?')){window.tracker.resetUser(); location.reload();}" class="text-gray-400 hover:text-red-600 underline transition-colors">
            Reset Data
          </button>` : ''}
        </div>
      </section>
    </article>
  `;
  
  // Move focus to the new heading for screen reader users
  const heading = document.getElementById('page-title');
  if (heading) {
    heading.focus();
  }

  // Add reflection form handler for R1
  if (node.id === 'R1') {
    const submitBtn = document.getElementById('submit-reflection');
    if (submitBtn) {
      submitBtn.onclick = async () => {
        const protectedVal = document.getElementById('protected').value;
        const riskedVal = document.getElementById('risked').value;
        const learnedVal = document.getElementById('learned').value;
        const nextStepVal = document.getElementById('nextStep').value;
        
        // At least one field must be filled
        if (!protectedVal && !riskedVal && !learnedVal && !nextStepVal) {
          alert('Please fill in at least one reflection field.');
          return;
        }
        
        // Disable button during submission
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        
        // Submit to Google Sheets
        await tracker.submitReflection(protectedVal, riskedVal, learnedVal, nextStepVal);
        
        // Show thank you message
        document.getElementById('reflection-form').classList.add('hidden');
        document.getElementById('reflection-thanks').classList.remove('hidden');
      };
    }
  }
}

(async function init(){
  const app = document.getElementById('app');
  
  // Expose tracker globally for onclick handlers
  window.tracker = tracker;
  
  // Load configuration and apply colors
  const config = await loadConfig();
  applyColorsToDOM(config);
  
  // Update page title and meta description
  document.title = config.metadata.siteName || 'AI Pathways Explorer';
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.content = config.metadata.description || 'Interactive explorer for AI pedagogy approaches';
  }
  
  // Show loading state
  app.innerHTML = '<div class="max-w-4xl mx-auto p-8 text-center"><div class="animate-pulse font-serif text-xl" style="color: var(--color-primary)">Loading pathways...</div></div>';
  
  try {
    const nodes = await loadNodes();
    
    function update(){
      const nodeId = getNodeFromHash();
      const trail = getTrailFromHash();
      renderNode(nodes[nodeId], trail);
    }
    
    window.addEventListener('hashchange', update);
    
    // Show welcome screen first, then start
    await showWelcomeScreen(config, () => {
      update();
    });
  } catch (error) {
    // Show user-friendly error message
    app.innerHTML = `
      <div class="max-w-4xl mx-auto p-8 bg-red-50 rounded-2xl shadow-lg border-2 border-red-200">
        <h1 class="font-serif text-3xl font-bold text-red-900 mb-4">Unable to Load Content</h1>
        <p class="text-lg text-red-800 mb-6 leading-relaxed">
          We encountered an error loading the AI Pathways Explorer. This might be due to a network issue or browser cache problem.
        </p>
        <div class="space-y-4">
          <button onclick="location.reload()" class="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium shadow-sm hover:shadow-md transition-all">
            Retry
          </button>
          <p class="text-sm text-red-700">
            If the problem persists, try:<br>
            • Refreshing your browser (Cmd+R or Ctrl+R)<br>
            • Clearing your browser cache<br>
            • Using a different browser
          </p>
        </div>
        <details class="mt-6 text-xs text-red-600">
          <summary class="cursor-pointer font-medium">Technical details</summary>
          <pre class="mt-2 p-3 bg-red-100 rounded-lg overflow-auto font-mono">${error.message || error}</pre>
        </details>
      </div>
    `;
  }
})();