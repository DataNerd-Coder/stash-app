// STASH — shared app utilities

function getGreeting(){
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function setGreeting(){
  const el = document.getElementById("greetingText");
  if (el) el.textContent = `${getGreeting()}, ${STASH_MOCK.user.firstName} \uD83D\uDC4B`;
}

// ---- Session (persisted locally so the flow feels real across pages) ----
// Note: relies on localStorage, which works once this is deployed or opened
// directly in a browser. It's disabled inside some in-app preview sandboxes.
const StashSession = {
  markOnboarded(){ try{ localStorage.setItem("stash_onboarded", "1"); }catch(e){} },
  isOnboarded(){ try{ return localStorage.getItem("stash_onboarded") === "1"; }catch(e){ return false; } },
  saveBusiness(data){ try{ localStorage.setItem("stash_business", JSON.stringify(data)); }catch(e){} },
  getBusiness(){ try{ return JSON.parse(localStorage.getItem("stash_business") || "null"); }catch(e){ return null; } }
};

// ---- Grouped-list divider fix-up (for lists with toggle/filter behavior) ----
function updateDividers(container){
  const items = Array.from(container.querySelectorAll(".list-item"))
    .filter(item => item.style.display !== "none");
  items.forEach((item, idx) => {
    item.style.borderBottom = idx === items.length - 1 ? "none" : "3px solid var(--border)";
  });
}

// ---- mockStashReply now defined in PHASE 3 section below (progressive record completion) ----


/* =========================================================
   PHASE 2 — Interactive chat sheet, drawer, mentions, history
   ========================================================= */

const StashChat = {
  sheet: null, compactHeightPx: 172, deviceHeightPx: 844, expanded: false,
  dragStartY: 0, dragStartTransform: 0, dragging: false,

  init(){
    this.sheet = document.getElementById("chatSheet");
    if (!this.sheet) return;
    // chat-sheet is position:fixed to the real viewport, so measure that directly
    this.deviceHeightPx = window.innerHeight;

    const compactContent = document.getElementById("chatCompactContent");
    if (compactContent) this.compactHeightPx = compactContent.offsetHeight + 14;

    // settled compact state needs no transform at all — bottom:0 + its own
    // natural (short) content height already places it correctly
    this.sheet.style.transform = "";

    const dockArea = document.getElementById("chatDockHandle");
    if (dockArea) dockArea.addEventListener("pointerdown", (e) => this.onDragStart(e));
    window.addEventListener("pointermove", (e) => this.onDragMove(e));
    window.addEventListener("pointerup", (e) => this.onDragEnd(e));
    this.attachInputDrag();

    // real mobile browsers resize the viewport (address bar show/hide, rotation)
    window.addEventListener("resize", () => { this.deviceHeightPx = window.innerHeight; });

    // scroll-triggered hide/show of the compact dock so page content stays unobstructed.
    // Never hide while the input is focused — mobile keyboards opening often fire their
    // own scroll/resize events, which would otherwise hide the input mid-typing.
    let lastScrollY = window.scrollY;
    let inputFocused = false;
    const chatInputEl = document.getElementById("chatInput");
    if (chatInputEl){
      chatInputEl.addEventListener("focus", () => {
        inputFocused = true;
        this.sheet.classList.remove("scroll-hidden");
      });
      chatInputEl.addEventListener("blur", () => { inputFocused = false; });
    }
    window.addEventListener("scroll", () => {
      if (this.expanded || this.dragging) return;
      if (inputFocused){
        this.sheet.classList.remove("scroll-hidden");
        lastScrollY = window.scrollY;
        return;
      }
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY;
      if (Math.abs(delta) < 8) return;
      if (delta > 0 && currentY > 40){
        this.sheet.classList.add("scroll-hidden");
      } else if (delta < 0){
        this.sheet.classList.remove("scroll-hidden");
      }
      lastScrollY = currentY;
    }, { passive: true });

    // render initial thread + suggestions
    STASH_MOCK.chatHistory[0].messages.forEach(m => renderMessage(m.from, m.text));
    renderSuggestions();
  },

  // translateY amount that hides everything except the compact footer,
  // valid only while the sheet has been made "tall" (see makeTallInstantly)
  hiddenTranslateY(){
    return this.deviceHeightPx - this.compactHeightPx;
  },

  currentTranslateY(){
    const style = window.getComputedStyle(this.sheet);
    const matrix = style.transform;
    if (matrix === "none") return this.expanded ? 0 : this.hiddenTranslateY();
    const values = matrix.match(/matrix\(([^)]+)\)/);
    if (!values) return 0;
    return parseFloat(values[1].split(",")[5]);
  },

  // temporarily give the sheet full viewport height (so drag/animation math is
  // physically meaningful) while instantly compensating with translateY so it
  // stays visually in the exact same place — no flash, no jump
  makeTallInstantly(){
    this.sheet.classList.add("expanded");
    this.sheet.style.transition = "none";
    this.sheet.style.transform = `translateY(${this.hiddenTranslateY()}px)`;
    this.sheet.offsetHeight; // force reflow
    this.sheet.style.transition = "";
  },

  onDragStart(e){
    this.dragging = true;
    this.sheet.classList.remove("scroll-hidden");
    this.sheet.classList.add("dragging");
    this.dragStartY = e.clientY;
    if (!this.expanded) this.makeTallInstantly();
    this.dragStartTransform = this.currentTranslateY();
  },

  // Lets the user drag-to-expand starting from the text input itself, not just
  // the grabber handle — but only once a real vertical drag is detected, so a
  // normal tap still focuses the input and opens the keyboard as expected.
  attachInputDrag(){
    const inputEl = document.getElementById("chatInput");
    if (!inputEl) return;
    const DRAG_THRESHOLD = 10;
    let candidate = false;
    let startX = 0, startY = 0;

    const onMove = (e) => {
      if (!candidate) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dy) < DRAG_THRESHOLD || Math.abs(dy) <= Math.abs(dx)) return;
      // confirmed: this is a drag, not a tap — hand off to the normal drag flow
      candidate = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      inputEl.blur();
      this.dragStartY = startY;
      this.onDragStart({ clientY: startY });
      this.onDragMove(e);
    };
    const onUp = () => {
      candidate = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    inputEl.addEventListener("pointerdown", (e) => {
      candidate = true;
      startX = e.clientX;
      startY = e.clientY;
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    });
  },

  onDragMove(e){
    if (!this.dragging) return;
    const delta = e.clientY - this.dragStartY;
    let next = this.dragStartTransform + delta;
    next = Math.max(0, Math.min(this.hiddenTranslateY(), next));
    this.sheet.style.transform = `translateY(${next}px)`;
  },

  onDragEnd(){
    if (!this.dragging) return;
    this.dragging = false;
    this.sheet.classList.remove("dragging");
    const current = this.currentTranslateY();
    if (current < this.hiddenTranslateY() * 0.62){
      this.settleExpanded();
    } else {
      this.settleCompact();
    }
  },

  settleExpanded(){
    this.expanded = true;
    this.sheet.classList.remove("scroll-hidden");
    if (!this.sheet.classList.contains("expanded")) this.makeTallInstantly();
    this.sheet.style.transform = "translateY(0)";
  },

  settleCompact(){
    this.expanded = false;
    // animate down while still "tall", then swap back to the short natural
    // height only once the slide-down transition has actually finished
    this.sheet.style.transform = `translateY(${this.hiddenTranslateY()}px)`;
    const onEnd = () => {
      this.sheet.classList.remove("expanded");
      this.sheet.style.transform = "";
    };
    this.sheet.addEventListener("transitionend", onEnd, { once: true });
    closeHistoryDrawer();
  },

  expand(){ if (!this.expanded) this.settleExpanded(); },
  collapse(){ if (this.expanded) this.settleCompact(); }
};

