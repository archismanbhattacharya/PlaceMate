import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

async function testKeys() {
    let apiKey = '';
    try {
        const envContent = fs.readFileSync(path.resolve('.env'), 'utf8');
        // Look for typical VITE_...=AIza... pattern or just the key
        const match = envContent.match(/=(AIza[a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            apiKey = match[1];
            console.log("Found API Key in .env");
        } else {
            // Fallback: try finding typical variable name
            const varMatch = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
            if (varMatch) apiKey = varMatch[1].trim();
        }
    } catch (e) {
        console.log("Could not read .env file: " + e.message);
    }

    if (!apiKey) {
        console.log("No API Key matching 'AIza...' found in .env");
        return;
    }

    console.log(`\nTesting Key from .env: ${apiKey.substring(0, 10)}...`);
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        console.log("Testing gemini-flash-latest...");
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent("Reply with 'Success'");
        console.log(`Success! Response: ${result.response.text()}`);
    } catch (error) {
        console.log(`Failed with gemini-flash-latest: ${error.message}`);
    }
}

testKeys();
