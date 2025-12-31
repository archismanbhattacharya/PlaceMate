import fs from 'fs';
import path from 'path';

async function listModels() {
    let apiKey = '';
    try {
        const envContent = fs.readFileSync(path.resolve('.env'), 'utf8');
        const match = envContent.match(/=(AIza[a-zA-Z0-9_-]+)/);
        if (match && match[1]) apiKey = match[1];
        else {
            const varMatch = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
            if (varMatch) apiKey = varMatch[1].trim();
        }
    } catch (e) { console.log(e.message); return; }

    if (!apiKey) { console.log("No key"); return; }

    console.log("Fetching models with key: " + apiKey.substring(0, 10) + "...");

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            console.error("API Error:", data.error);
        } else if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                if (m.name.includes("gemini")) console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
            });
        } else {
            console.log("No models found or unexpected format:", data);
        }
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

listModels();
