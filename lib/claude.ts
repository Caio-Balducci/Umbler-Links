import Anthropic from '@anthropic-ai/sdk';

// Cliente Claude — apenas server-side
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export { anthropic };
