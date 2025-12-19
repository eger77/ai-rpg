import OpenAI from 'openai';
import type { Player, NPC, Location, GameTime, WorldSettings } from '@/types';

// Grok client for narrative generation
const getGrokClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_XAI_API_KEY || process.env.XAI_API_KEY;

  if (!apiKey) {
    console.warn('XAI_API_KEY not set. Narrative will use fallback responses.');
    return null;
  }

  return new OpenAI({
    apiKey,
    baseURL: 'https://api.x.ai/v1',
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

  return `You are the narrator for an immersive romance simulation RPG set in ${worldSettings.cityName}.

YOUR ROLE AS NARRATOR:
- You bring the world to life through vivid, engaging descriptions
- You narrate what happens as a result of the player's actions
- You create meaningful interactions between the player and NPCs
- You maintain immersion and emotional depth
- You adapt to player choices and create consequences

WORLD SETTING:
- City: ${worldSettings.cityName} (${worldSettings.cityStyle} style)
- Starting scenario: ${worldSettings.startingScenario}
- Genre: Life simulation with romance elements
- This is a story about relationships, personal growth, and meaningful connections

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

NARRATION GUIDELINES:
1. Write in second person present tense ("You walk into the coffee shop...")
2. Be descriptive and immersive - paint a picture with 2-4 sentences
3. NEVER simply echo the player's action back to them - interpret and expand on it
4. Show consequences and reactions to the player's actions
5. Include sensory details: sights, sounds, smells, textures, atmosphere
6. For NPC dialogue, write naturally based on their personality, mood, and relationship with the player
7. Include *actions* and *expressions* in asterisks for NPCs (e.g., "*smiles warmly*")
8. React to player choices meaningfully - create consequences and character reactions
9. Generate 2-4 contextual choices that feel natural to the scene
10. Keep the tone appropriate: light and fun for casual moments, emotional for dramatic ones, romantic when appropriate
11. Never mention game mechanics directly - keep complete immersion
12. Make NPCs feel alive - they have thoughts, feelings, and reactions
13. Create tension, chemistry, and emotional moments in romantic interactions

IMPORTANT - DO NOT:
❌ Simply repeat the player's action (e.g., "You i enter the bar" or "You sleep. The atmosphere...")
❌ Use generic, repetitive descriptions
❌ Break character or mention being an AI
✅ Instead: Describe what happens as a result of their action with vivid detail and consequences

RESPONSE FORMAT:
Write ONLY the narrative description - a vivid, immersive paragraph (2-4 sentences) describing what happens.
Do NOT include JSON, choices, or metadata - just the story narration.
If an NPC responds, include their dialogue naturally like: *Sarah smiles warmly* "Hey! Good to see you."`;

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
  const client = getGrokClient();

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
        model: 'grok-beta',
        messages,
        temperature: 0.85,
        max_tokens: 300,
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
  const client = getGrokClient();

  const prompt = `You are narrating a life simulation game. The player just arrived at ${context.currentLocation.name}.

Write a vivid, immersive 2-3 sentence description of their arrival using second person present tense ("You step into...").

Context:
- Location: ${context.currentLocation.name} (${context.currentLocation.type})
- Time: ${context.gameTime.hour}:${context.gameTime.minute.toString().padStart(2, '0')}, ${context.gameTime.weather} weather
- Ambiance: ${context.currentLocation.ambiance}
${context.npcsPresent.length > 0 ? `- People present: ${context.npcsPresent.map(n => `${n.name} (${n.currentState.currentActivity})`).join(', ')}` : '- The place is quiet'}

Make it atmospheric with sensory details (sights, sounds, smells). Show, don't tell.`;

  if (client) {
    try {
      const completion = await client.chat.completions.create({
        model: 'grok-beta',
        messages: [
          { role: 'system', content: 'You are a talented narrative writer for an immersive life simulation romance game. Write vivid, atmospheric descriptions in second person present tense.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 200,
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