function renderMessage(from, text, imageDataUrl){
  const thread = document.getElementById("chatThread");
  if (!thread) return;
  const row = document.createElement("div");
  row.className = "msg-row " + (from === "user" ? "user" : "stash");
  const imgHtml = imageDataUrl ? `<img class="msg-image" src="${imageDataUrl}" alt="Attached">` : "";
  if (from === "stash"){
    row.innerHTML = `
      <div>
        <div class="msg-meta">
          <div class="msg-avatar"><img src="assets/logo-icon.png" alt="Stash"></div>
          <span style="font-size:11.5px; font-weight:700; color:var(--muted-2); text-transform:uppercase; letter-spacing:0.04em;">Stash</span>
        </div>
        <div class="msg-bubble">${imgHtml}${text ? `<div${imageDataUrl ? ' style="margin-top:8px;"' : ''}>${text}</div>` : ""}</div>
      </div>`;
  } else {
    row.innerHTML = `<div class="msg-bubble">${imgHtml}${text ? `<div${imageDataUrl ? ' style="margin-top:8px;"' : ''}>${text}</div>` : ""}</div>`;
  }
  thread.appendChild(row);
  scrollThreadToBottom();
}

function scrollThreadToBottom(){
  const wrap = document.getElementById("chatThreadWrap");
  if (!wrap) return;
  // wait a frame so layout (esp. right after auto-expand) has settled before measuring
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      wrap.scrollTo({ top: wrap.scrollHeight, behavior: "smooth" });
    });
  });
}

