// Test script for AI Summary functionality
const testConversations = {
  projectPlanning: [
    { author: "Alice", body: "Hey team, let's discuss the new project requirements" },
    { author: "Bob", body: "Sure! I think we need to focus on the user authentication first" },
    { author: "Charlie", body: "Agreed. We should also consider the database schema" },
    { author: "Alice", body: "Great points. Let's assign tasks: Bob handles auth, Charlie does DB design" },
    { author: "Bob", body: "Sounds good! I'll start working on it today" },
    { author: "Charlie", body: "Perfect. I'll have the schema ready by Friday" }
  ],
  
  bugReport: [
    { author: "Sarah", body: "Found a critical bug in the payment system" },
    { author: "Mike", body: "What's the issue exactly?" },
    { author: "Sarah", body: "Users can't complete checkout, getting 500 errors" },
    { author: "Mike", body: "I'll investigate immediately. Can you share the error logs?" },
    { author: "Sarah", body: "Sent them via email. Priority fix needed!" }
  ],
  
  meetingNotes: [
    { author: "Tom", body: "Sprint review went well today" },
    { author: "Lisa", body: "Yes, we completed 8 out of 10 story points" },
    { author: "Tom", body: "The remaining 2 stories will move to next sprint" },
    { author: "Lisa", body: "Agreed. Let's schedule retrospective for tomorrow" },
    { author: "Tom", body: "Perfect, I'll book the conference room" }
  ]
};

const buildSummaryPrompt = (messages, contextType) => {
  const participants = [...new Set(messages.map(m => m.author))];
  const messageText = messages
    .map(m => `${m.author}: ${m.body}`)
    .join('\n');

  const prompt = `
You are a professional meeting summarizer. Analyze this conversation and create a structured summary.

Participants: ${participants.join(', ')}
Total Messages: ${messages.length}
${contextType === 'thread' ? 'Thread' : 'Channel'} Discussion:

Conversation:
${messageText}

Create a summary with exactly this format:

**Key Discussion Points**:
• [Most important topic discussed]
• [Second most important topic]
• [Third topic if applicable]

**Decisions Made**:
• [Any concrete decisions or write "None identified"]

**Action Items**:
• [Specific tasks with person responsible or write "None identified"]

**Next Steps**:
• [Planned follow-ups or write "None identified"]

Keep it concise and professional.
`;
return prompt.trim();
};

const callTinyLlama = async (prompt) => {
  console.log('prompt:', prompt)
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:3b', 
        prompt: prompt,
        stream: false,
         options: {
          temperature: 0.2,
          top_p: 0.9,           
          top_k: 40,            
          repeat_penalty: 1.1,  
          num_predict: 500,     
          stop: ['\n---', 'END', "**Next Steps**:", "\n\n\n"]
        }
      })
    });
    console.log('response:', response)

    if (!response.ok) {
      throw new Error(`llama3.2:3b API error: ${response.status}`);
    }

    const result = await response.json();
    return result.response;
  } catch (error) {
    console.error('llama3.2:3b API call failed:', error);
    throw new Error('AI service temporarily unavailable');
  }
};

async function testSummaryGeneration(conversationName, messages) {
  const startTime = Date.now();
  
  try {
    const prompt = buildSummaryPrompt(messages, 'channel');
    const summary = await callTinyLlama(prompt);
    const responseTime = Date.now() - startTime;
    
    // Check if summary contains expected sections
    const hasParticipants = summary.includes('**Participants**');
    const hasKeyPoints = summary.includes('**Key Discussion Points**');
    const hasDecisions = summary.includes('**Decisions Made**');
    const hasActionItems = summary.includes('**Action Items**');
    const hasNextSteps = summary.includes('**Next Steps**');
    
    const isValid = hasParticipants && hasKeyPoints && hasDecisions && hasActionItems && hasNextSteps;
    
    console.log(`\n🤖 Testing ${conversationName}:`);
    console.log(`Messages: ${messages.length}`);
    console.log(`Participants: ${[...new Set(messages.map(m => m.author))].join(', ')}`);
    
    if (isValid) {
      console.log('✅ Summary structure: VALID');
      console.log(`⚡ Response time: ${responseTime}ms`);
      console.log('📝 Generated summary:');
      console.log('─'.repeat(50));
      console.log(summary);
      console.log('─'.repeat(50));
      console.log('Result: ✅ PASS');
    } else {
      console.log('❌ Summary structure: INVALID');
      console.log('Missing sections:', {
        participants: !hasParticipants,
        keyPoints: !hasKeyPoints,
        decisions: !hasDecisions,
        actionItems: !hasActionItems,
        nextSteps: !hasNextSteps
      });
      console.log('Raw summary:', summary);
      console.log('Result: ❌ FAIL');
    }

    return { success: true, isValid, responseTime, summary };

  } catch (error) {
    console.log(`\n❌ ERROR testing ${conversationName}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runSummaryTests() {
  console.log('📋 Testing AI Summary Generation\n');
  
  const results = [];
  let passCount = 0;
  
  for (const [conversationName, messages] of Object.entries(testConversations)) {
    const result = await testSummaryGeneration(conversationName, messages);
    
    if (result.success && result.isValid) {
      passCount++;
    }
    
    results.push({ conversationName, ...result });
    
    // Wait between requests to avoid overwhelming llama3.2:3b
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n📊 Results: ${passCount}/${results.length} tests passed`);
  
  if (results.length > 0) {
    const avgTime = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.responseTime, 0) / results.filter(r => r.success).length;
    console.log(`⚡ Average response time: ${avgTime.toFixed(2)}ms`);
  }
  
  console.log('\n🎉 AI Summary testing complete!');
}

runSummaryTests().catch(console.error); 