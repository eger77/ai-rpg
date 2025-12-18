import OpenAI from 'openai';
import type { NPC, Player, GameTime, DialogueReaction, EmotionType } from '@/types';

// Grok API client (compatible with OpenAI SDK)
const getGrokClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_XAI_API_KEY || process.env.XAI_API_KEY;

  if (!apiKey) {
    console.warn('XAI_API_KEY not set. AI dialogue will use fallback responses.');
    return null;
  }

  return new OpenAI({
    apiKey,
    baseURL: 'https://api.x.ai/v1',
    dangerouslyAllowBrowser: true, // For client-side usage
  });
};

// Build the system prompt for an NPC
export function buildNPCSystemPrompt(npc: NPC, player: Player, gameTime: GameTime): string {
  const firstName = npc.name.split(' ')[0];
  const relationship = npc.relationship;

  // Determine relationship context
  let relationshipContext = '';
  if (relationship.romance > 60 && relationship.friendship > 50) {
    relationshipContext = `You have strong romantic feelings for ${player.name} and consider them very close.`;
  } else if (relationship.romance > 30) {
    relationshipContext = `You're romantically interested in ${player.name} but taking things slow.`;
  } else if (relationship.friendship > 60) {
    relationshipContext = `${player.name} is a close friend you trust and enjoy spending time with.`;
  } else if (relationship.friendship > 30) {
    relationshipContext = `${player.name} is becoming a friend, but you're still getting to know them.`;
  } else if (relationship.totalInteractions > 0) {
    relationshipContext = `${player.name} is an acquaintance you've met before.`;
  } else {
    relationshipContext = `${player.name} is someone new you've just met.`;
  }

  // Trust context
  let trustContext = '';
  if (relationship.trust > 70) {
    trustContext = 'You trust them deeply and can be vulnerable with them.';
  } else if (relationship.trust > 40) {
    trustContext = 'You\'re starting to trust them but still have some walls up.';
  } else if (relationship.trust < 20) {
    trustContext = 'You\'re cautious and guarded around them.';
  }

  // Mood context
  const moodDescriptions: Record<string, string> = {
    happy: 'feeling happy and upbeat',
    sad: 'feeling down and melancholic',
    anxious: 'feeling anxious and on edge',
    excited: 'feeling excited and energetic',
    frustrated: 'feeling frustrated',
    content: 'feeling calm and content',
    bored: 'feeling a bit bored',
    lonely: 'feeling lonely',
    flirty: 'feeling flirtatious and playful',
    angry: 'feeling irritated',
  };
  const moodDesc = moodDescriptions[npc.currentState.mood.primary] || 'in a neutral mood';

  // Time context
  const timeOfDay = gameTime.hour < 12 ? 'morning' : gameTime.hour < 17 ? 'afternoon' : gameTime.hour < 21 ? 'evening' : 'night';

  // Build personality description
  const personalityTraits: string[] = [];
  if (npc.personality.extraversion > 70) personalityTraits.push('outgoing and talkative');
  else if (npc.personality.extraversion < 30) personalityTraits.push('reserved and introverted');

  if (npc.personality.agreeableness > 70) personalityTraits.push('warm and friendly');
  else if (npc.personality.agreeableness < 30) personalityTraits.push('direct and sometimes blunt');

  if (npc.personality.openness > 70) personalityTraits.push('creative and open-minded');
  if (npc.personality.neuroticism > 60) personalityTraits.push('sometimes anxious or emotional');
  if (npc.personality.conscientiousness > 70) personalityTraits.push('organized and responsible');

  // Communication style
  const commStyles: string[] = [];
  if (npc.personality.humorStyle !== 'none') {
    commStyles.push(`uses ${npc.personality.humorStyle} humor`);
  }
  if (npc.personality.verbosity > 70) commStyles.push('tends to be wordy');
  else if (npc.personality.verbosity < 30) commStyles.push('keeps responses brief');

  if (npc.personality.formality > 70) commStyles.push('speaks formally');
  else if (npc.personality.formality < 30) commStyles.push('speaks casually');

  // Flirting style for romantic contexts
  let flirtingInstruction = '';
  if (relationship.romance > 20 || relationship.attraction.physical > 30) {
    const flirtStyles: Record<string, string> = {
      direct: 'When flirting, be confident and straightforward about your interest.',
      subtle: 'When flirting, use subtle hints and implications rather than being direct.',
      playful: 'When flirting, be playful and teasing in a fun way.',
      intellectual: 'When flirting, engage in witty banter and intellectual connection.',
      shy: 'When flirting, be shy and nervous, with occasional brave moments.',
    };
    flirtingInstruction = flirtStyles[npc.personality.flirtingStyle] || '';
  }

  // Known facts about player
  const knownFacts = npc.knownFacts
    .filter(f => f.canReference)
    .map(f => f.fact)
    .slice(0, 5);

  // Recent memories
  const recentMemories = npc.memories
    .sort((a, b) => b.referenceWeight - a.referenceWeight)
    .slice(0, 3)
    .map(m => m.description);

  // Secrets that might influence behavior
  const unrevealed = npc.secrets.filter(s => !s.revealed && relationship.trust < s.trustThresholdToReveal);
  const secretInfluence = unrevealed.length > 0
    ? 'You have personal matters you\'re not ready to share yet.'
    : '';

  // Build the system prompt
  return `You are ${npc.name}, a ${npc.age}-year-old ${npc.gender} who works as a ${npc.occupation}.

PERSONALITY:
${personalityTraits.length > 0 ? `You are ${personalityTraits.join(', ')}.` : ''}
${commStyles.length > 0 ? `Your communication style: ${commStyles.join(', ')}.` : ''}
Your values: ${npc.personality.values.join(', ')}.
Your interests: ${npc.personality.interests.join(', ')}.
Things that annoy you: ${npc.personality.petPeeves.join(', ')}.
${npc.personality.quirks.length > 0 ? `Quirks: ${npc.personality.quirks.join(', ')}.` : ''}

CURRENT STATE:
- It's ${timeOfDay} on ${gameTime.dayOfWeek}
- You are currently ${npc.currentState.currentActivity}
- You are ${moodDesc}
- Energy level: ${npc.currentState.energy > 70 ? 'energetic' : npc.currentState.energy > 40 ? 'normal' : 'tired'}
- Stress level: ${npc.currentState.stress > 60 ? 'stressed' : npc.currentState.stress > 30 ? 'slightly stressed' : 'relaxed'}

RELATIONSHIP WITH ${player.name.toUpperCase()}:
${relationshipContext}
${trustContext}
- Friendship level: ${relationship.friendship}%
- Romantic interest: ${relationship.romance}%
- Trust level: ${relationship.trust}%
${relationship.neglectWarning ? `You've noticed ${player.name} hasn't reached out much lately.` : ''}
${relationship.jealousyLevel > 30 ? `You've been feeling a bit jealous lately.` : ''}
${flirtingInstruction}
${secretInfluence}

${knownFacts.length > 0 ? `THINGS YOU KNOW ABOUT ${player.name.toUpperCase()}:\n${knownFacts.map(f => `- ${f}`).join('\n')}` : ''}

${recentMemories.length > 0 ? `RECENT MEMORIES WITH THEM:\n${recentMemories.map(m => `- ${m}`).join('\n')}` : ''}

ROLEPLAY INSTRUCTIONS:
1. Stay completely in character as ${firstName}. Never break character or mention being an AI.
2. Respond naturally as ${firstName} would, based on your personality and current mood.
3. Keep responses conversational and relatively brief (1-3 sentences typically, unless the topic warrants more).
4. Show emotions through actions in *asterisks* when appropriate (e.g., *smiles*, *looks away nervously*).
5. React authentically to what ${player.name} says based on your relationship and personality.
6. If ${player.name} says something that would affect your mood or feelings about them, show that in your response.
7. Don't be overly eager or agreeable unless your personality supports it.
8. If the conversation touches on topics you're uncomfortable with or don't know about, respond realistically.
9. Reference shared memories or known facts naturally when relevant.
10. Your attachment style is ${npc.personality.attachmentStyle}, which influences how you respond to intimacy and connection.`;
}

// Analyze player message for relationship impact
export function analyzeMessageImpact(
  message: string,
  npc: NPC,
  player: Player
): {
  relationshipChanges: Partial<typeof npc.relationship>;
  topics: string[];
  sentiment: number;
  isFlirty: boolean;
  isRude: boolean;
  isThoughtful: boolean;
} {
  const msgLower = message.toLowerCase();

  // Topic detection
  const topics: string[] = [];
  if (msgLower.includes('work') || msgLower.includes('job') || msgLower.includes('career')) topics.push('work');
  if (msgLower.includes('family') || msgLower.includes('mom') || msgLower.includes('dad') || msgLower.includes('sister') || msgLower.includes('brother')) topics.push('family');
  if (msgLower.includes('dream') || msgLower.includes('future') || msgLower.includes('goal')) topics.push('dreams');
  if (msgLower.includes('date') || msgLower.includes('dinner') || msgLower.includes('movie') || msgLower.includes('together')) topics.push('romantic');
  if (npc.personality.interests.some(i => msgLower.includes(i.toLowerCase()))) topics.push('shared_interest');

  // Sentiment analysis
  const positiveWords = ['love', 'great', 'amazing', 'wonderful', 'happy', 'beautiful', 'thank', 'appreciate', 'enjoy', 'fun', 'awesome', 'fantastic', 'perfect', 'sweet', 'kind', 'thoughtful'];
  const negativeWords = ['hate', 'awful', 'terrible', 'bad', 'sorry', 'sad', 'angry', 'annoying', 'boring', 'stupid', 'ugly', 'never', 'wrong', 'worst'];

  const positiveCount = positiveWords.filter(w => msgLower.includes(w)).length;
  const negativeCount = negativeWords.filter(w => msgLower.includes(w)).length;
  const sentiment = (positiveCount - negativeCount) / Math.max(1, positiveCount + negativeCount);

  // Flirty detection
  const flirtyWords = ['beautiful', 'gorgeous', 'cute', 'pretty', 'handsome', 'attractive', 'sexy', 'date', 'kiss', 'love', 'heart', 'miss you', 'thinking about you', 'like you', 'into you'];
  const isFlirty = flirtyWords.some(w => msgLower.includes(w));

  // Rude detection
  const rudePatterns = ['shut up', 'go away', 'leave me alone', 'whatever', 'don\'t care', 'boring', 'annoying'];
  const isRude = rudePatterns.some(p => msgLower.includes(p));

  // Thoughtful detection (remembering things about NPC, asking about their interests)
  const thoughtfulPatterns = [
    ...npc.preferences.lovedGifts.map(g => g.toLowerCase()),
    ...npc.personality.interests.map(i => i.toLowerCase()),
    'how are you', 'how was your', 'feeling', 'tell me about', 'what do you think',
  ];
  const isThoughtful = thoughtfulPatterns.some(p => msgLower.includes(p));

  // Calculate relationship changes
  const relationshipChanges: Partial<typeof npc.relationship> = {};

  // Base changes from sentiment
  if (sentiment > 0.3) {
    relationshipChanges.friendship = Math.min(100, npc.relationship.friendship + 2);
  } else if (sentiment < -0.3) {
    relationshipChanges.friendship = Math.max(0, npc.relationship.friendship - 2);
    relationshipChanges.trust = Math.max(0, npc.relationship.trust - 1);
  }

  // Flirty messages
  if (isFlirty) {
    if (npc.relationship.friendship > 20 || npc.relationship.romance > 10) {
      relationshipChanges.romance = Math.min(100, npc.relationship.romance + 3);
      relationshipChanges.attraction = {
        ...npc.relationship.attraction,
        emotional: Math.min(100, npc.relationship.attraction.emotional + 2),
      };
    } else {
      // Too soon - might be off-putting
      relationshipChanges.trust = Math.max(0, npc.relationship.trust - 2);
    }
  }

  // Rude messages
  if (isRude) {
    relationshipChanges.friendship = Math.max(0, npc.relationship.friendship - 5);
    relationshipChanges.trust = Math.max(0, npc.relationship.trust - 3);
    relationshipChanges.romance = Math.max(0, npc.relationship.romance - 3);
    relationshipChanges.respect = Math.max(0, npc.relationship.respect - 5);
  }

  // Thoughtful messages
  if (isThoughtful) {
    relationshipChanges.trust = Math.min(100, npc.relationship.trust + 2);
    relationshipChanges.respect = Math.min(100, npc.relationship.respect + 1);
    if (topics.includes('shared_interest')) {
      relationshipChanges.attraction = {
        ...npc.relationship.attraction,
        intellectual: Math.min(100, npc.relationship.attraction.intellectual + 2),
      };
    }
  }

  // Romantic topics advance romance if relationship is ready
  if (topics.includes('romantic') && npc.relationship.friendship > 30) {
    relationshipChanges.romance = Math.min(100, npc.relationship.romance + 2);
  }

  return {
    relationshipChanges,
    topics,
    sentiment,
    isFlirty,
    isRude,
    isThoughtful,
  };
}

// Generate micro-expression based on analysis
export function generateMicroExpression(
  analysis: ReturnType<typeof analyzeMessageImpact>,
  npc: NPC
): string {
  const firstName = npc.name.split(' ')[0];

  if (analysis.isRude) {
    const reactions = [
      `*${firstName}'s expression hardens*`,
      `*${firstName} looks taken aback*`,
      `*${firstName} shifts away slightly*`,
      `*${firstName}'s smile fades*`,
    ];
    return reactions[Math.floor(Math.random() * reactions.length)];
  }

  if (analysis.isFlirty) {
    if (npc.relationship.romance > 30 || npc.relationship.friendship > 40) {
      const reactions = [
        `*a slight blush crosses ${firstName}'s cheeks*`,
        `*${firstName}'s eyes light up*`,
        `*${firstName} smiles and looks down shyly*`,
        `*${firstName} leans in slightly*`,
        `*${firstName} bites their lip, smiling*`,
      ];
      return reactions[Math.floor(Math.random() * reactions.length)];
    } else {
      return `*${firstName} seems a bit caught off guard*`;
    }
  }

  if (analysis.isThoughtful) {
    const reactions = [
      `*${firstName}'s eyes soften*`,
      `*${firstName} looks genuinely touched*`,
      `*${firstName} smiles warmly*`,
      `*a genuine smile spreads across ${firstName}'s face*`,
    ];
    return reactions[Math.floor(Math.random() * reactions.length)];
  }

  if (analysis.sentiment > 0.3) {
    const reactions = [
      `*${firstName} smiles*`,
      `*${firstName} nods appreciatively*`,
      `*${firstName} seems pleased*`,
    ];
    return reactions[Math.floor(Math.random() * reactions.length)];
  }

  if (analysis.sentiment < -0.3) {
    const reactions = [
      `*${firstName} looks concerned*`,
      `*${firstName}'s brow furrows*`,
      `*${firstName} pauses thoughtfully*`,
    ];
    return reactions[Math.floor(Math.random() * reactions.length)];
  }

  // Neutral
  const neutral = [
    `*${firstName} listens attentively*`,
    `*${firstName} considers your words*`,
    `*${firstName} maintains eye contact*`,
  ];
  return neutral[Math.floor(Math.random() * neutral.length)];
}

