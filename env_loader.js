import fs from 'node:fs';
import path from 'node:path';

function parseEnvContent(content) {
  const values = {};
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const equalsIndex = line.indexOf('=');

    if (equalsIndex <= 0) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

export function loadEnvFile(filePath = path.resolve(process.cwd(), '.env')) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const parsedValues = parseEnvContent(fs.readFileSync(filePath, 'utf8'));

  for (const [key, value] of Object.entries(parsedValues)) {
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }

  return parsedValues;
}
