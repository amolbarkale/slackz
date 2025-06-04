import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

const testMessages = {
  aggressive: "This is completely unacceptable! You need to fix this immediately or there will be consequences!",
  friendly: "Hey team! Great work on the project. Looking forward to collaborating more!",
  weak: "Um, maybe we could possibly consider perhaps looking into this if it's not too much trouble?",
  confusing: "The thing with the stuff needs to be done by someone for the project thing.",
  neutral: "Please review the quarterly report and provide feedback by Friday.",
  urgent: "URGENT: Server is down! Need immediate assistance from DevOps team."
};

const expectedTones = {
  aggressive: { tone: "aggressive", impact: "high-impact" },
  friendly: { tone: "friendly", impact: "medium-impact" },
  weak: { tone: "weak", impact: "low-impact" },
  confusing: { tone: "confusing", impact: "low-impact" },
  neutral: { tone: "neutral", impact: "medium-impact" },
  urgent: { tone: "aggressive", impact: "high-impact" }
};

async function testToneAnalysis(message, messageType) {
  const startTime = Date.now();
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

    const systemPrompt = `
      You are a Tone & Impact Analyzer. 
      Given the user's draft message, classify its tone as one of: "aggressive", "weak", "confusing", "neutral", or "friendly".
      Then classify its impact as one of: "low-impact", "medium-impact", or "high-impact".
      Return ONLY this JSON:
      { "tone": "<tone>", "impact": "<impact>" }
    `.trim();

    const userPrompt = `Message: """${message.trim()}"""`;
    const prompt = `${systemPrompt}\n\n${userPrompt}`;
    console.log('prompt:', prompt)

    const result = await model.generateContent(prompt);
    let raw = result.response.text();
    console.log('raw:', raw)
    raw = raw.replace(/```json\s*/, "").replace(/```/g, "").trim();
    console.log('raw:', raw)

    const parsed = JSON.parse(raw);
    console.log('parsed:', parsed)
    const responseTime = Date.now() - startTime;
    console.log('responseTime:', responseTime)
    const expected = expectedTones[messageType];
    console.log('expected:', expected)
    
    const isCorrect = parsed.tone === expected.tone && parsed.impact === expected.impact;
    console.log('isCorrect:', isCorrect)

    console.log(`\n🧪 Testing ${messageType} message:`);
    console.log(`Message: "${message}"`);
    console.log(`Expected: ${expected.tone}, ${expected.impact}`);
    console.log(`Actual: ${parsed.tone}, ${parsed.impact}`);
    console.log(`Response Time: ${responseTime}ms`);
    console.log(`Result: ${isCorrect ? '✅ PASS' : '❌ FAIL'}`);

    return { success: true, isCorrect, responseTime };

  } catch (error) {
    console.log(`\n❌ ERROR testing ${messageType}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runToneTests() {
  console.log('🎯 Testing Tone & Impact Checker\n');
  
  const results = [];
  let passCount = 0;
  
  for (const [messageType, message] of Object.entries(testMessages)) {
    const result = await testToneAnalysis(message, messageType);
    
    if (result.success && result.isCorrect) {
      passCount++;
    }
    
    results.push({ messageType, ...result });
    
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

  console.log('Running tone checker tests...')
  runToneTests().catch(console.error);