'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import type { NPC, Location } from '@/types';
import {
  generateNarrative,
  generateSceneOpening,
  type NarrativeMessage,
  type NarrativeChoice,
  type NarrativeContext,
} from '@/services/narrativeService';
import { generateNPCResponse } from '@/services/aiService';
import {
  Send,
  MessageSquare,
  User,
  Sparkles,
  Clock,
  ChevronRight,
  Loader2,
  MapPin,
  Heart,
  X,
} from 'lucide-react';

interface NarrativeWindowProps {
  onViewNPC: (npc: NPC) => void;
  onOpenMap: () => void;
}

export function NarrativeWindow({ onViewNPC, onOpenMap }: NarrativeWindowProps) {
  const {
    player,
    gameTime,
    npcs,
    locations,
    worldSettings,
    advanceTime,
    updatePlayer,
    updateNPCRelationship,
    addNPCMemory,
    getNPCsAtLocation,
  } = useGameStore();

  const [messages, setMessages] = useState<NarrativeMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeNPC, setActiveNPC] = useState<NPC | null>(null);
  const [currentChoices, setCurrentChoices] = useState<NarrativeChoice[]>([]);
  const [sceneType, setSceneType] = useState<'exploration' | 'dialogue' | 'activity' | 'event'>('exploration');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentLocation = player ? locations.get(player.currentLocationId) : null;
  const npcsHere = player ? getNPCsAtLocation(player.currentLocationId) : [];

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate initial scene when location changes
  useEffect(() => {
    if (player && currentLocation && messages.length === 0) {
      generateInitialScene();
    }
  }, [player?.currentLocationId]);

  const generateInitialScene = async () => {
    if (!player || !currentLocation || !worldSettings) return;

    setIsGenerating(true);

    const context: NarrativeContext = {
      player,
      currentLocation,
      npcsPresent: npcsHere,
      gameTime,
      worldSettings,
      recentEvents: [],
      currentSceneType: 'exploration',
    };

    try {
      const opening = await generateSceneOpening(context);

      const initialMessage: NarrativeMessage = {
        id: `msg_${Date.now()}`,
        type: 'narration',
        content: opening,
        timestamp: { ...gameTime },
      };

      setMessages([initialMessage]);

      // Generate initial choices
      const defaultChoices: NarrativeChoice[] = [];

      if (npcsHere.length > 0) {
        npcsHere.forEach((npc, index) => {
          defaultChoices.push({
            id: `talk_${npc.id}`,
            text: `Approach ${npc.name}`,
            type: 'dialogue',
            targetNPC: npc.id,
          });
        });
      }

      if (currentLocation.availableActivities?.length > 0) {
        currentLocation.availableActivities.slice(0, 3).forEach((activity) => {
          defaultChoices.push({
            id: `activity_${activity.id}`,
            text: activity.name,
            type: 'action',
            consequences: {
              energy: -activity.energyCost,
              time: activity.duration,
              money: -activity.moneyCost,
            },
          });
        });
      }

      defaultChoices.push({
        id: 'look_around',
        text: 'Look around',
        type: 'action',
      });

      defaultChoices.push({
        id: 'leave',
        text: 'Go somewhere else',
        type: 'leave',
      });

      setCurrentChoices(defaultChoices);
    } catch (error) {
      console.error('Error generating initial scene:', error);
    }

    setIsGenerating(false);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isGenerating || !player || !currentLocation || !worldSettings) return;

    const playerMessage = inputText.trim();
    setInputText('');
    setIsGenerating(true);

    // Add player message
    const playerMsg: NarrativeMessage = {
      id: `msg_${Date.now()}`,
      type: 'player_action',
      content: playerMessage,
      speaker: player.name,
      timestamp: { ...gameTime },
    };
    setMessages((prev) => [...prev, playerMsg]);

    try {
      if (activeNPC && sceneType === 'dialogue') {
        // Direct NPC conversation
        await handleNPCConversation(playerMessage);
      } else {
        // General narrative
        await handleNarrativeAction(playerMessage);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      addSystemMessage('Something went wrong. Try again.');
    }

    setIsGenerating(false);
  };

  const handleNPCConversation = async (playerMessage: string) => {
    if (!activeNPC || !player) return;

    const conversationHistory: Array<{ speaker: 'player' | 'npc'; content: string }> = messages
      .filter((m) => m.type === 'dialogue' || m.type === 'player_action')
      .map((m) => ({
        speaker: (m.speakerId === activeNPC.id ? 'npc' : 'player') as 'player' | 'npc',
        content: m.content,
      }));

    const result = await generateNPCResponse(
      playerMessage,
      activeNPC,
      player,
      gameTime,
      conversationHistory
    );

    // Add NPC response
    const npcMsg: NarrativeMessage = {
      id: `msg_${Date.now()}`,
      type: 'dialogue',
      content: result.response,
      speaker: activeNPC.name,
      speakerId: activeNPC.id,
      timestamp: { ...gameTime },
      emotion: result.detectedEmotion,
    };
    setMessages((prev) => [...prev, npcMsg]);

    // Add micro-expression as separate message if present
    if (result.microExpression) {
      const actionMsg: NarrativeMessage = {
        id: `msg_${Date.now()}_action`,
        type: 'npc_action',
        content: result.microExpression,
        speaker: activeNPC.name,
        speakerId: activeNPC.id,
        timestamp: { ...gameTime },
      };
      setMessages((prev) => [...prev, actionMsg]);
    }

    // Apply relationship changes
    if (Object.keys(result.relationshipChanges).length > 0) {
      updateNPCRelationship(activeNPC.id, result.relationshipChanges);
    }

    // Update choices for conversation
    setCurrentChoices([
      { id: 'continue', text: 'Continue talking...', type: 'dialogue' },
      { id: 'flirt', text: 'Say something flirty', type: 'dialogue' },
      { id: 'ask_about', text: 'Ask about their day', type: 'dialogue' },
      { id: 'end_convo', text: 'End conversation', type: 'action' },
    ]);

    advanceTime(2);
  };

  const handleNarrativeAction = async (playerMessage: string) => {
    if (!player || !currentLocation || !worldSettings) return;

    const context: NarrativeContext = {
      player,
      currentLocation,
      npcsPresent: npcsHere,
      gameTime,
      worldSettings,
      recentEvents: messages.slice(-5).map((m) => m.content),
      currentSceneType: sceneType,
      activeNPC: activeNPC || undefined,
    };

    const result = await generateNarrative(context, playerMessage, messages);

    // Add narration
    const narrationMsg: NarrativeMessage = {
      id: `msg_${Date.now()}`,
      type: 'narration',
      content: result.narration,
      timestamp: { ...gameTime },
    };
    setMessages((prev) => [...prev, narrationMsg]);

    // Add NPC dialogue if present
    if (result.npcDialogue) {
      const npc = npcsHere.find((n) => n.name === result.npcDialogue!.name);
      if (result.npcDialogue.action) {
        const actionMsg: NarrativeMessage = {
          id: `msg_${Date.now()}_action`,
          type: 'npc_action',
          content: result.npcDialogue.action,
          speaker: result.npcDialogue.name,
          speakerId: npc?.id,
          timestamp: { ...gameTime },
        };
        setMessages((prev) => [...prev, actionMsg]);
      }

      const dialogueMsg: NarrativeMessage = {
        id: `msg_${Date.now()}_dialogue`,
        type: 'dialogue',
        content: result.npcDialogue.text,
        speaker: result.npcDialogue.name,
        speakerId: npc?.id,
        timestamp: { ...gameTime },
      };
      setMessages((prev) => [...prev, dialogueMsg]);
    }

    // Update choices
    setCurrentChoices(result.choices);

    // Advance time
    advanceTime(result.suggestedTimeAdvance);

    // Apply mood changes
    if (result.moodShift === 'positive') {
      updatePlayer({ mood: Math.min(100, player.mood + 5) });
    } else if (result.moodShift === 'negative') {
      updatePlayer({ mood: Math.max(0, player.mood - 5) });
    }
  };

  const handleChoiceSelect = async (choice: NarrativeChoice) => {
    if (isGenerating) return;

    if (choice.type === 'leave') {
      onOpenMap();
      return;
    }

    if (choice.type === 'dialogue' && choice.targetNPC) {
      const npc = npcs.get(choice.targetNPC);
      if (npc) {
        startConversation(npc);
        return;
      }
    }

    if (choice.id === 'end_convo') {
      endConversation();
      return;
    }

    // Apply consequences
    if (choice.consequences && player) {
      const updates: Partial<typeof player> = {};
      if (choice.consequences.energy) {
        updates.energy = Math.max(0, Math.min(100, player.energy + choice.consequences.energy));
      }
      if (choice.consequences.mood) {
        updates.mood = Math.max(0, Math.min(100, player.mood + choice.consequences.mood));
      }
      if (choice.consequences.money) {
        updates.finances = {
          ...player.finances,
          balance: player.finances.balance + choice.consequences.money,
        };
      }
      if (Object.keys(updates).length > 0) {
        updatePlayer(updates);
      }
      if (choice.consequences.time) {
        advanceTime(choice.consequences.time);
      }
    }

    // Treat choice as player input
    setInputText(choice.text);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const startConversation = (npc: NPC) => {
    setActiveNPC(npc);
    setSceneType('dialogue');

    const startMsg: NarrativeMessage = {
      id: `msg_${Date.now()}`,
      type: 'narration',
      content: `You walk over to ${npc.name}, who is ${npc.currentState.currentActivity}. ${npc.relationship.friendship > 40 ? 'They smile as they see you approaching.' : 'They notice you approaching.'}`,
      timestamp: { ...gameTime },
    };
    setMessages((prev) => [...prev, startMsg]);

    setCurrentChoices([
      { id: 'greet', text: '"Hey, how are you?"', type: 'dialogue' },
      { id: 'casual', text: '"What are you up to?"', type: 'dialogue' },
      { id: 'flirt', text: '"You look nice today."', type: 'dialogue' },
      { id: 'end_convo', text: 'Walk away', type: 'action' },
    ]);
  };

  const endConversation = () => {
    if (activeNPC) {
      const endMsg: NarrativeMessage = {
        id: `msg_${Date.now()}`,
        type: 'narration',
        content: `You say goodbye to ${activeNPC.name} and step away.`,
        timestamp: { ...gameTime },
      };
      setMessages((prev) => [...prev, endMsg]);
    }

    setActiveNPC(null);
    setSceneType('exploration');
    generateInitialScene();
  };

  const addSystemMessage = (content: string) => {
    const msg: NarrativeMessage = {
      id: `msg_${Date.now()}`,
      type: 'system',
      content,
      timestamp: { ...gameTime },
    };
    setMessages((prev) => [...prev, msg]);
  };

  const formatTime = (time: typeof gameTime) => {
    const hour = time.hour % 12 || 12;
    const ampm = time.hour >= 12 ? 'PM' : 'AM';
    return `${hour}:${time.minute.toString().padStart(2, '0')} ${ampm}`;
  };

  if (!player || !currentLocation) return null;

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800/80 backdrop-blur border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              {activeNPC ? (
                <span className="text-white font-bold">{activeNPC.name.charAt(0)}</span>
              ) : (
                <MapPin className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold">
                {activeNPC ? activeNPC.name : currentLocation.name}
              </h3>
              <p className="text-xs text-gray-400">
                {activeNPC
                  ? `${activeNPC.occupation} • ${activeNPC.currentState.mood.primary}`
                  : `${formatTime(gameTime)} • ${gameTime.weather}`}
              </p>
            </div>
          </div>

          {activeNPC && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Heart className="w-4 h-4 text-pink-400" />
                <span className="text-gray-300">{activeNPC.relationship.romance}%</span>
              </div>
              <button
                onClick={() => onViewNPC(activeNPC)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white"
              >
                Profile
              </button>
              <button
                onClick={endConversation}
                className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="animate-fadeIn">
            {msg.type === 'narration' && (
              <div className="text-gray-300 leading-relaxed italic">
                {msg.content}
              </div>
            )}

            {msg.type === 'dialogue' && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">
                    {msg.speaker?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-purple-400 text-sm font-medium mb-1">{msg.speaker}</p>
                  <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 text-white">
                    {msg.content}
                  </div>
                </div>
              </div>
            )}

            {msg.type === 'player_action' && (
              <div className="flex gap-3 justify-end">
                <div className="max-w-[80%]">
                  <div className="bg-purple-600 rounded-2xl rounded-tr-sm px-4 py-3 text-white">
                    {msg.content}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
            )}

            {msg.type === 'npc_action' && (
              <div className="text-gray-500 text-sm italic pl-11">
                {msg.content}
              </div>
            )}

            {msg.type === 'system' && (
              <div className="text-center text-gray-500 text-sm py-2">
                {msg.content}
              </div>
            )}

            {msg.type === 'thought' && (
              <div className="text-gray-400 text-sm italic text-center py-2">
                <Sparkles className="w-4 h-4 inline mr-2" />
                {msg.content}
              </div>
            )}
          </div>
        ))}

        {isGenerating && (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">
              {activeNPC ? `${activeNPC.name} is typing...` : 'Generating...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Choices */}
      {currentChoices.length > 0 && !isGenerating && (
        <div className="px-4 py-3 border-t border-gray-800 bg-gray-800/50">
          <div className="flex flex-wrap gap-2">
            {currentChoices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleChoiceSelect(choice)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  choice.type === 'leave'
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : choice.type === 'dialogue'
                    ? 'bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                {choice.text}
                {choice.consequences?.time && (
                  <span className="ml-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3 inline" /> {choice.consequences.time}m
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700 bg-gray-800/50">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-3"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              activeNPC
                ? `Say something to ${activeNPC.name}...`
                : 'Describe your action or say something...'
            }
            className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isGenerating}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Type freely or select a choice above • Press Enter to send
        </p>
      </div>
    </div>
  );
}
