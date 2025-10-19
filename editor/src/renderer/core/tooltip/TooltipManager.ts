/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

        TooltipManager
        ---
        this module manages contextual tooltips throughout the
        WORLDEDIT editor interface. it provides a centralized
        system for showing and hiding tooltips with proper
        positioning, timing, and accessibility support.

        tooltips are triggered by hover events and can include
        keyboard shortcuts, descriptions, and contextual help.
        the system handles viewport boundaries and collision
        detection for optimal positioning.

*/

/*
	===============================================================
             --- SETUP ---
	===============================================================
*/

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

/**
 * Tooltip configuration interface
 */
interface TooltipConfig {
  content:        string;
  shortcut?:      string;
  position?:      TooltipPosition;
  delay?:         number;
  maxWidth?:      number;
  allowHTML?:     boolean;
  className?:     string;
}

/**
 * Tooltip position options
 */
enum TooltipPosition {
  TOP     = 'top',
  BOTTOM  = 'bottom',
  LEFT    = 'left',
  RIGHT   = 'right',
  AUTO    = 'auto'
}

/**
 * Tooltip element data
 */
interface TooltipElement {
  element:        HTMLElement;
  tooltip:        HTMLElement | null;
  config:         TooltipConfig;
  showTimeout:    NodeJS.Timeout | null;
  hideTimeout:    NodeJS.Timeout | null;
}

/*
	===============================================================
             --- MANAGER ---
	===============================================================
*/

/**
 * TooltipManager class
 *
 * Centralized tooltip management system with positioning and timing.
 * Handles tooltip creation, positioning, and lifecycle management.
 */
export class TooltipManager {

  private static instance: TooltipManager | null = null;

  private tooltips:         Map<HTMLElement, TooltipElement> = new Map();
  private container:        HTMLElement | null = null;
  private currentTooltip:   HTMLElement | null = null;

  /* DEFAULT CONFIGURATION */
  private defaultDelay:     number = 500;
  private hideDelay:        number = 100;
  private maxWidth:         number = 300;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {

    this.createContainer();
    this.attachGlobalListeners();

  }

  /**
   * Get singleton instance
   */
  public static getInstance(): TooltipManager {

    if (!TooltipManager.instance) {
      TooltipManager.instance = new TooltipManager();
    }

    return TooltipManager.instance;

  }

  /**
   * Register tooltip for an element
   */
  public register(element: HTMLElement, config: TooltipConfig): void {

    /* REMOVE EXISTING TOOLTIP */
    if (this.tooltips.has(element)) {
      this.unregister(element);
    }

    const tooltipElement: TooltipElement = {
      element:      element,
      tooltip:      null,
      config:       { ...this.getDefaultConfig(), ...config },
      showTimeout:  null,
      hideTimeout:  null
    };

    this.tooltips.set(element, tooltipElement);

    /* ATTACH EVENT LISTENERS */
    element.addEventListener('mouseenter', this.handleMouseEnter.bind(this, element));
    element.addEventListener('mouseleave', this.handleMouseLeave.bind(this, element));
    element.addEventListener('focus', this.handleFocus.bind(this, element));
    element.addEventListener('blur', this.handleBlur.bind(this, element));

  }

  /**
   * Unregister tooltip for an element
   */
  public unregister(element: HTMLElement): void {

    const tooltipElement = this.tooltips.get(element);

    if (tooltipElement) {

      /* CLEAR TIMEOUTS */
      if (tooltipElement.showTimeout) {
        clearTimeout(tooltipElement.showTimeout);
      }
      if (tooltipElement.hideTimeout) {
        clearTimeout(tooltipElement.hideTimeout);
      }

      /* HIDE AND REMOVE TOOLTIP */
      this.hideTooltip(element);

      /* REMOVE EVENT LISTENERS */
      element.removeEventListener('mouseenter', this.handleMouseEnter.bind(this, element));
      element.removeEventListener('mouseleave', this.handleMouseLeave.bind(this, element));
      element.removeEventListener('focus', this.handleFocus.bind(this, element));
      element.removeEventListener('blur', this.handleBlur.bind(this, element));

      this.tooltips.delete(element);

    }

  }

