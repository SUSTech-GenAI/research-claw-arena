import fs from 'node:fs/promises';
import path from 'node:path';

const cwd = process.cwd();

function extractFirstMatch(text, regex, label) {
  const match = text.match(regex);
  if (!match) {
    throw new Error(`Could not find ${label}`);
  }
  return match[1].trim();
}

async function readApiConfig() {
  const [geminiRaw, kimiRaw, proxyRaw] = await Promise.all([
    fs.readFile(path.join(cwd, 'api管理/gemini.md'), 'utf8'),
    fs.readFile(path.join(cwd, 'api管理/kimi.md'), 'utf8'),
    fs.readFile(path.join(cwd, 'api管理/数标标.md'), 'utf8'),
  ]);

  return {
    geminiKey: extractFirstMatch(geminiRaw, /\b(AIza[0-9A-Za-z\-_]+)\b/, 'Gemini API key'),
    kimiKey: extractFirstMatch(kimiRaw, /\b(sk-[A-Za-z0-9]+)\b/, 'Kimi API key'),
    proxyKey: extractFirstMatch(proxyRaw, /api:\s*(sk-[A-Za-z0-9]+)/, 'proxy API key'),
    proxyBaseUrl: extractFirstMatch(proxyRaw, /endurl:\s*(https?:\/\/[^\s]+)/, 'proxy base URL'),
  };
}

async function requestJson(url, options = {}) {
  const timeoutMs = 15000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw_text: text };
    }
    return {
      ok: response.ok,
      status: response.status,
      json,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      json: {
        error: error instanceof Error ? error.message : String(error),
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

async function testGemini(config) {
  const modelsUrl =
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(config.geminiKey)}`;
  const modelsResult = await requestJson(modelsUrl);

  const candidateModels = Array.isArray(modelsResult.json?.models)
    ? modelsResult.json.models.map((model) => model.name)
    : [];

  const preferredModel =
    candidateModels.find((name) => name.includes('gemini-3.1-pro')) ||
    candidateModels.find((name) => name.includes('gemini-2.5-pro')) ||
    'models/gemini-2.5-pro';

  const generateUrl =
    `https://generativelanguage.googleapis.com/v1beta/${preferredModel}:generateContent?key=${encodeURIComponent(config.geminiKey)}`;
  const body = {
    contents: [
      {
        parts: [
          {
            text: 'Return valid JSON only: {"ping":"pong","provider":"gemini"}',
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
    },
  };

  const generateResult = await requestJson(generateUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return {
    provider: 'gemini',
    models_test: {
      ok: modelsResult.ok,
      status: modelsResult.status,
      model_count: candidateModels.length,
      matched_preferred_model: preferredModel,
    },
    generation_test: {
      ok: generateResult.ok,
      status: generateResult.status,
      sample: generateResult.json?.candidates?.[0]?.content?.parts?.[0]?.text ?? generateResult.json,
    },
  };
}

async function testKimi(config) {
  const modelsUrl = 'https://api.moonshot.cn/v1/models';
  const modelsResult = await requestJson(modelsUrl, {
    headers: {
      authorization: `Bearer ${config.kimiKey}`,
    },
  });

  const candidateModels = Array.isArray(modelsResult.json?.data)
    ? modelsResult.json.data.map((model) => model.id)
    : [];
  const preferredModel =
    candidateModels.find((name) => name.includes('kimi-k2.5')) ||
    candidateModels[0] ||
    'kimi-k2.5';

  const chatUrl = 'https://api.moonshot.cn/v1/chat/completions';
  const body = {
    model: preferredModel,
    temperature: 1,
    messages: [
      {
        role: 'user',
        content: 'Return valid JSON only: {"ping":"pong","provider":"kimi"}',
      },
    ],
    response_format: {
      type: 'json_object',
    },
  };

  const chatResult = await requestJson(chatUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.kimiKey}`,
    },
    body: JSON.stringify(body),
  });

  return {
    provider: 'kimi',
    models_test: {
      ok: modelsResult.ok,
      status: modelsResult.status,
      model_count: candidateModels.length,
      matched_preferred_model: preferredModel,
    },
    generation_test: {
      ok: chatResult.ok,
      status: chatResult.status,
      sample: chatResult.json?.choices?.[0]?.message?.content ?? chatResult.json,
    },
  };
}

async function testProxy(config) {
  const modelsUrl = `${config.proxyBaseUrl}/v1/models`;
  const modelsResult = await requestJson(modelsUrl, {
    headers: {
      authorization: `Bearer ${config.proxyKey}`,
    },
  });

  const candidateModels = Array.isArray(modelsResult.json?.data)
    ? modelsResult.json.data.map((model) => model.id)
    : [];

  const gptModel =
    candidateModels.find((name) => name.includes('gpt-5.4')) ||
    candidateModels.find((name) => name.includes('gpt-5')) ||
    null;
  const claudeModel =
    candidateModels.find((name) => name.includes('claude-opus-4-6-thinking')) ||
    candidateModels.find((name) => name.includes('claude-opus-4-6')) ||
    candidateModels.find((name) => name.includes('claude') && name.includes('opus') && name.includes('4.6')) ||
    candidateModels.find((name) => name.includes('claude') && name.includes('opus')) ||
    null;
  const geminiModel =
    candidateModels.find((name) => name.includes('gemini-3.1-pro-preview')) ||
    candidateModels.find((name) => name.includes('gemini-3.1-pro')) ||
    candidateModels.find((name) => name.includes('gemini-3-pro-preview')) ||
    null;

  async function chatTest(model, providerLabel) {
    if (!model) {
      return {
        ok: false,
        status: null,
        sample: `${providerLabel} model not found in /v1/models`,
      };
    }
    const body = {
      model,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Return valid JSON only: {"ping":"pong","provider":"${providerLabel}"}`,
        },
      ],
      response_format: {
        type: 'json_object',
      },
    };

    const result = await requestJson(`${config.proxyBaseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${config.proxyKey}`,
      },
      body: JSON.stringify(body),
    });

    return {
      ok: result.ok,
      status: result.status,
      model,
      sample: result.json?.choices?.[0]?.message?.content ?? result.json,
    };
  }

  return {
    provider: 'proxy',
    models_test: {
      ok: modelsResult.ok,
      status: modelsResult.status,
      model_count: candidateModels.length,
      gpt_model: gptModel,
      claude_model: claudeModel,
      gemini_model: geminiModel,
    },
    generation_test: {
      gpt: await chatTest(gptModel, 'openai'),
      claude: await chatTest(claudeModel, 'claude'),
      gemini: await chatTest(geminiModel, 'gemini-proxy'),
    },
  };
}

async function main() {
  const config = await readApiConfig();
  const results = {
    tested_at: new Date().toISOString(),
    results: {
      gemini: await testGemini(config),
      kimi: await testKimi(config),
      proxy: await testProxy(config),
    },
  };

  const outputPath = path.join(cwd, 'api管理/judge-api-test-results.json');
  await fs.writeFile(outputPath, `${JSON.stringify(results, null, 2)}\n`, 'utf8');
  console.log(`Wrote API test results to ${path.relative(cwd, outputPath)}`);
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
