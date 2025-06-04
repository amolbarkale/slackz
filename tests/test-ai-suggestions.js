import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

const testConversations = {
  projectUpdate: {
    context: [
      { author: "Alice", content: "How's the new feature coming along?" },
      { author: "Bob", content: "Making good progress, should be ready by Friday" },
      { author: "Alice", content: "Great! Any blockers I should know about?" }
    ],
    targetMessage: { author: "Bob", content: "Actually, I'm running into some API rate limiting issues" }
  },
  
  problemReport: {
    context: [
      { author: "Sarah", content: "Users are reporting slow loading times" },
      { author: "Mike", content: "I'll check the server logs" },
      { author: "Sarah", content: "Thanks, it seems to be affecting the dashboard mostly" }
    ],
    targetMessage: { author: "Mike", content: "Found the issue - database query is taking 5+ seconds" }
  },
  
  meetingSchedule: {
    context: [
      { author: "Tom", content: "When should we schedule the sprint review?" },
      { author: "Lisa", content: "How about Thursday afternoon?" },
      { author: "Tom", content: "That works for me" }
    ],
    targetMessage: { author: "Lisa", content: "Perfect! I'll send out calendar invites for 2 PM" }
  }
};

async function testAISuggestions(conversationName, conversationData) {
  const startTime = Date.now();
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

    const prompt = `You are a helpful AI assistant in a Slack-like workspace chat. Generate exactly 3 different reply suggestions for the user.

Context of recent conversation:
${conversationData.context.map(msg => `${msg.author}: ${msg.content}`).join('\n')}

The user ${conversationData.targetMessage.author} just said: "${conversationData.targetMessage.content}"

Generate exactly 3 different reply options that are:
- Clear and concise (max 2 sentences each)
- Professional but conversational
- Contextually appropriate
- Different in tone/approach (e.g., one informative, one questioning, one supportive)

Return ONLY a JSON array of 3 strings, no other text:
["suggestion 1", "suggestion 2", "suggestion 3"]`;

    const result = await model.generateContent(prompt);
    let aiResponse = result.response.text().trim();
    
    // Clean up the response to extract JSON
    aiResponse = aiResponse.replace(/```json\s*/, "").replace(/```/g, "").trim();
    
    const suggestions = JSON.parse(aiResponse);
    const responseTime = Date.now() - startTime;
    
    const isValid = Array.isArray(suggestions) && 
                   suggestions.length === 3 && 
                   suggestions.every(s => typeof s === 'string' && s.length > 0);

    console.log(`\n🤖 Testing ${conversationName}:`);
    console.log(`Context: ${conversationData.context.length} messages`);
    console.log(`Target: "${conversationData.targetMessage.content}"`);
    
    if (isValid) {
      console.log('Generated suggestions:');
      suggestions.forEach((suggestion, index) => {
        console.log(`  ${index + 1}. ${suggestion}`);
      });
      console.log(`Response Time: ${responseTime}ms`);
      console.log('Result: ✅ PASS');
    } else {
      console.log('Result: ❌ FAIL - Invalid suggestions format');
      console.log('Raw response:', aiResponse);
    }

    return { success: true, isValid, responseTime, suggestions };

  } catch (error) {
    console.log(`\n❌ ERROR testing ${conversationName}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAISuggestionsTests() {
  console.log('💬 Testing AI Reply Suggestions\n');
  
  const results = [];
  let passCount = 0;
  
  for (const [conversationName, conversationData] of Object.entries(testConversations)) {
    const result = await testAISuggestions(conversationName, conversationData);
    
    if (result.success && result.isValid) {
      passCount++;
    }
    
    results.push({ conversationName, ...result });
    
    // Wait between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 Results: ${passCount}/${results.length} tests passed`);
  
  if (results.length > 0) {
    const avgTime = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.responseTime, 0) / results.filter(r => r.success).length;
    console.log(`⚡ Average response time: ${avgTime.toFixed(2)}ms`);
  }
}

runAISuggestionsTests().catch(console.error);