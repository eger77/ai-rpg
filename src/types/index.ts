// =====================================================
// AI-RPG: Core Type Definitions
// =====================================================

// =====================================================
// TIME & WORLD SYSTEM
// =====================================================

export interface GameTime {
  day: number;           // Day number since game start
  hour: number;          // 0-23
  minute: number;        // 0-59
  dayOfWeek: DayOfWeek;
  season: Season;
  weather: Weather;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'foggy';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'late_night';

// =====================================================
// PLAYER CHARACTER
// =====================================================

export interface Player {
  id: string;
  name: string;
  age: number;
  gender: Gender;

  // Core Stats
  stats: PlayerStats;

  // Physical State
  appearance: PlayerAppearance;
  currentOutfit: Outfit;
  wardrobe: ClothingItem[];

  // Resources
  finances: PlayerFinances;
  career: PlayerCareer;

  // State
  energy: number;          // 0-100
  stress: number;          // 0-100
  mood: number;            // 0-100
  hygiene: number;         // 0-100
  hunger: number;          // 0-100

  // Location
  currentLocationId: string;
  homeLocationId: string;

  // Social
  reputation: number;      // 0-100

  // Inventory
  inventory: InventoryItem[];

  // Flags & Progress
  unlockedLocations: string[];
  achievements: Achievement[];
  flags: Record<string, boolean | string | number>;
}

export type Gender = 'male' | 'female' | 'nonbinary';

export interface PlayerStats {
  charisma: number;        // 0-100 - Affects conversation success
  intelligence: number;    // 0-100 - Unlocks dialogue options
  empathy: number;         // 0-100 - Read NPCs better
  humor: number;           // 0-100 - Comedy success rate
  confidence: number;      // 0-100 - Bold action success
  fitness: number;         // 0-100 - Physical activities
  creativity: number;      // 0-100 - Art/music/writing
  cooking: number;         // 0-100 - Cooking skill
  dancing: number;         // 0-100 - Dance skill
}

export interface PlayerAppearance {
  hairStyle: string;
  hairColor: string;
  facialHair?: string;
  bodyType: string;
  skinTone: string;
  height: string;
}

export interface PlayerFinances {
  balance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsGoals: SavingsGoal[];
  pendingBills: Bill[];
  transactions: Transaction[];
  creditScore: number;     // 300-850
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDay: number;          // Day of month
  recurring: boolean;
  paid: boolean;
  category: 'rent' | 'utilities' | 'subscription' | 'insurance' | 'loan' | 'other';
}

export interface Transaction {
  id: string;
  amount: number;          // Positive = income, Negative = expense
  description: string;
  category: string;
  timestamp: GameTime;
}

export interface PlayerCareer {
  employed: boolean;
  companyName: string;
  position: string;
  department: string;
  salary: number;          // Annual
  payFrequency: 'weekly' | 'biweekly' | 'monthly';
  nextPayday: number;      // Game day

  // Work Schedule
  workDays: DayOfWeek[];
  workStartHour: number;
  workEndHour: number;

  // Performance
  performance: number;     // 0-100
  bossApproval: number;    // 0-100
  employmentDuration: number; // Days

  // Progression
  promotionRequirements: PromotionRequirement[];

  // Active Work Tasks
  workProjects: WorkProject[];
}

export interface PromotionRequirement {
  description: string;
  met: boolean;
}

export interface WorkProject {
  id: string;
  name: string;
  description: string;
  deadline: number;        // Game day
  progress: number;        // 0-100
  importance: 'low' | 'medium' | 'high' | 'critical';
}

// =====================================================
// CLOTHING & OUTFIT SYSTEM
// =====================================================

export interface Outfit {
  hat?: ClothingItem;
  top: ClothingItem;
  bottom: ClothingItem;
  shoes: ClothingItem;
  outerwear?: ClothingItem;
  accessory1?: ClothingItem;
  accessory2?: ClothingItem;
}

export interface ClothingItem {
  id: string;
  name: string;
  slot: ClothingSlot;
  style: ClothingStyle;
  formalityLevel: number;  // 1-5 (casual to black tie)
  condition: number;       // 0-100
  cleanliness: number;     // 0-100
  warmth: number;          // 1-5
  cost: number;

  // Effects
  confidenceBonus?: number;
  attractionBonus?: number;
  specialEffects?: string[];

