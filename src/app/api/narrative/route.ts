import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Server-side DeepSeek client (no CORS issues)
const getDeepSeekClient = () => {
  const apiKey = process.env.DEEPSEEK_API_KEY || 'sk-6d5d51862c5c4f89b95b9569127a9d9f';

  return new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com/v1',
  });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, temperature, max_tokens } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      );
    }

    const client = getDeepSeekClient();

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages,
      temperature: temperature || 0.9,
      max_tokens: max_tokens || 400,
    });

    return NextResponse.json({
      success: true,
      response: completion.choices[0]?.message?.content || '',
      usage: completion.usage,
    });

  } catch (error: any) {
    console.error('DeepSeek API error in narrative route:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate narrative',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
