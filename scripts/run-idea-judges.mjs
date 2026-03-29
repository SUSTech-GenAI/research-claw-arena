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
  const [proxyRaw, geminiRaw] = await Promise.all([
    fs.readFile(path.join(cwd, 'api管理/数标标.md'), 'utf8'),
    fs.readFile(path.join(cwd, 'api管理/gemini.md'), 'utf8'),
  ]);

  return {
    geminiKey: extractFirstMatch(geminiRaw, /\b(AIza[0-9A-Za-z\-_]+)\b/, 'Gemini API key'),
    proxyKey: extractFirstMatch(proxyRaw, /api:\s*(sk-[A-Za-z0-9]+)/, 'proxy API key'),
    proxyBaseUrl: extractFirstMatch(proxyRaw, /endurl:\s*(https?:\/\/[^\s]+)/, 'proxy base URL'),
  };
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw_text: text };
  }
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${JSON.stringify(json)}`);
  }
  return json;
}

async function detectProxyModels(baseUrl, apiKey) {
  const json = await requestJson(`${baseUrl}/v1/models`, {
    headers: {
      authorization: `Bearer ${apiKey}`,
    },
  });
  const modelIds = Array.isArray(json?.data) ? json.data.map((model) => model.id) : [];
  const gptModel =
    modelIds.find((name) => name.includes('gpt-5.4')) ||
    modelIds.find((name) => name.includes('gpt-5')) ||
    null;
  const claudeModel =
    modelIds.find((name) => name.includes('claude-opus-4-6-thinking')) ||
    modelIds.find((name) => name.includes('claude-opus-4-6')) ||
    modelIds.find((name) => name.includes('claude') && name.includes('opus') && name.includes('4.6')) ||
    modelIds.find((name) => name.includes('claude') && name.includes('opus')) ||
    null;
  return { modelIds, gptModel, claudeModel };
}

async function detectGeminiModel(apiKey) {
  const json = await requestJson(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
  );
  const modelNames = Array.isArray(json?.models) ? json.models.map((model) => model.name) : [];
  return (
    modelNames.find((name) => name.includes('gemini-3.1-pro-preview')) ||
    modelNames.find((name) => name.includes('gemini-3.1-pro')) ||
    modelNames.find((name) => name.includes('gemini-3-pro-preview')) ||
    modelNames.find((name) => name.includes('gemini-2.5-pro')) ||
    null
  );
}

async function loadPromptAndIdeas() {
  const [promptRaw, inputRaw] = await Promise.all([
    fs.readFile(path.join(cwd, 'api管理/idea-evaluator-shared-prompt.md'), 'utf8'),
    fs.readFile(path.join(cwd, 'idea/idea-round-1-score-input.json'), 'utf8'),
  ]);
  const input = JSON.parse(inputRaw);
  const ideas = input.candidates;
  const promptTemplate = promptRaw.split('## Prompt')[1]?.trim();
  if (!promptTemplate) {
    throw new Error('Could not find prompt body in shared prompt file.');
  }

  let prompt = promptTemplate;
  prompt = prompt.replace('{{IDEA_A}}', ideas[0]?.idea_text ?? '');
  prompt = prompt.replace('{{IDEA_B}}', ideas[1]?.idea_text ?? '');
  prompt = prompt.replace('{{IDEA_C}}', ideas[2]?.idea_text ?? '');

  return { prompt, input };
}

function parseJsonish(text) {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;
  return JSON.parse(candidate);
}

async function judgeWithProxy(baseUrl, apiKey, model, prompt, providerLabel, extraBody = {}) {
  const body = {
    model,
    temperature: 0,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: {
      type: 'json_object',
    },
    ...extraBody,
  };

  const json = await requestJson(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error(`Invalid ${providerLabel} response content`);
  }
  return {
    provider: providerLabel,
    model,
    raw: parseJsonish(content),
  };
}

async function judgeWithGemini(apiKey, model, prompt) {
  const json = await requestJson(
    `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string') {
    throw new Error('Invalid Gemini response content');
  }
  return {
    provider: 'gemini',
    model,
    raw: parseJsonish(text),
  };
}

