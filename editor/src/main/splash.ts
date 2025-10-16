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

import { BrowserWindow, screen } from 'electron';
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
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WORLDEDIT</title>
  <style>
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: transparent;
      overflow: hidden;
    }

    .container {
      position: relative;
      width: 600px;
      height: 400px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      overflow: hidden;
    }

    .logo {
      font-size: 48px;
      font-weight: 700;
      background: linear-gradient(45deg, #00d4ff, #0091ff, #00d4ff, #0091ff);
      background-size: 400% 400%;
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 20px;
      text-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
      letter-spacing: 2px;
      animation: logoGlow 3s ease-in-out infinite, gradientShift 4s ease-in-out infinite;
    }

    .subtitle {
      font-size: 16px;
      color: #8892b0;
      margin-bottom: 20px;
      letter-spacing: 1px;
    }

    .company {
      font-size: 14px;
      background: linear-gradient(90deg, #00d4ff, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #00d4ff);
      background-size: 400% 400%;
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 10px;
      letter-spacing: 1px;
      font-weight: 600;
      animation: rainbow 6s ease-in-out infinite, fadeInUp 1s ease-out;
    }

    .tagline {
      font-size: 12px;
      color: #8892b0;
      margin-bottom: 40px;
      letter-spacing: 0.5px;
      animation: fadeInUp 1.5s ease-out 0.5s both;
    }

    .progress-container {
      width: 400px;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
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
      font-size: 14px;
      color: #8892b0;
      text-align: center;
      min-height: 20px;
    }

    .version {
      position: absolute;
      bottom: 20px;
      font-size: 12px;
      color: #4a5568;
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

    @keyframes logoGlow {
      0%, 100% {
        text-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
      }
      50% {
        text-shadow: 0 0 30px rgba(0, 212, 255, 0.6), 0 0 40px rgba(0, 212, 255, 0.3);
      }
    }

    @keyframes gradientShift {
      0%, 100% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
    }

    @keyframes rainbow {
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

    .container::before {
      content: 'WORLDENV';
      position: absolute;
      top: 20px;
      left: 20px;
      font-size: 120px;
      font-weight: 100;
      color: rgba(0, 212, 255, 0.03);
      pointer-events: none;
      z-index: 0;
      letter-spacing: 8px;
      transform: rotate(-15deg);
    }

    .container::after {
      content: 'WORLDENV';
      position: absolute;
      bottom: 20px;
      right: 20px;
      font-size: 80px;
      font-weight: 100;
      color: rgba(0, 212, 255, 0.05);
      pointer-events: none;
      z-index: 0;
      letter-spacing: 4px;
      transform: rotate(15deg);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">WORLDEDIT</div>
    <div class="company">ELASTIC SOFTWORKS 2025</div>
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
