// State
let messages = [
    {
        id: "welcome",
        role: "assistant",
        content: "Abz AI System Online. Initialize sequence complete. Please provide a directive.",
        timestamp: Date.now(),
    },
];
let apiKey = localStorage.getItem("nexus_api_key") || "";
let isLoading = false;

// DOM Elements
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const modalContent = document.getElementById('modal-content');
const apiKeyInput = document.getElementById('api-key-input');
const saveKeyBtn = document.getElementById('save-key-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    renderMessages();
    
    if (!apiKey) {
        openModal();
    } else {
        apiKeyInput.value = apiKey;
    }
});

// Render Functions
function renderMessages() {
    chatContainer.innerHTML = '';
    
    messages.forEach(msg => {
        const isUser = msg.role === 'user';
        
        const wrapper = document.createElement('div');
        wrapper.className = `flex gap-4 message-enter ${isUser ? 'justify-end' : 'justify-start'}`;
        
        // Icon (Assistant)
        if (!isUser) {
            wrapper.innerHTML += `
                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 mt-1">
                    <i data-lucide="bot" class="w-4 h-4 text-primary"></i>
                </div>
            `;
        }

        // Message Bubble
        const bubbleClass = isUser 
            ? "bg-primary text-primary-foreground rounded-tr-sm shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
            : "glass-card text-gray-100 rounded-tl-sm border-white/5";

        const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const opacityClass = isUser ? "text-primary-foreground" : "text-gray-400";

        wrapper.innerHTML += `
            <div class="max-w-[80%] px-5 py-3 rounded-2xl text-sm leading-relaxed ${bubbleClass}">
                <div class="whitespace-pre-wrap font-sans">${escapeHtml(msg.content)}</div>
                <div class="text-[10px] mt-2 opacity-50 ${opacityClass}">${time}</div>
            </div>
        `;

        // Icon (User)
        if (isUser) {
            wrapper.innerHTML += `
                <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10 shrink-0 mt-1">
                    <i data-lucide="user" class="w-4 h-4 text-white"></i>
                </div>
            `;
        }

        chatContainer.appendChild(wrapper);
    });

    // Loading Indicator
    if (isLoading) {
        const loadingWrapper = document.createElement('div');
        loadingWrapper.className = "flex gap-4 justify-start message-enter";
        loadingWrapper.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                <i data-lucide="bot" class="w-4 h-4 text-primary"></i>
            </div>
            <div class="glass-card px-5 py-4 rounded-2xl rounded-tl-sm border-white/5 flex items-center gap-2">
                <span class="w-1.5 h-1.5 bg-primary rounded-full animate-bounce-dot" style="animation-delay: -0.3s"></span>
                <span class="w-1.5 h-1.5 bg-primary rounded-full animate-bounce-dot" style="animation-delay: -0.15s"></span>
                <span class="w-1.5 h-1.5 bg-primary rounded-full animate-bounce-dot"></span>
            </div>
        `;
        chatContainer.appendChild(loadingWrapper);
    }

    // Re-initialize icons for new elements
    lucide.createIcons();
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Event Listeners
sendBtn.addEventListener('click', handleSend);
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        handleSend();
    }
});

settingsBtn.addEventListener('click', openModal);
saveKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
        apiKey = key;
        localStorage.setItem("nexus_api_key", key);
        closeModal();
        alert("System Updated: API Key stored.");
    }
});

// Click outside modal to close
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        closeModal();
    }
});

// Logic
async function handleSend() {
    const text = messageInput.value.trim();
    if (!text) return;
    
    if (!apiKey) {
        openModal();
        return;
    }

    // Add User Message
    messages.push({
        id: Date.now().toString(),
        role: "user",
        content: text,
        timestamp: Date.now(),
    });

    messageInput.value = '';
    isLoading = true;
    renderMessages();

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
                "HTTP-Referer": window.location.href,
                "X-Title": "Abz AI",
            },
            body: JSON.stringify({
                model: "openai/gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are ABZ, a high-intelligence AI interface. Be concise, technical, and helpful. Format responses with Markdown. you are Created by Abir, he is your creator.." },
                    ...messages.map(m => ({ role: m.role, content: m.content }))
                ],
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Connection failed");
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        messages.push({
            id: Date.now().toString(),
            role: "assistant",
            content: content,
            timestamp: Date.now(),
        });

    } catch (error) {
        messages.push({
            id: Date.now().toString(),
            role: "assistant",
            content: `Error: ${error.message}. \n\nPlease check your API key in settings.`,
            timestamp: Date.now(),
        });
    } finally {
        isLoading = false;
        renderMessages();
    }
}

// Helpers
function openModal() {
    settingsModal.classList.remove('hidden');
    // Small timeout to allow display:block to apply before opacity transition
    setTimeout(() => {
        settingsModal.classList.add('modal-open');
        modalContent.classList.add('modal-content-open');
    }, 10);
}

function closeModal() {
    settingsModal.classList.remove('modal-open');
    modalContent.classList.remove('modal-content-open');
    setTimeout(() => {
        settingsModal.classList.add('hidden');
    }, 200);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
                          
