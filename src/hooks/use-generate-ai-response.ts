import { useCallback, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface UseGenerateAISuggestionsProps {
  workspaceId: Id<"workspaces">;
  channelId?: Id<"channels">;
  conversationId?: Id<"conversations">;
  parentMessageId?: Id<"messages">;
}

export const useGenerateAISuggestions = ({
  workspaceId,
  channelId,
  conversationId,
  parentMessageId,
}: UseGenerateAISuggestionsProps) => {
  const [isPending, setIsPending] = useState(false);
  
  const generateAISuggestions = useAction(api.ai.generateAISuggestions);

  const mutate = useCallback(
    async (contextMessageId: Id<"messages">): Promise<string[]> => {
      setIsPending(true);
      try {
        const suggestions = await generateAISuggestions({
          workspaceId,
          channelId,
          conversationId,
          parentMessageId,
          contextMessageId,
        });
        return suggestions;
      } catch (error) {
        console.error("Failed to generate AI suggestions:", error);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [generateAISuggestions, workspaceId, channelId, conversationId, parentMessageId]
  );

  return { mutate, isPending };
}; 