function renderSuggestions(){
  const row = document.getElementById("suggestionRow");
  if (!row) return;
  row.innerHTML = "";
  STASH_MOCK.suggestions.forEach(s => {
    const chip = document.createElement("button");
    chip.className = "suggestion-chip";
    chip.textContent = s;
    chip.onclick = () => { document.getElementById("chatInput").value = s; sendMessage(); };
    row.appendChild(chip);
  });
}

function sendMessage(){
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text) return;
  closeMentionMenu();
  closeProductMenu();

  const mentionMatch = text.match(/^@(\w+)$/);
  if (mentionMatch){
    const tag = mentionMatch[1].toLowerCase();
    const page = STASH_MOCK.pageShortcuts.find(p => p.tag === tag);
    if (page){ window.location.href = page.href; return; }
  }

  if (StashChat.sheet && !StashChat.expanded) StashChat.expand();

  // Stage 2: message is exactly "#query" — send as-is, then search
  const hashCommand = text.match(/^#(\S.*)$/);
  if (hashCommand){
    renderMessage("user", text);
    input.value = "";
    updateSendButtonState();
    const query = hashCommand[1];
    setTimeout(() => {
      const results = searchProducts(query, 5);
      renderProductChooser(query, results);
    }, 450);
    return;
  }

  // # used inline inside a normal sentence, e.g. "How many do I have of #mlk?"
  const inlineHash = text.match(/#(\w+)/);
  if (inlineHash){
    renderMessage("user", text);
    input.value = "";
    updateSendButtonState();
    const query = inlineHash[1];
    const results = searchProducts(query, 5);
    setTimeout(() => {
      if (results.length === 1){
        const product = results[0];
        if (/how many|stock|left|remaining/i.test(text)){
          renderMessage("stash", `${product.name}: ${stockLine(product)}.`);
        } else {
          renderProductCard(product);
        }
      } else if (results.length > 1){
        renderMessage("stash", `A few products could match #${query} — did you mean one of these?`);
        setTimeout(() => renderProductChooser(query, results), 250);
      } else {
        renderMessage("stash", `I couldn't find a product matching #${query}.`);
      }
    }, 450);
    return;
  }

  renderMessage("user", text);
  input.value = "";
  updateSendButtonState();
  setTimeout(() => renderMessage("stash", mockStashReply(text)), 500);
}

/* ---------- @ mention (handleChatInputChange now defined in PHASE 4, handles both @ and #) ---------- */
function pickMention(tag){
  const input = document.getElementById("chatInput");
  input.value = "@" + tag + " ";
  closeMentionMenu();
  input.focus();
}
function closeMentionMenu(){
  const menu = document.getElementById("mentionMenu");
  if (menu){ menu.classList.remove("open"); menu.innerHTML = ""; }
}

/* ---------- Camera / attach (real file picker, feeds into chat) ---------- */
function triggerCamera(){
  document.getElementById("cameraFileInput").click();
}
function triggerAttach(){
  document.getElementById("attachFileInput").click();
}
function handleFileCapture(inputEl, isCamera){
  const file = inputEl.files && inputEl.files[0];
  if (!file) return;
  const isImage = file.type.startsWith("image/");
  const reader = new FileReader();
  reader.onload = () => {
    if (StashChat.sheet && !StashChat.expanded) StashChat.expand();
    const label = isCamera ? "Snapped a photo of my notebook" : `Attached ${file.name}`;
    renderMessage("user", label, reader.result);

    if (isImage){
      setTimeout(() => renderMessage("stash", "Reading your notebook\u2026"), 500);
      setTimeout(() => {
        const thread = document.getElementById("chatThread");
        if (thread.lastChild) thread.removeChild(thread.lastChild);
        renderDetectedProductsMessage();
      }, 1600);
    } else {
      setTimeout(() => {
        renderMessage("stash", "Got it \u2014 reading this now. I'll update your records once I've matched it to your products.");
      }, 700);
    }
  };
  reader.readAsDataURL(file);
  inputEl.value = "";
}

function renderDetectedProductsMessage(){
  const items = STASH_MOCK.detectionSample;
  const total = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  const rows = items.map(i => `
    <div class="detected-row">
      <div class="row-icon">\u2713</div>
      <div class="row-body">
        <div class="row-title">${i.name}</div>
        <div class="row-subtitle">${i.qty} @ ${formatNaira(i.unitPrice)}</div>
      </div>
      <div class="prevenue">${formatNaira(i.qty * i.unitPrice)}</div>
    </div>`).join("");
  const html = `
    <div style="font-weight:600; margin-bottom:8px;">I found ${items.length} products on this page</div>
    ${rows}
    <div class="detected-total">
      <span>Total</span>
      <span>${formatNaira(total)}</span>
    </div>
    <div style="margin-top:10px; color:var(--muted); font-size:12.5px;">Does this look right?</div>`;
  renderMessage("stash", html);
}

/* ---------- Chat history — half-page slide with search ---------- */
function openHistoryDrawer(){
  const el = document.getElementById("historyDrawerOverlay");
  if (!el) return;
  el.classList.add("open");
  document.getElementById("historySearchInput").value = "";
  renderHistoryList();
}
function closeHistoryDrawer(){
  const el = document.getElementById("historyDrawerOverlay");
  if (el) el.classList.remove("open");
}
function renderHistoryList(query){
  const list = document.getElementById("historyList");
  if (!list) return;
  const q = (query || "").trim().toLowerCase();
  const items = q ? STASH_MOCK.chatHistory.filter(c => c.title.toLowerCase().includes(q)) : STASH_MOCK.chatHistory;
  if (items.length === 0){
    list.innerHTML = '<div class="empty-state">No conversations found.</div>';
    return;
  }
  list.innerHTML = items.map(c => `
    <div class="list-item" style="cursor:pointer;" onclick="loadHistoryConvo('${c.id}')">
      <div class="row-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H18.5C19.3 4 20 4.7 20 5.5V15.5C20 16.3 19.3 17 18.5 17H9L5 20.5V17H5.5C4.7 17 4 16.3 4 15.5V5.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
      </div>
      <div class="row-body">
        <div class="row-title">${c.title}</div>
        <div class="row-subtitle">${c.date}</div>
      </div>
      <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 5L16 12L9 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>`).join("");
}
function loadHistoryConvo(id){
  const convo = STASH_MOCK.chatHistory.find(c => c.id === id);
  if (!convo) return;
  const thread = document.getElementById("chatThread");
  thread.innerHTML = "";
  convo.messages.forEach(m => renderMessage(m.from, m.text));
  closeHistoryDrawer();
}
function startNewChat(){
  const thread = document.getElementById("chatThread");
  thread.innerHTML = "";
  renderMessage("stash", "Good " + getGreeting().split(" ")[1] + `, ${STASH_MOCK.user.firstName}. What would you like to know?`);
  closeHistoryDrawer();
}

/* ---------- Hamburger drawer ---------- */
function openDrawer(){
  const el = document.getElementById("drawerOverlay");
  if (el) el.classList.add("open");
}
function closeDrawer(){
  const el = document.getElementById("drawerOverlay");
  if (el) el.classList.remove("open");
}

/* ---------- Sign-out modal ---------- */
function openSignOutModal(){
  closeDrawer();
  const el = document.getElementById("signOutModal");
  if (el) el.classList.add("open");
}
function closeSignOutModal(){
  const el = document.getElementById("signOutModal");
  if (el) el.classList.remove("open");
}
function confirmSignOut(){
  try{ localStorage.removeItem("stash_onboarded"); localStorage.removeItem("stash_business"); }catch(e){}
  window.location.href = "welcome.html";
}

/* =========================================================
   PHASE 3 — + menu, Calculator, progressive record completion
   ========================================================= */

/* ---------- + toolbox ---------- */
function togglePlusMenu(){
  const menu = document.getElementById("plusMenu");
  if (!menu) return;
  menu.classList.toggle("open");
}
function closePlusMenu(){
  const menu = document.getElementById("plusMenu");
  if (menu) menu.classList.remove("open");
}
function insertMentionTrigger(){
  const input = document.getElementById("chatInput");
  input.value = "@";
  input.focus();
  handleChatInputChange();
}
document.addEventListener("click", (e) => {
  const menu = document.getElementById("plusMenu");
  const btn = document.getElementById("plusBtn");
  if (!menu || !menu.classList.contains("open")) return;
  if (!menu.contains(e.target) && !btn.contains(e.target)) closePlusMenu();
});

/* ---------- Calculator ---------- */
const StashCalc = {
  expr: "",
  history: [],
  lastFullExpr: null,
  lastResult: null,

  open(){
    document.getElementById("calculatorModal").classList.add("open");
    this.render();
  },
  close(){
    document.getElementById("calculatorModal").classList.remove("open");
  },
  input(token){
    this.expr += token;
    this.render();
  },
  backspace(){
    this.expr = this.expr.slice(0, -1);
    this.render();
  },
  clearAll(){
    this.expr = "";
    this.render();
  },
  percent(){
    this.expr += "%";
    this.render();
  },
  plusMinus(){
    if (!this.expr){ this.expr = "-"; this.render(); return; }
    // toggle sign of the trailing number
    const m = this.expr.match(/(-?\d*\.?\d+)$/);
    if (m){
      const num = m[1];
      const start = this.expr.length - num.length;
      const toggled = num.startsWith("-") ? num.slice(1) : "-" + num;
      this.expr = this.expr.slice(0, start) + toggled;
    }
    this.render();
  },
  safeEval(str){
    let jsExpr = str
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/−/g, "-")
      .replace(/(\d+(\.\d+)?)%/g, "($1/100)");
    if (!/^[0-9+\-*/().\s]*$/.test(jsExpr)) return null;
    try {
      // eslint-disable-next-line no-new-func
      const val = Function('"use strict"; return (' + jsExpr + ")")();
      return typeof val === "number" && isFinite(val) ? val : null;
    } catch(e){ return null; }
  },
  equals(){
    if (!this.expr) return;
    const val = this.safeEval(this.expr);
    if (val === null) return;
    const resultStr = formatCalcNumber(val);
    this.lastFullExpr = this.expr;
    this.lastResult = resultStr;
    this.history.push({ expr: this.expr, result: resultStr });
    if (this.history.length > 6) this.history.shift();
    this.expr = String(val); // keep raw numeric value for further calculation
    this.render();
  },
  render(){
    document.getElementById("calcExpression").textContent = this.expr ? this.expr : "\u00A0";
    const val = this.expr ? this.safeEval(this.expr) : 0;
    document.getElementById("calcResult").textContent = val !== null ? formatCalcNumber(val) : "Error";
    const histEl = document.getElementById("calcHistory");
    histEl.innerHTML = this.history.slice().reverse().map(h =>
      `<div class="calc-history-item">${h.expr} = ${h.result}</div>`).join("");
  }
};

