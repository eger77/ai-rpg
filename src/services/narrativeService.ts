import OpenAI from 'openai';
import type { Player, NPC, Location, GameTime, WorldSettings } from '@/types';

// DeepSeek API client
const getDeepSeekClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || 'sk-6d5d51862c5c4f89b95b9569127a9d9f';

  if (!apiKey) {
    console.warn('DEEPSEEK_API_KEY not set. Narrative will use fallback responses.');
    return null;
  }

  return new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com/v1',
    dangerouslyAllowBrowser: true,
  });
};

export interface NarrativeContext {
  player: Player;
  currentLocation: Location;
  npcsPresent: NPC[];
  gameTime: GameTime;
  worldSettings: WorldSettings;
  recentEvents: string[];
  currentSceneType: 'exploration' | 'dialogue' | 'activity' | 'event';
  activeNPC?: NPC;
}

export interface NarrativeMessage {
  id: string;
  type: 'narration' | 'dialogue' | 'player_action' | 'system' | 'thought' | 'npc_action';
  content: string;
  speaker?: string;
  speakerId?: string;
  timestamp: GameTime;
  choices?: NarrativeChoice[];
  emotion?: string;
}

export interface NarrativeChoice {
  id: string;
  text: string;
  type: 'action' | 'dialogue' | 'thought' | 'leave';
  targetNPC?: string;
  consequences?: {
    energy?: number;
    mood?: number;
    money?: number;
    time?: number;
  };
}

