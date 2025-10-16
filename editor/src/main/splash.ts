/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Splash Screen Module
 *
 * Displays splash screen during application initialization.
 * Shows loading progress and version information.
 */

import { BrowserWindow, screen, nativeTheme } from 'electron';
import { logger } from './logger';

class SplashScreen {
  private window: BrowserWindow | null;
  private close_timeout: NodeJS.Timeout | null;

  constructor() {
    this.window = null;
    this.close_timeout = null;
  }

  /**
   * show()
   *
   * Creates and displays splash screen window.
   * Returns promise that resolves when splash is ready.
   */
  public async show(): Promise<void> {
    if (this.window) {
      logger.warn('SPLASH', 'Splash screen already shown');
      return;
    }

    const display = screen.getPrimaryDisplay();
    const { width, height } = display.workAreaSize;

    const splash_width = 600;
    const splash_height = 400;

    this.window = new BrowserWindow({
      width: splash_width,
      height: splash_height,
      x: Math.floor((width - splash_width) / 2),
      y: Math.floor((height - splash_height) / 2),
      frame: false,
      transparent: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true
      }
    });

    const splash_html = this.generateSplashHTML();
    const splash_data_url = `data:text/html;charset=utf-8,${encodeURIComponent(splash_html)}`;

    await this.window.loadURL(splash_data_url);

    this.window.once('ready-to-show', () => {
      if (this.window) {
        this.window.show();
        logger.info('SPLASH', 'Splash screen shown');
      }
    });
  }

  /**
   * hide()
   *
   * Hides and destroys splash screen window.
   */
  public hide(): void {
    if (!this.window) {
      return;
    }

    if (this.close_timeout) {
      clearTimeout(this.close_timeout);
      this.close_timeout = null;
    }

    if (!this.window.isDestroyed()) {
      this.window.close();
    }

    this.window = null;

    logger.info('SPLASH', 'Splash screen hidden');
  }

  /**
   * hideAfter()
   *
   * Hides splash screen after specified delay.
   */
  public hideAfter(delay: number): void {
    if (this.close_timeout) {
      clearTimeout(this.close_timeout);
    }

    this.close_timeout = setTimeout(() => {
      this.hide();
    }, delay);
  }

  /**
   * updateMessage()
   *
   * Updates splash screen loading message.
   */
  public updateMessage(message: string): void {
    if (!this.window || this.window.isDestroyed()) {
      return;
    }

    this.window.webContents
      .executeJavaScript(`document.getElementById('message').textContent = '${message}';`)
      .catch((error) => {
        logger.error('SPLASH', 'Failed to update message', { error });
      });
  }

  /**
   * updateProgress()
   *
   * Updates splash screen progress bar.
   */
  public updateProgress(progress: number): void {
    if (!this.window || this.window.isDestroyed()) {
      return;
    }

    const clamped_progress = Math.max(0, Math.min(100, progress));

    this.window.webContents
      .executeJavaScript(
        `document.getElementById('progress').style.width = '${clamped_progress}%';`
      )
      .catch((error) => {
        logger.error('SPLASH', 'Failed to update progress', { error });
      });
  }

  /**
   * generateSplashHTML()
   *
   * Generates HTML content for splash screen.
   */
  private generateSplashHTML(): string {
    const isDark = nativeTheme.shouldUseDarkColors;
    const bgColor = isDark ? '#2a2a2a' : '#ffffff';
    const textPrimary = isDark ? '#ffffff' : '#1a1a1a';
    const textSecondary = isDark ? '#8892b0' : '#666666';
    const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WORLDEDIT</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: transparent;
      overflow: hidden;
    }

    .container {
      position: relative;
      width: 600px;
      height: 400px;
      background: ${bgColor};
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 40px 40px 40px;
      border: 1px solid ${borderColor};
      overflow: hidden;
    }

    .company {
      font-size: 13px;
      color: ${textSecondary};
      margin-bottom: 32px;
      letter-spacing: 2px;
      font-weight: 600;
      text-transform: uppercase;
      animation: fadeInUp 0.8s ease-out;
    }

    .logo-container {
      display: flex;
      gap: 2px;
      margin-bottom: 32px;
      height: 56px;
      align-items: center;
    }

    .logo-letter {
      font-size: 48px;
      font-weight: 700;
      background: linear-gradient(135deg, #00d4ff, #0091ff, #00d4ff, #0091ff);
      background-size: 300% 300%;
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: 2px;
      opacity: 0;
      transform: translateY(-100px);
      animation: letterDrop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                 rainbowShift 4s ease-in-out infinite;
    }

    .logo-letter:nth-child(1) { animation-delay: 0.1s, 0s; }
    .logo-letter:nth-child(2) { animation-delay: 0.2s, 0s; }
    .logo-letter:nth-child(3) { animation-delay: 0.3s, 0s; }
    .logo-letter:nth-child(4) { animation-delay: 0.4s, 0s; }
    .logo-letter:nth-child(5) { animation-delay: 0.5s, 0s; }
    .logo-letter:nth-child(6) { animation-delay: 0.6s, 0s; }
    .logo-letter:nth-child(7) { animation-delay: 0.7s, 0s; }
    .logo-letter:nth-child(8) { animation-delay: 0.8s, 0s; }

    .tagline {
      font-size: 12px;
      color: ${textSecondary};
      margin-bottom: 48px;
      letter-spacing: 1.5px;
      font-weight: 600;
      text-transform: uppercase;
      animation: fadeInUp 1.2s ease-out 0.8s both;
    }

    .progress-container {
      width: 400px;
      height: 4px;
      background: ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 20px;
    }

    .progress-bar {
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #00d4ff 0%, #0091ff 100%);
      border-radius: 2px;
      transition: width 0.3s ease;
      box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
    }

    .message {
      font-size: 13px;
      color: ${textSecondary};
      text-align: center;
      min-height: 20px;
      font-weight: 500;
    }

    .version {
      position: absolute;
      bottom: 20px;
      font-size: 11px;
      color: ${isDark ? '#4a5568' : '#999999'};
      font-weight: 500;
    }

    @keyframes letterDrop {
      0% {
        opacity: 0;
        transform: translateY(-100px);
      }
      60% {
        opacity: 1;
        transform: translateY(10px);
      }
      80% {
        transform: translateY(-5px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes rainbowShift {
      0%, 100% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.6;
      }
    }

    .loading {
      animation: pulse 2s ease-in-out infinite;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="company">ELASTIC SOFTWORKS 2025</div>

    <div class="logo-container">
      <span class="logo-letter">W</span>
      <span class="logo-letter">O</span>
      <span class="logo-letter">R</span>
      <span class="logo-letter">L</span>
      <span class="logo-letter">D</span>
      <span class="logo-letter">E</span>
      <span class="logo-letter">N</span>
      <span class="logo-letter">V</span>
    </div>

    <div class="tagline">NEW WORLD APPLICATIONS</div>

    <div class="progress-container">
      <div class="progress-bar" id="progress"></div>
    </div>

    <div class="message loading" id="message">Loading...</div>

    <div class="version">v0.1.0-prealpha</div>
  </div>
</body>
</html>
    `.trim();
  }
}

export const splashScreen = new SplashScreen();
