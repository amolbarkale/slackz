// AI Summary utility for client-side processing
import { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";

// Helper function to extract text from Quill JSON format
const extractTextFromQuillJson = (body: string): string => {
  try {
    const parsed = JSON.parse(body);
    if (parsed.ops && Array.isArray(parsed.ops)) {
      return parsed.ops
        .map((op: any) => {
          if (typeof op.insert === 'string') {
            return op.insert;
          }
          return '';
        })
        .join('')
        .trim();
    }
    return body;
  } catch {
    // If it's not JSON, return as is
    return body;
  }
};

// Helper function to build summary prompt
const buildSummaryPrompt = (messages: any[], contextType: string) => {
  const participants = Array.from(new Set(messages.map(m => m.author)));
  const messageText = messages
  .map(m => `${m.author}: ${extractTextFromQuillJson(m.body)}`)
  .join('\n');

  return `You are an AI assistant that creates structured summaries of ${contextType} conversations in a Slack-like workspace.

Conversation Context:
Participants: ${participants.join(', ')}
Total Messages: ${messages.length}
${contextType === 'thread' ? 'Thread' : contextType === 'conversation' ? 'Direct Message' : 'Channel'} Discussion:

    ${messageText}

Please create a structured summary with the following sections:

**Participants**: List all participants who contributed to the discussion

**Key Discussion Points**: 
• Main topics discussed (3-5 bullet points)

**Decisions Made**:
• Any concrete decisions or agreements reached

    **Action Items**:
• Tasks assigned or next steps identified
• Include who is responsible if mentioned

    **Next Steps**:
• Planned follow-ups or future actions

Keep the summary concise but comprehensive. Use bullet points for clarity. If no decisions or action items were made, state "None identified" for those sections.`;
};

// Helper function to call TinyLlama
const callTinyLlama = async (prompt: string) => {
  try {
    console.log('prompt:', prompt)
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'tinyllama',
        prompt: prompt,
        stream: false,
       options: {
          temperature: 0.3, // More focused responses
          max_tokens: 800,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`TinyLlama API error: ${response.status}`);
    }

    const result = await response.json();
    return result.response;
    console.log('result.response:', result.response)
  } catch (error) {
    console.error('TinyLlama API call failed:', error);
    throw new Error('AI service temporarily unavailable');
  }
};

// Helper function to generate fallback summary
const generateFallbackSummary = (messages: any[], contextType: string) => {
  const participants = Array.from(new Set(messages.map(m => m.author)));
  const timeRange = messages.length > 0 
    ? `${new Date(messages[0].createdAt).toLocaleString()} - ${new Date(messages[messages.length - 1].createdAt).toLocaleString()}`
    : 'No messages';

  return `**AI Summary Generation Failed**

**Participants**: ${participants.join(', ')}

**Message Count**: ${messages.length} messages

**Time Range**: ${timeRange}

**Status**: AI summarization temporarily unavailable. Please try again later.

**Key Discussion Points**: 
• Unable to analyze due to AI service unavailability

**Decisions Made**: Unable to determine

**Action Items**: Unable to extract

**Next Steps**: Please retry summary generation when AI service is restored.`;
};

// Main function to generate thread summary
export const generateThreadSummary = async (
  convex: ConvexReactClient,
  workspaceId: string,
  threadId: string
): Promise<string> => {
  try {
    // Aggregate messages from thread
    const messages = await convex.query(api.aiSummary.aggregateMessages, {
      workspaceId: workspaceId as any,
      threadId: threadId as any,
      limit: 500,
    });

    if (messages.length === 0) {
      return "**Thread Summary**\n\nNo messages found in this thread.";
    }

    // Build prompt and call TinyLlama
    const prompt = buildSummaryPrompt(messages, 'thread');
    const summary = await callTinyLlama(prompt);

    // Save summary to database
    await convex.mutation(api.aiSummary.saveSummary, {
      workspaceId: workspaceId as any,
      contextType: "thread",
      contextId: threadId,
      summary,
      messageCount: messages.length,
      participantCount: new Set(messages.map(m => m.author)).size,
    });

    return summary;
  } catch (error) {
    console.error('Thread summary generation failed:', error);
    
    // Generate fallback summary
    try {
      const messages = await convex.query(api.aiSummary.aggregateMessages, {
        workspaceId: workspaceId as any,
        threadId: threadId as any,
        limit: 500,
      });
      
      return generateFallbackSummary(messages, 'thread');
    } catch {
      return "**Error**: Unable to generate summary. Please try again later.";
    }
  }
};

// Main function to generate channel summary
export const generateChannelSummary = async (
  convex: ConvexReactClient,
  workspaceId: string,
  channelId: string
): Promise<string> => {
  try {
    // Aggregate messages from channel
    const messages = await convex.query(api.aiSummary.aggregateMessages, {
      workspaceId: workspaceId as any,
      channelId: channelId as any,
      limit: 500,
    });

    if (messages.length === 0) {
      return "**Channel Summary**\n\nNo messages found in this channel.";
    }

    // Build prompt and call TinyLlama
    const prompt = buildSummaryPrompt(messages, 'channel');
    const summary = await callTinyLlama(prompt);

    // Save summary to database
    await convex.mutation(api.aiSummary.saveSummary, {
      workspaceId: workspaceId as any,
      contextType: "channel",
      contextId: channelId,
      summary,
      messageCount: messages.length,
      participantCount: new Set(messages.map(m => m.author)).size,
    });

    return summary;
  } catch (error) {
    console.error('Channel summary generation failed:', error);
    
    // Generate fallback summary
    try {
      const messages = await convex.query(api.aiSummary.aggregateMessages, {
        workspaceId: workspaceId as any,
        channelId: channelId as any,
        limit: 500,
      });
      
      return generateFallbackSummary(messages, 'channel');
    } catch {
      return "**Error**: Unable to generate summary. Please try again later.";
    }
  }
};

// Main function to generate conversation summary (for direct messages)
export const generateConversationSummary = async (
  convex: ConvexReactClient,
  workspaceId: string,
  conversationId: string
): Promise<string> => {
  try {
    // Aggregate messages from conversation (including thread replies)
    const messages = await convex.query(api.aiSummary.aggregateMessages, {
      workspaceId: workspaceId as any,
      conversationId: conversationId as any,
      limit: 500,
    });

    if (messages.length === 0) {
      return "**Conversation Summary**\n\nNo messages found in this conversation.";
    }

    // Build prompt and call TinyLlama
    const prompt = buildSummaryPrompt(messages, 'conversation');
    const summary = await callTinyLlama(prompt);

    // Save summary to database
    await convex.mutation(api.aiSummary.saveSummary, {
      workspaceId: workspaceId as any,
      contextType: "conversation",
      contextId: conversationId,
      summary,
      messageCount: messages.length,
      participantCount: Array.from(new Set(messages.map(m => m.author))).length,
    });

    return summary;
  } catch (error) {
    console.error('Conversation summary generation failed:', error);
    
    // Generate fallback summary
    try {
      const messages = await convex.query(api.aiSummary.aggregateMessages, {
        workspaceId: workspaceId as any,
        conversationId: conversationId as any,
        limit: 500,
      });
      
      return generateFallbackSummary(messages, 'conversation');
    } catch {
      return "**Error**: Unable to generate summary. Please try again later.";
    }
  }
}; 