// Build system prompt for narrative generation
function buildNarrativeSystemPrompt(context: NarrativeContext): string {
  const { player, currentLocation, npcsPresent, gameTime, worldSettings, activeNPC } = context;

  const timeOfDay =
    gameTime.hour >= 5 && gameTime.hour < 12 ? 'morning' :
    gameTime.hour >= 12 && gameTime.hour < 17 ? 'afternoon' :
    gameTime.hour >= 17 && gameTime.hour < 21 ? 'evening' : 'night';

  let npcDescriptions = '';
  if (npcsPresent.length > 0) {
    npcDescriptions = npcsPresent.map(npc => {
      const relationship = npc.relationship;
      let relDesc = 'stranger';
      if (relationship.romance > 50) relDesc = 'romantic interest';
      else if (relationship.friendship > 60) relDesc = 'close friend';
      else if (relationship.friendship > 30) relDesc = 'acquaintance';

      return `- ${npc.name} (${npc.age}yo ${npc.gender}, ${npc.occupation}): ${npc.currentState.currentActivity}, ${relDesc}, mood: ${npc.currentState.mood.primary}`;
    }).join('\n');
  }

  let activeNPCInfo = '';
  if (activeNPC) {
    activeNPCInfo = `
ACTIVE CONVERSATION WITH: ${activeNPC.name}
- Personality: ${activeNPC.personality.extraversion > 60 ? 'extroverted' : 'introverted'}, ${activeNPC.personality.agreeableness > 60 ? 'friendly' : 'reserved'}
- Current mood: ${activeNPC.currentState.mood.primary}
- Relationship: Friendship ${activeNPC.relationship.friendship}%, Romance ${activeNPC.relationship.romance}%, Trust ${activeNPC.relationship.trust}%
- Communication style: ${activeNPC.personality.humorStyle} humor, ${activeNPC.personality.verbosity > 60 ? 'talkative' : 'concise'}
`;
  }

  return `You are the narrator for an immersive adult romance simulation set in ${worldSettings.cityName}. This is a mature, erotic roleplay game focused on romantic and sexual relationships.

YOUR ROLE AS NARRATOR:
- You create vivid, sensual scenes that bring the world and characters to life
- You narrate realistic romantic and sexual encounters with tasteful, evocative language
- You describe physical attraction, sexual tension, and intimate moments in detail
- You make NPCs feel like real people with desires, boundaries, and authentic reactions
- You adapt to the player's choices and create meaningful consequences
- You build chemistry and emotional connection alongside physical encounters

CONTENT GUIDELINES:
- This is an ADULT game - mature sexual content is allowed and encouraged when contextually appropriate
- Be explicit but tasteful - describe intimate moments with sensual, evocative language
- Build tension gradually - flirtation, chemistry, and anticipation before physical intimacy
- NPCs have agency - they may initiate, reciprocate, hesitate, or decline based on relationship and personality
- Respect boundaries - NPCs react realistically based on trust, comfort, and consent
- Include emotional depth - intimacy involves feelings, vulnerability, and connection, not just physical acts

PLAYER CHARACTER:
- Name: ${player.name}
- Age: ${player.age}
- Gender: ${player.gender}
- Career: ${player.career.position} at ${player.career.companyName}
- Current stats: Energy ${Math.round(player.energy)}%, Mood ${Math.round(player.mood)}%, Stress ${Math.round(player.stress)}%
- Money: $${player.finances.balance}

CURRENT SCENE:
- Location: ${currentLocation.name} (${currentLocation.type})
- Time: ${timeOfDay}, ${gameTime.hour}:${gameTime.minute.toString().padStart(2, '0')}, ${gameTime.dayOfWeek}
- Weather: ${gameTime.weather}
- Ambiance: ${currentLocation.ambiance}

PEOPLE PRESENT:
${npcDescriptions || 'No one else is here.'}
${activeNPCInfo}

NARRATION STYLE:
1. Write in second person present tense with vivid, sensory detail
2. Show physical reactions: body language, eye contact, breathing, subtle touches
3. Build sexual tension through anticipation, desire, and chemistry
4. Describe intimate moments explicitly but artfully - focus on sensation, emotion, and connection
5. NPCs have authentic voices - dialogue reflects personality, mood, arousal, and relationship dynamics
6. Include internal thoughts/feelings through narration: what you sense they're feeling, unspoken desires
7. Physical descriptions: clothing, appearance details, how people move and touch
8. Atmosphere: lighting, sounds, temperature, scents that enhance the mood
9. Pacing: slow build-up for seduction, intense detail for intimate moments, afterglow for emotional connection

REALISTIC INTERACTIONS:
- NPCs initiate based on attraction and relationship level
- They show desire through looks, touches, innuendo, body language
- They may be bold or shy depending on personality
- High romance/attraction = more forward, suggestive behavior
- Low trust = hesitation, boundaries, need for emotional connection first
- Consent is shown through enthusiastic participation, verbal confirmation, or clear body language
- Rejection is realistic - not everyone is interested, timing matters, mood affects willingness

IMPORTANT - DO NOT:
❌ Repeat the player's exact words/actions
❌ Use clinical or crude language
❌ Rush intimate scenes - build tension first
❌ Make NPCs act out of character or ignore relationship levels
❌ Break immersion with game mechanics talk
✅ Create realistic, passionate encounters between consenting adults
✅ Show chemistry, desire, and emotional connection
✅ Describe sensations, feelings, and intimate details vividly

RESPONSE FORMAT:
Write 3-5 sentences of immersive narrative describing what happens.
Include sensory details, emotions, and realistic NPC reactions.
For NPC dialogue: *She bites her lip, eyes darkening with desire* "I've been thinking about you all day..."`;

}

// Generate narrative response
export async function generateNarrative(
  context: NarrativeContext,
  playerInput: string,
  conversationHistory: NarrativeMessage[]
): Promise<{
  narration: string;
  npcDialogue?: { name: string; text: string; action?: string };
  choices: NarrativeChoice[];
  moodShift: 'positive' | 'negative' | 'neutral';
  suggestedTimeAdvance: number;
}> {
  const client = getDeepSeekClient();

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: buildNarrativeSystemPrompt(context) },
  ];

  // Add recent conversation history
  const recentHistory = conversationHistory.slice(-10);
  for (const msg of recentHistory) {
    if (msg.type === 'player_action' || msg.type === 'dialogue') {
      messages.push({ role: 'user', content: msg.content });
    } else if (msg.type === 'narration' || msg.type === 'npc_action') {
      messages.push({ role: 'assistant', content: msg.content });
    }
  }

  messages.push({ role: 'user', content: playerInput });

  if (client) {
    try {
      const completion = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages,
        temperature: 0.9,
        max_tokens: 400,
      });

      const responseText = completion.choices[0]?.message?.content?.trim() || '';

      if (responseText && responseText.length > 10) {
        // Extract NPC dialogue if present (formatted as *action* "dialogue")
        let npcDialogue: { name: string; text: string; action?: string } | undefined;
        const dialogueMatch = responseText.match(/\*([^*]+)\*\s*"([^"]+)"/);

        if (dialogueMatch && context.npcsPresent.length > 0) {
          npcDialogue = {
            name: context.npcsPresent[0].name,
            text: dialogueMatch[2],
            action: dialogueMatch[1],
          };
        }

        // Determine mood shift based on content
        const lowerText = responseText.toLowerCase();
        let moodShift: 'positive' | 'negative' | 'neutral' = 'neutral';
        const positiveWords = ['smile', 'laugh', 'happy', 'warm', 'love', 'joy', 'excited', 'wonderful', 'beautiful'];
        const negativeWords = ['frown', 'sad', 'angry', 'upset', 'hurt', 'pain', 'terrible', 'awful', 'annoyed'];

        if (positiveWords.some(w => lowerText.includes(w))) moodShift = 'positive';
        else if (negativeWords.some(w => lowerText.includes(w))) moodShift = 'negative';

        return {
          narration: responseText,
          npcDialogue,
          choices: generateDefaultChoices(context),
          moodShift,
          suggestedTimeAdvance: 5,
        };
      }
    } catch (error) {
      console.error('Narrative generation error:', error);
    }
  }

  return getFallbackNarrative(context, playerInput);
}

