/**
 * Toast notification system with dynamic CSS injection and smooth animation.
 */
export class Toast {
  private static stylesInjected = false;

  /**
   * Displays a toast notification.
   * @param message The message to display.
   * @param duration Duration in milliseconds before auto-dismissal (default: 3000).
   */
  public static show(message: string, duration = 3000): void {
    if (!this.stylesInjected) {
      this.injectStyles();
      this.stylesInjected = true;
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    document.body.appendChild(toast);

    // Trigger animation on next frame
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Hide and remove the toast after duration
    setTimeout(() => {
      toast.classList.remove('show');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, duration);
  }

  /**
   * Injects required CSS styles for toast notifications.
   */
  private static injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .toast {
        position: fixed;
        left: 50%;
        bottom: 32px;
        transform: translateX(-50%) translateY(20px);
        min-width: max-content;
        max-width: 80vw;
        background-color: #222;
        color: #fff;
        padding: 12px 20px;
        border-radius: 6px;
        font-size: 15px;
        text-align: center;
        z-index: 9999;
        opacity: 0;
        pointer-events: none;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        transition: opacity 0.4s ease, transform 0.4s ease;
      }

      .toast.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    `;
    document.head.appendChild(style);
  }
}

// Example usage:
// Toast.show("✅ Action completed successfully!");

