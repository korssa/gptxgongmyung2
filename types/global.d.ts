declare global {
  interface Window {
    adminModeChange?: (enabled: boolean) => void;
  }
}

export {};