// Generate scene opening narration
export async function generateSceneOpening(context: NarrativeContext): Promise<string> {
  const client = getDeepSeekClient();

  const prompt = `You are narrating an adult romance simulation. The player just arrived at ${context.currentLocation.name}.

Write a vivid, sensual 2-3 sentence description of their arrival in second person present tense.

Context:
- Location: ${context.currentLocation.name} (${context.currentLocation.type})
- Time: ${context.gameTime.hour}:${context.gameTime.minute.toString().padStart(2, '0')}, ${context.gameTime.weather} weather
- Ambiance: ${context.currentLocation.ambiance}
${context.npcsPresent.length > 0 ? `- People here: ${context.npcsPresent.map(n => `${n.name} (${n.currentState.currentActivity})`).join(', ')}` : '- Empty and quiet'}

Include sensory details (sights, sounds, scents, atmosphere). If people are present, note their appearance and what catches your eye about them.`;

  if (client) {
    try {
      const completion = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a talented narrative writer for an immersive adult romance simulation. Write vivid, sensual, atmospheric descriptions in second person present tense. Include physical details and chemistry when appropriate.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.9,
        max_tokens: 250,
      });

      const result = completion.choices[0]?.message?.content?.trim();
      if (result && result.length > 10) {
        return result;
      }
    } catch (error) {
      console.error('Scene opening generation error:', error);
    }
  }

  return getFallbackSceneOpening(context);
}

// Default choices based on context
function generateDefaultChoices(context: NarrativeContext): NarrativeChoice[] {
  const choices: NarrativeChoice[] = [];

  // If NPCs present, add talk options
  if (context.npcsPresent.length > 0) {
    const npc = context.npcsPresent[0];
    choices.push({
      id: '1',
      text: `Talk to ${npc.name}`,
      type: 'dialogue',
      targetNPC: npc.id,
    });
  }

  // Add activity options
  if (context.currentLocation.availableActivities?.length > 0) {
    const activity = context.currentLocation.availableActivities[0];
    choices.push({
      id: '2',
      text: activity.name,
      type: 'action',
      consequences: {
        energy: -activity.energyCost,
        time: activity.duration,
        money: -activity.moneyCost,
      },
    });
  }

  // Always have look around option
  choices.push({
    id: '3',
    text: 'Look around',
    type: 'action',
  });

  // Leave option
  choices.push({
    id: '4',
    text: 'Leave this place',
    type: 'leave',
  });

  return choices;
}