  // Metadata
  color: string;
  brand?: string;
  description: string;

  // State
  isWet: boolean;
  hasStain: boolean;
  stainDescription?: string;
}

export type ClothingSlot = 'hat' | 'top' | 'bottom' | 'shoes' | 'outerwear' | 'accessory' | 'underwear' | 'sleepwear' | 'swimwear';
export type ClothingStyle = 'casual' | 'business' | 'formal' | 'athletic' | 'vintage' | 'streetwear' | 'artistic' | 'luxury';

// =====================================================
// INVENTORY SYSTEM
// =====================================================

export interface InventoryItem {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  quantity: number;

  // Gift Properties
  giftValue?: number;      // How much NPCs like it generally
  npcPreferences?: Record<string, number>; // NPC-specific preferences

  // Consumable Properties
  consumable?: boolean;
  expiresOnDay?: number;

  // Key Item Properties
  isKeyItem?: boolean;
  unlocksLocation?: string;
  unlocksNpcContent?: string;

  // Misc
  sellValue: number;
  purchasedFrom?: string;
  obtainedMethod: 'purchased' | 'gifted' | 'found' | 'crafted' | 'quest_reward';
  obtainedDay: number;

  // Memory attachment
  memorableWith?: string;  // NPC ID if this item has sentimental value
  memoryDescription?: string;
}

export type ItemType = 'gift' | 'food' | 'drink' | 'key_item' | 'tool' | 'entertainment' | 'crafting' | 'memento' | 'ticket' | 'medicine';

// =====================================================
// NPC SYSTEM
// =====================================================

export interface NPC {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  occupation: string;

  // Appearance (for descriptions/portraits)
  appearance: NPCAppearance;

  // Personality
  personality: NPCPersonality;

  // Current State
  currentState: NPCState;

  // Schedule
  defaultSchedule: ScheduleEntry[];
  scheduleOverrides: ScheduleOverride[];

  // Relationship with Player
  relationship: NPCRelationship;

  // Knowledge & Memory
  knownFacts: NPCFact[];
  memories: NPCMemory[];

  // Hidden Info (player discovers over time)
  secrets: NPCSecret[];
  hiddenMotives: string[];
  internalMonologue: string[]; // What they're thinking

  // Social Network
  connections: NPCConnection[];

  // Quest/Content
  questChain: NPCQuestChain | null;
  unlockedContent: string[];

  // Preferences
  preferences: NPCPreferences;

  // Dialogue State
  conversationTopicsUnlocked: string[];
  conversationTopicsExhausted: string[];
}

export interface NPCAppearance {
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  height: string;
  bodyType: string;
  distinguishingFeatures: string[];
  usualStyle: ClothingStyle;
  portraitUrl?: string;
}

export interface NPCPersonality {
  // Big Five Traits (0-100)
  openness: number;        // Curious vs Consistent
  conscientiousness: number; // Organized vs Flexible
  extraversion: number;    // Outgoing vs Reserved
  agreeableness: number;   // Cooperative vs Competitive
  neuroticism: number;     // Sensitive vs Resilient

  // Communication Style
  verbosity: number;       // 0-100 (brief to wordy)
  formality: number;       // 0-100 (casual to formal)
  humorStyle: 'dry' | 'silly' | 'sarcastic' | 'dark' | 'wholesome' | 'none';
  conflictStyle: 'avoider' | 'aggressive' | 'passive_aggressive' | 'communicative' | 'pleaser';

  // Romance Style
  flirtingStyle: 'direct' | 'subtle' | 'playful' | 'intellectual' | 'shy';
  attachmentStyle: 'secure' | 'anxious' | 'avoidant' | 'fearful';

  // Values & Interests
  values: string[];
  interests: string[];
  dealbreakers: string[];

  // Quirks
  quirks: string[];
  petPeeves: string[];
}

export interface NPCState {
  currentLocationId: string;
  currentActivity: string;
  mood: NPCMood;
  energy: number;          // 0-100
  stress: number;          // 0-100
  availability: 'available' | 'busy' | 'unavailable' | 'sleeping';
  currentThoughts: string[];