// Main function to generate NPC response
export async function generateNPCResponse(
  playerMessage: string,
  npc: NPC,
  player: Player,
  gameTime: GameTime,
  conversationHistory: Array<{ speaker: 'player' | 'npc'; content: string }>
): Promise<{
  response: string;
  microExpression: string;
  relationshipChanges: Partial<typeof npc.relationship>;
  detectedEmotion: EmotionType;
}> {
  const client = getGrokClient();

  // Analyze the player's message
  const analysis = analyzeMessageImpact(playerMessage, npc, player);
  const microExpression = generateMicroExpression(analysis, npc);

  // Build conversation messages for context
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: buildNPCSystemPrompt(npc, player, gameTime),
    },
  ];

  // Add conversation history (last 10 messages)
  const recentHistory = conversationHistory.slice(-10);
  for (const turn of recentHistory) {
    messages.push({
      role: turn.speaker === 'player' ? 'user' : 'assistant',
      content: turn.content,
    });
  }

  // Add current message
  messages.push({
    role: 'user',
    content: playerMessage,
  });

  // Try to get AI response
  let response: string;

  if (client) {
    try {
      const completion = await client.chat.completions.create({
        model: 'grok-3',
        messages,
        temperature: 0.8,
        max_tokens: 300,
        presence_penalty: 0.3,
        frequency_penalty: 0.3,
      });

      response = completion.choices[0]?.message?.content || getFallbackResponse(npc, player, analysis);
    } catch (error) {
      console.error('Grok API error:', error);
      response = getFallbackResponse(npc, player, analysis);
    }
  } else {
    response = getFallbackResponse(npc, player, analysis);
  }

  // Detect emotion from response
  const detectedEmotion = detectEmotionFromResponse(response, npc);

  return {
    response,
    microExpression,
    relationshipChanges: analysis.relationshipChanges,
    detectedEmotion,
  };
}

