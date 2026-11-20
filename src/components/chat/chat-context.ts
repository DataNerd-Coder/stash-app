import { createContext, useContext, type RefObject } from "react";
import type { Conversation, Product } from "@/data/types";
import type { ChatMessage, MessageBody, SheetHandle } from "./types";

export interface ChatContextValue {
  messages: ChatMessage[];
  input: string;
  setInput: (value: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  sheetRef: RefObject<SheetHandle | null>;

  expand(): void;
  collapse(): void;
  focusInput(): void;

  push(from: ChatMessage["from"], body: MessageBody, image?: string): string;
  pushText(from: ChatMessage["from"], text: string): string;
  remove(id: string): void;

  /** Sends the current input (or `override`) as a user message. */
  send(override?: string): void;
  pickMention(tag: string): void;
  pickProductSuggestion(product: Product): void;
  showProduct(product: Product): void;
  attachFile(file: File, fromCamera: boolean): void;
  submitVoiceNote(): void;
  voiceUnavailable(): void;
  loadConversation(convo: Conversation): void;
  startNewChat(): void;
  reset(): void;
}

export const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside <ChatProvider>");
  return ctx;
}
