import 'dotenv/config'; 

export interface LlmRequest {
  system: string; // the agent's job description (the "instruction")
  user: string;   // the actual request for this call
}

export async function callLlm(req: LlmRequest): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY; 
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY is not set. Add it to your .env file in the project root.');
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL ?? 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: req.system,
      messages: [{ role: 'user', content: req.user }],
    }),
  });

  if (!res.ok) {
    throw new Error(`LLM call failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  return data.content.map((c) => c.text ?? '').join('');
}