function formatCalcNumber(n){
  if (Number.isInteger(n)) return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const parts = n.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

function openCalculator(){ StashCalc.open(); }
function closeCalculator(){ StashCalc.close(); }
function calcInput(t){ StashCalc.input(t); }
function calcBackspace(){ StashCalc.backspace(); }
function calcClearAll(){ StashCalc.clearAll(); }
function calcPercent(){ StashCalc.percent(); }
function calcPlusMinus(){ StashCalc.plusMinus(); }
function calcEquals(){ StashCalc.equals(); }
function calcUseInStash(){
  if (!StashCalc.expr) return;
  const val = StashCalc.safeEval(StashCalc.expr);
  if (val === null) return;
  const resultStr = formatCalcNumber(val);
  // prefer the last full expression (with operators) if the current expr is just its bare result
  const useExpr = (StashCalc.lastFullExpr && String(val) === StashCalc.expr) ? StashCalc.lastFullExpr : StashCalc.expr;
  const withNaira = useExpr.replace(/(\d+(\.\d+)?)/g, (m) => formatCalcNumber(Number(m)));
  const spaced = withNaira.replace(/([+\-×÷])/g, " $1 \u20A6");
  const summary = `\u20A6${spaced} = \u20A6${resultStr}`;
  StashCalc.close();
  if (StashChat.sheet && !StashChat.expanded) StashChat.expand();
  const input = document.getElementById("chatInput");
  input.value = summary + " ";
  input.focus();
}

/* ---------- Progressive record completion (demo logic) ---------- */
let pendingClarification = null; // { type: "sales"|"expense", amount }

function mockStashReply(userText){
  const t = userText.toLowerCase();

  // voice note demo: composite sale + expense in one sentence
  if (t.includes("twelve cartons of indomie") && t.includes("spent")){
    return "Got it \u2014 recorded 12 cartons of Indomie sold for \u20A6120,000, plus a \u20A65,000 transport expense.";
  }

  // if we're mid-clarification, treat this reply as the answer
  if (pendingClarification){
    const p = pendingClarification;
    pendingClarification = null;
    if (/no|don'?t know|not sure|skip/.test(t)){
      return p.type === "sales"
        ? `No problem \u2014 I've recorded ${formatNaira(p.amount)} as today's total sale.`
        : `No problem \u2014 I've recorded ${formatNaira(p.amount)} as a general expense.`;
    }
    return p.type === "sales"
      ? `Got it \u2014 recorded ${formatNaira(p.amount)} in sales for ${userText.trim()}.`
      : `Noted \u2014 ${formatNaira(p.amount)} logged under "${userText.trim()}".`;
  }

  // sales total with product mentioned — confirm directly, no need to ask
  const salesMatch = userText.match(/\u20A6?\s?([\d,]+)\s*(?:naira)?\s*(?:in sales|sales|i sold|i made)/i) ||
                      userText.match(/(?:i made|sold)\D{0,15}\u20A6?\s?([\d,]+)/i);
  const productNameHit = t.match(/(indomie|coca-?cola|peak milk|milk|water|milo|golden morn|bread|yoghurt|maltina|maggi)/i);
  if (salesMatch){
    const amount = Number(salesMatch[1].replace(/,/g, ""));
    if (amount > 0){
      if (productNameHit){
        return `Got it \u2014 recorded ${formatNaira(amount)} in sales for ${productNameHit[1]}.`;
      }
      pendingClarification = { type: "sales", amount };
      return `Got it \u2014 I've recorded ${formatNaira(amount)} in sales. Do you remember what you sold?`;
    }
  }

  // expense — confirm directly if a category is present, otherwise ask
  const expenseMatch = userText.match(/\u20A6?\s?([\d,]+)\s*(?:naira)?\s*(?:on|for)?\s*(?:expenses?|i spent|spent)/i) ||
                        userText.match(/(?:i spent|spent)\D{0,15}\u20A6?\s?([\d,]+)/i);
  const categoryHit = t.match(/(transport|electricity|salary|wages|rent|nylon|bags|fuel)/i);
  if (expenseMatch){
    const amount = Number(expenseMatch[1].replace(/,/g, ""));
    if (amount > 0){
      if (categoryHit){
        return `Noted \u2014 ${formatNaira(amount)} recorded under ${categoryHit[1].charAt(0).toUpperCase() + categoryHit[1].slice(1)}.`;
      }
      pendingClarification = { type: "expense", amount };
      return `Noted \u2014 ${formatNaira(amount)} recorded as an expense. What was it for?`;
    }
  }

  if (t.includes("today") || t.includes("make") || t.includes("sales")){
    return `Today's sales are ${formatNaira(STASH_MOCK.today.totalSales)} from ${STASH_MOCK.today.salesCount} sales \u2014 up ${STASH_MOCK.today.changePct}% on yesterday.`;
  }
  if (t.includes("top") || t.includes("best")){
    const p = STASH_MOCK.topProducts[0];
    return `${p.name} is your top product today \u2014 ${p.units} units sold, bringing in ${formatNaira(p.revenue)}.`;
  }
  if (t.includes("restock") || t.includes("low") || t.includes("out of stock")){
    const names = STASH_MOCK.lowStock.slice(0,3).map(s => s.name).join(", ");
    return `You're running low on ${names}. Want me to add these to a restock list?`;
  }
  if (t.includes("profit")){
    return `Estimated profit this month is \u20A6284,600 so far, based on your recorded cost prices.`;
  }
  if (t.includes("=") && /\d/.test(t)){
    return "Got that calculation \u2014 tell me what it's for and I'll record it (e.g. \"these are today's sales\").";
  }
  // barcode: assigning an item
  const assignMatch = userText.match(/this is (?:a |an )?(.+?)[.,]?\s*(?:i bought it for|bought for|cost)\s*\u20A6?\s?([\d,]+)/i);
  if (assignMatch){
    const item = assignMatch[1].trim();
    const cost = Number(assignMatch[2].replace(/,/g, ""));
    return `Got it \u2014 this barcode is now assigned to "${item}" at a cost of ${formatNaira(cost)}. I'll flag it as sold once you tell me it's gone.`;
  }
  // barcode: selling scanned items
  const soldMatch = userText.match(/sold (?:this|these|it|them)(?:\s*(?:for|@))?\s*\u20A6?\s?([\d,]+)/i);
  if (soldMatch){
    const amount = Number(soldMatch[1].replace(/,/g, ""));
    return `Recorded \u2014 sold for ${formatNaira(amount)}. Those barcodes are now free to reuse on a new item whenever you're ready.`;
  }
  return "Got it \u2014 I've noted that. You can also snap a photo of your notebook page any time and I'll update your records automatically.";
}

/* =========================================================
   PHASE 4 — Voice notes, product (#) search, scroll polish
   ========================================================= */

function updateSendButtonState(){
  const input = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const micBtn = document.getElementById("micBtn");
  if (!input || !sendBtn || !micBtn) return;
  const hasText = input.value.trim().length > 0;
  sendBtn.style.display = hasText ? "flex" : "none";
  micBtn.style.display = hasText ? "none" : "flex";
}

/* ---------- # Product search (fuzzy matching) ---------- */
function levenshtein(a, b){
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++){
    for (let j = 1; j <= n; j++){
      const cost = a[i-1] === b[j-1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + cost);
    }
  }
  return dp[m][n];
}

