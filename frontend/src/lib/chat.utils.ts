
import type { ChatState } from "@/types/store";
import type { Conversation, Message } from "@/types/chat";
import type { User } from "@/types/user";

/**
 * Deduplicate direct conversations that share the same participant pair.
 * Keeps the one with the most recent `lastMessageAt`.
 */
export const deduplicateDirectConversations = (
  conversations: Conversation[]
): Conversation[] => {
  const seen = new Map<string, Conversation>();

  for (const convo of conversations) {
    if (convo.type !== "direct") continue;

    const key = [...convo.participants.map((p) => p._id)].sort().join("-");
    const existing = seen.get(key);

    if (!existing || convo.lastMessageAt > existing.lastMessageAt) {
      seen.set(key, convo);
    }
  }

  const directIds = new Set(seen.values());
  return conversations.filter(
    (c) => c.type !== "direct" || directIds.has(c)
  );
};

/** Append a new message to the conversation's message list in state. */
export const appendMessage = (
  messagesState: ChatState["messages"],
  convoId: string,
  message: Message
): ChatState["messages"] => {
  const current = messagesState[convoId];
  return {
    ...messagesState,
    [convoId]: {
      ...current,
      items: [...(current?.items ?? []), message],
      hasMore: current?.hasMore ?? false,
      nextCursor: current?.nextCursor ?? null,
    },
  };
};

/** Build a lastMessage patch for a conversation after sending. */
export const buildLastMessagePatch = (
  savedMessage: Message,
  userId: string,
  displayName: string,
  avatarUrl?: string
): Pick<Conversation, "lastMessage" | "lastMessageAt" | "seenBy"> => ({
  lastMessage: {
    _id: savedMessage._id,
    content: savedMessage.content ?? "",
    createdAt: savedMessage.createdAt,
    sender: { _id: userId, displayName, avatarUrl },
  },
  lastMessageAt: savedMessage.createdAt,
  seenBy: [],
});

export const filterValidConversations = <T extends  Conversation>(c: T) =>
  !(c.type === "group" && (!c.participants || c.participants.length <= 2));

export const updateMessageState = (state: ChatState, savedMessage: Message, convoId: string, user: User): Partial<ChatState> => {
  const messageWithOwn: Message = { ...savedMessage, isOwn: true };
  const lastMessagePatch = buildLastMessagePatch(
    savedMessage,
    user._id,
    user.displayName ?? "",
    user.avatarUrl
  );

  return {
    messages: appendMessage(state.messages, convoId, messageWithOwn),
    conversations: state.conversations.map((c) =>
      c._id === convoId ? { ...c, ...lastMessagePatch } : c
    ),
  };
};