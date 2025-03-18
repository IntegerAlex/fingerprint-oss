/**
 * Show toasts in the browser.
 * @param {string} message
 * @returns {void}
 */
 // Toast notification system with CSS injection and display logic
export class Toast {
  private static stylesInjected: boolean = false;
  
  /**
   * Show a toast notification
   * @param message The message to display
   * @param duration Visibility duration in milliseconds (default: 3000)
   */
  public static show(message: string, duration: number = 3000): void {
    // Inject styles only once
    if (!this.stylesInjected) {
      this.injectStyles();
      this.stylesInjected = true;
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    document.body.appendChild(toast);

    // Use requestAnimationFrame for smooth animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto-hide after duration
    setTimeout(() => {
      toast.classList.remove('show');
      
      // Wait for animation to complete before removing
      toast.addEventListener('transitionend', () => {
        toast.remove();
      }, { once: true });
    }, duration);
  }

  /**
   * Inject required CSS styles for toast notifications
   */
  private static injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .toast {
        visibility: hidden;
        min-width: 250px;
        margin-left: -125px;
        background: #333;
        color: #fff;
        text-align: center;
        border-radius: 4px;
        padding: 12px;
        position: fixed;
        z-index: 10000;
        left: 50%;
        bottom: 30px;
        font-size: 14px;
        opacity: 0;
        transition: opacity 0.3s ease, visibility 0.3s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }

      .toast.show {
        visibility: visible;
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  }
}

// Usage example:
// Toast.show("This is a toast message!");
