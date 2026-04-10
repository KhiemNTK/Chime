import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatState } from "@/types/store";

import { chatService } from "@/services/chatService";
import { useAuthStore } from "./useAuthStore";
import { deduplicateDirectConversations, filterValidConversations, updateMessageState } from "@/lib/chat.utils";


export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      activeConversationId: null,
      convoLoading: false,
      messageLoading: false,

      setActiveConversation: (id) => set({ activeConversationId: id }),

      reset: () =>
        set({
          conversations: [],
          messages: {},
          activeConversationId: null,
          convoLoading: false,
          messageLoading: false,
        }),

      fetchConversations: async () => {
        try {
          set({ convoLoading: true });
          const { conversations } = await chatService.fetchConversations();
          const deduped = deduplicateDirectConversations(conversations);

          set({ 
            conversations: deduped.filter(filterValidConversations), 
            convoLoading: false 
          });
        } catch (error) {
          console.error("Failed to fetch conversations", error);
          set({ convoLoading: false });
        }
      },

      fetchMessages: async (conversationId) => {
        const { activeConversationId, messages } = get();
        const { user } = useAuthStore.getState();
        const convoId = conversationId ?? activeConversationId;

        if (!convoId) return;

        const current = messages[convoId];
        
        // null cursor means no more pages
        if (current?.nextCursor === null) return;
        
        const nextCursor = current?.nextCursor || "";

        set({ messageLoading: true });

        try {
          const { messages: fetched, cursor } =
            await chatService.fetchMessages(convoId, nextCursor);

          const processed = fetched.map((m) => ({
            ...m,
            isOwn: m.senderId === user?._id,
          }));

          set((state) => {
            const prev = state.messages[convoId]?.items ?? [];
            
            // Deduplicate to prevent double-appending in React Strict Mode
            const newMessages = processed.filter(
              (p) => !prev.some((pr) => pr._id === p._id)
            );

            const merged =
              prev.length > 0 ? [...newMessages, ...prev] : newMessages;

            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: merged,
                  hasMore: !!cursor,
                  nextCursor: cursor ?? null,
                },
              },
            };
          });
        } catch (error) {
          console.error("Error when calling fetchMessages in store", error);
        } finally {
          set({ messageLoading: false });
        }
      },

      markAsSeen: async () => {
        try {
          const { user } = useAuthStore.getState();
          const { activeConversationId, conversations } = get();

          if (!activeConversationId || !user) return;

          const convo = conversations.find(
            (c) => c._id === activeConversationId
          );
          
          if (!convo || (convo.unreadCounts?.[user._id] ?? 0) === 0) return;

          await chatService.markAsSeen(activeConversationId);

          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === activeConversationId
                ? { ...c, unreadCounts: { ...c.unreadCounts, [user._id]: 0 } }
                : c
            ),
          }));
        } catch (error) {
          console.error("Error when calling markAsSeen in store", error);
        }
      },

      sendDirectMessage: async (recipientId, content, imgUrl) => {
        const { activeConversationId } = get();
        const { user } = useAuthStore.getState();

        if (!user) return;

        try {
          const savedMessage = await chatService.sendDirectMessage(
            recipientId,
            content,
            imgUrl,
            activeConversationId || undefined
          );

          const convoId = activeConversationId ?? savedMessage.conversationId;
          if (!convoId) return;

          set((state) => updateMessageState(state, savedMessage, convoId, user));
        } catch (error) {
          console.error("Error when calling sendDirectMessage in store", error);
        }
      },

      sendGroupMessage: async (conversationId, content, imgUrl) => {
        const { user } = useAuthStore.getState();

        if (!user) return;

        try {
          const savedMessage = await chatService.sendGroupMessage(
            conversationId,
            content,
            imgUrl
          );

          set((state) => updateMessageState(state, savedMessage, conversationId, user));
        } catch (error) {
          console.error("Error when calling sendGroupMessage in store", error);
        }
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({
        conversations: state.conversations.filter(filterValidConversations),
      }),
    }
  )
);
