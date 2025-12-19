import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { enableMapSet, current } from 'immer';
import type {
  GameTime,
  Player,
  NPC,
  Location,
  Quest,
  GameEvent,
  PhoneState,
  Weather,
  DayOfWeek,
  TimeOfDay,
  Message,
  Notification,
  Transaction,
  NPCMemory,
  DialogueState,
  WorldSettings,
  Email,
  EmailState,
} from '@/types';
import { autonomousNPC } from '@/systems/autonomousNPC';

// Enable Immer's MapSet plugin for Map/Set support
enableMapSet();

// =====================================================
// GAME STATE INTERFACE
// =====================================================

interface GameState {
  // Core State
  initialized: boolean;
  paused: boolean;
  gameSpeed: number; // 1 = normal, 2 = fast, 0.5 = slow

  // Time
  gameTime: GameTime;
  realTimeRatio: number; // Real minutes per game hour

  // World Settings
  worldSettings: WorldSettings | null;

  // Entities
  player: Player | null;
  npcs: Map<string, NPC>;
  locations: Map<string, Location>;
  quests: Map<string, Quest>;
  events: GameEvent[];

  // Communication
  phone: PhoneState | null;
  emailState: EmailState | null;

  // Dialogue
  dialogue: DialogueState | null;

  // Global Flags
  globalFlags: Record<string, boolean | string | number>;

  // World Wiki (auto-generated lore)
  worldWiki: Map<string, { title: string; content: string; category: string }>;

  // Pending Events Queue
  eventQueue: GameEvent[];

  // Statistics
  totalPlayTime: number; // Minutes
}

interface GameActions {
  // Initialization
  initializeGame: (playerData: Partial<Player>) => void;
  loadGame: (saveData: string) => void;
  saveGame: () => string;
  resetGame: () => void;

  // Time Management
  advanceTime: (minutes: number) => void;
  setGameSpeed: (speed: number) => void;
  pauseGame: () => void;
  resumeGame: () => void;

