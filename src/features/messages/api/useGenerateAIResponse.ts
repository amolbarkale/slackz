import { useMutation as useReactQueryMutation } from "@tanstack/react-query";
import { useMutation as useConvexMutation } from "convex/react";

import { api } from "../../../../convex/_generated/api";

export const useGenerateAIResponse = () => {
  const mutation = useConvexMutation(api.messages.generateAIResponse);

  const generateAIResponse = useReactQueryMutation({
    mutationFn: mutation,
  });

  return generateAIResponse;
}; 