/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * You are free to use, modify, and redistribute this software, but modifications must also be licensed under the LGPL.
 * This project is distributed without any warranty; see the LGPL for more details.
 *
 * For a full copy of the LGPL and ethical contribution guidelines, please refer to the `COPYRIGHT.md` and `NOTICE.md` files.
 */
import { StructuredLogger } from './config';

/**
 * Toast notification system with glassmorphism styling and smooth animation.
 */
export class Toast {
  private static stylesInjected = false;

  /**
   * Displays a toast notification.
   * @param message The message to display.
   * @param duration Duration in milliseconds before auto-dismissal (default: 3000).
   */
  public static show(message: string, duration = 3000): void {
    // Safety check for DOM availability
    if (typeof document === 'undefined' || !document.body || !document.createElement) {
      StructuredLogger.warn('Toast', 'Toast notification cannot be displayed: DOM not available');
      return;
    }

    if (!this.stylesInjected) {
      this.injectStyles();
      this.stylesInjected = true;
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Hide and remove after duration
    setTimeout(() => {
      toast.classList.remove('show');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, duration);
  }

  /**
   * Injects glassmorphic CSS styles for toasts.
   */
  private static injectStyles(): void {
    // Safety check for DOM availability
    if (typeof document === 'undefined' || !document.head || !document.createElement) {
      StructuredLogger.warn('Toast', 'Toast styles cannot be injected: DOM not available');
      return;
    }

    const style = document.createElement('style');
    style.textContent = `
      .toast {
        position: fixed;
        left: 50%;
        bottom: 32px;
        transform: translateX(-50%) translateY(20px);
        max-width: 80vw;
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        padding: 12px 24px;
        border-radius: 10px;
        font-size: 15px;
        text-align: center;
        z-index: 9999;
        opacity: 0;
        pointer-events: none;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        transition: opacity 0.4s ease, transform 0.4s ease;
      }

      .toast.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }

      @media (prefers-color-scheme: dark) {
        .toast {
          background: rgba(30, 30, 30, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Example usage:
// Toast.show("✨ Toast with glass effect!");

