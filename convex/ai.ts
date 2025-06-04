import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const generateAIResponse = action({
  args: {
    workspaceId: v.id("workspaces"),
    channelId: v.optional(v.id("channels")),
    conversationId: v.optional(v.id("conversations")),
    parentMessageId: v.optional(v.id("messages")),
    contextMessageId: v.id("messages"), // The message to respond to
  },
  handler: async (ctx, args): Promise<Id<"messages">> => {
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

    // Generate AI response using Google Gemini (this is why we need an action - for HTTP requests)
    try {
      console.log('genAI initialized successfully');
      
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

      const prompt = `You are a helpful AI assistant in a Slack-like workspace chat. 

Context of recent conversation:
${contextData.conversationContext.map((msg: { author: string; content: string }) => `${msg.author}: ${msg.content}`).join('\n')}

The user ${contextData.targetUser?.name || "Unknown"} just said: "${contextData.targetMessage.body}"

Please provide a helpful, concise, and contextually appropriate response. Keep it conversational and professional. If the message is a question, try to answer it. If it's a statement, provide a thoughtful response or ask a follow-up question.`;

      const result = await model.generateContent(prompt);
      const aiResponse = result.response.text();

      // Create AI response message using internal mutation
      const messageId: Id<"messages"> = await ctx.runMutation(internal.messages.createAIMessage, {
        aiResponse,
        workspaceId: args.workspaceId,
        channelId: args.channelId,
        conversationId: args.conversationId,
        parentMessageId: args.parentMessageId,
      });

      return messageId;
    } catch (error) {
      console.error("AI Response Error:", error);
      throw new Error("Failed to generate AI response");
    }
  },
}); 