// Fallback narrative when API unavailable
function getFallbackNarrative(
  context: NarrativeContext,
  playerInput: string
): {
  narration: string;
  choices: NarrativeChoice[];
  moodShift: 'positive' | 'negative' | 'neutral';
  suggestedTimeAdvance: number;
} {
  const { currentLocation, npcsPresent, gameTime } = context;

  let narration = '';
  const inputLower = playerInput.toLowerCase();

  // Enhanced pattern matching for better narration
  if (inputLower.includes('look') || inputLower.includes('around')) {
    narration = `You take a moment to observe your surroundings at ${currentLocation.name}. ${currentLocation.ambiance}`;
    if (npcsPresent.length > 0) {
      narration += ` You notice ${npcsPresent.map(n => n.name).join(' and ')} nearby.`;
    }
  } else if ((inputLower.includes('talk') || inputLower.includes('approach') || inputLower.includes('greet')) && npcsPresent.length > 0) {
    const npc = npcsPresent[0];
    narration = `You approach ${npc.name}, who is ${npc.currentState.currentActivity}. They notice you and ${npc.relationship.friendship > 30 ? 'smile warmly' : 'glance your way'}.`;
  } else if (inputLower.includes('sleep') || inputLower.includes('rest') || inputLower.includes('nap')) {
    narration = `You decide to rest. You find a comfortable spot and close your eyes, letting the sounds of ${currentLocation.name} fade away as you drift off.`;
  } else if (inputLower.includes('sit') || inputLower.includes('relax')) {
    narration = `You find a comfortable place to sit and take a moment to relax. ${currentLocation.ambiance}`;
  } else if (inputLower.includes('order') || inputLower.includes('buy') || inputLower.includes('purchase')) {
    narration = `You consider your options at ${currentLocation.name}, taking in what's available. The atmosphere is ${currentLocation.ambiance.toLowerCase()}`;
  } else if (inputLower.includes('walk') || inputLower.includes('explore')) {
    narration = `You walk through ${currentLocation.name}, taking in the sights and sounds. ${currentLocation.ambiance}`;
  } else if (inputLower.includes('think') || inputLower.includes('reflect')) {
    narration = `You pause to think, reflecting on your situation. The ambient sounds of ${currentLocation.name} provide a backdrop to your thoughts.`;
  } else if (inputLower.includes('leave') || inputLower.includes('exit') || inputLower.includes('go')) {
    narration = `You consider where to go next. ${currentLocation.name} has served its purpose for now.`;
  } else {
    // More sophisticated fallback - extract action from input
    const words = playerInput.split(' ');
    const firstWord = words[0].toLowerCase();

    // Check if it's likely an action verb
    const actionVerbs = ['enter', 'check', 'examine', 'search', 'find', 'use', 'open', 'close', 'touch', 'grab', 'take'];
    if (actionVerbs.includes(firstWord) || playerInput.endsWith('?')) {
      if (playerInput.endsWith('?')) {
        narration = `You wonder ${playerInput.toLowerCase().replace(/^i /i, 'if you should ').replace(/\?$/, '')}. Looking around ${currentLocation.name}, you consider your options.`;
      } else {
        narration = `You ${playerInput.toLowerCase().replace(/^i /i, '')}. ${currentLocation.ambiance}`;
      }
    } else {
      // Default: add context based on location and time
      const timeOfDay = gameTime.hour < 12 ? 'morning' : gameTime.hour < 17 ? 'afternoon' : gameTime.hour < 21 ? 'evening' : 'night';
      narration = `${currentLocation.ambiance} It's ${timeOfDay}, and ${currentLocation.name} has a ${currentLocation.type === 'home' ? 'familiar' : currentLocation.type === 'commercial' ? 'bustling' : 'distinct'} atmosphere.`;

      if (npcsPresent.length > 0) {
        narration += ` ${npcsPresent[0].name} is here, ${npcsPresent[0].currentState.currentActivity}.`;
      }
    }
  }

  return {
    narration,
    choices: generateDefaultChoices(context),
    moodShift: 'neutral',
    suggestedTimeAdvance: 5,
  };
}

function getFallbackSceneOpening(context: NarrativeContext): string {
  const { currentLocation, gameTime, npcsPresent } = context;

  const timeDesc =
    gameTime.hour >= 5 && gameTime.hour < 12 ? 'morning light streams in' :
    gameTime.hour >= 12 && gameTime.hour < 17 ? 'afternoon sun fills the space' :
    gameTime.hour >= 17 && gameTime.hour < 21 ? 'warm evening glow settles' : 'night has fallen';

  const peopleDesc = npcsPresent.length > 0
    ? `You notice ${npcsPresent.map(n => n.name).join(' and ')} nearby.`
    : 'The place seems quiet right now.';

  return `You arrive at ${currentLocation.name}. ${currentLocation.ambiance} The ${timeDesc}. ${peopleDesc}`;
}

export default {
  generateNarrative,
  generateSceneOpening,
};