function stripVowels(s){ return s.replace(/[aeiou]/g, ""); }

function fuzzyProductScore(query, targetName){
  const q = query.toLowerCase().trim();
  const t = targetName.toLowerCase();
  if (!q) return -999;
  if (t.includes(q)) return 1000 - t.indexOf(q);
  const qS = stripVowels(q), tS = stripVowels(t);
  if (qS && tS.includes(qS)) return 700 - tS.indexOf(qS);
  const words = t.split(/[^a-z0-9]+/).filter(Boolean);
  let best = -999;
  words.forEach(w => {
    const maxDist = Math.max(2, Math.ceil(q.length / 2));
    const d = levenshtein(q, w);
    if (d <= maxDist){
      const score = 500 - d * 60 - Math.abs(w.length - q.length) * 5;
      if (score > best) best = score;
    }
  });
  return best;
}

function searchProducts(query, limit){
  const q = (query || "").trim();
  if (!q) return [];
  const scored = STASH_MOCK.products.map(p => ({ p, score: fuzzyProductScore(q, p.name) }));
  return scored.filter(x => x.score > -50)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit || 5)
    .map(x => x.p);
}

function avgSellingPrice(productName){
  const matches = STASH_MOCK.sales.filter(s => s.product === productName);
  if (matches.length === 0) return null;
  const total = matches.reduce((sum, s) => sum + s.amount, 0);
  const units = matches.reduce((sum, s) => sum + s.qty, 0);
  if (units === 0) return null;
  return { avg: total / units, count: matches.length };
}

