/**
 * Simple test script to verify Gemini API key
 * Run: node test-gemini-api.js
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_KEY_HERE';

// Try different model names
const MODELS_TO_TEST = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
];

async function testModel(modelName) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

    console.log(`\n🧪 Testing model: ${modelName}`);
    console.log(`URL: ${url.replace(GEMINI_API_KEY, 'REDACTED')}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: 'user', parts: [{ text: 'Hello, test message' }] }
                ]
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ SUCCESS! Model works.');
            console.log('Response:', data.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 100));
            return true;
        } else {
            const errorText = await response.text();
            console.log(`❌ FAILED: ${response.status}`);
            console.log('Error:', errorText.substring(0, 200));
            return false;
        }
    } catch (err) {
        console.log('❌ FETCH ERROR:', err.message);
        return false;
    }
}

async function main() {
    console.log('═══════════════════════════════════════');
    console.log('  Gemini API Key Test');
    console.log('═══════════════════════════════════════');
    console.log('API Key:', GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : 'NOT SET');

    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_KEY_HERE') {
        console.log('\n❌ No API key found!');
        console.log('Run: GEMINI_API_KEY=your_key node test-gemini-api.js');
        process.exit(1);
    }

    for (const model of MODELS_TO_TEST) {
        const success = await testModel(model);
        if (success) {
            console.log(`\n✅ RECOMMENDED MODEL: ${model}`);
            console.log(`Update api/gemini/chat.js line 14 to use this model.`);
            break;
        }
    }

    console.log('\n═══════════════════════════════════════');
}

main();
