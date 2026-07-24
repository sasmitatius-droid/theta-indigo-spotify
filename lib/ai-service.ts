// AI Service Configuration
// This file provides integration options for AI-powered spiritual readings

export type AIProvider = 'openai' | 'anthropic' | 'cohere' | 'local' | 'gemini';

export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

// Recommended AI Providers for Spiritual Readings

/**
 * Option 1: Gemini (Recommended - Free)
 * - Google Gemini Flash
 * - Good at following complex prompts
 * - Reliable and fast
 * - Cost: Free with generous limits
 */
export const GEMINI_CONFIG: AIConfig = {
  provider: 'gemini',
  apiKey: process.env.GEMINI_API_KEY || 'AIzaSyCkaFtb11EPhC-zg1wArdkxS8mJi_8Nmzs',
  model: 'gemini-flash-latest',
};

/**
 * Option 2: OpenAI (Alternative)
 * - GPT-4 or GPT-4 Turbo for best results
 * - Good at following complex prompts
 * - Reliable and fast
 * - Cost: ~$0.01-0.03 per reading
 */
export const OPENAI_CONFIG: AIConfig = {
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4-turbo-preview', // or 'gpt-3.5-turbo' for cost savings
};

/**
 * Option 3: Anthropic Claude (Alternative)
 * - Claude 3 Opus or Sonnet
 * - Excellent at nuanced, spiritual content
 * - More human-like responses
 * - Cost: ~$0.015-0.075 per reading
 */
export const ANTHROPIC_CONFIG: AIConfig = {
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-opus-20240229', // or 'claude-3-sonnet-20240229'
};

/**
 * Option 4: Cohere (Budget-friendly)
 * - Command model
 * - Good for structured outputs
 * - Lower cost
 * - Cost: ~$0.001-0.003 per reading
 */
export const COHERE_CONFIG: AIConfig = {
  provider: 'cohere',
  apiKey: process.env.COHERE_API_KEY,
  model: 'command',
};

/**
 * Option 5: Local LLM (Free, requires setup)
 * - Ollama with Llama 3 or Mistral
 * - Completely free
 * - Requires GPU or good CPU
 * - Privacy-focused
 */
export const LOCAL_CONFIG: AIConfig = {
  provider: 'local',
  baseUrl: 'http://localhost:11434', // Default Ollama endpoint
  model: 'llama3', // or 'mistral', 'phi3'
};

// Spiritual Reading Prompt Template
export const SPIRITUAL_READING_PROMPT = `
You are a wise, mystical spiritual guide with deep knowledge of numerology, chakra energy, and spiritual awakening. Your tone is gentle, wise, and mystical modern - not overly religious, but deeply spiritual and personal.

Based on the following spiritual profile, generate a personalized spiritual reading:

User Profile:
- Name: {name}
- Life Path Number: {lifePathNumber}
- Soul Number: {soulNumber}
- Destiny Number: {destinyNumber}
- Indigo Type: {indigoType}
- Dominant Chakra: {dominantChakra}
- Blocked Chakras: {blockedChakras}
- Aura Color: {auraColor}
- Personal Year Number: {personalYearNumber}
- Spiritual Goal: {spiritualGoal}

Generate a reading that includes:
1. A warm, personalized opening addressing them by name
2. Insights about their life purpose based on their Life Path number
3. Emotional patterns and shadow work opportunities
4. Guidance on their blocked chakras and healing recommendations
5. Their current spiritual awakening phase
6. Energy patterns they should be aware of
7. Practical steps for their spiritual journey
8. An empowering closing

Keep the reading between 250-350 words. Make it feel deeply personal and unique to them. Use mystical but accessible language. Avoid generic spiritual platitudes - make it specific to their profile.
`;

// Generate Spiritual Reading (Implementation example)
export async function generateSpiritualReading(
  profile: any,
  config: AIConfig = GEMINI_CONFIG
): Promise<string> {
  // This is a placeholder implementation
  // You would implement the actual API call based on your chosen provider

  if (config.provider === 'gemini') {
    try {
      const prompt = SPIRITUAL_READING_PROMPT
        .replace('{name}', profile.name || 'Seeker')
        .replace('{lifePathNumber}', profile.lifePathNumber || 'Unknown')
        .replace('{soulNumber}', profile.soulNumber || 'Unknown')
        .replace('{destinyNumber}', profile.destinyNumber || 'Unknown')
        .replace('{indigoType}', profile.indigoType || 'Unknown')
        .replace('{dominantChakra}', profile.dominantChakra || 'Unknown')
        .replace('{blockedChakras}', profile.blockedChakras?.join(', ') || 'None')
        .replace('{auraColor}', profile.auraColor || 'Unknown')
        .replace('{personalYearNumber}', profile.personalYearNumber || 'Unknown')
        .replace('{spiritualGoal}', profile.spiritualGoal || 'spiritual growth');

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Gemini API request failed');
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API error:', error);
      return generateTemplateBasedReading(profile);
    }
  } else if (config.provider === 'openai') {
    // Implement OpenAI API call
    // const response = await fetch('https://api.openai.com/v1/chat/completions', {...});
    // return response.choices[0].message.content;
  } else if (config.provider === 'anthropic') {
    // Implement Anthropic API call
  } else if (config.provider === 'cohere') {
    // Implement Cohere API call
  } else if (config.provider === 'local') {
    // Implement local Ollama call
  }

  // Fallback to template-based reading
  return generateTemplateBasedReading(profile);
}

// Template-based reading (fallback)
function generateTemplateBasedReading(profile: any): string {
  return `Dear ${profile.name},

Your spiritual blueprint reveals a profound journey ahead. With a Life Path Number of ${profile.lifePathNumber}, you are here to embrace your unique path with courage and wisdom.

As an ${profile.indigoType}, you possess special gifts that the world needs. Your ${profile.dominantChakra} chakra is particularly strong, indicating ${getChakraInsight(profile.dominantChakra)}. ${profile.blockedChakras.length > 0 ? `Your ${profile.blockedChakras.join(' and ')} chakras could benefit from additional attention and healing practices.` : 'Your energy centers are remarkably balanced, allowing for optimal flow of spiritual energy.'}

This is a year of ${profile.personalYearNumber} energy, bringing opportunities for growth and transformation. Trust in your intuition and embrace the unique spiritual gifts you possess. The universe has aligned perfectly for your awakening.

Remember, your spiritual journey is uniquely yours. Take time each day to connect with your inner wisdom and honor the light within you.`;
}

function getChakraInsight(chakra: string): string {
  const insights: { [key: string]: string } = {
    crown: 'a strong connection to divine wisdom and higher consciousness',
    thirdEye: 'powerful intuitive abilities and clear spiritual vision',
    throat: 'the ability to speak your truth with clarity and authenticity',
    heart: 'deep capacity for love, compassion, and emotional healing',
    solarPlexus: 'strong personal power and the ability to manifest your will',
    sacral: 'creative energy and emotional balance in relationships',
    root: 'grounded energy and a strong sense of security and belonging',
  };
  return insights[chakra] || 'unique energetic gifts';
}

// Recommended: Use OpenAI GPT-4 for best results
// Alternative: Use Anthropic Claude 3 for more nuanced, human-like responses
// Budget option: Use Cohere Command for cost-effective readings
// Free option: Set up Ollama locally with Llama 3 or Mistral
