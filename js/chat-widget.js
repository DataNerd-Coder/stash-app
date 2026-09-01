// STASH — shared global chatbox widget
// Injects the full chat bottom-sheet (compact <-> expanded), calculator modal,
// and hidden file inputs into any page that calls mountStashChat().
// This keeps the chat markup in exactly one place instead of duplicated per page.

function stashChatWidgetHTML(){
  const isDashboardPage = /(^|\/)dashboard\.html$/.test(window.location.pathname) || window.location.pathname === "/" || window.location.pathname.endsWith("/stash-app/");
  return `
    <!-- ===== Chat bottom sheet (compact <-> expanded) ===== -->
    <div class="chat-sheet compact" id="chatSheet">

      <div class="chat-sheet-header">
        <button class="chat-history-btn" onclick="openHistoryDrawer()" aria-label="Chat history">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M4 6.5H20M4 12H20M4 17.5H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
        <div style="display:flex; align-items:center; gap:8px;">
          <div class="msg-avatar" style="width:26px; height:26px; border-radius:8px;"><img src="assets/logo-icon.png" alt="Stash" style="width:14px; height:14px;"></div>
          <span class="header-title" style="font-size:15px;">Stash</span>
        </div>
        <button class="chat-history-btn" onclick="StashChat.collapse()" aria-label="Collapse">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 9L12 16L5 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>

      <div id="chatDockHandle">
        <div class="grabber"></div>
      </div>

      <div class="chat-thread-wrap" id="chatThreadWrap">
        <div id="chatThread" style="display:flex; flex-direction:column;"></div>
      </div>

      <div class="history-drawer-overlay" id="historyDrawerOverlay" onclick="if(event.target===this) closeHistoryDrawer();">
        <div class="history-drawer-panel">
          <div class="history-drawer-header">
            <h2>Chat history</h2>
            <button class="chat-history-btn" onclick="closeHistoryDrawer()" aria-label="Close">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 5L19 19M19 5L5 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            </button>
          </div>
          <div class="history-search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.8"/><path d="M20 20L16 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            <input type="text" id="historySearchInput" placeholder="Search conversations" oninput="renderHistoryList(this.value)">
          </div>
          <div class="history-list" id="historyList"></div>
          <div style="padding:4px 4px 4px;">
            <button class="btn-secondary" onclick="startNewChat()">Start a new chat</button>
          </div>
        </div>
      </div>

      <!-- footer: suggestions + input (shared compact/expanded) -->
      <div class="chat-sheet-footer" id="chatCompactContent">
        <div class="suggestion-row" id="suggestionRow"></div>

        <!-- voice recording bar (hidden unless recording) -->
        <div class="voice-bar" id="voiceBar" style="display:none;">
          <button class="voice-cancel-btn" onclick="StashVoice.cancel()" aria-label="Cancel recording">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 5L19 19M19 5L5 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>
          <div class="voice-waveform" id="voiceWaveform">
            <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
          <span class="voice-timer" id="voiceTimer">0:00</span>
          <button class="voice-send-btn" onclick="StashVoice.finish()" aria-label="Send recording">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M20 12L4 4L7 12L4 20L20 12Z" stroke="white" stroke-width="1.8" stroke-linejoin="round" fill="white"/></svg>
          </button>
        </div>

        <div class="chat-input-row" id="chatInputRow" style="position:relative; margin-top:8px;">
          <div id="mentionMenu" class="mention-menu"></div>
          <div id="productMenu" class="mention-menu product-menu"></div>

          <!-- + toolbox -->
          <div class="plus-menu" id="plusMenu">
            <button class="plus-menu-item" onclick="closePlusMenu(); triggerCamera();">
              <span class="plus-menu-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 8.5C4 7.4 4.9 6.5 6 6.5H8L9 5H15L16 6.5H18C19.1 6.5 20 7.4 20 8.5V17C20 18.1 19.1 19 18 19H6C4.9 19 4 18.1 4 17V8.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="12.5" r="3.2" stroke="currentColor" stroke-width="1.6"/></svg></span>
              Camera
            </button>
            <button class="plus-menu-item" onclick="closePlusMenu(); triggerAttach();">
              <span class="plus-menu-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 8L9.5 15.5C8.4 16.6 6.6 16.6 5.5 15.5C4.4 14.4 4.4 12.6 5.5 11.5L13.5 3.5C14.9 2.1 17.1 2.1 18.5 3.5C19.9 4.9 19.9 7.1 18.5 8.5L11 16C10.3 16.7 9.2 16.7 8.5 16C7.8 15.3 7.8 14.2 8.5 13.5L15 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
              Files
            </button>
            <button class="plus-menu-item" onclick="closePlusMenu(); window.location.href='barcode.html';">
              <span class="plus-menu-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 5V19M8 5V19M11 5V19M15 5V19M17 5V19M20 5V19" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></span>
              Barcode
            </button>
            <button class="plus-menu-item" onclick="closePlusMenu(); openCalculator();">
              <span class="plus-menu-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="5" y="3.5" width="14" height="17" rx="2.5" stroke="currentColor" stroke-width="1.6"/><path d="M8 7.5H16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="8.3" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="15.7" cy="12" r="1" fill="currentColor"/><circle cx="8.3" cy="15.7" r="1" fill="currentColor"/><circle cx="12" cy="15.7" r="1" fill="currentColor"/><circle cx="15.7" cy="15.7" r="1" fill="currentColor"/></svg></span>
              Calculator
            </button>
            <button class="plus-menu-item" onclick="closePlusMenu(); insertMentionTrigger();">
              <span class="plus-menu-icon plus-menu-at">@</span>
              Go to page
            </button>
          </div>

          <button class="chat-icon-btn" onclick="togglePlusMenu()" id="plusBtn" aria-label="More options">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>
          <input type="text" id="chatInput" placeholder="Tell Stash..." autocomplete="off"
                 oninput="handleChatInputChange()"
                 onkeydown="if(event.key==='Enter'){ event.preventDefault(); sendMessage(); }">
          <button class="send-btn" id="sendBtn" onclick="sendMessage()" aria-label="Send">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 19V5M12 5L6 11M12 5L18 11" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="send-btn mic-btn" id="micBtn" onclick="StashVoice.start()" aria-label="Record voice note" style="display:none;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="9" y="3" width="6" height="11" rx="3" stroke="white" stroke-width="1.7"/><path d="M6 11.5C6 15 8.7 17.5 12 17.5C15.3 17.5 18 15 18 11.5" stroke="white" stroke-width="1.7" stroke-linecap="round"/><path d="M12 17.5V21" stroke="white" stroke-width="1.7" stroke-linecap="round"/></svg>
          </button>
        </div>
        ${isDashboardPage ? '<div class="chat-caption">Just write. Snap and send. Stash handles the rest.</div>' : ''}
      </div>
    </div>

    <!-- ===== Calculator modal ===== -->
    <div class="modal-overlay calculator-overlay" id="calculatorModal">
      <div class="calculator-card">
        <div class="calculator-header">
          <span class="header-title" style="font-size:15px;">Calculator</span>
          <button class="chat-history-btn" onclick="closeCalculator()" aria-label="Close">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 5L19 19M19 5L5 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>
        </div>

        <div class="calc-history" id="calcHistory"></div>

        <div class="calc-display">
          <div class="calc-expression" id="calcExpression">&nbsp;</div>
          <div class="calc-result" id="calcResult">0</div>
        </div>

        <div class="calc-grid">
          <button class="calc-btn calc-fn" onclick="calcClearAll()">AC</button>
          <button class="calc-btn calc-fn" onclick="calcBackspace()">⌫</button>
          <button class="calc-btn calc-fn" onclick="calcPercent()">%</button>
          <button class="calc-btn calc-op" onclick="calcInput('÷')">÷</button>

          <button class="calc-btn" onclick="calcInput('7')">7</button>
          <button class="calc-btn" onclick="calcInput('8')">8</button>
          <button class="calc-btn" onclick="calcInput('9')">9</button>
          <button class="calc-btn calc-op" onclick="calcInput('×')">×</button>

          <button class="calc-btn" onclick="calcInput('4')">4</button>
          <button class="calc-btn" onclick="calcInput('5')">5</button>
          <button class="calc-btn" onclick="calcInput('6')">6</button>
          <button class="calc-btn calc-op" onclick="calcInput('−')">−</button>

          <button class="calc-btn" onclick="calcInput('1')">1</button>
          <button class="calc-btn" onclick="calcInput('2')">2</button>
          <button class="calc-btn" onclick="calcInput('3')">3</button>
          <button class="calc-btn calc-op" onclick="calcInput('+')">+</button>

          <button class="calc-btn" onclick="calcPlusMinus()">±</button>
          <button class="calc-btn" onclick="calcInput('0')">0</button>
          <button class="calc-btn" onclick="calcInput('.')">.</button>
          <button class="calc-btn calc-eq" onclick="calcEquals()">=</button>

          <button class="calc-btn calc-fn" onclick="calcInput('(')">(</button>
          <button class="calc-btn calc-fn" onclick="calcInput(')')">)</button>
          <button class="calc-btn calc-use" id="calcUseBtn" onclick="calcUseInStash()">Use in Stash</button>
        </div>
      </div>
    </div>

    <input type="file" id="cameraFileInput" accept="image/*" capture="environment" style="display:none;" onchange="handleFileCapture(this, true)">
    <input type="file" id="attachFileInput" accept="image/*,.pdf,.csv,.xlsx" style="display:none;" onchange="handleFileCapture(this, false)">
  `;
}

function mountStashChat(){
  const screen = document.querySelector(".screen");
  if (!screen || document.getElementById("chatSheet")) return;
  const wrap = document.createElement("div");
  wrap.innerHTML = stashChatWidgetHTML();
  while (wrap.firstChild) screen.appendChild(wrap.firstChild);
  StashChat.init();
  updateSendButtonState();
}