  // Player Actions
  updatePlayer: (updates: Partial<Player>) => void;
  updatePlayerStats: (stats: Partial<Player['stats']>) => void;
  updatePlayerFinances: (finances: Partial<Player['finances']>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void;
  changeEnergy: (amount: number) => void;
  changeStress: (amount: number) => void;
  changeMood: (amount: number) => void;
  changeHygiene: (amount: number) => void;
  moveToLocation: (locationId: string) => void;

  // NPC Actions
  addNPC: (npc: NPC) => void;
  updateNPC: (npcId: string, updates: Partial<NPC>) => void;
  updateNPCRelationship: (npcId: string, updates: Partial<NPC['relationship']>) => void;
  addNPCMemory: (npcId: string, memory: Omit<NPCMemory, 'id'>) => void;
  setNPCPortrait: (npcId: string, portraitUrl: string) => void;
  addKnownFact: (npcId: string, fact: string, canReference?: boolean) => void;
  getNPC: (npcId: string) => NPC | undefined;
  getNPCsAtLocation: (locationId: string) => NPC[];
  triggerNPCInitiatedMessage: () => void;

  // Location Actions
  addLocation: (location: Location) => void;
  updateLocation: (locationId: string, updates: Partial<Location>) => void;
  unlockLocation: (locationId: string) => void;
  getLocation: (locationId: string) => Location | undefined;

  // Quest Actions
  addQuest: (quest: Quest) => void;
  updateQuest: (questId: string, updates: Partial<Quest>) => void;
  completeQuestObjective: (questId: string, objectiveId: string) => void;
  failQuest: (questId: string) => void;

  // Event Actions
  triggerEvent: (event: GameEvent) => void;
  queueEvent: (event: GameEvent) => void;
  processEventQueue: () => GameEvent | null;

  // Phone/Communication Actions
  sendMessage: (npcId: string, content: string) => void;
  sendTextMessage: (npcId: string, content: string) => void;
  receiveMessage: (npcId: string, content: string) => void;
  setConversationTyping: (npcId: string, typing: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  markMessageRead: (conversationId: string, messageId: string) => void;
  markNotificationRead: (notificationId: string) => void;

  // Email Actions
  addEmail: (email: Omit<Email, 'id'>) => void;
  markEmailRead: (emailId: string) => void;
  deleteEmail: (emailId: string) => void;
  replyToEmail: (emailId: string, body: string) => void;

  // World Settings Actions
  setWorldSettings: (settings: WorldSettings) => void;
  updateWorldSettings: (updates: Partial<WorldSettings>) => void;
  setLocationImage: (locationId: string, imageUrl: string) => void;

  // Dialogue Actions
  startDialogue: (npcId: string) => void;
  endDialogue: () => void;
  addDialogueTurn: (speaker: 'player' | 'npc', content: string) => void;

  // Utility Actions
  setFlag: (key: string, value: boolean | string | number) => void;
  getFlag: (key: string) => boolean | string | number | undefined;
  addWikiEntry: (id: string, title: string, content: string, category: string) => void;

  // Helpers
  getTimeOfDay: () => TimeOfDay;
  isLocationOpen: (locationId: string) => boolean;
  canAfford: (amount: number) => boolean;
  getLocationsCount: () => number;
  getNPCsCount: () => number;
}

type GameStore = GameState & GameActions;

// =====================================================
// INITIAL STATE
// =====================================================

const initialState: GameState = {
  initialized: false,
  paused: false,
  gameSpeed: 1,

  gameTime: {
    day: 1,
    hour: 8,
    minute: 0,
    dayOfWeek: 'monday',
    season: 'spring',
    weather: 'sunny',
  },
  realTimeRatio: 1, // 1 real minute = 1 game hour

  worldSettings: null,

  player: null,
  npcs: new Map(),
  locations: new Map(),
  quests: new Map(),
  events: [],

  phone: null,
  emailState: null,
  dialogue: null,

  globalFlags: {},
  worldWiki: new Map(),
  eventQueue: [],

  totalPlayTime: 0,
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const getDayOfWeek = (day: number): DayOfWeek => {
  const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  return days[(day - 1) % 7];
};

const getTimeOfDay = (hour: number): TimeOfDay => {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  if (hour >= 21 || hour < 1) return 'night';
  return 'late_night';
};

const generateId = () => Math.random().toString(36).substring(2, 15);

// =====================================================
// GAME STORE
// =====================================================

export const useGameStore = create<GameStore>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      // ===== INITIALIZATION =====

      initializeGame: (playerData) => {
        set((state) => {
          state.initialized = true;

          // Create player with defaults
          state.player = {
            id: generateId(),
            name: playerData.name || 'Player',
            age: playerData.age || 25,
            gender: playerData.gender || 'male',

            stats: {
              charisma: 50,
              intelligence: 50,
              empathy: 50,
              humor: 50,
              confidence: 50,
              fitness: 50,
              creativity: 50,
              cooking: 20,
              dancing: 20,
              ...playerData.stats,
            },

            appearance: playerData.appearance || {
              hairStyle: 'short',
              hairColor: 'brown',
              bodyType: 'average',
              skinTone: 'medium',
              height: 'average',
            },

            currentOutfit: playerData.currentOutfit || {
              top: {
                id: 'basic_tshirt',
                name: 'Basic T-Shirt',
                slot: 'top',
                style: 'casual',
                formalityLevel: 1,
                condition: 100,
                cleanliness: 100,
                warmth: 2,
                cost: 20,
                color: 'white',
                description: 'A simple white t-shirt',
                isWet: false,
                hasStain: false,
              },
              bottom: {
                id: 'basic_jeans',
                name: 'Blue Jeans',
                slot: 'bottom',
                style: 'casual',
                formalityLevel: 2,
                condition: 100,
                cleanliness: 100,
                warmth: 3,
                cost: 50,
                color: 'blue',
                description: 'Classic blue jeans',
                isWet: false,
                hasStain: false,
              },
              shoes: {
                id: 'basic_sneakers',
                name: 'White Sneakers',
                slot: 'shoes',
                style: 'casual',
                formalityLevel: 1,
                condition: 100,
                cleanliness: 100,
                warmth: 2,
                cost: 60,
                color: 'white',
                description: 'Comfortable white sneakers',
                isWet: false,
                hasStain: false,
              },
            },

            wardrobe: [],

            finances: {
              balance: 1500,
              monthlyIncome: 3200,
              monthlyExpenses: 1650,
              savingsGoals: [],
              pendingBills: [
                {
                  id: 'rent',
                  name: 'Rent',
                  amount: 900,
                  dueDay: 1,
                  recurring: true,
                  paid: false,
                  category: 'rent',
                },
                {
                  id: 'utilities',
                  name: 'Utilities',
                  amount: 150,
                  dueDay: 5,
                  recurring: true,
                  paid: false,
                  category: 'utilities',
                },
                {
                  id: 'phone',
                  name: 'Phone Bill',
                  amount: 80,
                  dueDay: 15,
                  recurring: true,
                  paid: false,
                  category: 'subscription',
                },
              ],
              transactions: [],
              creditScore: 700,
              ...playerData.finances,
            },

            career: playerData.career || {
              employed: true,
              companyName: 'TechVision Solutions',
              position: 'Junior Marketing Associate',
              department: 'Digital Marketing',
              salary: 38400,
              payFrequency: 'biweekly',
              nextPayday: 14,
              workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
              workStartHour: 9,
              workEndHour: 17,
              performance: 70,
              bossApproval: 60,
              employmentDuration: 240,
              promotionRequirements: [
                { description: '6 months experience', met: true },
                { description: 'Complete major project', met: false },
                { description: 'Performance rating 85%+', met: false },
                { description: 'Boss approval 80%+', met: false },
              ],
              workProjects: [],
            },

            energy: 100,
            stress: 20,
            mood: 70,
            hygiene: 100,
            hunger: 20,

            currentLocationId: 'home',
            homeLocationId: 'home',

            reputation: 50,

            inventory: [],
            unlockedLocations: ['home', 'downtown_cafe', 'city_park', 'grocery_store'],
            achievements: [],
            flags: {},
          };

          // Initialize phone
          state.phone = {
            battery: 100,
            signal: 4,
            wifi: true,
            conversations: [],
            notifications: [],
            callLog: [],
            emails: [
              {
                id: 'welcome_email',
                from: 'City Welcome Center',
                fromAddress: 'welcome@city.gov',
                subject: 'Welcome to your new journey!',
                body: 'Welcome! Your adventure begins today. Make the most of every moment.\n\nWe hope you enjoy your time in our wonderful city. Feel free to explore, meet new people, and discover all that life has to offer.',
                timestamp: { ...state.gameTime },
                read: false,
                starred: false,
                folder: 'inbox',
              },
            ],
            contacts: [],
            blockedContacts: [],
            socialMediaFeed: [],
          };
        });
      },

      loadGame: (saveData) => {
        try {
          const parsed = JSON.parse(saveData);
          set((state) => {
            // Manually assign each property to avoid Immer issues
            state.initialized = parsed.initialized ?? false;
            state.paused = parsed.paused ?? false;
            state.gameSpeed = parsed.gameSpeed ?? 1;
            state.gameTime = parsed.gameTime;
            state.realTimeRatio = parsed.realTimeRatio ?? 1;
            state.worldSettings = parsed.worldSettings ?? null;
            state.player = parsed.player ?? null;
            state.events = parsed.events ?? [];
            state.phone = parsed.phone ?? null;
            state.emailState = parsed.emailState ?? null;
            state.dialogue = parsed.dialogue ?? null;
            state.globalFlags = parsed.globalFlags ?? {};
            state.eventQueue = parsed.eventQueue ?? [];
            state.totalPlayTime = parsed.totalPlayTime ?? 0;

            // Convert Maps back from objects
            state.npcs.clear();
            if (parsed.npcs) {
              Object.entries(parsed.npcs).forEach(([key, value]) => {
                state.npcs.set(key, value as NPC);
              });
            }
            state.locations.clear();
            if (parsed.locations) {
              Object.entries(parsed.locations).forEach(([key, value]) => {
                state.locations.set(key, value as Location);
              });
            }
            state.quests.clear();
            if (parsed.quests) {
              Object.entries(parsed.quests).forEach(([key, value]) => {
                state.quests.set(key, value as Quest);
              });
            }
            state.worldWiki.clear();
            if (parsed.worldWiki) {
              Object.entries(parsed.worldWiki).forEach(([key, value]) => {
                state.worldWiki.set(key, value as any);
              });
            }
          });
        } catch (e) {
          console.error('Failed to load game:', e);
        }
      },

      saveGame: () => {
        const state = get();
        const saveData = {
          ...state,
          npcs: Object.fromEntries(state.npcs),
          locations: Object.fromEntries(state.locations),
          quests: Object.fromEntries(state.quests),
          worldWiki: Object.fromEntries(state.worldWiki),
        };
        return JSON.stringify(saveData);
      },

      resetGame: () => {
        set((state) => {
          state.initialized = false;
          state.paused = false;
          state.gameSpeed = 1;
          state.gameTime = {
            day: 1,
            hour: 8,
            minute: 0,
            dayOfWeek: 'monday',
            season: 'spring',
            weather: 'sunny',
          };
          state.realTimeRatio = 1;
          state.worldSettings = null;
          state.player = null;
          state.npcs = new Map();
          state.locations = new Map();
          state.quests = new Map();
          state.events = [];
          state.phone = null;
          state.emailState = null;
          state.dialogue = null;
          state.globalFlags = {};
          state.worldWiki = new Map();
          state.eventQueue = [];
          state.totalPlayTime = 0;
        });
      },

      // ===== TIME MANAGEMENT =====

      advanceTime: (minutes) => {
        set((state) => {
          let newMinute = state.gameTime.minute + minutes;
          let newHour = state.gameTime.hour;
          let newDay = state.gameTime.day;

          // Handle minute overflow
          while (newMinute >= 60) {
            newMinute -= 60;
            newHour += 1;
          }

          // Handle hour overflow
          while (newHour >= 24) {
            newHour -= 24;
            newDay += 1;
          }

          state.gameTime = {
            ...state.gameTime,
            minute: newMinute,
            hour: newHour,
            day: newDay,
            dayOfWeek: getDayOfWeek(newDay),
          };

          // Update player stats based on time passing
          if (state.player) {
            // Energy decay
            state.player.energy = Math.max(0, state.player.energy - minutes * 0.05);
            // Hunger increases
            state.player.hunger = Math.min(100, state.player.hunger + minutes * 0.03);
            // Hygiene decay
            state.player.hygiene = Math.max(0, state.player.hygiene - minutes * 0.02);
          }

          // Update NPC states using autonomous engine
          Array.from(state.npcs.keys()).forEach((id) => {
            const npc = state.npcs.get(id);
            if (!npc || !state.player) return;

            // Simulate NPC's day - updates location, mood, energy, availability
            const updates = autonomousNPC.simulateNPCDay(npc, state.gameTime);
            Object.assign(npc, updates);

            // Decay relationship if neglected
            if (npc.relationship.daysSinceContact > 3) {
              npc.relationship.friendship = Math.max(0, npc.relationship.friendship - 0.5);
              npc.relationship.romance = Math.max(0, npc.relationship.romance - 1);
              npc.relationship.neglectWarning = npc.relationship.daysSinceContact > 5;
            }

            // Increment daysSinceContact (reset when player messages them)
            npc.relationship.daysSinceContact += minutes / (24 * 60);

            // Random life events
            if (Math.random() < 0.05) {
              const lifeEvent = autonomousNPC.generateLifeEvent(npc, state.gameTime);
              if (lifeEvent) {
                // Store the life event in NPC's memory
                npc.memories.push({
                  id: generateId(),
                  description: lifeEvent.description,
                  day: state.gameTime.day,
                  emotionalImpact: lifeEvent.type.includes('success') ? 20 : lifeEvent.type.includes('stress') || lifeEvent.type.includes('sick') ? -20 : 0,
                  significance: lifeEvent.type.includes('success') || lifeEvent.type.includes('excited') ? 'notable' : 'forgettable',
                  tags: [lifeEvent.type, 'autonomous_event'],
                  referenceWeight: 1,
                  timesReferenced: 0,
                  involvedNPCs: [],
                });
              }
            }
          });

          state.totalPlayTime += minutes;
        });

        // Occasionally trigger NPC-initiated messages (every ~30 game minutes on average)
        if (Math.random() < minutes / 30) {
          get().triggerNPCInitiatedMessage();
        }
      },

      setGameSpeed: (speed) => {
        set((state) => {
          state.gameSpeed = speed;
        });
      },

      pauseGame: () => {
        set((state) => {
          state.paused = true;
        });
      },

      resumeGame: () => {
        set((state) => {
          state.paused = false;
        });
      },

      // ===== PLAYER ACTIONS =====

      updatePlayer: (updates) => {
        set((state) => {
          if (state.player) {
            Object.assign(state.player, updates);
          }
        });
      },

      updatePlayerStats: (stats) => {
        set((state) => {
          if (state.player) {
            Object.assign(state.player.stats, stats);
          }
        });
      },

      updatePlayerFinances: (finances) => {
        set((state) => {
          if (state.player) {
            Object.assign(state.player.finances, finances);
          }
        });
      },

      addTransaction: (transaction) => {
        set((state) => {
          if (state.player) {
            const newTransaction = {
              ...transaction,
              id: generateId(),
              timestamp: { ...state.gameTime },
            };
            state.player.finances.transactions.push(newTransaction);
            state.player.finances.balance += transaction.amount;
          }
        });
      },

      changeEnergy: (amount) => {
        set((state) => {
          if (state.player) {
            state.player.energy = Math.max(0, Math.min(100, state.player.energy + amount));
          }
        });
      },

      changeStress: (amount) => {
        set((state) => {
          if (state.player) {
            state.player.stress = Math.max(0, Math.min(100, state.player.stress + amount));
          }
        });
      },

      changeMood: (amount) => {
        set((state) => {
          if (state.player) {
            state.player.mood = Math.max(0, Math.min(100, state.player.mood + amount));
          }
        });
      },

      changeHygiene: (amount) => {
        set((state) => {
          if (state.player) {
            state.player.hygiene = Math.max(0, Math.min(100, state.player.hygiene + amount));
          }
        });
      },

      moveToLocation: (locationId) => {
        set((state) => {
          if (state.player) {
            const location = state.locations.get(locationId);
            if (location && (location.unlocked || state.player.unlockedLocations.includes(locationId))) {
              state.player.currentLocationId = locationId;
            }
          }
        });
      },

      // ===== NPC ACTIONS =====

      addNPC: (npc) => {
        set((state) => {
          state.npcs.set(npc.id, npc);

          // Add to phone contacts
          if (state.phone) {
            state.phone.contacts.push({
              id: generateId(),
              npcId: npc.id,
              blocked: false,
              favorite: false,
            });

            // Create conversation
            state.phone.conversations.push({
              id: generateId(),
              npcId: npc.id,
              messages: [],
              unreadCount: 0,
              lastMessageTime: state.gameTime,
              typing: false,
              readReceipts: true,
            });
          }
        });
      },

      updateNPC: (npcId, updates) => {
        set((state) => {
          const npc = state.npcs.get(npcId);
          if (npc) {
            Object.assign(npc, updates);
          }
        });
      },

      updateNPCRelationship: (npcId, updates) => {
        set((state) => {
          const npc = state.npcs.get(npcId);
          if (npc) {
            Object.assign(npc.relationship, updates);
          }
        });
      },

      addNPCMemory: (npcId, memory) => {
        set((state) => {
          const npc = state.npcs.get(npcId);
          if (npc) {
            const newMemory = { ...memory, id: generateId() };
            npc.memories.push(newMemory);
          }
        });
      },

      setNPCPortrait: (npcId, portraitUrl) => {
        set((state) => {
          const npc = state.npcs.get(npcId);
          if (npc) {
            npc.appearance.portraitUrl = portraitUrl;
          }
        });
      },

      addKnownFact: (npcId, fact, canReference = true) => {
        set((state) => {
          const npc = state.npcs.get(npcId);
          if (npc) {
            const newFact = {
              id: generateId(),
              category: 'personal' as const,
              fact,
              discoveredOnDay: state.gameTime.day,
              importance: 'minor' as const,
              canReference,
            };
            npc.knownFacts.push(newFact);
          }
        });
      },

      getNPC: (npcId) => {
        return get().npcs.get(npcId);
      },

      getNPCsAtLocation: (locationId) => {
        const npcs: NPC[] = [];
        Array.from(get().npcs.values()).forEach((npc) => {
          if (npc.currentState.currentLocationId === locationId) {
            npcs.push(npc);
          }
        });
        return npcs;
      },

      triggerNPCInitiatedMessage: () => {
        const state = get();
        if (!state.player || !state.phone) return;

        // Get NPCs the player knows (has had contact with)
        const knownNPCs: NPC[] = [];
        Array.from(state.npcs.values()).forEach((npc) => {
          if (npc.relationship.totalInteractions > 0 || npc.relationship.friendship > 10) {
            knownNPCs.push(npc);
          }
        });

        if (knownNPCs.length === 0) return;

        // Check each NPC to see if they should proactively text
        knownNPCs.forEach((npc) => {
          if (autonomousNPC.shouldNPCTextPlayer(npc, state.player!, state.gameTime)) {
            // Generate contextual message using autonomous engine
            const content = autonomousNPC.generateProactiveMessage(npc, state.player!, state.gameTime);

            // Send the message
            set((s) => {
              if (!s.phone) return;

              let conversation = s.phone.conversations.find((c) => c.npcId === npc.id);
              if (!conversation) {
                conversation = {
                  id: generateId(),
                  npcId: npc.id,
                  messages: [],
                  unreadCount: 0,
                  lastMessageTime: { ...s.gameTime },
                  typing: false,
                  readReceipts: true,
                };
                s.phone.conversations.push(conversation);

                // Ensure contact exists
                const contactExists = s.phone.contacts.some((c) => c.npcId === npc.id);
                if (!contactExists) {
                  s.phone.contacts.push({
                    id: generateId(),
                    npcId: npc.id,
                    blocked: false,
                    favorite: false,
                  });
                }
              }

              const newMessage: Message = {
                id: generateId(),
                senderId: npc.id,
                content,
                timestamp: { ...s.gameTime },
                read: false,
                delivered: true,
              };
              conversation.messages.push(newMessage);
              conversation.unreadCount += 1;
              conversation.lastMessageTime = { ...s.gameTime };

              // Add notification
              s.phone.notifications.push({
                id: generateId(),
                type: 'message',
                title: npc.name,
                body: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                timestamp: { ...s.gameTime },
                read: false,
                sourceNpcId: npc.id,
                urgent: false,
              });
            });
          }
        });
      },

      // ===== LOCATION ACTIONS =====

      addLocation: (location) => {
        set((state) => {
          state.locations.set(location.id, location);
        });
      },

      updateLocation: (locationId, updates) => {
        set((state) => {
          const location = state.locations.get(locationId);
          if (location) {
            Object.assign(location, updates);
          }
        });
      },

      unlockLocation: (locationId) => {
        set((state) => {
          const location = state.locations.get(locationId);
          if (location) {
            location.unlocked = true;
          }
          if (state.player && !state.player.unlockedLocations.includes(locationId)) {
            state.player.unlockedLocations.push(locationId);
          }
        });
      },

      getLocation: (locationId) => {
        return get().locations.get(locationId);
      },

      // ===== QUEST ACTIONS =====

      addQuest: (quest) => {
        set((state) => {
          state.quests.set(quest.id, quest);
        });
      },

      updateQuest: (questId, updates) => {
        set((state) => {
          const quest = state.quests.get(questId);
          if (quest) {
            Object.assign(quest, updates);
          }
        });
      },

      completeQuestObjective: (questId, objectiveId) => {
        set((state) => {
          const quest = state.quests.get(questId);
          if (quest) {
            const objective = quest.objectives.find((obj) => obj.id === objectiveId);
            if (objective) {
              objective.completed = true;
            }
            const allComplete = quest.objectives.every((obj) => obj.completed);
            if (allComplete) {
              quest.status = 'completed';
              quest.completedOnDay = state.gameTime.day;
            }
          }
        });
      },

      failQuest: (questId) => {
        set((state) => {
          const quest = state.quests.get(questId);
          if (quest) {
            quest.status = 'failed';
          }
        });
      },

      // ===== EVENT ACTIONS =====

      triggerEvent: (event) => {
        set((state) => {
          state.events.push({ ...event, triggered: true, triggeredOnDay: state.gameTime.day });
        });
      },

      queueEvent: (event) => {
        set((state) => {
          state.eventQueue.push(event);
          // Sort by priority
          state.eventQueue.sort((a, b) => b.priority - a.priority);
        });
      },

      processEventQueue: () => {
        const state = get();
        if (state.eventQueue.length === 0) return null;

        const event = state.eventQueue[0];
        set((s) => {
          s.eventQueue.shift();
        });
        return event;
      },

      // ===== PHONE/COMMUNICATION ACTIONS =====

      sendMessage: (npcId, content) => {
        set((state) => {
          if (state.phone) {
            const conversation = state.phone.conversations.find((c) => c.npcId === npcId);
            if (conversation) {
              const newMessage: Message = {
                id: generateId(),
                senderId: 'player',
                content,
                timestamp: { ...state.gameTime },
                read: true,
                delivered: true,
              };
              conversation.messages.push(newMessage);
              conversation.lastMessageTime = { ...state.gameTime };
            }
          }

          // Reset days since contact and increment totalInteractions
          const npc = state.npcs.get(npcId);
          if (npc) {
            npc.relationship.daysSinceContact = 0;
            npc.relationship.neglectWarning = false;
            npc.relationship.totalInteractions += 1;
          }
        });
      },

      receiveMessage: (npcId, content) => {
        set((state) => {
          if (state.phone) {
            const conversation = state.phone.conversations.find((c) => c.npcId === npcId);
            if (conversation) {
              const newMessage: Message = {
                id: generateId(),
                senderId: npcId,
                content,
                timestamp: { ...state.gameTime },
                read: false,
                delivered: true,
              };
              conversation.messages.push(newMessage);
              conversation.unreadCount += 1;
              conversation.lastMessageTime = { ...state.gameTime };

              // Add notification
              const npc = state.npcs.get(npcId);
              state.phone.notifications.push({
                id: generateId(),
                type: 'message',
                title: npc?.name || 'New Message',
                body: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                timestamp: { ...state.gameTime },
                read: false,
                sourceNpcId: npcId,
                urgent: false,
              });
            }
          }
        });
      },

      setConversationTyping: (npcId, typing) => {
        set((state) => {
          if (state.phone) {
            const conversation = state.phone.conversations.find((c) => c.npcId === npcId);
            if (conversation) {
              conversation.typing = typing;
            }
          }
        });
      },

      addNotification: (notification) => {
        set((state) => {
          if (state.phone) {
            state.phone.notifications.push({
              ...notification,
              id: generateId(),
              timestamp: { ...state.gameTime },
            });
          }
        });
      },

      markMessageRead: (conversationId, messageId) => {
        set((state) => {
          if (state.phone) {
            const conversation = state.phone.conversations.find((c) => c.id === conversationId);
            if (conversation) {
              const message = conversation.messages.find((m) => m.id === messageId);
              if (message && !message.read) {
                message.read = true;
                conversation.unreadCount = Math.max(0, conversation.unreadCount - 1);
              }
            }
          }
        });
      },

      markNotificationRead: (notificationId) => {
        set((state) => {
          if (state.phone) {
            const notification = state.phone.notifications.find((n) => n.id === notificationId);
            if (notification) {
              notification.read = true;
            }
          }
        });
      },

      sendTextMessage: (npcId, content) => {
        set((state) => {
          if (state.phone) {
            // Ensure NPC is in contacts - add them if they're not
            const contactExists = state.phone.contacts.some((c) => c.npcId === npcId);
            if (!contactExists) {
              state.phone.contacts.push({
                id: generateId(),
                npcId,
                blocked: false,
                favorite: false,
              });
            }

            let conversation = state.phone.conversations.find((c) => c.npcId === npcId);
            if (!conversation) {
              // Create new conversation if it doesn't exist
              const newConv = {
                id: generateId(),
                npcId,
                messages: [] as Message[],
                unreadCount: 0,
                lastMessageTime: { ...state.gameTime },
                typing: false,
                readReceipts: true,
              };
              state.phone.conversations.push(newConv);
              conversation = newConv;
            }
            const newMessage: Message = {
              id: generateId(),
              senderId: 'player',
              content,
              timestamp: { ...state.gameTime },
              read: true,
              delivered: true,
            };
            conversation.messages.push(newMessage);
            conversation.lastMessageTime = { ...state.gameTime };
          }

          // Reset days since contact and increment totalInteractions
          const npc = state.npcs.get(npcId);
          if (npc) {
            npc.relationship.daysSinceContact = 0;
            npc.relationship.neglectWarning = false;
            npc.relationship.totalInteractions += 1;
          }
        });
      },

      // ===== EMAIL ACTIONS =====

      addEmail: (email) => {
        set((state) => {
          if (!state.emailState) {
            state.emailState = { emails: [], unreadCount: 0 };
          }
          const newEmail = { ...email, id: generateId() };
          state.emailState.emails.unshift(newEmail);
          if (!newEmail.read) {
            state.emailState.unreadCount += 1;
          }

          // Add notification for new email
          if (state.phone && email.folder === 'inbox') {
            state.phone.notifications.push({
              id: generateId(),
              type: 'email',
              title: `Email from ${email.from}`,
              body: email.subject,
              timestamp: { ...state.gameTime },
              read: false,
              urgent: false,
            });
          }
        });
      },

      markEmailRead: (emailId) => {
        set((state) => {
          if (state.emailState) {
            const email = state.emailState.emails.find((e) => e.id === emailId);
            if (email && !email.read) {
              email.read = true;
              state.emailState.unreadCount = Math.max(0, state.emailState.unreadCount - 1);
            }
          }
        });
      },

      deleteEmail: (emailId) => {
        set((state) => {
          if (state.emailState) {
            const index = state.emailState.emails.findIndex((e) => e.id === emailId);
            if (index !== -1) {
              const email = state.emailState.emails[index];
              if (!email.read) {
                state.emailState.unreadCount = Math.max(0, state.emailState.unreadCount - 1);
              }
              state.emailState.emails.splice(index, 1);
            }
          }
        });
      },

      replyToEmail: (emailId, body) => {
        set((state) => {
          if (state.emailState && state.player) {
            const originalEmail = state.emailState.emails.find((e) => e.id === emailId);
            if (originalEmail) {
              const replyEmail: Email = {
                id: generateId(),
                from: state.player.name,
                fromAddress: `${state.player.name.toLowerCase().replace(' ', '.')}@email.com`,
                subject: `Re: ${originalEmail.subject}`,
                body,
                timestamp: { ...state.gameTime },
                read: true,
                starred: false,
                folder: 'sent',
                replyToId: emailId,
              };
              state.emailState.emails.unshift(replyEmail);
            }
          }
        });
      },

      // ===== WORLD SETTINGS ACTIONS =====

      setWorldSettings: (settings) => {
        set((state) => {
          state.worldSettings = settings;
        });
      },

      updateWorldSettings: (updates) => {
        set((state) => {
          if (state.worldSettings) {
            state.worldSettings = { ...state.worldSettings, ...updates };
          }
        });
      },

      setLocationImage: (locationId, imageUrl) => {
        set((state) => {
          if (state.worldSettings) {
            state.worldSettings.locationImages[locationId] = imageUrl;
          }
        });
      },

      // ===== DIALOGUE ACTIONS =====

      startDialogue: (npcId) => {
        set((state) => {
          state.dialogue = {
            activeNpcId: npcId,
            currentTopic: null,
            conversationHistory: [],
            availableTopics: [],
            moodShifts: [],
            lastResponseReaction: null,
          };
        });
      },

      endDialogue: () => {
        set((state) => {
          state.dialogue = null;
        });
      },

      addDialogueTurn: (speaker, content) => {
        set((state) => {
          if (state.dialogue) {
            state.dialogue.conversationHistory.push({
              speaker,
              content,
              timestamp: { ...state.gameTime },
            });
          }
        });
      },

      // ===== UTILITY ACTIONS =====

      setFlag: (key, value) => {
        set((state) => {
          state.globalFlags[key] = value;
        });
      },

      getFlag: (key) => {
        return get().globalFlags[key];
      },

      addWikiEntry: (id, title, content, category) => {
        set((state) => {
          state.worldWiki.set(id, { title, content, category });
        });
      },

      // ===== HELPERS =====

      getTimeOfDay: () => {
        return getTimeOfDay(get().gameTime.hour);
      },

      isLocationOpen: (locationId) => {
        const state = get();
        const location = state.locations.get(locationId);
        if (!location) return false;
        if (location.openHours === 'always') return true;
        if (location.closedDays.includes(state.gameTime.dayOfWeek)) return false;
        const { hour } = state.gameTime;
        return hour >= location.openHours.open && hour < location.openHours.close;
      },

      canAfford: (amount) => {
        const state = get();
        return (state.player?.finances.balance ?? 0) >= amount;
      },

      getLocationsCount: () => {
        return get().locations.size;
      },

      getNPCsCount: () => {
        return get().npcs.size;
      },
    })),
    {
      name: 'ai-rpg-save',
      version: 3, // Increment this when save format changes
      partialize: (state) => ({
        initialized: state.initialized,
        gameTime: state.gameTime,
        player: state.player,
        npcs: Object.fromEntries(Array.from(state.npcs)),
        locations: Object.fromEntries(Array.from(state.locations)),
        quests: Object.fromEntries(Array.from(state.quests)),
        events: state.events,
        phone: state.phone,
        globalFlags: state.globalFlags,
        worldWiki: Object.fromEntries(Array.from(state.worldWiki)),
        totalPlayTime: state.totalPlayTime,
        worldSettings: state.worldSettings,
        emailState: state.emailState,
      }),
      migrate: (persistedState, version) => {
        // Clear old incompatible saves
        if (version < 3) {
          console.log('Clearing old save data (version upgrade to fix Immer compatibility)');
          return {
            initialized: false,
            npcs: {},
            locations: {},
            quests: {},
            worldWiki: {},
            gameTime: {
              day: 1,
              hour: 8,
              minute: 0,
              dayOfWeek: 'monday',
              season: 'spring',
              weather: 'sunny',
            },
            player: null,
            events: [],
            phone: null,
            emailState: null,
            globalFlags: {},
            totalPlayTime: 0,
          };
        }
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        // Convert plain objects back to Maps after rehydration
        if (state) {
          try {
            // Cast to any to avoid type issues during rehydration
            const anyState = state as any;
            if (anyState.npcs && !(anyState.npcs instanceof Map)) {
              anyState.npcs = new Map(Object.entries(anyState.npcs));
            }
            if (anyState.locations && !(anyState.locations instanceof Map)) {
              anyState.locations = new Map(Object.entries(anyState.locations));
            }
            if (anyState.quests && !(anyState.quests instanceof Map)) {
              anyState.quests = new Map(Object.entries(anyState.quests));
            }
            if (anyState.worldWiki && !(anyState.worldWiki instanceof Map)) {
              anyState.worldWiki = new Map(Object.entries(anyState.worldWiki));
            }
          } catch (error) {
            console.error('Error rehydrating state, resetting:', error);
            // Reset to empty Maps on error - cast to any for direct mutation
            const anyState = state as any;
            anyState.npcs = new Map();
            anyState.locations = new Map();
            anyState.quests = new Map();
            anyState.worldWiki = new Map();
            anyState.initialized = false;
          }
        }
      },
    }
  )
);