  // Temporary States
  isWet?: boolean;
  isEmbarrassed?: boolean;
  isDrunk?: boolean;
  isSick?: boolean;
}

export interface NPCMood {
  primary: EmotionType;
  intensity: number;       // 0-100
  secondary?: EmotionType;
  cause?: string;
  duration: number;        // Minutes remaining
}

export type EmotionType =
  | 'happy' | 'sad' | 'angry' | 'anxious' | 'excited'
  | 'frustrated' | 'content' | 'bored' | 'lonely' | 'hopeful'
  | 'jealous' | 'flirty' | 'embarrassed' | 'proud' | 'hurt';

export interface ScheduleEntry {
  dayOfWeek: DayOfWeek | 'all' | 'weekday' | 'weekend';
  startHour: number;
  endHour: number;
  locationId: string;
  activity: string;
  interruptible: boolean;
}

export interface ScheduleOverride {
  day: number;             // Game day
  entries: ScheduleEntry[];
  reason: string;
}

// =====================================================
// RELATIONSHIP SYSTEM
// =====================================================

export interface NPCRelationship {
  // Core Metrics (0-100)
  friendship: number;
  romance: number;
  trust: number;
  respect: number;

  // Attraction Types (0-100)
  attraction: {
    physical: number;
    intellectual: number;
    emotional: number;
    spiritual: number;
  };

  // Relationship Status
  status: RelationshipStatus;
  stage: RelationshipStage;

  // Milestones
  milestonesCompleted: RelationshipMilestone[];
  milestonesAvailable: RelationshipMilestone[];

  // Interaction History
  lastInteraction: GameTime | null;
  totalInteractions: number;
  positiveInteractions: number;
  negativeInteractions: number;

  // Decay & Maintenance
  daysSinceContact: number;
  neglectWarning: boolean;

  // Special Flags
  hasConfessedFeelings: boolean;
  isExclusive: boolean;
  hasMetFamily: boolean;
  hasSharedSecret: boolean;
  firstKissDate: number | null;

  // Tension
  currentTension: number;  // 0-100 (unresolved conflict)
  tensionCause?: string;

  // Jealousy
  jealousyLevel: number;   // 0-100
  jealousyTargets: string[]; // NPC IDs they're jealous of
}

export type RelationshipStatus =
  | 'stranger' | 'acquaintance' | 'friend' | 'close_friend'
  | 'romantic_interest' | 'dating' | 'exclusive' | 'committed'
  | 'engaged' | 'married' | 'ex' | 'estranged' | 'enemy';

export type RelationshipStage =
  | 'unknown' | 'introduction' | 'building_rapport' | 'friendship'
  | 'flirtation' | 'courtship' | 'early_romance' | 'established_romance'
  | 'deep_connection' | 'commitment';

export interface RelationshipMilestone {
  id: string;
  name: string;
  description: string;
  type: 'friendship' | 'romance' | 'trust' | 'intimacy' | 'commitment';

  // Requirements
  requirements: MilestoneRequirement[];

  // Rewards
  unlocksContent: string[];
  unlocksLocations: string[];
  unlocksTopics: string[];

  completed: boolean;
  completedOnDay?: number;
}

export interface MilestoneRequirement {
  type: 'stat' | 'quest' | 'item' | 'location' | 'time_invested' | 'flag';
  target: string;
  value: number | boolean | string;
  currentValue?: number | boolean | string;
  met: boolean;
}

// =====================================================
// NPC MEMORY & KNOWLEDGE
// =====================================================

export interface NPCFact {
  id: string;
  category: 'personal' | 'preference' | 'history' | 'family' | 'work' | 'secret';
  fact: string;
  discoveredOnDay: number;
  importance: 'trivial' | 'minor' | 'significant' | 'major';
  canReference: boolean;   // Can player bring this up in conversation?
}

export interface NPCMemory {
  id: string;
  description: string;
  day: number;
  emotionalImpact: number; // -100 to 100
  significance: 'forgettable' | 'notable' | 'important' | 'pivotal' | 'defining';
  tags: string[];

  // How often this gets referenced
  referenceWeight: number;
  timesReferenced: number;

