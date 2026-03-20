async function testDashscope(apiKey) {
    try {
        const res = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'qwen-turbo',
                input: { messages: [{ role: 'user', content: 'hello' }] }
            })
        });
        const data = await res.json();
        if (data.code || data.message) {
            return { valid: false, error: data.message || data.code };
        }
        return { valid: true };
    } catch (e) {
        return { valid: false, error: e.message };
    }
}

async function testQianfan(ak, sk) {
    try {
        const res = await fetch(`https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${ak}&client_secret=${sk}`);
        const data = await res.json();
        if (data.error) {
            return { valid: false, error: data.error_description || data.error };
        }
        return { valid: true };
    } catch (e) {
        return { valid: false, error: e.message };
    }
}

async function testGoogle(apiKey) {
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
        });
        const data = await res.json();
        if (data.error) {
            return { valid: false, error: data.error.message };
        }
        return { valid: true };
    } catch (e) {
        return { valid: false, error: e.message };
    }
}

async function main() {
    console.log("=== API Key 检查结果 ===");
    
    console.log("\n1. 检查 Alibaba Dashscope...");
    const dsRes = await testDashscope('sk-b2e89f9ed380433e9ac95dd57ec96303');
    console.log(dsRes.valid ? "✅ 有效 (可以使用)" : `❌ 无效/错误: ${dsRes.error}`);

    console.log("\n2. 检查 Baidu Qianfan...");
    const qfRes = await testQianfan('ALTAK-09YIb2aC3I8xDeuf1Ow03', 'dd1ef0e80b0c552208460734caad20630faf2a55');
    console.log(qfRes.valid ? "✅ 有效 (可以使用)" : `❌ 无效/错误: ${qfRes.error}`);

    console.log("\n3. 检查 Google API Key...");
    const gRes = await testGoogle('AIzaSyD-NtybPtLVIBdZoNQ4x66sgH-oWuUAkPM');
    console.log(gRes.valid ? "✅ 有效 (可以使用)" : `❌ 无效/错误: ${gRes.error}`);
}

main();
