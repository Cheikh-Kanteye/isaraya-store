type EventListener = (...args: unknown[]) => void;

class EventEmitter {
  private events: Record<string, EventListener[]> = {};

  on(event: string, listener: EventListener): () => void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);

    // Return a function to unsubscribe
    return () => {
      this.events[event] = this.events[event].filter((l) => l !== listener);
    };
  }

  emit(event: string, ...args: unknown[]): void {
    if (this.events[event]) {
      this.events[event].forEach((listener) => listener(...args));
    }
  }
}

export const storeObserver = new EventEmitter();
