import { useLocalStorage } from "@vueuse/core";

export function useSettings() {
  return useLocalStorage('settings', {
    geminiApiKey: '',
    geminiModel: 'gemini-1.5-flash',
  })
}