  /**
   * Update tooltip configuration
   */
  public update(element: HTMLElement, config: Partial<TooltipConfig>): void {

    const tooltipElement = this.tooltips.get(element);

    if (tooltipElement) {
      tooltipElement.config = { ...tooltipElement.config, ...config };

      /* UPDATE EXISTING TOOLTIP IF VISIBLE */
      if (tooltipElement.tooltip) {
        this.updateTooltipContent(tooltipElement);
      }
    }

  }

  /**
   * Show tooltip for element
   */
  public show(element: HTMLElement): void {

    const tooltipElement = this.tooltips.get(element);

    if (tooltipElement) {
      this.showTooltip(element);
    }

  }

  /**
   * Hide tooltip for element
   */
  public hide(element: HTMLElement): void {

    const tooltipElement = this.tooltips.get(element);

    if (tooltipElement) {
      this.hideTooltip(element);
    }

  }

  /**
   * Hide all tooltips
   */
  public hideAll(): void {

    this.tooltips.forEach((_, element) => {
      this.hideTooltip(element);
    });

  }

  /*
	===============================================================
             --- EVENT HANDLERS ---
	===============================================================
*/

  /**
   * Handle mouse enter event
   */
  private handleMouseEnter(element: HTMLElement, event: MouseEvent): void {

    const tooltipElement = this.tooltips.get(element);

    if (tooltipElement) {

      /* CLEAR HIDE TIMEOUT */
      if (tooltipElement.hideTimeout) {
        clearTimeout(tooltipElement.hideTimeout);
        tooltipElement.hideTimeout = null;
      }

      /* SET SHOW TIMEOUT */
      const delay = tooltipElement.config.delay || this.defaultDelay;
      tooltipElement.showTimeout = setTimeout(() => {
        this.showTooltip(element);
      }, delay);

    }

  }

  /**
   * Handle mouse leave event
   */
  private handleMouseLeave(element: HTMLElement, event: MouseEvent): void {

    const tooltipElement = this.tooltips.get(element);

    if (tooltipElement) {

      /* CLEAR SHOW TIMEOUT */
      if (tooltipElement.showTimeout) {
        clearTimeout(tooltipElement.showTimeout);
        tooltipElement.showTimeout = null;
      }

      /* SET HIDE TIMEOUT */
      tooltipElement.hideTimeout = setTimeout(() => {
        this.hideTooltip(element);
      }, this.hideDelay);

    }

  }

  /**
   * Handle focus event
   */
  private handleFocus(element: HTMLElement, event: FocusEvent): void {

    /* SHOW TOOLTIP IMMEDIATELY ON KEYBOARD FOCUS */
    this.showTooltip(element);

  }

  /**
   * Handle blur event
   */
  private handleBlur(element: HTMLElement, event: FocusEvent): void {

    /* HIDE TOOLTIP ON BLUR */
    this.hideTooltip(element);

  }

  /*
	===============================================================
             --- TOOLTIP MANAGEMENT ---
	===============================================================
*/

  /**
   * Show tooltip for element
   */
  private showTooltip(element: HTMLElement): void {

    const tooltipElement = this.tooltips.get(element);

    if (!tooltipElement || tooltipElement.tooltip) {
      return;
    }

    /* HIDE OTHER TOOLTIPS */
    if (this.currentTooltip && this.currentTooltip !== tooltipElement.tooltip) {
      this.hideAllTooltips();
    }

    /* CREATE TOOLTIP ELEMENT */
    const tooltip = this.createTooltipElement(tooltipElement);
    tooltipElement.tooltip = tooltip;
    this.currentTooltip = tooltip;

    /* ADD TO CONTAINER */
    if (this.container) {
      this.container.appendChild(tooltip);
    }

    /* POSITION TOOLTIP */
    this.positionTooltip(element, tooltip, tooltipElement.config);

    /* ANIMATE IN */
    requestAnimationFrame(() => {
      tooltip.classList.add('tooltip-visible');
    });

  }

