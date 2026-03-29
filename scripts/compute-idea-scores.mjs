import fs from 'node:fs/promises';
import path from 'node:path';

function usage() {
  console.error('Usage: node scripts/compute-idea-scores.mjs <input.json> [output.json]');
  process.exit(1);
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function roundInt(value) {
  return Math.round(value);
}

function mean(values) {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values) {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function computeRelativeEfficiency(best, current) {
  if (!(best > 0) || !(current > 0)) {
    throw new Error(`Invalid efficiency inputs: best=${best}, current=${current}`);
  }
  return Math.min(100, 100 * Math.sqrt(best / current));
}

function collectJudgeMetric(judgeScores, metricName) {
  if (!judgeScores || typeof judgeScores !== 'object') {
    return [];
  }
  return Object.entries(judgeScores)
    .map(([judge, metrics]) => ({
      judge,
      value: metrics?.[metricName],
    }))
    .filter((entry) => typeof entry.value === 'number');
}

function buildSemanticMetric(judgeScores, metricName, outlierThreshold) {
  const entries = collectJudgeMetric(judgeScores, metricName);
  if (entries.length === 0) {
    return {
      value: null,
      rounded: null,
      outlierJudges: [],
      judgeCount: 0,
    };
  }

  const values = entries.map((entry) => entry.value);
  const metricMedian = median(values);
  const metricMean = mean(values);
  const outlierJudges = entries
    .filter((entry) => Math.abs(entry.value - metricMedian) > outlierThreshold)
    .map((entry) => entry.judge);

  return {
    value: round1(metricMean),
    rounded: roundInt(metricMean),
    outlierJudges,
    judgeCount: entries.length,
  };
}

async function main() {
  const [, , inputArg, outputArg] = process.argv;
  if (!inputArg) {
    usage();
  }

  const cwd = process.cwd();
  const inputPath = path.resolve(cwd, inputArg);
  const configPath = path.resolve(cwd, 'api管理/idea-scoring-config.json');

  const [inputRaw, configRaw] = await Promise.all([
    fs.readFile(inputPath, 'utf8'),
    fs.readFile(configPath, 'utf8'),
  ]);

  const input = JSON.parse(inputRaw);
  const config = JSON.parse(configRaw);

  if (!Array.isArray(input.candidates) || input.candidates.length === 0) {
    throw new Error('Input must contain a non-empty candidates array.');
  }

  const scopePolicy = config.comparison_scope_policy;
  const inputScope = input.comparison_scope;
  if (!scopePolicy.allowed.includes(inputScope)) {
    throw new Error(`Unsupported comparison_scope: ${inputScope}`);
  }

  const weights = config.weights[input.weights_profile || 'default'];
  if (!weights) {
    throw new Error(`Unknown weights profile: ${input.weights_profile}`);
  }

  const timeValues = input.candidates.map((candidate) => candidate.time_seconds);
  const tokenValues = input.candidates.map((candidate) => candidate.total_tokens);

  if (timeValues.some((value) => typeof value !== 'number' || value <= 0)) {
    throw new Error('Each candidate must include a positive numeric time_seconds value.');
  }
  if (tokenValues.some((value) => typeof value !== 'number' || value <= 0)) {
    throw new Error('Each candidate must include a positive numeric total_tokens value.');
  }

  const bestTime = Math.min(...timeValues);
  const bestTokens = Math.min(...tokenValues);
  const outlierThreshold =
    config.semantic_metrics.research_value.outlier_threshold_from_median ?? 20;

  const results = input.candidates.map((candidate) => {
    const researchValue = buildSemanticMetric(
      candidate.judge_scores,
      'research_value',
      outlierThreshold
    );
    const operability = buildSemanticMetric(candidate.judge_scores, 'operability', outlierThreshold);

    const timeEfficiencyValue = computeRelativeEfficiency(bestTime, candidate.time_seconds);
    const tokenEfficiencyValue = computeRelativeEfficiency(bestTokens, candidate.total_tokens);

    const timeEfficiency = {
      value: round1(timeEfficiencyValue),
      rounded: roundInt(timeEfficiencyValue),
    };
    const tokenEfficiency = {
      value: round1(tokenEfficiencyValue),
      rounded: roundInt(tokenEfficiencyValue),
    };

    const hasSemanticScores = researchValue.value !== null && operability.value !== null;
    const overallValue = hasSemanticScores
      ? weights.research_value * researchValue.value +
        weights.operability * operability.value +
        weights.time_efficiency * timeEfficiency.value +
        weights.token_efficiency * tokenEfficiency.value
      : null;

    return {
      id: candidate.id,
      name: candidate.name,
      source: candidate.source,
      idea_text: candidate.idea_text,
      comparison_scope: inputScope,
      raw_inputs: {
        time_seconds: candidate.time_seconds,
        total_tokens: candidate.total_tokens,
      },
      scores: {
        research_value: researchValue,
        operability,
        time_efficiency: timeEfficiency,
        token_efficiency: tokenEfficiency,
        overall: overallValue === null
          ? {
              value: null,
              rounded: null,
            }
          : {
              value: round1(overallValue),
              rounded: roundInt(overallValue),
            },
      },
    };
  });

  const output = {
    scoring_version: config.version,
    input_file: path.relative(cwd, inputPath),
    comparison_scope: inputScope,
    weights_profile: input.weights_profile || 'default',
    weights,
    computed_at: new Date().toISOString(),
    notes: input.notes || '',
    candidates: results,
  };

  const serialized = `${JSON.stringify(output, null, 2)}\n`;

  if (outputArg) {
    const outputPath = path.resolve(cwd, outputArg);
    await fs.writeFile(outputPath, serialized, 'utf8');
    console.log(`Wrote scores to ${path.relative(cwd, outputPath)}`);
    return;
  }

  process.stdout.write(serialized);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

