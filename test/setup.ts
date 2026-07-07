import '@testing-library/jest-dom';
import { vi } from 'vitest';

// jsdom does not implement execCommand
Object.defineProperty(document, 'execCommand', {
  value: vi.fn((command: string, _showUI?: boolean, value?: string) => {
    if (command === 'insertHTML' && value) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const fragment = range.createContextualFragment(value);
        range.insertNode(fragment);
      }
    }
    return true;
  }),
  writable: true
});

Object.defineProperty(document, 'queryCommandState', {
  value: vi.fn(() => false),
  writable: true
});

// jsdom does not implement Range#getBoundingClientRect; a zero-size rect
// makes the selection bubble toolbar treat the range as invisible
if (!Range.prototype.getBoundingClientRect) {
  Range.prototype.getBoundingClientRect = function () {
    return new DOMRect(0, 0, 0, 0);
  };
}

// Minimal DOMRect polyfill for jsdom
globalThis.DOMRect = globalThis.DOMRect ||
  class DOMRect {
    x = 0;
    y = 0;
    width = 0;
    height = 0;
    top = 0;
    right = 0;
    bottom = 0;
    left = 0;
    constructor(x = 0, y = 0, w = 0, h = 0) {
      this.x = x;
      this.y = y;
      this.width = w;
      this.height = h;
      this.top = y;
      this.right = x + w;
      this.bottom = y + h;
      this.left = x;
    }
    static fromRect(rect?: { x?: number; y?: number; width?: number; height?: number }) {
      return new DOMRect(rect?.x, rect?.y, rect?.width, rect?.height);
    }
    toJSON() {
      return { x: this.x, y: this.y, width: this.width, height: this.height, top: this.top, right: this.right, bottom: this.bottom, left: this.left };
    }
  } as any;