  /**
   * Hide tooltip for element
   */
  private hideTooltip(element: HTMLElement): void {

    const tooltipElement = this.tooltips.get(element);

    if (tooltipElement && tooltipElement.tooltip) {

      const tooltip = tooltipElement.tooltip;

      /* ANIMATE OUT */
      tooltip.classList.remove('tooltip-visible');

      /* REMOVE AFTER ANIMATION */
      setTimeout(() => {
        if (tooltip.parentNode) {
          tooltip.parentNode.removeChild(tooltip);
        }
      }, 200);

      tooltipElement.tooltip = null;

      if (this.currentTooltip === tooltip) {
        this.currentTooltip = null;
      }

    }

  }

  /**
   * Hide all tooltips
   */
  private hideAllTooltips(): void {

    this.tooltips.forEach((tooltipElement) => {
      if (tooltipElement.tooltip) {
        this.hideTooltip(tooltipElement.element);
      }
    });

  }

  /**
   * Create tooltip DOM element
   */
  private createTooltipElement(tooltipElement: TooltipElement): HTMLElement {

    const tooltip = document.createElement('div');
    tooltip.className = `tooltip ${tooltipElement.config.className || ''}`;

    /* CONTENT */
    const content = document.createElement('div');
    content.className = 'tooltip-content';

    if (tooltipElement.config.allowHTML) {
      content.innerHTML = tooltipElement.config.content;
    } else {
      content.textContent = tooltipElement.config.content;
    }

    tooltip.appendChild(content);

    /* SHORTCUT */
    if (tooltipElement.config.shortcut) {
      const shortcut = document.createElement('div');
      shortcut.className = 'tooltip-shortcut';
      shortcut.textContent = tooltipElement.config.shortcut;
      tooltip.appendChild(shortcut);
    }

    /* STYLING */
    const maxWidth = tooltipElement.config.maxWidth || this.maxWidth;
    tooltip.style.maxWidth = `${maxWidth}px`;

    return tooltip;

  }

  /**
   * Update tooltip content
   */
  private updateTooltipContent(tooltipElement: TooltipElement): void {

    if (!tooltipElement.tooltip) {
      return;
    }

    const contentElement = tooltipElement.tooltip.querySelector('.tooltip-content');
    if (contentElement) {
      if (tooltipElement.config.allowHTML) {
        contentElement.innerHTML = tooltipElement.config.content;
      } else {
        contentElement.textContent = tooltipElement.config.content;
      }
    }

    /* UPDATE SHORTCUT */
    let shortcutElement = tooltipElement.tooltip.querySelector('.tooltip-shortcut');

    if (tooltipElement.config.shortcut) {
      if (!shortcutElement) {
        shortcutElement = document.createElement('div');
        shortcutElement.className = 'tooltip-shortcut';
        tooltipElement.tooltip.appendChild(shortcutElement);
      }
      shortcutElement.textContent = tooltipElement.config.shortcut;
    } else if (shortcutElement) {
      shortcutElement.remove();
    }

  }

  /**
   * Position tooltip relative to element
   */
  private positionTooltip(element: HTMLElement, tooltip: HTMLElement, config: TooltipConfig): void {

    const elementRect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let position = config.position || TooltipPosition.AUTO;

    /* AUTO POSITIONING */
    if (position === TooltipPosition.AUTO) {
      position = this.calculateBestPosition(elementRect, tooltipRect, viewportWidth, viewportHeight);
    }

    let top: number;
    let left: number;

    switch (position) {
      case TooltipPosition.TOP:
        top = elementRect.top - tooltipRect.height - 8;
        left = elementRect.left + (elementRect.width - tooltipRect.width) / 2;
        break;

      case TooltipPosition.BOTTOM:
        top = elementRect.bottom + 8;
        left = elementRect.left + (elementRect.width - tooltipRect.width) / 2;
        break;

      case TooltipPosition.LEFT:
        top = elementRect.top + (elementRect.height - tooltipRect.height) / 2;
        left = elementRect.left - tooltipRect.width - 8;
        break;

      case TooltipPosition.RIGHT:
        top = elementRect.top + (elementRect.height - tooltipRect.height) / 2;
        left = elementRect.right + 8;
        break;

      default:
        top = elementRect.bottom + 8;
        left = elementRect.left + (elementRect.width - tooltipRect.width) / 2;
    }

    /* VIEWPORT CONSTRAINTS */
    left = Math.max(8, Math.min(left, viewportWidth - tooltipRect.width - 8));
    top = Math.max(8, Math.min(top, viewportHeight - tooltipRect.height - 8));

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;

    /* ADD POSITION CLASS */
    tooltip.classList.add(`tooltip-${position}`);

  }

