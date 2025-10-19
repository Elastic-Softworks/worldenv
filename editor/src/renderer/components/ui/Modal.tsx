/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

        Modal Component
        ---
        this component provides a modal dialog overlay for displaying
        content above the main interface. it includes backdrop handling,
        keyboard navigation, and proper focus management for accessibility.

        the modal supports customizable sizing, positioning, and styling
        while maintaining consistent behavior across different dialog types.
        it integrates with the theme system and handles escape key closing.

*/

/*
	===============================================================
             --- SETUP ---
	===============================================================
*/

import React, { useEffect, useRef } from 'react'; /* REACT FRAMEWORK */
import { useTheme } from '../../context/ThemeContext'; /* THEME MANAGEMENT */

/*
	===============================================================
             --- PROPS ---
	===============================================================
*/

/**
 * Modal component props interface
 */
interface ModalProps {
  visible: boolean;
  title?: string;
  width?: number;
  height?: number;
  closable?: boolean;
  maskClosable?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  onClose: () => void;
}

/*
	===============================================================
             --- COMPONENT ---
	===============================================================
*/

/**
 * Modal component
 *
 * Overlay dialog component with backdrop and keyboard handling.
 * Provides consistent modal behavior throughout the application.
 */
export function Modal({
  visible,
  title,
  width = 600,
  height = 400,
  closable = true,
  maskClosable = true,
  className = '',
  style,
  children,
  onClose
}: ModalProps): JSX.Element | null {
  const { theme } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  /* HANDLE KEYBOARD EVENTS */
  useEffect(() => {
    if (visible) {
      /* STORE PREVIOUSLY FOCUSED ELEMENT */
      previousFocus.current = document.activeElement as HTMLElement;

      /* FOCUS MODAL */
      if (modalRef.current) {
        modalRef.current.focus();
      }

      /* ADD KEYBOARD LISTENER */
      const handleKeyDown = (event: KeyboardEvent): void => {
        if (event.key === 'Escape' && closable) {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        /* RESTORE FOCUS */
        if (previousFocus.current) {
          previousFocus.current.focus();
        }
      };
    }

    return undefined;
  }, [visible, closable, onClose]);

  /**
   * handleBackdropClick()
   *
   * Closes modal when clicking on backdrop if maskClosable is true.
   */
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (event.target === event.currentTarget && maskClosable) {
      onClose();
    }
  };

  if (!visible) {
    return null;
  }

  /* MODAL STYLES */
  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease-out'
  };

  const modalStyle: React.CSSProperties = {
    width: Math.min(width, window.innerWidth - 40),
    height: Math.min(height, window.innerHeight - 40),
    maxWidth: '90vw',
    maxHeight: '90vh',
    backgroundColor: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.primary}`,
    borderRadius: '8px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    outline: 'none',
    animation: 'slideIn 0.2s ease-out',
    ...style
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px 20px',
    borderBottom: `1px solid ${theme.colors.border.primary}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: theme.colors.foreground.primary
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: theme.colors.foreground.secondary,
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    transition: 'background-color 0.2s ease'
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  };

  return (
    <>
      <div className="modal-backdrop" style={backdropStyle} onClick={handleBackdropClick}>
        <div
          ref={modalRef}
          className={`modal ${className}`.trim()}
          style={modalStyle}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
        >
          {/* HEADER */}
          {(title || closable) && (
            <div className="modal-header" style={headerStyle}>
              {title && (
                <h2 id="modal-title" style={titleStyle}>
                  {title}
                </h2>
              )}
              {closable && (
                <button
                  className="modal-close"
                  style={closeButtonStyle}
                  onClick={onClose}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.background.secondary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  aria-label="Close modal"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {/* CONTENT */}
          <div className="modal-content" style={contentStyle}>
            {children}
          </div>
        </div>
      </div>

      {/* ANIMATIONS */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
}

/*
	===============================================================
             --- EOF ---
	===============================================================
*/
