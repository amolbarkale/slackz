import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Query to aggregate messages for summary
export const aggregateMessages = query({
  args: {
    workspaceId: v.id("workspaces"),
    channelId: v.optional(v.id("channels")),
    threadId: v.optional(v.id("messages")),
    conversationId: v.optional(v.id("conversations")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 500; // Max 500 messages
    
    let messages;
    
    if (args.threadId) {
      // Get thread messages (replies to a specific message)
      messages = await ctx.db
        .query("messages")
        .withIndex("by_parent_message_id", (q) => q.eq("parentMessageId", args.threadId))
        .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
        .order("desc")
        .take(limit);
      
      // Also get the parent message
      const parentMessage = await ctx.db.get(args.threadId);
      if (parentMessage) {
        messages = [parentMessage, ...messages.reverse()];
      }
    } else if (args.channelId) {
      // Get channel messages (no parent message)
      messages = await ctx.db
        .query("messages")
        .withIndex("by_channel_id", (q) => q.eq("channelId", args.channelId))
        .filter((q) => 
          q.and(
            q.eq(q.field("workspaceId"), args.workspaceId),
            q.eq(q.field("parentMessageId"), undefined)
          )
        )
        .order("desc")
        .take(limit);
      
      messages = messages.reverse();
    } else if (args.conversationId) {
      // Get conversation messages (including thread replies for DMs)
      messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation_id", (q) => q.eq("conversationId", args.conversationId))
        .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
        .order("desc")
        .take(limit);
      
      messages = messages.reverse();
    } else {
      return [];
    }

    // Enrich messages with user information
    const enrichedMessages = await Promise.all(
      messages.map(async (message) => {
        const member = await ctx.db.get(message.memberId);
        const user = member ? await ctx.db.get(member.userId) : null;
        
        return {
          id: message._id,
          body: message.body,
          createdAt: message._creationTime,
          author: user?.name || "Unknown User",
          memberId: message.memberId,
        };
      })
    );

    return enrichedMessages;
  },
});

// Mutation to save summary
export const saveSummary = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    contextType: v.union(v.literal("thread"), v.literal("channel"), v.literal("conversation")),
    contextId: v.string(),
    summary: v.string(),
    messageCount: v.number(),
    participantCount: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify user authentication
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Verify user is member of workspace
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", userId)
      )
      .unique();
      
    if (!member) {
      throw new Error("Unauthorized - not a member of this workspace");
    }

    // Check if summary already exists and update or create
    const existing = await ctx.db
      .query("summaries")
      .withIndex("by_context", (q) =>
        q.eq("workspaceId", args.workspaceId)
         .eq("contextType", args.contextType)
         .eq("contextId", args.contextId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        summary: args.summary,
        messageCount: args.messageCount,
        participantCount: args.participantCount,
        generatedBy: member._id,
        generatedAt: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("summaries", {
        workspaceId: args.workspaceId,
        contextType: args.contextType,
        contextId: args.contextId,
        summary: args.summary,
        messageCount: args.messageCount,
        participantCount: args.participantCount,
        generatedBy: member._id,
        generatedAt: Date.now(),
      });
    }
  },
});

// Query to get existing summary
export const getSummary = query({
  args: {
    workspaceId: v.id("workspaces"),
    contextType: v.union(v.literal("thread"), v.literal("channel"), v.literal("conversation")),
    contextId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("summaries")
      .withIndex("by_context", (q) =>
        q.eq("workspaceId", args.workspaceId)
         .eq("contextType", args.contextType)
         .eq("contextId", args.contextId)
      )
      .unique();
  },
}); 