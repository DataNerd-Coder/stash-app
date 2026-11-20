import { Outlet } from "react-router";
import { ChatSheet } from "@/components/chat/ChatSheet";

/** Business pages: page content with the shared pullable chatbox docked underneath. */
export function ChatLayout() {
  return (
    <>
      <Outlet />
      <ChatSheet />
    </>
  );
}
