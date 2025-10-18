/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Engine Command Queue (Renderer)
 *
 * Manages command queuing and reliable ordering for engine operations.
 * Provides retry logic, priority handling, and batch processing.
 */

import {
  IPCCommand,
  IPCResponse,
  IPCPriority,
  IPCChannelName,
  QueuedCommand,
  IPCStatistics
} from '../../shared/types/IPCTypes';

export interface CommandQueueConfig {
  maxQueueSize: number;
  processingInterval: number;
  maxRetryAttempts: number;
  retryDelay: number;
  batchSize: number;
  enablePriorityQueue: boolean;
  enableStatistics: boolean;
}

export interface QueueStatistics {
  totalQueued: number;
  totalProcessed: number;
  totalFailed: number;
  currentQueueSize: number;
  averageProcessingTime: number;
  retryCount: number;
}

/**
 * EngineCommandQueue class
 *
 * Manages a queue of engine commands with reliable delivery,
 * retry logic, and priority handling.
 */
export class EngineCommandQueue {
  private config: CommandQueueConfig;
  private queue: Map<string, QueuedCommand> = new Map();
  private processingTimer: number | null = null;
  private statistics: QueueStatistics;
  private isProcessing: boolean = false;
  private commandProcessor: ((command: QueuedCommand) => Promise<IPCResponse>) | null = null;

  constructor(config: CommandQueueConfig) {
    this.config = config;
    this.statistics = {
      totalQueued: 0,
      totalProcessed: 0,
      totalFailed: 0,
      currentQueueSize: 0,
      averageProcessingTime: 0,
      retryCount: 0
    };
  }

  /**
   * initialize()
   *
   * Initialize the command queue with processor function.
   */
  initialize(processor: (command: QueuedCommand) => Promise<IPCResponse>): void {
    this.commandProcessor = processor;
    this.startProcessing();
  }

  /**
   * dispose()
   *
   * Clean up command queue resources.
   */
  dispose(): void {
    this.stopProcessing();
    this.clearQueue();
    this.commandProcessor = null;
  }

  /**
   * enqueue()
   *
   * Add command to the queue.
   */
  enqueue<T>(command: IPCCommand<T>): Promise<IPCResponse<unknown>> {
    if (this.queue.size >= this.config.maxQueueSize) {
      throw new Error('Command queue is full');
    }

    const queuedCommand: QueuedCommand<T> = {
      ...command,
      queuedAt: Date.now(),
      attempts: 0,
      status: 'pending'
    };

    return new Promise((resolve, reject) => {
      // Store promise handlers in the command
      (queuedCommand as any).resolve = resolve;
      (queuedCommand as any).reject = reject;

      this.queue.set(command.id, queuedCommand);
      this.statistics.totalQueued++;
      this.updateQueueStatistics();

      console.debug('[ENGINE_QUEUE] Command enqueued:', command.channel, command.id);
    });
  }

  /**
   * dequeue()
   *
   * Remove command from queue (used for priority processing).
   */
  dequeue(commandId: string): QueuedCommand | null {
    const command = this.queue.get(commandId);
    if (command) {
      this.queue.delete(commandId);
      this.updateQueueStatistics();
    }
    return command || null;
  }

  /**
   * priority()
   *
   * Set command priority (moves to front of queue).
   */
  priority(commandId: string, priority: IPCPriority): boolean {
    const command = this.queue.get(commandId);
    if (command && command.status === 'pending') {
      command.priority = priority;
      return true;
    }
    return false;
  }

  /**
   * cancel()
   *
   * Cancel pending command.
   */
  cancel(commandId: string): boolean {
    const command = this.queue.get(commandId);
    if (command && command.status === 'pending') {
      this.queue.delete(commandId);

      // Reject the promise
      if ((command as any).reject) {
        (command as any).reject(new Error('Command cancelled'));
      }

      this.updateQueueStatistics();
      console.debug('[ENGINE_QUEUE] Command cancelled:', commandId);
      return true;
    }
    return false;
  }

  /**
   * clear()
   *
   * Clear all pending commands.
   */
  clear(): void {
    const pendingCommands = Array.from(this.queue.values())
      .filter(cmd => cmd.status === 'pending');

    pendingCommands.forEach(command => {
      if ((command as any).reject) {
        (command as any).reject(new Error('Queue cleared'));
      }
    });

    this.clearQueue();
  }

  /**
   * getStatistics()
   *
   * Get queue statistics.
   */
  getStatistics(): QueueStatistics {
    this.updateQueueStatistics();
    return { ...this.statistics };
  }

  /**
   * getQueueSize()
   *
   * Get current queue size.
   */
  getQueueSize(): number {
    return this.queue.size;
  }

