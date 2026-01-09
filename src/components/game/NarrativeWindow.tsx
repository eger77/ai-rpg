'use client';

import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import type { NPC, NPCRelationship } from '@/types';
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
  User,
  Sparkles,
  Clock,
  Loader2,
  MapPin,
  Heart,
  X,
  RefreshCw,
  Trash2,
  MoreVertical,
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
    addKnownFact,
    updateNPC,
    saveGame,
    loadGame,
    quests,
    getNPCsAtLocation,
  } = useGameStore();

  const [messages, setMessages] = useState<NarrativeMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeNPC, setActiveNPC] = useState<NPC | null>(null);
  const [currentChoices, setCurrentChoices] = useState<NarrativeChoice[]>([]);
  const [sceneType, setSceneType] = useState<'exploration' | 'dialogue' | 'activity' | 'event'>('exploration');
  const [lastPlayerMessage, setLastPlayerMessage] = useState<string>('');
  const [messageMenuOpen, setMessageMenuOpen] = useState<string | null>(null);

  type RelationshipDelta = Partial<Omit<NPCRelationship, 'attraction'>> & {
    attraction?: Partial<NPCRelationship['attraction']>;
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageSeqRef = useRef(0);
  const lastLocationIdRef = useRef<string | null>(null);
  const relationshipDeltaByMessageIdRef = useRef(new Map<string, { npcId: string; delta: RelationshipDelta }>());
  const undoStackRef = useRef<Array<{ npcId: string; messageId: string; delta: RelationshipDelta }>>([]);

  const makeMessageId = (kind: string) => {
    messageSeqRef.current += 1;
    // Stable, deterministic ID without relying on Date.now() (linted as impure).
    return `msg_${gameTime.day}_${gameTime.hour}_${gameTime.minute}_${messageSeqRef.current}_${kind}`;
  };

  const clamp01 = (value: number) => Math.max(0, Math.min(100, value));

  const getOutfitFormality = () => {
    if (!player) return 1;
    const outfit = player.currentOutfit;
    const items = [
      outfit.hat,
      outfit.top,
      outfit.bottom,
      outfit.shoes,
      outfit.outerwear,
      outfit.accessory1,
      outfit.accessory2,
    ].filter((i): i is NonNullable<typeof i> => Boolean(i));
    if (items.length === 0) return 1;
    const avg = items.reduce((sum, item) => sum + item.formalityLevel, 0) / items.length;
    return Math.round(avg);
  };

  const addSystemMessage = (content: string) => {
    const msg: NarrativeMessage = {
      id: makeMessageId('system'),
      type: 'system',
      content,
      timestamp: { ...gameTime },
    };
    setMessages((prev) => [...prev, msg]);
  };

  const applyRelationshipDelta = (npcId: string, delta: RelationshipDelta, sign: 1 | -1) => {
    const npc = useGameStore.getState().npcs.get(npcId);
    if (!npc) return;

    const next: Partial<NPCRelationship> = {};
    for (const key of ['friendship', 'romance', 'trust', 'respect', 'jealousyLevel', 'currentTension'] as const) {
      const d = delta[key];
      if (typeof d === 'number') {
        // updateNPCRelationship expects absolute values.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (next as any)[key] = clamp01((npc.relationship as any)[key] + d * sign);
      }
    }

    if (delta.attraction) {
      next.attraction = {
        ...npc.relationship.attraction,
        ...(delta.attraction.physical !== undefined
          ? { physical: clamp01(npc.relationship.attraction.physical + delta.attraction.physical * sign) }
          : {}),
        ...(delta.attraction.intellectual !== undefined
          ? { intellectual: clamp01(npc.relationship.attraction.intellectual + delta.attraction.intellectual * sign) }
          : {}),
        ...(delta.attraction.emotional !== undefined
          ? { emotional: clamp01(npc.relationship.attraction.emotional + delta.attraction.emotional * sign) }
          : {}),
        ...(delta.attraction.spiritual !== undefined
          ? { spiritual: clamp01(npc.relationship.attraction.spiritual + delta.attraction.spiritual * sign) }
          : {}),
      };
    }

    if (Object.keys(next).length > 0) {
      updateNPCRelationship(npcId, next);
    }
  };

  const currentLocation = player ? locations.get(player.currentLocationId) : null;
  const npcsHere = player ? getNPCsAtLocation(player.currentLocationId) : [];

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildDefaultChoices = (loc: typeof currentLocation, present: NPC[]) => {
    if (!loc) return [];

    const defaultChoices: NarrativeChoice[] = [];

    if (present.length > 0) {
      present.forEach((npc) => {
        defaultChoices.push({
          id: `talk_${npc.id}`,
          text: `Approach ${npc.name}`,
          type: 'dialogue',
          targetNPC: npc.id,
        });
      });
    }

    if (loc.availableActivities?.length > 0) {
      loc.availableActivities.slice(0, 3).forEach((activity) => {
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

    defaultChoices.push({ id: 'look_around', text: 'Look around', type: 'action' });
    defaultChoices.push({ id: 'leave', text: 'Go somewhere else', type: 'leave' });

    return defaultChoices;
  };

  const getMessageNumberMap = () => {
    const map = new Map<string, number>();
    let i = 1;
    for (const m of messages) {
      if (m.type === 'npc_action') continue;
      map.set(m.id, i);
      i += 1;
    }
    return map;
  };

  async function generateSceneOpeningAndChoices(mode: 'initial' | 'location_change') {
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

      const openingMsg: NarrativeMessage = {
        id: makeMessageId(mode === 'initial' ? 'scene_opening' : 'scene_opening_location_change'),
        type: 'narration',
        content: opening,
        timestamp: { ...gameTime },
      };

      if (mode === 'initial') {
        setMessages([openingMsg]);
      } else {
        setMessages((prev) => [...prev, openingMsg]);
      }

      setCurrentChoices(buildDefaultChoices(currentLocation, npcsHere));
    } catch (error) {
      console.error('Error generating scene opening:', error);
    }

    setIsGenerating(false);
  }

  // Generate initial scene once, and append a divider/opening on location change (without clearing chat history).
  useEffect(() => {
    if (!player || !currentLocation) return;

    const prevId = lastLocationIdRef.current;
    const nextId = player.currentLocationId;
    lastLocationIdRef.current = nextId;

    // First mount
    if (!prevId) {
      if (messages.length === 0) {
        const t = setTimeout(() => void generateSceneOpeningAndChoices('initial'), 0);
        return () => clearTimeout(t);
      }
      return;
    }

    // Location changed
    if (prevId !== nextId) {
      const t = setTimeout(() => {
        setActiveNPC(null);
        setSceneType('exploration');
        setCurrentChoices(buildDefaultChoices(currentLocation, npcsHere));

        const prevLoc = locations.get(prevId)?.name || prevId;
        addSystemMessage(`📍 Location changed: ${prevLoc} → ${currentLocation.name}`);

        void generateSceneOpeningAndChoices('location_change');
      }, 0);
      return () => clearTimeout(t);
    }
  }, [player?.currentLocationId]);

  const handleSendMessage = async () => {
    const raw = inputText.trim();
    if (!raw || isGenerating || !player) return;

    setInputText('');

    const lower = raw.toLowerCase();

    // ===== META COMMANDS =====
    if (lower === 'map') {
      onOpenMap();
      addSystemMessage('Opening map…');
      return;
    }

    if (lower === 'stats') {
      addSystemMessage(
        `Stats — Energy ${Math.round(player.energy)}% | Mood ${Math.round(player.mood)}% | Stress ${Math.round(player.stress)}% | Hygiene ${Math.round(player.hygiene)}% | Hunger ${Math.round(player.hunger)}% | $${player.finances.balance.toLocaleString()}`
      );
      return;
    }

    if (lower === 'relationships') {
      const top = Array.from(npcs.values())
        .sort((a, b) => b.relationship.romance + b.relationship.friendship - (a.relationship.romance + a.relationship.friendship))
        .slice(0, 5)
        .map((n) => `${n.name}: ❤️${Math.round(n.relationship.romance)}% 👥${Math.round(n.relationship.friendship)}% 🛡️${Math.round(n.relationship.trust)}%`);
      addSystemMessage(top.length > 0 ? `Relationships:\n${top.join('\n')}` : 'No relationships yet.');
      return;
    }

    if (lower === 'quests') {
      const active = Array.from(quests.values()).filter((q) => q.status === 'active');
      addSystemMessage(active.length ? `Active quests:\n${active.map((q) => `- ${q.title}`).join('\n')}` : 'No active quests.');
      return;
    }

    if (lower === 'save') {
      try {
        const data = saveGame();
        localStorage.setItem('ai_rpg_manual_save', data);
        addSystemMessage('💾 Game saved.');
      } catch (e) {
        console.error(e);
        addSystemMessage('Save failed.');
      }
      return;
    }

    if (lower === 'load') {
      try {
        const data = localStorage.getItem('ai_rpg_manual_save');
        if (!data) {
          addSystemMessage('No manual save found.');
          return;
        }
        loadGame(data);
        addSystemMessage('✅ Game loaded.');
      } catch (e) {
        console.error(e);
        addSystemMessage('Load failed.');
      }
      return;
    }

    if (lower === 'export') {
      try {
        const data = saveGame();
        addSystemMessage(`EXPORT:\n${data}`);
      } catch (e) {
        console.error(e);
        addSystemMessage('Export failed.');
      }
      return;
    }

    if (lower.startsWith('import ')) {
      try {
        const data = raw.slice('import '.length).trim();
        loadGame(data);
        addSystemMessage('✅ Import loaded.');
      } catch (e) {
        console.error(e);
        addSystemMessage('Import failed (invalid data).');
      }
      return;
    }

    if (lower === 'undo') {
      const last = undoStackRef.current.pop();
      if (!last) {
        addSystemMessage('Nothing to undo.');
        return;
      }
      applyRelationshipDelta(last.npcId, last.delta, -1);
      relationshipDeltaByMessageIdRef.current.delete(last.messageId);
      addSystemMessage('↩️ Undid last relationship change.');
      return;
    }

    if (lower === 'regen' || lower === 'regenerate' || lower === 'try again' || lower === 'regenerate that') {
      await regenerateLastResponse();
      return;
    }

    if (lower.startsWith('delete ')) {
      const n = Number.parseInt(raw.slice('delete '.length).trim(), 10);
      if (!Number.isFinite(n) || n <= 0) {
        addSystemMessage('Usage: delete [#]');
        return;
      }
      const numberMap = getMessageNumberMap();
      const target = [...numberMap.entries()].find(([, idx]) => idx === n);
      if (!target) {
        addSystemMessage(`No message #${n}`);
        return;
      }
      deleteMessage(target[0]);
      addSystemMessage(`Deleted message #${n}.`);
      return;
    }

    if (lower === 'delete' || lower === 'delete last' || lower === 'delete my last message') {
      const numberMap = getMessageNumberMap();
      const max = Math.max(0, ...numberMap.values());
      if (max === 0) {
        addSystemMessage('Nothing to delete.');
        return;
      }
      const target = [...numberMap.entries()].find(([, idx]) => idx === max);
      if (target) {
        deleteMessage(target[0]);
        addSystemMessage(`Deleted message #${max}.`);
      }
      return;
    }

    if (lower === 'help') {
      addSystemMessage(
        [
          'Commands:',
          '- regen / "try again": regenerate last response',
          '- delete [#]: delete message number',
          '- undo: undo last relationship change',
          '- save / load / export / import [data]',
          '- stats / relationships / quests',
          '- map',
        ].join('\n')
      );
      return;
    }

    // ===== NORMAL PLAY INPUT =====
    if (!currentLocation || !worldSettings) return;

    const playerMessage = raw;
    setIsGenerating(true);
    setLastPlayerMessage(playerMessage);

    // Add player message
    const playerMsg: NarrativeMessage = {
      id: makeMessageId('player'),
      type: 'player_action',
      content: playerMessage,
      speaker: player.name,
      timestamp: { ...gameTime },
    };
    setMessages((prev) => [...prev, playerMsg]);

    try {
      if (activeNPC && sceneType === 'dialogue') {
        await handleNPCConversation(playerMessage);
      } else {
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
    const npcMsgId = makeMessageId(`npc_${activeNPC.id}`);
    const npcMsg: NarrativeMessage = {
      id: npcMsgId,
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
        id: `${npcMsgId}_action`,
        type: 'npc_action',
        content: result.microExpression,
        speaker: activeNPC.name,
        speakerId: activeNPC.id,
        timestamp: { ...gameTime },
      };
      setMessages((prev) => [...prev, actionMsg]);
    }

    // Apply relationship changes and store them for potential reversal
    if (Object.keys(result.relationshipChanges).length > 0) {
      const before = activeNPC.relationship;
      const delta: RelationshipDelta = {};

      if (typeof result.relationshipChanges.friendship === 'number') {
        delta.friendship = result.relationshipChanges.friendship - before.friendship;
      }
      if (typeof result.relationshipChanges.romance === 'number') {
        delta.romance = result.relationshipChanges.romance - before.romance;
      }
      if (typeof result.relationshipChanges.trust === 'number') {
        delta.trust = result.relationshipChanges.trust - before.trust;
      }
      if (typeof result.relationshipChanges.respect === 'number') {
        delta.respect = result.relationshipChanges.respect - before.respect;
      }
      if (result.relationshipChanges.attraction) {
        delta.attraction = {
          ...(result.relationshipChanges.attraction.physical !== undefined
            ? { physical: result.relationshipChanges.attraction.physical - before.attraction.physical }
            : {}),
          ...(result.relationshipChanges.attraction.intellectual !== undefined
            ? { intellectual: result.relationshipChanges.attraction.intellectual - before.attraction.intellectual }
            : {}),
          ...(result.relationshipChanges.attraction.emotional !== undefined
            ? { emotional: result.relationshipChanges.attraction.emotional - before.attraction.emotional }
            : {}),
          ...(result.relationshipChanges.attraction.spiritual !== undefined
            ? { spiritual: result.relationshipChanges.attraction.spiritual - before.attraction.spiritual }
            : {}),
        };
      }

      relationshipDeltaByMessageIdRef.current.set(npcMsgId, { npcId: activeNPC.id, delta });
      undoStackRef.current.push({ npcId: activeNPC.id, messageId: npcMsgId, delta });
      updateNPCRelationship(activeNPC.id, result.relationshipChanges);

      // Simple jealousy: if romance increased here and you also have romance with someone else,
      // raise jealousy a bit on those others.
      if ((delta.romance ?? 0) > 0) {
        useGameStore.getState().npcs.forEach((other) => {
          if (other.id === activeNPC.id) return;
          if (other.relationship.romance >= 40) {
            const bump = Math.min(15, Math.max(2, Math.round((delta.romance ?? 0) * 2)));
            updateNPCRelationship(other.id, {
              jealousyLevel: clamp01(other.relationship.jealousyLevel + bump),
              trust: clamp01(other.relationship.trust - Math.round(bump / 3)),
            });
          }
        });
      }

      // Secrets: reveal when trust crosses threshold.
      const updatedNpc = useGameStore.getState().npcs.get(activeNPC.id);
      if (updatedNpc) {
        const revealable = updatedNpc.secrets
          .filter((s) => !s.revealed && updatedNpc.relationship.trust >= s.trustThresholdToReveal)
          .sort((a, b) => a.trustThresholdToReveal - b.trustThresholdToReveal)[0];
        if (revealable) {
          updateNPC(updatedNpc.id, {
            secrets: updatedNpc.secrets.map((s) =>
              s.id === revealable.id ? { ...s, revealed: true, revealedOnDay: gameTime.day } : s
            ),
          });
          addKnownFact(updatedNpc.id, `Secret: ${revealable.content}`, true);
          addSystemMessage(`🔓 SECRET UNLOCKED (${updatedNpc.name}): ${revealable.content}`);
        }
      }
    }

    // Add memory of this conversation to NPC
    const emotionImpactMap: Record<string, number> = {
      happy: 60, excited: 70, flirty: 50, content: 30,
      sad: -40, frustrated: -50, angry: -70, anxious: -30,
      bored: -10, lonely: -20, embarrassed: 10, jealous: -40,
      grateful: 50, nostalgic: 20, hopeful: 40, confused: 0,
    };
    const emotionalImpact = emotionImpactMap[result.detectedEmotion] || 0;
    const significance: 'forgettable' | 'notable' | 'important' | 'pivotal' | 'defining' =
      Math.abs(emotionalImpact) >= 90 ? 'defining' :
      Math.abs(emotionalImpact) >= 70 ? 'pivotal' :
      Math.abs(emotionalImpact) >= 40 ? 'important' :
      Math.abs(emotionalImpact) >= 20 ? 'notable' : 'forgettable';

    addNPCMemory(activeNPC.id, {
      description: `Had a conversation with ${player.name} at ${currentLocation?.name || 'unknown location'}: "${playerMessage.slice(0, 50)}${playerMessage.length > 50 ? '...' : ''}"`,
      day: gameTime.day,
      emotionalImpact,
      significance,
      tags: ['in_person', 'conversation', result.detectedEmotion],
      referenceWeight: 60,
      timesReferenced: 0,
      involvedNPCs: [],
      locationId: currentLocation?.id,
    });

    // Update choices for conversation
    const convoChoices: NarrativeChoice[] = [
      { id: 'continue', text: 'Continue talking...', type: 'dialogue' },
      { id: 'flirt', text: 'Say something flirty', type: 'dialogue' },
      { id: 'ask_about', text: 'Ask about their day', type: 'dialogue' },
      ...(activeNPC.relationship.romance >= 30 ? [{ id: 'date_plan', text: 'Plan a date', type: 'action' as const }] : []),
      { id: 'end_convo', text: 'End conversation', type: 'action' },
    ];
    setCurrentChoices(convoChoices);

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
    const narrationId = makeMessageId('narration');
    const narrationMsg: NarrativeMessage = {
      id: narrationId,
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
          id: `${narrationId}_npc_action`,
          type: 'npc_action',
          content: result.npcDialogue.action,
          speaker: result.npcDialogue.name,
          speakerId: npc?.id,
          timestamp: { ...gameTime },
        };
        setMessages((prev) => [...prev, actionMsg]);
      }

      const dialogueMsg: NarrativeMessage = {
        id: `${narrationId}_npc_dialogue`,
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

    // Date planning (minimal system)
    if (choice.id === 'date_plan' && activeNPC) {
      const formality = getOutfitFormality();
      setCurrentChoices([
        { id: 'date_cafe', text: '☕ Coffee date (The Cozy Bean) — $15, 60m', type: 'action' },
        { id: 'date_park', text: '🌳 Park walk (Riverside Park) — $20, 90m', type: 'action' },
        { id: 'date_fine', text: `🍝 Dinner (La Bella Notte) — $150, 120m (requires formality 3+, you are ${formality})`, type: 'action' },
        { id: 'continue', text: 'Never mind, keep talking', type: 'dialogue' },
        { id: 'end_convo', text: 'End conversation', type: 'action' },
      ]);
      return;
    }

    if (choice.id.startsWith('date_') && activeNPC && player) {
      const npcNow = useGameStore.getState().npcs.get(activeNPC.id);
      if (!npcNow) return;

      const formality = getOutfitFormality();
      const balance = player.finances.balance;

      const applyDate = (opts: { cost: number; minutes: number; romance: number; trust: number; narration: string }) => {
        if (balance < opts.cost) {
          addSystemMessage('You can’t afford that right now.');
          return;
        }

        // Spend money + time
        updatePlayer({
          finances: { ...player.finances, balance: player.finances.balance - opts.cost },
        });
        advanceTime(opts.minutes);

        // Relationship boost
        updateNPCRelationship(npcNow.id, {
          romance: clamp01(npcNow.relationship.romance + opts.romance),
          trust: clamp01(npcNow.relationship.trust + opts.trust),
          friendship: clamp01(npcNow.relationship.friendship + Math.max(1, Math.round(opts.romance / 2))),
        });

        // Log a memory
        addNPCMemory(npcNow.id, {
          description: `Went on a date with ${player.name}: ${opts.narration}`,
          day: gameTime.day,
          emotionalImpact: 70,
          significance: 'pivotal',
          tags: ['date', 'romance'],
          referenceWeight: 80,
          timesReferenced: 0,
          involvedNPCs: [],
          locationId: player.currentLocationId,
        });

        // Narrate in the main window
        setMessages((prev) => [
          ...prev,
          {
            id: makeMessageId('date_narration'),
            type: 'narration',
            content: opts.narration,
            timestamp: { ...gameTime },
          },
        ]);

        // Return to conversation flow
        setCurrentChoices([
          { id: 'continue', text: 'Continue talking...', type: 'dialogue' },
          { id: 'flirt', text: 'Say something flirty', type: 'dialogue' },
          { id: 'ask_about', text: 'Ask about their day', type: 'dialogue' },
          { id: 'end_convo', text: 'End conversation', type: 'action' },
        ]);
      };

      if (choice.id === 'date_cafe') {
        applyDate({
          cost: 15,
          minutes: 60,
          romance: 5,
          trust: 1,
          narration: `You and ${npcNow.name} settle into a cozy corner with warm drinks. *Their smile comes easier as the hour slips by.*`,
        });
        return;
      }

      if (choice.id === 'date_park') {
        applyDate({
          cost: 20,
          minutes: 90,
          romance: 8,
          trust: 2,
          narration: `You and ${npcNow.name} walk the park trails together, shoulders brushing now and then. *The conversation turns softer, more personal.*`,
        });
        return;
      }

      if (choice.id === 'date_fine') {
        if (formality < 3) {
          addSystemMessage('Your outfit is too casual for that venue. Change into something more formal first.');
          return;
        }
        applyDate({
          cost: 150,
          minutes: 120,
          romance: 12,
          trust: 2,
          narration: `Candlelight and quiet music frame the evening as you share a long dinner with ${npcNow.name}. *They keep meeting your eyes, lingering just a beat.*`,
        });
        return;
      }
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
      id: makeMessageId('conversation_start'),
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
        id: makeMessageId('conversation_end'),
        type: 'narration',
        content: `You say goodbye to ${activeNPC.name} and step away.`,
        timestamp: { ...gameTime },
      };
      setMessages((prev) => [...prev, endMsg]);
    }

    setActiveNPC(null);
    setSceneType('exploration');
    setCurrentChoices(buildDefaultChoices(currentLocation, npcsHere));
  };

  // Delete a message and reverse any relationship changes if it was an NPC message
  const deleteMessage = (messageId: string) => {
    const messageToDelete = messages.find((m) => m.id === messageId);
    if (!messageToDelete) return;

    // Reverse relationship delta if we recorded one for this message.
    const deltaEntry = relationshipDeltaByMessageIdRef.current.get(messageId);
    if (deltaEntry) {
      applyRelationshipDelta(deltaEntry.npcId, deltaEntry.delta, -1);
      relationshipDeltaByMessageIdRef.current.delete(messageId);
    }

    // Remove the message and any attached micro-expression/action siblings.
    const base = messageId.replace(/_npc_dialogue$/, '');
    setMessages((prev) =>
      prev.filter((m) => {
        if (m.id === messageId) return false;
        if (m.id === `${messageId}_action`) return false;
        if (m.id.startsWith(`${messageId}_`)) return false;
        if (m.id === `${base}_npc_action`) return false;
        return true;
      })
    );
    setMessageMenuOpen(null);
  };

  // Regenerate the last AI response
  const regenerateLastResponse = async () => {
    if (!lastPlayerMessage || isGenerating || !player) return;

    // Remove everything after the last player input, then regenerate.
    const toRemove: string[] = [];
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (m.type === 'player_action') break;
      toRemove.push(m.id);
    }

    // Reverse any recorded relationship deltas for removed messages.
    for (const id of toRemove) {
      const deltaEntry = relationshipDeltaByMessageIdRef.current.get(id);
      if (deltaEntry) {
        applyRelationshipDelta(deltaEntry.npcId, deltaEntry.delta, -1);
        relationshipDeltaByMessageIdRef.current.delete(id);
      }
    }
    setMessages((prev) => prev.filter((m) => !toRemove.includes(m.id)));

    setIsGenerating(true);

    try {
      if (activeNPC && sceneType === 'dialogue') {
        await handleNPCConversation(lastPlayerMessage);
      } else {
        await handleNarrativeAction(lastPlayerMessage);
      }
    } catch (error) {
      console.error('Error regenerating response:', error);
      addSystemMessage('Failed to regenerate. Try again.');
    }

    setIsGenerating(false);
  };

  const formatTime = (time: typeof gameTime) => {
    const hour = time.hour % 12 || 12;
    const ampm = time.hour >= 12 ? 'PM' : 'AM';
    return `${hour}:${time.minute.toString().padStart(2, '0')} ${ampm}`;
  };

  // Debug: Show helpful message if location not found
  if (!player) {
    return (
      <div className="flex flex-col h-full bg-gray-900 rounded-2xl border border-gray-700 items-center justify-center">
        <p className="text-gray-400">Loading player data...</p>
      </div>
    );
  }

  if (!currentLocation) {
    return (
      <div className="flex flex-col h-full bg-gray-900 rounded-2xl border border-gray-700 items-center justify-center p-8">
        <MapPin className="w-12 h-12 text-gray-600 mb-4" />
        <p className="text-gray-400 text-center mb-4">
          No location found. Setting up your starting location...
        </p>
        <p className="text-gray-500 text-sm text-center mb-4">
          Location ID: {player.currentLocationId}<br />
          Available locations: {locations.size}
        </p>
        <button
          onClick={onOpenMap}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium"
        >
          Open Map
        </button>
      </div>
    );
  }

  const messageNumberMap = getMessageNumberMap();

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
        {messages.map((msg, index) => {
          const isLastAIMessage = index === messages.length - 1 &&
            (msg.type === 'dialogue' || msg.type === 'narration');
          const canDelete = msg.type !== 'player_action' && messages.length > 1;
          const showMenu = messageMenuOpen === msg.id;
          const messageNumber = messageNumberMap.get(msg.id);

          return (
            <div key={msg.id} className="animate-fadeIn group relative">
              {msg.type !== 'npc_action' && messageNumber !== undefined && (
                <div className="absolute -left-2 top-0 -translate-x-full text-xs text-gray-600 opacity-0 group-hover:opacity-100 select-none">
                  #{messageNumber}
                </div>
              )}
              {msg.type === 'narration' && (
                <div className="flex items-start gap-2">
                  <div className="flex-1 text-gray-300 leading-relaxed italic">
                    {msg.content}
                  </div>
                  {canDelete && (
                    <div className="relative">
                      <button
                        onClick={() => setMessageMenuOpen(showMenu ? null : msg.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded text-gray-500 hover:text-white transition-all"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {showMenu && (
                        <div className="absolute right-0 top-6 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
                          {isLastAIMessage && lastPlayerMessage && (
                            <button
                              onClick={regenerateLastResponse}
                              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                            >
                              <RefreshCw className="w-4 h-4" /> Regenerate
                            </button>
                          )}
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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
                    <div className="flex items-start gap-2">
                      <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 text-white flex-1">
                        {msg.content}
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setMessageMenuOpen(showMenu ? null : msg.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded text-gray-500 hover:text-white transition-all"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {showMenu && (
                          <div className="absolute right-0 top-6 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
                            {isLastAIMessage && lastPlayerMessage && (
                              <button
                                onClick={regenerateLastResponse}
                                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                              >
                                <RefreshCw className="w-4 h-4" /> Regenerate
                              </button>
                            )}
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {msg.type === 'player_action' && (
                <div className="flex gap-3 justify-end">
                  <div className="max-w-[80%] flex items-start gap-2">
                    <div className="relative">
                      <button
                        onClick={() => setMessageMenuOpen(showMenu ? null : msg.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded text-gray-500 hover:text-white transition-all"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {showMenu && (
                        <div className="absolute left-0 top-6 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
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
          );
        })}

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
