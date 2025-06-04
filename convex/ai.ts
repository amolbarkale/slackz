import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { internal } from "./_generated/api";

export const generateAISuggestions = action({
  args: {
    workspaceId: v.id("workspaces"),
    channelId: v.optional(v.id("channels")),
    conversationId: v.optional(v.id("conversations")),
    parentMessageId: v.optional(v.id("messages")),
    contextMessageId: v.id("messages"), // The message to respond to
  },
  handler: async (ctx, args): Promise<string[]> => {
    const apiKey = process.env.GEMINI_API_KEY;
          
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable not found. Please set it in the Convex dashboard.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Get conversation context using internal query
    const contextData = await ctx.runQuery(internal.messages.getConversationContext, {
      channelId: args.channelId,
      conversationId: args.conversationId,
      parentMessageId: args.parentMessageId,
      contextMessageId: args.contextMessageId,
    });

    // Generate AI suggestions using Google Gemini
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

      const prompt = `You are a helpful AI assistant in a Slack-like workspace chat. Generate exactly 3 different reply suggestions for the user.

Context of recent conversation:
${contextData.conversationContext.map((msg: { author: string; content: string }) => `${msg.author}: ${msg.content}`).join('\n')}

The user ${contextData.targetUser?.name || "Unknown"} just said: "${contextData.targetMessage.body}"

Generate exactly 3 different reply options that are:
- Clear and concise (max 2 sentences each)
- Professional but conversational
- Contextually appropriate
- Different in tone/approach (e.g., one informative, one questioning, one supportive)

Return ONLY a JSON array of 3 strings, no other text:
["suggestion 1", "suggestion 2", "suggestion 3"]`;

      const result = await model.generateContent(prompt);
      let aiResponse = result.response.text().trim();
      console.log('aiResponse:', aiResponse)
      
      // Clean up the response to extract JSON
      aiResponse = aiResponse.replace(/```json\s*/, "").replace(/```/g, "").trim();
      console.log('aiResponse:', aiResponse)
      
      try {
        const suggestions = JSON.parse(aiResponse);
        console.log('suggestions:', suggestions)
        if (Array.isArray(suggestions) && suggestions.length === 3) {
          return suggestions;
        } else {
          // Fallback if JSON parsing fails
          return [
            "Thanks for sharing that!",
            "Could you tell me more about this?",
            "That's interesting. What's your next step?"
          ];
        }
      } catch (parseError) {
        console.error("Failed to parse AI suggestions:", parseError);
        // Fallback suggestions
        return [
          "Thanks for the update!",
          "How can I help with this?",
          "Let me know if you need any assistance."
        ];
      }
    } catch (error) {
      console.error("AI Suggestions Error:", error);
      throw new Error("Failed to generate AI suggestions");
    }
  },
}); 