  // Related entities
  involvedNPCs: string[];
  locationId?: string;
  relatedItemId?: string;
}

export interface NPCSecret {
  id: string;
  content: string;
  severity: 'minor' | 'significant' | 'major' | 'devastating';
  trustThresholdToReveal: number;
  revealed: boolean;
  revealedOnDay?: number;
  affectsRelationships?: string[]; // NPC IDs
}

export interface NPCConnection {
  npcId: string;
  relationshipType: 'family' | 'friend' | 'coworker' | 'ex' | 'rival' | 'crush' | 'acquaintance';
  specificRole?: string;   // e.g., "sister", "best friend", "ex-boyfriend"
  closeness: number;       // 0-100
  opinion: number;         // -100 to 100 (their opinion of the connected NPC)

  // How this affects player
  sharesInfoAboutPlayer: boolean;
  influencesOpinionOfPlayer: boolean;
}

export interface NPCPreferences {
  // Gifts
  lovedGifts: string[];
  likedGifts: string[];
  dislikedGifts: string[];
  hatedGifts: string[];

  // Activities
  favoriteActivities: string[];
  dislikedActivities: string[];

  // Date Venues
  preferredDateTypes: string[];

  // Conversation
  favoriteTopics: string[];
  avoidTopics: string[];

  // Food & Drink
  favoriteFoods: string[];
  allergies: string[];
  dietaryRestrictions: string[];
  favoriteDrinks: string[];

  // Misc
  favoriteColor: string;
  favoriteFlower: string;
  birthday: { month: number; day: number };
}

export interface NPCQuestChain {
  id: string;
  name: string;
  currentStage: number;
  stages: QuestStage[];
  completed: boolean;
  failed: boolean;
  failureConsequence?: string;
}

export interface QuestStage {
  id: string;
  description: string;
  objectives: QuestObjective[];
  deadline?: number;       // Game day
  rewards: QuestReward[];
  completed: boolean;
}

export interface QuestObjective {
  id: string;
  description: string;
  type: 'talk' | 'give_item' | 'go_location' | 'reach_relationship' | 'complete_activity' | 'find_npc' | 'custom';
  target: string;
  targetValue?: number;
  currentValue?: number;
  completed: boolean;
}

export interface QuestReward {
  type: 'item' | 'money' | 'relationship' | 'unlock_location' | 'unlock_content' | 'stat_boost' | 'achievement';
  target: string;
  value: number | string;
}

// =====================================================
// LOCATION SYSTEM
// =====================================================

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  description: string;

  // Access
  unlocked: boolean;
  unlockRequirements: LocationUnlockRequirement[];

  // Schedule
  openHours: { open: number; close: number } | 'always';
  closedDays: DayOfWeek[];

  // Atmosphere
  noiseLevel: 'quiet' | 'moderate' | 'loud' | 'very_loud';
  crowdLevel: CrowdLevel;
  ambiance: string;

  // Requirements
  dressCode?: ClothingStyle;
  minFormalityLevel?: number;
  admissionCost?: number;
  membershipRequired?: boolean;

  // Interactions
  availableActivities: LocationActivity[];
  interactionPoints: InteractionPoint[];
  discoveryZones: DiscoveryZone[];

  // NPCs
  regularNPCs: string[];   // NPCs who can be found here
  staffNPCs: string[];

  // Connected Locations
  connectedLocations: { locationId: string; travelTime: number }[];

  // Visual
  imageUrl?: string;
  timeVariants?: Record<TimeOfDay, string>;
  weatherVariants?: Record<Weather, string>;
}

export type LocationType =
  | 'home' | 'work' | 'cafe' | 'restaurant' | 'bar' | 'club'
  | 'park' | 'beach' | 'gym' | 'shop' | 'gallery' | 'theater'
  | 'library' | 'office' | 'apartment' | 'hotel' | 'venue';

export type CrowdLevel = 'empty' | 'sparse' | 'moderate' | 'crowded' | 'packed';

export interface LocationUnlockRequirement {
  type: 'relationship' | 'reputation' | 'quest' | 'item' | 'money' | 'time' | 'clothing' | 'membership';
  target: string;
  value: number | string | boolean;
  met: boolean;
}

export interface LocationActivity {
  id: string;
  name: string;
  description: string;
  duration: number;        // Minutes
  energyCost: number;
  moneyCost: number;

  // Effects
  statChanges?: Partial<PlayerStats>;
  moodChange?: number;
  stressChange?: number;

  // Requirements
  requiresNPC?: string;
  requiresItem?: string;
  requiresSkillLevel?: { skill: keyof PlayerStats; level: number };

