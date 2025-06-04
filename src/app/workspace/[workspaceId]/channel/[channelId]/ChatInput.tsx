import dynamic from "next/dynamic";
import Quill from "quill";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { useCreateMessage } from "@/features/messages/api/useCreateMessage";
import { useGenerateAIResponse } from "@/features/messages/api/useGenerateAIResponse";
import { useGetMessages } from "@/features/messages/api/useGetMessages";
import { useGenerateUploadUrl } from "@/features/upload/api/useGenerateUploadUrl";
import { useChannelId } from "@/hooks/useChannelId";
import { useWorkspaceId } from "@/hooks/useWorkspaceId";
import { Id } from "../../../../../../convex/_generated/dataModel";

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

interface ChatInputProps {
  placeholder: string;
}

type CreateMessageValues = {
  channelId: Id<"channels">;
  workspaceId: Id<"workspaces">;
  body: string;
  image?: Id<"_storage">;
};

export const ChatInput = ({ placeholder }: ChatInputProps) => {
  const editorRef = useRef<Quill | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [isPending, setIsPending] = useState(false);

  const workspaceId = useWorkspaceId();
  const channelId = useChannelId();
  const createMessage = useCreateMessage();
  const generateAIResponse = useGenerateAIResponse();
  const generateUploadUrl = useGenerateUploadUrl();
  
  // Get recent messages for AI context
  const getMessages = useGetMessages({
    channelId,
  });

  const handleSubmit = async ({
    body,
    image,
  }: {
    body: string;
    image: File | null;
  }) => {
    try {
      setIsPending(true);
      editorRef.current?.enable(false);

      const values: CreateMessageValues = {
        body,
        workspaceId,
        channelId,
        image: undefined,
      };

      if (image) {
        const url = await generateUploadUrl.mutateAsync({});

        const result = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": image.type },
          body: image,
        });

        if (!result.ok) {
          throw new Error("Failed to upload image");
        }

        const { storageId } = await result.json();

        values.image = storageId;
      }
      await createMessage.mutateAsync(values);
      setEditorKey((prev) => prev + 1);
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsPending(false);
      editorRef.current?.enable(true);
    }
  };

  const handleSuggestReply = async () => {
    try {
      // Get the most recent message to respond to
      const recentMessages = getMessages.results;
      if (recentMessages.length === 0) {
        toast.error("No messages to respond to");
        return;
      }

      const lastMessage = recentMessages[0];
      
      // Generate AI response using the existing mutation
      await generateAIResponse.mutateAsync({
        workspaceId,
        channelId,
        contextMessageId: lastMessage._id,
      });

      toast.success("AI suggestion generated!");
    } catch (error) {
      console.error("Error generating AI suggestion:", error);
      toast.error("Failed to generate AI suggestion");
    }
  };

  return (
    <div className="px-5 w-full">
      <Editor
        key={editorKey}
        placeholder={placeholder}
        onSubmit={handleSubmit}
        disabled={isPending}
        innerRef={editorRef}
        showSuggestReply={getMessages.results.length > 0}
        onSuggestReply={handleSuggestReply}
      />
    </div>
  );
};
