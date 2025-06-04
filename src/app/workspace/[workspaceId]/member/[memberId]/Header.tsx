import { FaChevronDown } from "react-icons/fa";
import { FileText } from "lucide-react";
import { useState } from "react";
import { useConvex } from "convex/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { generateConversationSummary } from "@/lib/ai-summary";
import { AISummaryModal } from "@/components/AISummaryModal";
import { useWorkspaceId } from "@/hooks/useWorkspaceId";

interface HeaderProps {
  memberName?: string;
  memberImage?: string;
  onClick?: () => void;
  conversationId?: string;
}

export const Header = ({
  memberImage,
  memberName = "Member",
  onClick,
  conversationId,
}: HeaderProps) => {
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const convex = useConvex();
  const workspaceId = useWorkspaceId();

  // Handle summary generation
  const handleCreateSummary = async (): Promise<string> => {
    if (!conversationId) {
      throw new Error("Conversation ID is required for summary generation");
    }
    return await generateConversationSummary(convex, workspaceId, conversationId);
  };

  return (
    <>
      <div className="bg-white border-b h-[49px] flex items-center px-4 overflow-hidden">
        <Button
          variant="ghost"
          size="sm"
          className="text-lg font-semibold px-2 overflow-hidden w-auto"
          onClick={onClick}
        >
          <Avatar className="size-6 mr-2">
            <AvatarImage src={memberImage} />
            <AvatarFallback>{memberName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="truncate">{memberName}</span>
          <FaChevronDown className="size-2.5 ml-2" />
        </Button>
        
        {/* AI Summary Button */}
        {conversationId && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => setIsSummaryModalOpen(true)}
          >
            <FileText className="size-4 mr-2" />
            AI Summary
          </Button>
        )}
      </div>
      
      <AISummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        onGenerate={handleCreateSummary}
        title="Conversation Summary"
      />
    </>
  );
};