  // Social
  canInviteNPC: boolean;
  romanticPotential: boolean;
}

export interface InteractionPoint {
  id: string;
  name: string;
  description: string;
  privateLevel: number;    // 0-100 (how private for intimate conversation)
}

export interface DiscoveryZone {
  id: string;
  name: string;
  description: string;
  discovered: boolean;

  // Requirements to discover
  requirements: {
    type: 'relationship' | 'item' | 'quest' | 'random' | 'time';
    target?: string;
    value?: number | string;
    chance?: number;       // For random discovery
  };

  unlocksContent: string[];
}

// =====================================================
// COMMUNICATION SYSTEM
// =====================================================

export interface PhoneState {
  battery: number;         // 0-100
  signal: number;          // 0-4 bars
  wifi: boolean;

  conversations: Conversation[];
  notifications: Notification[];
  callLog: CallLogEntry[];
  emails: Email[];

  contacts: Contact[];
  blockedContacts: string[];

  // Social Media
  socialMediaFeed: SocialMediaPost[];
}

export interface Conversation {
  id: string;
  npcId: string;
  messages: Message[];
  unreadCount: number;
  lastMessageTime: GameTime;
  typing: boolean;         // Is NPC currently typing?
  readReceipts: boolean;
}

export interface Message {
  id: string;
  senderId: string;        // 'player' or NPC ID
  content: string;
  timestamp: GameTime;
  read: boolean;
  delivered: boolean;

  // Rich content
  imageUrl?: string;
  emoji?: string;

  // Player response options (for NPC messages)
  suggestedResponses?: string[];

  // Emotional analysis
  tone?: EmotionType;
  sentiment?: number;      // -100 to 100
}

export interface Notification {
  id: string;
  type: 'message' | 'call' | 'email' | 'social' | 'bill' | 'event' | 'reminder' | 'system';
  title: string;
  body: string;
  timestamp: GameTime;
  read: boolean;

  // Action
  actionType?: string;
  actionTarget?: string;

  // Source
  sourceNpcId?: string;
  urgent: boolean;
}

export interface CallLogEntry {
  id: string;
  npcId: string;
  timestamp: GameTime;
  type: 'incoming' | 'outgoing' | 'missed';
  duration?: number;       // Seconds
  hasVoicemail: boolean;
  voicemailContent?: string;
}

export interface Email {
  id: string;
  from: string;
  fromAddress: string;
  subject: string;
  body: string;
  timestamp: GameTime;
  read: boolean;
  starred: boolean;
  folder: 'inbox' | 'sent' | 'drafts' | 'trash';
  replyToId?: string;
  attachments?: { name: string; type: string }[];
}

export interface Contact {
  id: string;
  npcId: string;
  nickname?: string;
  photoUrl?: string;
  blocked: boolean;
  favorite: boolean;
  notes?: string;
}

export interface SocialMediaPost {
  id: string;
  authorId: string;
  content: string;
  imageUrl?: string;
  timestamp: GameTime;
  likes: number;
  comments: { authorId: string; content: string }[];
  playerLiked: boolean;
  playerCommented: boolean;
}

// =====================================================
// QUEST & OBJECTIVE SYSTEM
// =====================================================

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'main' | 'side' | 'personal' | 'discovery' | 'timed';

  // Source
  giverNpcId?: string;
  autoGenerated: boolean;

  // Status
  status: 'available' | 'active' | 'completed' | 'failed' | 'expired';

  // Objectives
  objectives: QuestObjective[];

  // Time Constraints
  deadline?: number;       // Game day
  urgency: 'none' | 'low' | 'medium' | 'high' | 'critical';

  // Rewards
  rewards: QuestReward[];

  // Failure
  failureConsequences?: string[];

  // Progress
  startedOnDay?: number;
  completedOnDay?: number;
}

// =====================================================
// EVENT SYSTEM
// =====================================================

export interface GameEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;

  // Timing
  triggerConditions: EventTrigger[];
  triggeredOnDay?: number;
  duration?: number;       // Minutes

  // Content
  scene?: EventScene;
  choices?: EventChoice[];

  // Consequences
  consequences: EventConsequence[];

  // Flags
  oneTime: boolean;
  triggered: boolean;
  priority: number;        // Higher = more important
}

