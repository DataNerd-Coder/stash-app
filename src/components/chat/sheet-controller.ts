/**
 * Drives the chat bottom-sheet's compact <-> expanded gesture.
 *
 * This is a direct port of the original `StashChat` object. It manipulates the
 * sheet's transform and classes imperatively (not through React state) because
 * drag tracking runs on every pointermove and must never wait on a re-render.
 * React is told about the settled state through `onExpandedChange`.
 */

export interface SheetElements {
  sheet: HTMLElement;
  /** footer (suggestions + input) — its height is what stays visible when compact */
  footer: HTMLElement;
  /** grabber area that starts a drag */
  handle: HTMLElement;
  input: HTMLInputElement;
}

const INPUT_DRAG_THRESHOLD = 10;
const EXPAND_THRESHOLD = 0.62;
const SETTLE_FALLBACK_MS = 450;

export class SheetController {
  expanded = false;

  private dragging = false;
  private dragStartY = 0;
  private dragStartTransform = 0;
  private compactHeightPx = 172;
  private viewportHeightPx = window.innerHeight;
  private inputFocused = false;
  private lastScrollY = window.scrollY;
  private settleTimer: number | undefined;
  private disposers: Array<() => void> = [];
  private readonly els: SheetElements;
  private readonly onExpandedChange: (expanded: boolean) => void;

  constructor(els: SheetElements, onExpandedChange: (expanded: boolean) => void) {
    this.els = els;
    this.onExpandedChange = onExpandedChange;
  }

  mount() {
    const { sheet, handle, input } = this.els;
    // settled compact state needs no transform: bottom:0 + its own short
    // natural height already places it correctly
    sheet.style.transform = "";
    this.measureCompact();

    this.listen(handle, "pointerdown", (e) => this.onDragStart((e as PointerEvent).clientY));
    this.listen(window, "pointermove", (e) => this.onDragMove((e as PointerEvent).clientY));
    this.listen(window, "pointerup", () => this.onDragEnd());
    this.listen(window, "pointercancel", () => this.onDragEnd());
    // real mobile browsers resize the viewport (address bar show/hide, rotation)
    this.listen(window, "resize", () => {
      this.viewportHeightPx = window.innerHeight;
    });

    // Never hide the dock while the input is focused — mobile keyboards opening
    // fire their own scroll/resize events, which would hide the input mid-typing.
    this.listen(input, "focus", () => {
      this.inputFocused = true;
      sheet.classList.remove("scroll-hidden");
    });
    this.listen(input, "blur", () => {
      this.inputFocused = false;
    });
    this.listen(window, "scroll", () => this.onScroll(), { passive: true });

    this.attachInputDrag();
  }

  destroy() {
    this.disposers.forEach((d) => d());
    this.disposers = [];
    window.clearTimeout(this.settleTimer);
  }

  expand() {
    if (!this.expanded) this.settleExpanded();
  }

  collapse() {
    if (this.expanded) this.settleCompact();
  }

  /** Bring the compact dock back if it was hidden by scrolling. */
  reveal() {
    this.els.sheet.classList.remove("scroll-hidden");
    this.lastScrollY = window.scrollY;
  }

  // ---------------------------------------------------------------------------

  private listen(target: EventTarget, type: string, fn: (e: Event) => void, opts?: AddEventListenerOptions) {
    target.addEventListener(type, fn, opts);
    this.disposers.push(() => target.removeEventListener(type, fn, opts));
  }

  private measureCompact() {
    this.compactHeightPx = this.els.footer.offsetHeight + 14;
  }

  /** Scroll-triggered hide/show of the compact dock so page content stays unobstructed. */
  private onScroll() {
    if (this.expanded || this.dragging) return;
    const { sheet } = this.els;
    if (this.inputFocused) {
      sheet.classList.remove("scroll-hidden");
      this.lastScrollY = window.scrollY;
      return;
    }
    const currentY = window.scrollY;
    const delta = currentY - this.lastScrollY;
    if (Math.abs(delta) < 8) return;
    if (delta > 0 && currentY > 40) sheet.classList.add("scroll-hidden");
    else if (delta < 0) sheet.classList.remove("scroll-hidden");
    this.lastScrollY = currentY;
  }