function stockLine(product){
  if (product.stockUnits === 0) return "Out of stock";
  return `${product.stockUnits} units`;
}

function renderProductCard(product){
  const sales = avgSellingPrice(product.name);
  const lines = [
    `<b>${product.name}</b>`,
    `Cost price: ${formatNaira(product.cost)}/${product.costUnit}`,
    `Selling price: Not set`,
    sales ? `Average selling price: ${formatNaira(Math.round(sales.avg))} <span style="color:var(--muted-2); font-weight:500;">(based on ${sales.count} recorded sale${sales.count === 1 ? "" : "s"})</span>` : `Average selling price: Not available yet`,
    `In stock: ${stockLine(product)}`
  ];
  renderMessage("stash", lines.join("<br>"));
}

function renderProductChooser(query, matches){
  if (matches.length === 0){
    renderMessage("stash", `I couldn't find any products matching "${query}".`);
    return;
  }
  const rows = matches.map(p => `
    <div class="product-result-row" onclick="chooseProductFromChat('${p.name.replace(/'/g, "\\'")}')">
      <span>${p.name}</span>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 5L16 12L9 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>`).join("");
  renderMessage("stash", `<div style="font-weight:600; margin-bottom:6px;">Products matching "${query}"</div>${rows}`);
}

function chooseProductFromChat(name){
  const product = STASH_MOCK.products.find(p => p.name === name);
  if (!product) return;
  renderProductCard(product);
}