async function judgeWithOpenAIProxy(baseUrl, apiKey, model, prompt) {
  return judgeWithProxy(baseUrl, apiKey, model, prompt, 'openai', {
    reasoning_effort: 'medium',
  });
}

async function judgeWithClaudeProxy(baseUrl, apiKey, model, prompt) {
  return judgeWithProxy(baseUrl, apiKey, model, prompt, 'claude');
}

async function judgeWithGeminiProxy(baseUrl, apiKey, model, prompt) {
  const body = {
    model,
    temperature: 0,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: {
      type: 'json_object',
    },
  };

  const json = await requestJson(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const text = json?.choices?.[0]?.message?.content;
  if (typeof text !== 'string') {
    throw new Error('Invalid Gemini proxy response content');
  }
  return {
    provider: 'gemini',
    model,
    raw: parseJsonish(text),
  };
}

function mergeJudgeResults(baseInput, judgePayloads) {
  const judgeMap = Object.fromEntries(
    judgePayloads.map((payload) => [payload.provider, payload.raw])
  );

  const updatedCandidates = baseInput.candidates.map((candidate) => {
    const judgeScores = {};
    for (const [judgeProvider, payload] of Object.entries(judgeMap)) {
      const found = payload.ideas.find((idea) => idea.idea_id === candidate.id_alias);
      if (!found) {
        continue;
      }
      judgeScores[judgeProvider] = {
        research_value: found.research_value,
        operability: found.operability,
        research_value_reason: found.research_value_reason,
        operability_reason: found.operability_reason,
        key_strength: found.key_strength,
        key_risk: found.key_risk,
      };
    }
    return {
      ...candidate,
      judge_scores: judgeScores,
    };
  });

  return {
    ...baseInput,
    candidates: updatedCandidates.map(({ idea_id, ...candidate }) => candidate),
  };
}

async function main() {
  const config = await readApiConfig();
  const { prompt, input } = await loadPromptAndIdeas();

  const baseInput = {
    ...input,
    candidates: input.candidates.map((candidate, index) => ({
      ...candidate,
      id_alias: ['A', 'B', 'C'][index],
    })),
  };

  const proxyModels = await detectProxyModels(config.proxyBaseUrl, config.proxyKey);
  if (!proxyModels.gptModel || !proxyModels.claudeModel) {
    throw new Error('Could not detect required GPT or Claude models from proxy /v1/models.');
  }
  const geminiModel = await detectGeminiModel(config.geminiKey);
  if (!geminiModel) {
    throw new Error('Could not detect a supported Gemini model from the official Gemini API.');
  }

  const judgePayloads = await Promise.all([
    judgeWithOpenAIProxy(config.proxyBaseUrl, config.proxyKey, proxyModels.gptModel, prompt),
    judgeWithClaudeProxy(config.proxyBaseUrl, config.proxyKey, proxyModels.claudeModel, prompt),
    judgeWithGemini(config.geminiKey, geminiModel, prompt).catch(() =>
      judgeWithGeminiProxy(
        config.proxyBaseUrl,
        config.proxyKey,
        'gemini-3.1-pro-preview',
        prompt
      )
    ),
  ]);

  const output = {
    evaluated_at: new Date().toISOString(),
    judges: judgePayloads.map((payload) => ({
      provider: payload.provider,
      model: payload.model,
    })),
    results: judgePayloads,
  };

  const rawOutputPath = path.join(cwd, 'idea/idea-round-1-judge-raw-results.json');
  await fs.writeFile(rawOutputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  const mergedInput = mergeJudgeResults(baseInput, judgePayloads);
  const mergedCandidates = mergedInput.candidates.map(({ id_alias, ...candidate }) => candidate);
  const scoredInputPath = path.join(cwd, 'idea/idea-round-1-score-input.with-judges.json');
  await fs.writeFile(
    scoredInputPath,
    `${JSON.stringify({ ...mergedInput, candidates: mergedCandidates }, null, 2)}\n`,
    'utf8'
  );

  console.log(`Wrote judge raw results to ${path.relative(cwd, rawOutputPath)}`);
  console.log(`Wrote merged score input to ${path.relative(cwd, scoredInputPath)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