export type EventType =
  | 'random' | 'scheduled' | 'triggered' | 'npc_initiated'
  | 'weather' | 'emergency' | 'opportunity' | 'consequence';

export interface EventTrigger {
  type: 'time' | 'location' | 'relationship' | 'stat' | 'flag' | 'random' | 'npc_present' | 'item' | 'weather';
  condition: string;
  value?: number | string | boolean;
}

export interface EventScene {
  locationId: string;
  npcsPresent: string[];
  narration: string;
  ambiance: string;
}

export interface EventChoice {
  id: string;
  text: string;
  requirements?: { type: string; value: number | string }[];
  consequences: EventConsequence[];
  leadsToSceneId?: string;
}

export interface EventConsequence {
  type: 'stat_change' | 'relationship_change' | 'item' | 'money' | 'flag' | 'quest' | 'unlock' | 'npc_state' | 'narration';
  target: string;
  value: number | string | boolean;
  description?: string;
}

// =====================================================
// ACHIEVEMENT SYSTEM
// =====================================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'romance' | 'social' | 'career' | 'exploration' | 'collection' | 'milestone' | 'secret';

  // Progress
  unlocked: boolean;
  unlockedOnDay?: number;
  progress?: number;
  maxProgress?: number;

  // Rewards
  rewards?: AchievementReward[];
}

export interface AchievementReward {
  type: 'title' | 'item' | 'unlock' | 'stat_boost';
  value: string | number;
}

// =====================================================
// DIALOGUE SYSTEM
// =====================================================

export interface DialogueState {
  activeNpcId: string | null;
  currentTopic: string | null;
  conversationHistory: DialogueTurn[];
  availableTopics: DialogueTopic[];
  moodShifts: { turn: number; mood: EmotionType }[];

  // Real-time feedback
  lastResponseReaction: DialogueReaction | null;
}

export interface DialogueTurn {
  speaker: 'player' | 'npc';
  content: string;
  timestamp: GameTime;
  emotion?: EmotionType;
  action?: string;         // e.g., "*leans in*", "*looks away*"
}

export interface DialogueTopic {
  id: string;
  name: string;
  category: 'casual' | 'deep' | 'romantic' | 'conflict' | 'secret';
  unlocked: boolean;
  exhausted: boolean;
  requiresTrust?: number;
  requiresRomance?: number;
}

export interface DialogueReaction {
  type: 'positive' | 'negative' | 'neutral' | 'mixed';
  intensity: number;
  microExpression: string; // e.g., "Her eyes light up", "He shifts uncomfortably"
  statChanges?: Partial<NPCRelationship>;
}

// =====================================================
// SAVE SYSTEM
// =====================================================

export interface SaveData {
  version: string;
  savedAt: Date;
  playTime: number;        // Total minutes played

  gameTime: GameTime;
  player: Player;
  npcs: NPC[];
  locations: Location[];
  quests: Quest[];
  events: GameEvent[];
  phone: PhoneState;

  // Flags and global state
  globalFlags: Record<string, boolean | string | number>;
  worldWiki: WorldWikiEntry[];
}

export interface WorldWikiEntry {
  id: string;
  category: 'location' | 'character' | 'event' | 'item' | 'lore';
  title: string;
  content: string;
  discovered: boolean;
  discoveredOnDay?: number;
  linkedEntries: string[];
}

// =====================================================
// WORLD SETTINGS (Character/World Creation)
// =====================================================

export interface WorldSettings {
  // City/World settings
  cityName: string;
  cityStyle: 'modern' | 'medieval' | 'futuristic' | 'steampunk' | 'fantasy' | 'cyberpunk' | 'victorian';
  citySize: 'small' | 'medium' | 'large';
  climate: 'tropical' | 'temperate' | 'arctic' | 'desert' | 'mediterranean';

  // Player background
  careerPath: string;           // Typeable career/job
  startingScenario: string;     // Starting situation description

  // Visual settings
  artStyle: 'anime' | 'realistic' | 'cartoon' | 'painterly';

  // Generated assets
  cityMapUrl?: string;
  locationImages: Record<string, string>;  // locationId -> imageUrl

  // World state
  generatedLocations: string[]; // IDs of procedurally generated locations
}

export interface EmailState {
  emails: Email[];
  unreadCount: number;
}
