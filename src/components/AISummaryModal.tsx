import { Loader, FileText } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface AISummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => Promise<string>;
  title: string;
}

export const AISummaryModal = ({
  isOpen,
  onClose,
  onGenerate,
  title,
}: AISummaryModalProps) => {
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const result = await onGenerate();
      setSummary(result);
      setHasGenerated(true);
    } catch (error) {
      console.error("Failed to generate summary:", error);
      setSummary("**Error**: Failed to generate summary. Please try again later.");
      setHasGenerated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSummary("");
    setHasGenerated(false);
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {!hasGenerated && !isLoading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <FileText className="size-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                Generate an AI summary of this conversation to quickly understand key points, decisions, and action items.
              </p>
              <Button onClick={handleGenerate} className="mt-4">
                Generate Summary
              </Button>
            </div>
          )}
          
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader className="size-8 animate-spin text-blue-600" />
              <p className="text-center text-muted-foreground">
                Analyzing conversation and generating summary...
              </p>
              <p className="text-xs text-center text-muted-foreground">
                This may take up to 30 seconds
              </p>
            </div>
          )}
          
          {hasGenerated && summary && (
            <div className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {summary.split('\n').map((line, index) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return (
                        <h3 key={index} className="font-semibold text-base mt-4 mb-2 text-gray-900">
                          {line.replace(/\*\*/g, '')}
                        </h3>
                      );
                    }
                    if (line.startsWith('• ')) {
                      return (
                        <li key={index} className="ml-4 mb-1">
                          {line.substring(2)}
                        </li>
                      );
                    }
                    if (line.trim() === '') {
                      return <br key={index} />;
                    }
                    return (
                      <p key={index} className="mb-2">
                        {line}
                      </p>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={isLoading}
                >
                  Regenerate Summary
                </Button>
                <Button onClick={handleClose}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 