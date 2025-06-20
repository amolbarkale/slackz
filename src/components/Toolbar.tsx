import { MessageSquareTextIcon, Pencil, Smile, Trash, Bot, FileText } from "lucide-react";

import { Button } from "./ui/button";
import { Hint } from "./Hint";
import { EmojiPopover } from "./EmojiPopover";

interface ToolbarProps {
  isAuthor: boolean;
  isPending: boolean;
  hideThreadButton?: boolean;
  onEdit: () => void;
  onThread: () => void;
  onDelete: () => void;
  onReaction: (value: string) => void;
  onAIResponse?: () => void;
  onCreateSummary?: () => void;
}

export const Toolbar = ({
  isAuthor,
  isPending,
  hideThreadButton,
  onDelete,
  onEdit,
  onReaction,
  onThread,
  onAIResponse,
  onCreateSummary,
}: ToolbarProps) => {
  return (
    <div className="absolute top-0 right-5">
      <div className="group-hover:opacity-100 opacity-0 transition-opacity border bg-white rounded-md shadow-sm">
        <EmojiPopover
          hint="Add reaction"
          onEmojiSelect={(emoji) => onReaction(emoji)}
        >
          <Button size="iconSm" variant="ghost" disabled={isPending}>
            <Smile className="size-4" />
          </Button>
        </EmojiPopover>
        {onAIResponse && (
          <Hint label="Ask AI to respond">
            <Button
              size="icon"
              variant="ghost"
              disabled={isPending}
              onClick={onAIResponse}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Bot className="size-4" />
            </Button>
          </Hint>
        )}
        {onCreateSummary && (
          <Hint label="Create AI Summary">
            <Button
              size="icon"
              variant="ghost"
              disabled={isPending}
              onClick={onCreateSummary}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <FileText className="size-4" />
            </Button>
          </Hint>
        )}
        {!hideThreadButton && (
          <Hint label="Reply in thread">
            <Button
              size="iconSm"
              variant="ghost"
              disabled={isPending}
              onClick={onThread}
            >
              <MessageSquareTextIcon className="size-4" />
            </Button>
          </Hint>
        )}
        {isAuthor && (
          <Hint label="Edit message">
            <Button
              size="iconSm"
              variant="ghost"
              disabled={isPending}
              onClick={onEdit}
            >
              <Pencil className="size-4" />
            </Button>
          </Hint>
        )}
        {isAuthor && (
          <Hint label="Delete message">
            <Button
              size="iconSm"
              variant="ghost"
              disabled={isPending}
              onClick={onDelete}
            >
              <Trash className="size-4" />
            </Button>
          </Hint>
        )}
      </div>
    </div>
  );
};
