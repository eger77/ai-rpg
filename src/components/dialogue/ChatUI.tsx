'use client';

import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import type { NPC, DialogueReaction, EmotionType } from '@/types';
import {
  X,
  Send,
  Heart,
  Users,
  Shield,
  Star,
  Smile,
  Frown,
  Meh,
  AlertCircle,
  Gift,
  Calendar,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface ChatUIProps {
  npc: NPC;
  isOpen: boolean;
  onClose: () => void;
}

// Quick response suggestions based on context
const QUICK_RESPONSES = {
  greeting: [
    'Hey! How are you?',
    'Nice to see you!',
    'What have you been up to?',
  ],
  casual: [
    'That sounds interesting!',
    'Tell me more about that',
    'How do you feel about it?',
  ],
  flirty: [
    'You look great today',
    'I\'ve been thinking about you',
    'Want to grab dinner sometime?',
  ],
  supportive: [
    'I\'m here for you',
    'That must be tough',
    'How can I help?',
  ],
};

const EMOTION_ICONS: Partial<Record<EmotionType, React.ElementType>> = {
  happy: Smile,
  sad: Frown,
  content: Meh,
  excited: Sparkles,
  anxious: AlertCircle,
};

export function ChatUI({ npc, isOpen, onClose }: ChatUIProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastReaction, setLastReaction] = useState<DialogueReaction | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    dialogue,
    gameTime,
    startDialogue,
    endDialogue,
    addDialogueTurn,
    sendMessage: sendTextMessage,
    receiveMessage,
    updateNPCRelationship,
    addNPCMemory,
    advanceTime,
  } = useGameStore();

  useEffect(() => {
    if (isOpen && !dialogue) {
      startDialogue(npc.id);
    }
    return () => {
      if (dialogue) {
        endDialogue();
      }
    };
  }, [isOpen, npc.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dialogue?.conversationHistory]);

  if (!isOpen) return null;

  const formatTime = (time: typeof gameTime) => {
    const hour = time.hour % 12 || 12;
    const ampm = time.hour >= 12 ? 'PM' : 'AM';
    return `${hour}:${time.minute.toString().padStart(2, '0')} ${ampm}`;
  };

  const analyzeMessage = (msg: string): { tone: 'positive' | 'negative' | 'neutral'; topics: string[] } => {
    const positiveWords = ['love', 'great', 'amazing', 'wonderful', 'happy', 'beautiful', 'thank', 'appreciate'];
    const negativeWords = ['hate', 'awful', 'terrible', 'bad', 'sorry', 'sad', 'angry'];

    const msgLower = msg.toLowerCase();
    const hasPositive = positiveWords.some(w => msgLower.includes(w));
    const hasNegative = negativeWords.some(w => msgLower.includes(w));

    let tone: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (hasPositive && !hasNegative) tone = 'positive';
    if (hasNegative && !hasPositive) tone = 'negative';

    // Extract potential topics
    const topics: string[] = [];
    if (msgLower.includes('work') || msgLower.includes('job')) topics.push('work');
    if (msgLower.includes('family')) topics.push('family');
    if (msgLower.includes('hobby') || msgLower.includes('interest')) topics.push('interests');
    if (msgLower.includes('date') || msgLower.includes('dinner') || msgLower.includes('movie')) topics.push('romantic');

    return { tone, topics };
  };

  const generateNPCResponse = (playerMessage: string): string => {
    const analysis = analyzeMessage(playerMessage);
    const personality = npc.personality;
    const relationship = npc.relationship;

    // Simple response generation based on personality and relationship
    const responses: string[] = [];

    // Greeting responses
    if (playerMessage.toLowerCase().includes('hello') || playerMessage.toLowerCase().includes('hey') || playerMessage.toLowerCase().includes('hi')) {
      if (relationship.friendship > 50) {
        responses.push(`Hey! It's so good to see you!`);
        responses.push(`Oh hi! I was just thinking about you.`);
      } else if (relationship.friendship > 20) {
        responses.push(`Hey there! How have you been?`);
        responses.push(`Hi! Nice to run into you.`);
      } else {
        responses.push(`Hello.`);
        responses.push(`Hi, can I help you with something?`);
      }
    }

    // Compliment responses
    if (playerMessage.toLowerCase().includes('beautiful') || playerMessage.toLowerCase().includes('look great') || playerMessage.toLowerCase().includes('pretty')) {
      if (relationship.romance > 30) {
        responses.push(`*blushes* That's so sweet of you to say.`);
        responses.push(`You're making me blush! Thank you.`);
      } else if (relationship.friendship > 30) {
        responses.push(`Oh, thank you! That's kind.`);
      } else {
        responses.push(`Um, thanks I guess.`);
      }
    }

    // Question about how they're doing
    if (playerMessage.toLowerCase().includes('how are you') || playerMessage.toLowerCase().includes('how\'s it going')) {
      const moodResponses: Record<string, string[]> = {
        happy: [`I'm doing great actually!`, `Really good, thanks for asking!`],
        sad: [`Honestly, not the best day...`, `I've been better, but I'll manage.`],
        content: [`Pretty good, just the usual.`, `Can't complain!`],
        anxious: [`A bit stressed with work, but okay.`, `Got a lot on my mind...`],
      };
      const moodType = npc.currentState.mood.primary;
      if (moodResponses[moodType]) {
        responses.push(...moodResponses[moodType]);
      } else {
        responses.push(`I'm okay, thanks for asking!`);
      }
    }

    // Date/hangout proposals
    if (playerMessage.toLowerCase().includes('dinner') || playerMessage.toLowerCase().includes('date') || playerMessage.toLowerCase().includes('hang out')) {
      if (relationship.romance > 40 || relationship.friendship > 50) {
        responses.push(`I'd love that! When were you thinking?`);
        responses.push(`That sounds fun! What did you have in mind?`);
      } else if (relationship.trust > 30) {
        responses.push(`Maybe... let me check my schedule.`);
      } else {
        responses.push(`I don't know if that's a good idea...`);
        responses.push(`I'm pretty busy lately, sorry.`);
      }
    }

    // Generic responses based on personality
    if (responses.length === 0) {
      if (personality.extraversion > 60) {
        responses.push(`That's interesting! Tell me more.`);
        responses.push(`Oh really? I love hearing about that kind of stuff!`);
      } else {
        responses.push(`I see.`);
        responses.push(`That's nice.`);
        responses.push(`Hmm, interesting.`);
      }

      if (analysis.tone === 'positive') {
        responses.push(`You seem happy today, that's nice.`);
      } else if (analysis.tone === 'negative') {
        responses.push(`Is everything okay?`);
      }
    }

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const calculateRelationshipImpact = (playerMessage: string): Partial<typeof npc.relationship> => {
    const analysis = analyzeMessage(playerMessage);
    const changes: Partial<typeof npc.relationship> = {};

    // Base relationship changes
    if (analysis.tone === 'positive') {
      changes.friendship = Math.min(100, npc.relationship.friendship + 1);
      if (analysis.topics.includes('romantic')) {
        changes.romance = Math.min(100, npc.relationship.romance + 2);
      }
    } else if (analysis.tone === 'negative') {
      changes.friendship = Math.max(0, npc.relationship.friendship - 1);
    }

    return changes;
  };

  const generateMicroExpression = (playerMessage: string): string => {
    const analysis = analyzeMessage(playerMessage);
    const relationship = npc.relationship;

    if (analysis.tone === 'positive') {
      if (relationship.romance > 40) {
        return '*her eyes light up and she leans in slightly*';
      }
      return '*she smiles warmly*';
    } else if (analysis.tone === 'negative') {
      return '*she shifts uncomfortably*';
    }

    if (analysis.topics.includes('romantic')) {
      if (relationship.romance > 30) {
        return '*a slight blush crosses her cheeks*';
      } else {
        return '*she glances away briefly*';
      }
    }

    return '*she listens attentively*';
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    const playerMessage = message.trim();
    setMessage('');

    // Add player message
    addDialogueTurn('player', playerMessage);

    // Also send as text message for persistence
    sendTextMessage(npc.id, playerMessage);

    // Show typing indicator
    setIsTyping(true);

    // Generate micro-expression reaction
    const microExpression = generateMicroExpression(playerMessage);
    setLastReaction({
      type: 'positive',
      intensity: 50,
      microExpression,
    });

    // Calculate relationship changes
    const relationshipChanges = calculateRelationshipImpact(playerMessage);
    if (Object.keys(relationshipChanges).length > 0) {
      updateNPCRelationship(npc.id, relationshipChanges);
    }

    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Generate and add NPC response
    const npcResponse = generateNPCResponse(playerMessage);
    setIsTyping(false);

    addDialogueTurn('npc', npcResponse);
    receiveMessage(npc.id, npcResponse);

    // Advance time slightly
    advanceTime(5);
  };

  const handleQuickResponse = (response: string) => {
    setMessage(response);
  };

  const MoodIcon = EMOTION_ICONS[npc.currentState.mood.primary] || Meh;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl h-[80vh] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold text-white">
            {npc.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-white">{npc.name}</h2>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <MoodIcon className="w-4 h-4" />
              <span className="capitalize">{npc.currentState.mood.primary}</span>
              <span>•</span>
              <span className="capitalize">{npc.currentState.availability}</span>
            </div>
          </div>

          {/* Quick relationship stats */}
          <div className="flex items-center gap-3 text-white/80 text-sm">
            <div className="flex items-center gap-1" title="Friendship">
              <Users className="w-4 h-4" />
              <span>{npc.relationship.friendship}%</span>
            </div>
            <div className="flex items-center gap-1" title="Romance">
              <Heart className="w-4 h-4" />
              <span>{npc.relationship.romance}%</span>
            </div>
            <div className="flex items-center gap-1" title="Trust">
              <Shield className="w-4 h-4" />
              <span>{npc.relationship.trust}%</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Micro-expression feedback */}
        {lastReaction && (
          <div className="px-4 py-2 bg-purple-900/30 text-purple-300 text-sm italic">
            {lastReaction.microExpression}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {dialogue?.conversationHistory.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">Start a conversation with {npc.name.split(' ')[0]}</p>
              <p className="text-gray-600 text-sm mt-1">
                Currently: {npc.currentState.currentActivity}
              </p>
            </div>
          )}

          {dialogue?.conversationHistory.map((turn, index) => (
            <div
              key={index}
              className={`flex ${turn.speaker === 'player' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                  turn.speaker === 'player'
                    ? 'bg-purple-600 text-white rounded-br-sm'
                    : 'bg-gray-700 text-white rounded-bl-sm'
                }`}
              >
                {turn.action && (
                  <p className="text-sm italic opacity-70 mb-1">{turn.action}</p>
                )}
                <p>{turn.content}</p>
                <p className="text-xs opacity-50 mt-1">{formatTime(turn.timestamp)}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl bg-gray-700 text-gray-400 rounded-bl-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Responses */}
        <div className="px-4 py-2 border-t border-gray-800">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Object.entries(QUICK_RESPONSES).map(([category, responses]) => (
              responses.slice(0, 1).map((response, i) => (
                <button
                  key={`${category}-${i}`}
                  onClick={() => handleQuickResponse(response)}
                  className="flex-shrink-0 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-full text-sm text-gray-300 transition-colors"
                >
                  {response}
                </button>
              ))
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 bg-gray-800/50 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-400 hover:text-pink-400 transition-colors" title="Send Gift">
              <Gift className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-blue-400 transition-colors" title="Suggest Date">
              <Calendar className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Message ${npc.name.split(' ')[0]}...`}
              className="flex-1 px-4 py-3 bg-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() || isTyping}
              className="p-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
