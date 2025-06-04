import { useMutation as useReactQueryMutation } from "@tanstack/react-query";
import { useAction } from "convex/react";

import { api } from "../../../../convex/_generated/api";

export const useGenerateAIResponse = () => {
  const action = useAction(api.ai.generateAISuggestions);

  const generateAIResponse = useReactQueryMutation({
    mutationFn: action,
  });

  return generateAIResponse;
}; 