  /** translateY that hides everything but the compact footer (valid while "tall"). */
  private hiddenTranslateY() {
    return this.viewportHeightPx - this.compactHeightPx;
  }

  private currentTranslateY() {
    const transform = window.getComputedStyle(this.els.sheet).transform;
    if (!transform || transform === "none") return this.expanded ? 0 : this.hiddenTranslateY();
    return new DOMMatrixReadOnly(transform).m42;
  }

  /**
   * Temporarily give the sheet full viewport height (so drag/animation math is
   * physically meaningful) while instantly compensating with translateY so it
   * stays visually in exactly the same place — no flash, no jump.
   */
  private makeTallInstantly() {
    const { sheet } = this.els;
    window.clearTimeout(this.settleTimer);
    this.measureCompact();
    sheet.classList.add("expanded");
    sheet.style.transition = "none";
    sheet.style.transform = `translateY(${this.hiddenTranslateY()}px)`;
    void sheet.offsetHeight; // force reflow
    sheet.style.transition = "";
  }

  private onDragStart(clientY: number) {
    const { sheet } = this.els;
    this.dragging = true;
    sheet.classList.remove("scroll-hidden");
    sheet.classList.add("dragging");
    this.dragStartY = clientY;
    if (!this.expanded && !sheet.classList.contains("expanded")) this.makeTallInstantly();
    this.dragStartTransform = this.currentTranslateY();
  }

  private onDragMove(clientY: number) {
    if (!this.dragging) return;
    const next = Math.max(0, Math.min(this.hiddenTranslateY(), this.dragStartTransform + (clientY - this.dragStartY)));
    this.els.sheet.style.transform = `translateY(${next}px)`;
  }

  private onDragEnd() {
    if (!this.dragging) return;
    this.dragging = false;
    this.els.sheet.classList.remove("dragging");
    if (this.currentTranslateY() < this.hiddenTranslateY() * EXPAND_THRESHOLD) this.settleExpanded();
    else this.settleCompact();
  }

  /**
   * Lets the user drag-to-expand starting from the text input itself — but only
   * once a real vertical drag is detected, so a normal tap still focuses the
   * input and opens the keyboard.
   */
  private attachInputDrag() {
    const { input } = this.els;
    let candidate = false;
    let startX = 0;
    let startY = 0;

    const onMove = (e: PointerEvent) => {
      if (!candidate) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dy) < INPUT_DRAG_THRESHOLD || Math.abs(dy) <= Math.abs(dx)) return;
      // confirmed: this is a drag, not a tap — hand off to the normal drag flow
      stop();
      input.blur();
      this.onDragStart(startY);
      this.onDragMove(e.clientY);
    };
    const stop = () => {
      candidate = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", stop);
    };

    this.listen(input, "pointerdown", (e) => {
      const pe = e as PointerEvent;
      candidate = true;
      startX = pe.clientX;
      startY = pe.clientY;
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", stop);
    });
    this.disposers.push(stop);
  }

  private settleExpanded() {
    const { sheet } = this.els;
    this.expanded = true;
    sheet.classList.remove("scroll-hidden");
    if (!sheet.classList.contains("expanded")) this.makeTallInstantly();
    window.clearTimeout(this.settleTimer);
    sheet.style.transform = "translateY(0)";
    this.onExpandedChange(true);
  }

  private settleCompact() {
    const { sheet } = this.els;
    this.expanded = false;
    // animate down while still "tall", then swap back to the short natural
    // height only once the slide-down has actually finished
    sheet.style.transform = `translateY(${this.hiddenTranslateY()}px)`;

    const finish = () => {
      sheet.removeEventListener("transitionend", onEnd);
      window.clearTimeout(this.settleTimer);
      if (this.expanded || this.dragging) return; // re-opened mid-animation
      sheet.classList.remove("expanded");
      sheet.style.transform = "";
    };
    const onEnd = (e: TransitionEvent) => {
      if (e.target === sheet && e.propertyName === "transform") finish();
    };
    sheet.addEventListener("transitionend", onEnd);
    window.clearTimeout(this.settleTimer);
    // safety net in case transitionend never fires (e.g. no actual movement)
    this.settleTimer = window.setTimeout(finish, SETTLE_FALLBACK_MS);
    this.onExpandedChange(false);
  }
}