/* ---------- # autocomplete + @ mention (shared input handler) ---------- */
function handleChatInputChange(){
  updateSendButtonState();
  const input = document.getElementById("chatInput");
  const menu = document.getElementById("mentionMenu");
  const productMenu = document.getElementById("productMenu");
  if (!input) return;
  const val = input.value;

  const hashMatch = val.match(/(^|\s)#(\w*)$/);
  if (hashMatch){
    closeMentionMenu();
    const query = hashMatch[2];
    if (!query){ closeProductMenu(); return; }
    const results = searchProducts(query, 5);
    if (results.length === 0){ closeProductMenu(); return; }
    productMenu.innerHTML = results.map(p => `
      <div class="mention-item" onclick="pickProductSuggestion('${p.name.replace(/'/g, "\\'")}')">
        <span>${p.name}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="margin-left:auto; color:var(--muted-2);"><path d="M9 5L16 12L9 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>`).join("");
    productMenu.classList.add("open");
    return;
  }
  closeProductMenu();

  const match = val.match(/(^|\s)@(\w*)$/);
  if (!match || !menu){ closeMentionMenu(); return; }
  const query = match[2].toLowerCase();
  const results = STASH_MOCK.pageShortcuts.filter(p => p.tag.startsWith(query));
  if (results.length === 0){ closeMentionMenu(); return; }
  menu.innerHTML = results.map(p => `
    <div class="mention-item" onclick="pickMention('${p.tag}')">
      <span class="tag">@${p.tag}</span> ${p.label}
    </div>`).join("");
  menu.classList.add("open");
}
function closeProductMenu(){
  const menu = document.getElementById("productMenu");
  if (menu){ menu.classList.remove("open"); menu.innerHTML = ""; }
}
function pickProductSuggestion(name){
  closeProductMenu();
  const input = document.getElementById("chatInput");
  input.value = "";
  updateSendButtonState();
  if (StashChat.sheet && !StashChat.expanded) StashChat.expand();
  renderMessage("user", `#${name}`);
  const product = STASH_MOCK.products.find(p => p.name === name);
  if (product) setTimeout(() => renderProductCard(product), 400);
}

/* ---------- Voice notes (real mic capture, mocked transcription) ---------- */
const VOICE_TRANSCRIPTS = [
  "I sold twelve cartons of Indomie today for one hundred and twenty thousand naira and spent five thousand on transport."
];

const StashVoice = {
  recording: false,
  mediaRecorder: null,
  stream: null,
  seconds: 0,
  timerInterval: null,

  async start(){
    if (this.recording) return;
    try{
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch(e){
      if (StashChat.sheet && !StashChat.expanded) StashChat.expand();
      renderMessage("stash", "I couldn't access your microphone. Check your browser's microphone permission and try again.");
      return;
    }
    this.recording = true;
    this.seconds = 0;
    try{ this.mediaRecorder = new MediaRecorder(this.stream); this.mediaRecorder.start(); }catch(e){ /* recorder optional, UI still works */ }

    document.getElementById("chatInputRow").style.display = "none";
    document.getElementById("voiceBar").style.display = "flex";
    document.getElementById("voiceTimer").textContent = "0:00";

    this.timerInterval = setInterval(() => {
      this.seconds++;
      const m = Math.floor(this.seconds / 60);
      const s = String(this.seconds % 60).padStart(2, "0");
      document.getElementById("voiceTimer").textContent = `${m}:${s}`;
    }, 1000);
  },

  stopStream(){
    clearInterval(this.timerInterval);
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive"){
      try{ this.mediaRecorder.stop(); }catch(e){}
    }
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    this.recording = false;
    document.getElementById("voiceBar").style.display = "none";
    document.getElementById("chatInputRow").style.display = "flex";
  },

  cancel(){
    if (!this.recording) return;
    this.stopStream();
  },

  finish(){
    if (!this.recording) return;
    this.stopStream();
    if (StashChat.sheet && !StashChat.expanded) StashChat.expand();
    renderMessage("stash", "Transcribing your voice note\u2026");
    setTimeout(() => {
      // remove the transient "transcribing" bubble
      const thread = document.getElementById("chatThread");
      if (thread.lastChild) thread.removeChild(thread.lastChild);
      const transcript = VOICE_TRANSCRIPTS[0];
      renderMessage("user", transcript);
      setTimeout(() => renderMessage("stash", mockStashReply(transcript)), 500);
    }, 1100);
  }
};
