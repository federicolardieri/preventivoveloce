import { create } from 'zustand';

interface UIStoreState {
  isAiAssistantOpen: boolean;
  setAiAssistantOpen: (open: boolean) => void;
  aiPrompt: string;
  setAiPrompt: (prompt: string) => void;
}

export const useUIStore = create<UIStoreState>((set) => ({
  isAiAssistantOpen: false,
  setAiAssistantOpen: (open) => set({ isAiAssistantOpen: open }),
  aiPrompt: '',
  setAiPrompt: (prompt) => set({ aiPrompt: prompt }),
}));