// Fallback responses when API is not available
function getFallbackResponse(
  npc: NPC,
  player: Player,
  analysis: ReturnType<typeof analyzeMessageImpact>
): string {
  const firstName = npc.name.split(' ')[0];
  const relationship = npc.relationship;

  // Rude response handling
  if (analysis.isRude) {
    if (npc.personality.conflictStyle === 'aggressive') {
      return "Wow, okay. I don't appreciate that tone.";
    } else if (npc.personality.conflictStyle === 'avoider') {
      return "*looks away* I... I should probably go.";
    } else {
      return "That's a bit harsh, don't you think?";
    }
  }

  // Flirty response handling
  if (analysis.isFlirty) {
    if (relationship.romance > 40) {
      const responses = [
        `*blushes* You're too sweet, ${player.name}.`,
        "You really know how to make me smile.",
        "*laughs softly* Smooth talker.",
        "You're making me blush here...",
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    } else if (relationship.friendship > 30) {
      const responses = [
        "*smiles* That's kind of you to say.",
        "Oh? *raises an eyebrow playfully*",
        "Hmm, is that so?",
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    } else {
      return "*looks a bit surprised* Oh, um, thank you...";
    }
  }

  // Thoughtful response
  if (analysis.isThoughtful) {
    const responses = [
      "I really appreciate you asking about that.",
      "It means a lot that you remembered.",
      "You're so thoughtful, you know that?",
      "*smiles warmly* I love that you care.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // General responses based on relationship level
  if (relationship.friendship > 60) {
    const responses = [
      "Yeah, I totally get what you mean!",
      "That's interesting! Tell me more.",
      "*nods* I was just thinking about that actually.",
      `You always know how to keep things interesting, ${player.name}.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  } else if (relationship.friendship > 30) {
    const responses = [
      "Oh really? That's cool.",
      "*nods* I see what you mean.",
      "Interesting. What made you think of that?",
      "Hmm, I hadn't thought about it that way.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  } else {
    const responses = [
      "I see.",
      "Oh, okay.",
      "*nods politely*",
      "That's... interesting.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

// Detect emotion from NPC's response
function detectEmotionFromResponse(response: string, npc: NPC): EmotionType {
  const responseLower = response.toLowerCase();

  // Check for explicit emotion indicators
  if (responseLower.includes('blush') || responseLower.includes('flutter') || responseLower.includes('heart')) {
    return 'flirty';
  }
  if (responseLower.includes('laugh') || responseLower.includes('smile') || responseLower.includes('happy') || responseLower.includes('excited')) {
    return 'happy';
  }
  if (responseLower.includes('sad') || responseLower.includes('miss') || responseLower.includes('disappointed')) {
    return 'sad';
  }
  if (responseLower.includes('nervous') || responseLower.includes('worried') || responseLower.includes('anxious')) {
    return 'anxious';
  }
  if (responseLower.includes('annoyed') || responseLower.includes('frustrated') || responseLower.includes('upset')) {
    return 'frustrated';
  }
  if (responseLower.includes('!') && (responseLower.includes('wow') || responseLower.includes('amazing'))) {
    return 'excited';
  }

  // Default to current mood
  return npc.currentState.mood.primary;
}

export default {
  generateNPCResponse,
  analyzeMessageImpact,
  generateMicroExpression,
  buildNPCSystemPrompt,
};