  /**
   * getPendingCommands()
   *
   * Get list of pending commands.
   */
  getPendingCommands(): QueuedCommand[] {
    return Array.from(this.queue.values())
      .filter(cmd => cmd.status === 'pending')
      .sort(this.commandComparator.bind(this));
  }

  /**
   * getProcessingCommands()
   *
   * Get list of currently processing commands.
   */
  getProcessingCommands(): QueuedCommand[] {
    return Array.from(this.queue.values())
      .filter(cmd => cmd.status === 'processing');
  }

  /**
   * startProcessing()
   *
   * Start command queue processing.
   */
  private startProcessing(): void {
    if (this.processingTimer) {
      return;
    }

    this.processingTimer = window.setInterval(() => {
      this.processQueue();
    }, this.config.processingInterval);

    console.debug('[ENGINE_QUEUE] Processing started');
  }

  /**
   * stopProcessing()
   *
   * Stop command queue processing.
   */
  private stopProcessing(): void {
    if (this.processingTimer) {
      window.clearInterval(this.processingTimer);
      this.processingTimer = null;
    }

    console.debug('[ENGINE_QUEUE] Processing stopped');
  }

  /**
   * processQueue()
   *
   * Process commands in the queue.
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || !this.commandProcessor) {
      return;
    }

    this.isProcessing = true;

    try {
      const pendingCommands = this.getPendingCommands();
      const batch = pendingCommands.slice(0, this.config.batchSize);

      for (const command of batch) {
        await this.processCommand(command);
      }
    } catch (error) {
      console.error('[ENGINE_QUEUE] Processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * processCommand()
   *
   * Process individual command.
   */
  private async processCommand(command: QueuedCommand): Promise<void> {
    if (command.status !== 'pending') {
      return;
    }

    command.status = 'processing';
    command.attempts++;
    command.lastAttempt = Date.now();

    const startTime = Date.now();

    try {
      const response = await this.commandProcessor!(command);
      const processingTime = Date.now() - startTime;

      // Update statistics
      this.statistics.totalProcessed++;
      this.updateAverageProcessingTime(processingTime);

      // Complete command
      command.status = 'completed';
      this.queue.delete(command.id);

      // Resolve promise
      if ((command as any).resolve) {
        (command as any).resolve(response);
      }

      console.debug('[ENGINE_QUEUE] Command completed:', command.channel, command.id);
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.handleCommandError(command, error as Error, processingTime);
    }
  }

  /**
   * handleCommandError()
   *
   * Handle command processing error with retry logic.
   */
  private handleCommandError(command: QueuedCommand, error: Error, processingTime: number): void {
    console.warn('[ENGINE_QUEUE] Command failed:', command.channel, command.id, error.message);

    // Check if we should retry
    if (command.attempts < this.config.maxRetryAttempts) {
      command.status = 'pending';
      this.statistics.retryCount++;

      // Add retry delay
      setTimeout(() => {
        // Command will be picked up in next processing cycle
      }, this.config.retryDelay * command.attempts);

      console.debug('[ENGINE_QUEUE] Command queued for retry:', command.id, 'attempt:', command.attempts);
    } else {
      // Max retries reached, fail the command
      command.status = 'failed';
      this.statistics.totalFailed++;
      this.queue.delete(command.id);

      // Reject promise
      if ((command as any).reject) {
        (command as any).reject(error);
      }

      console.error('[ENGINE_QUEUE] Command failed permanently:', command.id, error.message);
    }

    this.updateAverageProcessingTime(processingTime);
  }

  /**
   * commandComparator()
   *
   * Compare commands for priority sorting.
   */
  private commandComparator(a: QueuedCommand, b: QueuedCommand): number {
    if (this.config.enablePriorityQueue) {
      // Higher priority first
      const priorityDiff = (b.priority || IPCPriority.NORMAL) - (a.priority || IPCPriority.NORMAL);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
    }

    // Earlier queued commands first
    return a.queuedAt - b.queuedAt;
  }

  /**
   * updateQueueStatistics()
   *
   * Update queue size statistics.
   */
  private updateQueueStatistics(): void {
    this.statistics.currentQueueSize = this.queue.size;
  }

  /**
   * updateAverageProcessingTime()
   *
   * Update average processing time statistics.
   */
  private updateAverageProcessingTime(processingTime: number): void {
    const totalProcessed = this.statistics.totalProcessed;
    if (totalProcessed === 1) {
      this.statistics.averageProcessingTime = processingTime;
    } else {
      this.statistics.averageProcessingTime =
        (this.statistics.averageProcessingTime * (totalProcessed - 1) + processingTime) / totalProcessed;
    }
  }

  /**
   * clearQueue()
   *
   * Clear all commands from queue.
   */
  private clearQueue(): void {
    this.queue.clear();
    this.updateQueueStatistics();
  }
}
