import { useCallback, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface UseGenerateAIResponseProps {
  workspaceId: Id<"workspaces">;
  channelId?: Id<"channels">;
  conversationId?: Id<"conversations">;
  parentMessageId?: Id<"messages">;
}

export const useGenerateAIResponse = ({
  workspaceId,
  channelId,
  conversationId,
  parentMessageId,
}: UseGenerateAIResponseProps) => {
  const [isPending, setIsPending] = useState(false);
  
  const generateAIResponse = useAction(api.ai.generateAIResponse);

  const mutate = useCallback(
    async (contextMessageId: Id<"messages">) => {
      setIsPending(true);
      try {
        await generateAIResponse({
          workspaceId,
          channelId,
          conversationId,
          parentMessageId,
          contextMessageId,
        });
      } catch (error) {
        console.error("Failed to generate AI response:", error);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [generateAIResponse, workspaceId, channelId, conversationId, parentMessageId]
  );

  return { mutate, isPending };
}; 