  /**
   * Calculate best position for tooltip
   */
  private calculateBestPosition(
    elementRect: DOMRect,
    tooltipRect: DOMRect,
    viewportWidth: number,
    viewportHeight: number
  ): TooltipPosition {

    const spaceTop = elementRect.top;
    const spaceBottom = viewportHeight - elementRect.bottom;
    const spaceLeft = elementRect.left;
    const spaceRight = viewportWidth - elementRect.right;

    /* PREFER BOTTOM IF SPACE AVAILABLE */
    if (spaceBottom >= tooltipRect.height + 16) {
      return TooltipPosition.BOTTOM;
    }

    /* THEN TOP */
    if (spaceTop >= tooltipRect.height + 16) {
      return TooltipPosition.TOP;
    }

    /* THEN RIGHT */
    if (spaceRight >= tooltipRect.width + 16) {
      return TooltipPosition.RIGHT;
    }

    /* FINALLY LEFT */
    if (spaceLeft >= tooltipRect.width + 16) {
      return TooltipPosition.LEFT;
    }

    /* DEFAULT TO BOTTOM */
    return TooltipPosition.BOTTOM;

  }

  /*
	===============================================================
             --- SETUP ---
	===============================================================
*/

  /**
   * Create tooltip container
   */
  private createContainer(): void {

    this.container = document.createElement('div');
    this.container.id = 'tooltip-container';
    this.container.style.position = 'fixed';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.pointerEvents = 'none';
    this.container.style.zIndex = '10000';

    document.body.appendChild(this.container);

    /* ADD CSS STYLES */
    this.injectStyles();

  }

  /**
   * Attach global event listeners
   */
  private attachGlobalListeners(): void {

    /* HIDE TOOLTIPS ON SCROLL/RESIZE */
    window.addEventListener('scroll', this.hideAllTooltips.bind(this), true);
    window.addEventListener('resize', this.hideAllTooltips.bind(this));

    /* HIDE TOOLTIPS ON ESCAPE */
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.hideAllTooltips();
      }
    });

  }

  /**
   * Inject CSS styles
   */
  private injectStyles(): void {

    const style = document.createElement('style');
    style.textContent = `
      .tooltip {
        position: absolute;
        background: #333;
        color: #fff;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-family: system-ui, -apple-system, sans-serif;
        line-height: 1.4;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        opacity: 0;
        transform: scale(0.9);
        transition: opacity 0.2s ease, transform 0.2s ease;
        pointer-events: none;
        z-index: 10001;
      }

      .tooltip-visible {
        opacity: 1;
        transform: scale(1);
      }

      .tooltip-content {
        margin: 0;
      }

      .tooltip-shortcut {
        margin-top: 4px;
        font-size: 10px;
        opacity: 0.8;
        font-weight: bold;
      }

      [data-theme="light"] .tooltip {
        background: #f8f9fa;
        color: #333;
        border: 1px solid #e0e0e0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    `;

    document.head.appendChild(style);

  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): TooltipConfig {

    return {
      content:    '',
      position:   TooltipPosition.AUTO,
      delay:      this.defaultDelay,
      maxWidth:   this.maxWidth,
      allowHTML:  false
    };

  }

}

/* EXPORT SINGLETON INSTANCE */
export const tooltipManager = TooltipManager.getInstance();

/*
	===============================================================
             --- EXPORTS ---
	===============================================================
*/

export { TooltipPosition };
export type { TooltipConfig };

/*
	===============================================================
             --- EOF ---
	===============================================================
*/
