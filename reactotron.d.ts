// TypeScript declaration for Reactotron's console.tron
interface Reactotron {
  log: (message: string, ...optionalParams: any[]) => void;
  warn: (message: string, ...optionalParams: any[]) => void;
  error: (message: string, ...optionalParams: any[]) => void;
  display: (config: {
    name: string;
    value?: any;
    preview?: string;
    important?: boolean;
    image?: string;
  }) => void;
}

declare global {
  interface Console {
    tron: Reactotron;
  }
}

export {};
