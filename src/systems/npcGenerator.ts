import { v4 as uuidv4 } from 'uuid';
import type {
  NPC,
  NPCPersonality,
  NPCAppearance,
  NPCPreferences,
  NPCRelationship,
  NPCState,
  ScheduleEntry,
  RelationshipMilestone,
  NPCSecret,
  NPCConnection,
  Gender,
  ClothingStyle,
  EmotionType,
  DayOfWeek,
} from '@/types';

// =====================================================
// NPC GENERATION TEMPLATES & DATA
// =====================================================

// Name pools by gender
const FIRST_NAMES = {
  male: [
    'James', 'Michael', 'David', 'Daniel', 'Marcus', 'Alex', 'Ryan', 'Chris',
    'Jake', 'Tyler', 'Ethan', 'Noah', 'Lucas', 'Mason', 'Oliver', 'Liam',
    'Benjamin', 'Nathan', 'Samuel', 'Andrew', 'Sebastian', 'Adrian', 'Derek',
    'Victor', 'Julian', 'Maxwell', 'Gabriel', 'Rafael', 'Dante', 'Leo',
  ],
  female: [
    'Sarah', 'Emma', 'Jessica', 'Ashley', 'Sophia', 'Olivia', 'Mia', 'Luna',
    'Chloe', 'Grace', 'Lily', 'Hannah', 'Natalie', 'Samantha', 'Victoria',
    'Rachel', 'Rebecca', 'Lauren', 'Isabella', 'Ava', 'Emily', 'Zoe',
    'Maya', 'Claire', 'Aurora', 'Stella', 'Violet', 'Aria', 'Elena', 'Rosa',
  ],
  nonbinary: [
    'Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn',
    'Cameron', 'Jamie', 'Drew', 'Sage', 'Phoenix', 'River', 'Skylar', 'Blake',
  ],
};

const LAST_NAMES = [
  'Martinez', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson',
  'Anderson', 'Taylor', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin',
  'Thompson', 'Garcia', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee',
  'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott', 'Torres',
  'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Chen',
  'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Kim', 'Evans',
];

// Occupation templates with associated traits
interface OccupationTemplate {
  title: string;
  workHours: { start: number; end: number };
  workDays: ('weekday' | 'weekend' | 'all')[];
  workLocation: string;
  salaryRange: { min: number; max: number };
  associatedInterests: string[];
  associatedValues: string[];
  commonStyles: ClothingStyle[];
  stressLevel: number;
}

const OCCUPATIONS: OccupationTemplate[] = [
  {
    title: 'Architect',
    workHours: { start: 9, end: 18 },
    workDays: ['weekday'],
    workLocation: 'architecture_firm',
    salaryRange: { min: 60000, max: 120000 },
    associatedInterests: ['design', 'art', 'architecture', 'travel'],
    associatedValues: ['creativity', 'ambition', 'precision'],
    commonStyles: ['business', 'artistic'],
    stressLevel: 60,
  },
  {
    title: 'Bartender',
    workHours: { start: 17, end: 2 },
    workDays: ['weekday', 'weekend'],
    workLocation: 'the_corner_bar',
    salaryRange: { min: 25000, max: 50000 },
    associatedInterests: ['mixology', 'music', 'socializing', 'nightlife'],
    associatedValues: ['community', 'fun', 'loyalty'],
    commonStyles: ['casual', 'streetwear'],
    stressLevel: 50,
  },
  {
    title: 'Barista',
    workHours: { start: 6, end: 14 },
    workDays: ['weekday'],
    workLocation: 'downtown_cafe',
    salaryRange: { min: 20000, max: 35000 },
    associatedInterests: ['coffee', 'art', 'music', 'reading'],
    associatedValues: ['creativity', 'kindness', 'authenticity'],
    commonStyles: ['casual', 'artistic', 'vintage'],
    stressLevel: 40,
  },
  {
    title: 'Software Developer',
    workHours: { start: 10, end: 19 },
    workDays: ['weekday'],
    workLocation: 'tech_company',
    salaryRange: { min: 70000, max: 150000 },
    associatedInterests: ['technology', 'gaming', 'problem_solving'],
    associatedValues: ['innovation', 'logic', 'efficiency'],
    commonStyles: ['casual', 'streetwear'],
    stressLevel: 55,
  },
  {
    title: 'Nurse',
    workHours: { start: 7, end: 19 },
    workDays: ['all'],
    workLocation: 'hospital',
    salaryRange: { min: 50000, max: 90000 },
    associatedInterests: ['healthcare', 'helping_others', 'fitness'],
    associatedValues: ['compassion', 'dedication', 'resilience'],
    commonStyles: ['casual', 'athletic'],
    stressLevel: 75,
  },
  {
    title: 'Teacher',
    workHours: { start: 7, end: 16 },
    workDays: ['weekday'],
    workLocation: 'school',
    salaryRange: { min: 40000, max: 70000 },
    associatedInterests: ['education', 'reading', 'mentoring'],
    associatedValues: ['patience', 'knowledge', 'growth'],
    commonStyles: ['business', 'casual'],
    stressLevel: 65,
  },
  {
    title: 'Fitness Instructor',
    workHours: { start: 6, end: 20 },
    workDays: ['all'],
    workLocation: 'yoga_studio',
    salaryRange: { min: 30000, max: 60000 },
    associatedInterests: ['fitness', 'wellness', 'nutrition', 'yoga'],
    associatedValues: ['health', 'discipline', 'positivity'],
    commonStyles: ['athletic'],
    stressLevel: 35,
  },
  {
    title: 'Graphic Designer',
    workHours: { start: 10, end: 18 },
    workDays: ['weekday'],
    workLocation: 'design_studio',
    salaryRange: { min: 45000, max: 85000 },
    associatedInterests: ['art', 'design', 'photography', 'typography'],
    associatedValues: ['creativity', 'aesthetics', 'innovation'],
    commonStyles: ['artistic', 'vintage', 'streetwear'],
    stressLevel: 50,
  },
  {
    title: 'Writer',
    workHours: { start: 9, end: 17 },
    workDays: ['weekday'],
    workLocation: 'home',
    salaryRange: { min: 30000, max: 80000 },
    associatedInterests: ['writing', 'reading', 'poetry', 'philosophy'],
    associatedValues: ['creativity', 'authenticity', 'introspection'],
    commonStyles: ['casual', 'artistic', 'vintage'],
    stressLevel: 55,
  },
  {
    title: 'Lawyer',
    workHours: { start: 8, end: 19 },
    workDays: ['weekday'],
    workLocation: 'law_firm',
    salaryRange: { min: 80000, max: 200000 },
    associatedInterests: ['law', 'debate', 'reading', 'politics'],
    associatedValues: ['justice', 'ambition', 'logic'],
    commonStyles: ['formal', 'business'],
    stressLevel: 80,
  },
  {
    title: 'Chef',
    workHours: { start: 14, end: 23 },
    workDays: ['all'],
    workLocation: 'restaurant',
    salaryRange: { min: 35000, max: 80000 },
    associatedInterests: ['cooking', 'food', 'travel', 'culture'],
    associatedValues: ['creativity', 'perfection', 'passion'],
    commonStyles: ['casual'],
    stressLevel: 70,
  },
  {
    title: 'Photographer',
    workHours: { start: 10, end: 18 },
    workDays: ['all'],
    workLocation: 'freelance',
    salaryRange: { min: 30000, max: 90000 },
    associatedInterests: ['photography', 'art', 'travel', 'nature'],
    associatedValues: ['creativity', 'adventure', 'beauty'],
    commonStyles: ['casual', 'artistic'],
    stressLevel: 45,
  },
];

// Appearance options
const HAIR_STYLES = {
  male: ['short', 'medium', 'long', 'buzz cut', 'fade', 'slicked back', 'messy', 'undercut'],
  female: ['long straight', 'long wavy', 'long curly', 'bob', 'pixie cut', 'shoulder length', 'braided', 'ponytail'],
  nonbinary: ['short', 'medium', 'long', 'undercut', 'asymmetric', 'buzz cut', 'natural'],
};

const HAIR_COLORS = ['black', 'dark brown', 'brown', 'light brown', 'blonde', 'dirty blonde', 'red', 'auburn', 'gray', 'silver'];
const EYE_COLORS = ['brown', 'dark brown', 'hazel', 'green', 'blue', 'gray', 'amber'];
const BODY_TYPES = ['slim', 'athletic', 'average', 'muscular', 'curvy', 'petite', 'tall'];
const HEIGHTS = ['short', 'below average', 'average', 'above average', 'tall'];
const SKIN_TONES = ['fair', 'light', 'medium', 'olive', 'tan', 'brown', 'dark'];

const DISTINGUISHING_FEATURES = [
  'warm smile', 'bright eyes', 'dimples', 'freckles', 'strong jawline',
  'high cheekbones', 'expressive eyebrows', 'gentle expression', 'intense gaze',
  'laugh lines', 'beauty mark', 'scar on chin', 'glasses', 'tattoo visible',
  'piercings', 'always well-groomed', 'natural beauty', 'striking features',
];

// Personality components
const HUMOR_STYLES: NPCPersonality['humorStyle'][] = ['dry', 'silly', 'sarcastic', 'dark', 'wholesome', 'none'];
const CONFLICT_STYLES: NPCPersonality['conflictStyle'][] = ['avoider', 'aggressive', 'passive_aggressive', 'communicative', 'pleaser'];
const FLIRTING_STYLES: NPCPersonality['flirtingStyle'][] = ['direct', 'subtle', 'playful', 'intellectual', 'shy'];
const ATTACHMENT_STYLES: NPCPersonality['attachmentStyle'][] = ['secure', 'anxious', 'avoidant', 'fearful'];

const VALUES = [
  'honesty', 'loyalty', 'ambition', 'creativity', 'family', 'adventure',
  'security', 'independence', 'compassion', 'justice', 'wisdom', 'success',
  'authenticity', 'growth', 'harmony', 'freedom', 'tradition', 'innovation',
];

const GENERAL_INTERESTS = [
  'music', 'movies', 'travel', 'cooking', 'fitness', 'reading', 'gaming',
  'photography', 'hiking', 'yoga', 'dancing', 'art', 'sports', 'technology',
  'nature', 'fashion', 'food', 'wine', 'coffee', 'history', 'science',
  'philosophy', 'psychology', 'astronomy', 'gardening', 'crafts', 'volunteering',
];

const DEALBREAKERS = [
  'dishonesty', 'disloyalty', 'cruelty', 'arrogance', 'laziness',
  'closed-mindedness', 'disrespect', 'manipulation', 'jealousy',
  'lack of ambition', 'rudeness', 'selfishness', 'immaturity',
];

const QUIRKS = [
  'always early', 'chronic oversleeper', 'hums when happy', 'bites lip when thinking',
  'touches hair when nervous', 'makes puns constantly', 'collects something unusual',
  'quotes movies/books', 'doodles when bored', 'talks to plants', 'names their belongings',
  'has a lucky item', 'superstitious about small things', 'sings in the shower',
  'stress baker', 'midnight snacker', 'obsessive list maker', 'sends voice memos',
];

const PET_PEEVES = [
  'lateness', 'loud chewing', 'interrupting', 'littering', 'rudeness to service staff',
  'phone during dinner', 'spoilers', 'bad grammar', 'leaving lights on',
  'wet towels on bed', 'slow walkers', 'unsolicited advice', 'talking during movies',
];

// Gift categories
const GIFT_CATEGORIES = {
  romantic: ['flowers', 'chocolates', 'jewelry', 'perfume', 'love_letters'],
  intellectual: ['books', 'puzzles', 'art_supplies', 'museum_tickets'],
  experiential: ['concert_tickets', 'cooking_class', 'spa_day', 'adventure_activity'],
  practical: ['coffee', 'wine', 'gourmet_food', 'cozy_items'],
  creative: ['art', 'music', 'handmade_items', 'vintage_finds'],
};

// Secret templates
const SECRET_TEMPLATES = [
  { template: '{name} has trust issues from a past relationship', severity: 'significant' as const, minTrust: 50 },
  { template: '{name} is dealing with family estrangement', severity: 'major' as const, minTrust: 70 },
  { template: '{name} has a secret dream they\'re afraid to pursue', severity: 'significant' as const, minTrust: 45 },
  { template: '{name} struggled with their mental health in the past', severity: 'major' as const, minTrust: 75 },
  { template: '{name} is hiding financial difficulties', severity: 'significant' as const, minTrust: 60 },
  { template: '{name} has an ex who affected them deeply', severity: 'significant' as const, minTrust: 55 },
  { template: '{name} feels like an impostor in their career', severity: 'minor' as const, minTrust: 40 },
  { template: '{name} is secretly looking for something more in life', severity: 'minor' as const, minTrust: 35 },
];

// Activity preferences
const DATE_TYPES = ['intellectual', 'romantic', 'adventurous', 'cozy', 'creative', 'social', 'outdoors'];
const FAVORITE_FOODS = ['italian', 'sushi', 'mexican', 'thai', 'indian', 'french', 'american', 'mediterranean', 'korean', 'brunch'];
const DRINKS = ['coffee', 'tea', 'wine', 'craft_beer', 'cocktails', 'whiskey', 'smoothies', 'bubble_tea'];
const COLORS = ['red', 'blue', 'green', 'purple', 'yellow', 'orange', 'pink', 'black', 'white', 'teal', 'sage', 'coral'];
const FLOWERS = ['roses', 'sunflowers', 'tulips', 'lilies', 'daisies', 'orchids', 'peonies', 'wildflowers'];

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomElements = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
};
const randomRange = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number): number => Math.random() * (max - min) + min;
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

// =====================================================
// NPC GENERATOR CLASS
// =====================================================

export interface NPCGeneratorOptions {
  gender?: Gender;
  ageRange?: { min: number; max: number };
  occupation?: string;
  forceRomanceable?: boolean;
  personalityBias?: Partial<NPCPersonality>;
  initialLocationId?: string;
}

export class NPCGenerator {
  private usedNames: Set<string> = new Set();

  generateNPC(options: NPCGeneratorOptions = {}): NPC {
    const gender = options.gender || this.randomGender();
    const age = randomRange(options.ageRange?.min ?? 21, options.ageRange?.max ?? 45);
    const name = this.generateUniqueName(gender);
    const occupation = options.occupation
      ? OCCUPATIONS.find((o) => o.title === options.occupation) || randomElement(OCCUPATIONS)
      : randomElement(OCCUPATIONS);

    const personality = this.generatePersonality(occupation, options.personalityBias);
    const appearance = this.generateAppearance(gender, occupation);
    const preferences = this.generatePreferences(personality, occupation);

    const npc: NPC = {
      id: uuidv4(),
      name,
      age,
      gender,
      occupation: occupation.title,

      appearance,
      personality,
      preferences,

      currentState: this.generateInitialState(occupation, options.initialLocationId),
      defaultSchedule: this.generateSchedule(occupation),
      scheduleOverrides: [],

      relationship: this.createInitialRelationship(),

      knownFacts: [],
      memories: [],
      secrets: this.generateSecrets(name),
      hiddenMotives: this.generateHiddenMotives(personality),
      internalMonologue: [],

      connections: [],

      questChain: null,
      unlockedContent: [],

      conversationTopicsUnlocked: ['casual', 'weather', 'work_general'],
      conversationTopicsExhausted: [],
    };

    return npc;
  }

  generateMultipleNPCs(count: number, options: NPCGeneratorOptions = {}): NPC[] {
    const npcs: NPC[] = [];
    const genderDistribution: Gender[] = ['male', 'female', 'female', 'male', 'nonbinary'];

    for (let i = 0; i < count; i++) {
      const gender = options.gender || genderDistribution[i % genderDistribution.length];
      npcs.push(this.generateNPC({ ...options, gender }));
    }

    // Create some connections between NPCs
    this.generateInterNPCConnections(npcs);

    return npcs;
  }

  private randomGender(): Gender {
    const roll = Math.random();
    if (roll < 0.45) return 'female';
    if (roll < 0.9) return 'male';
    return 'nonbinary';
  }

  private generateUniqueName(gender: Gender): string {
    const firstNames = FIRST_NAMES[gender];
    let attempts = 0;
    let name: string;

    do {
      const firstName = randomElement(firstNames);
      const lastName = randomElement(LAST_NAMES);
      name = `${firstName} ${lastName}`;
      attempts++;
    } while (this.usedNames.has(name) && attempts < 100);

    this.usedNames.add(name);
    return name;
  }

  private generatePersonality(occupation: OccupationTemplate, bias?: Partial<NPCPersonality>): NPCPersonality {
    // Base personality with some randomness
    const base: NPCPersonality = {
      openness: clamp(randomRange(30, 90) + (bias?.openness ?? 0), 0, 100),
      conscientiousness: clamp(randomRange(30, 90) + (bias?.conscientiousness ?? 0), 0, 100),
      extraversion: clamp(randomRange(20, 90) + (bias?.extraversion ?? 0), 0, 100),
      agreeableness: clamp(randomRange(40, 90) + (bias?.agreeableness ?? 0), 0, 100),
      neuroticism: clamp(randomRange(20, 70) + (bias?.neuroticism ?? 0), 0, 100),

      verbosity: randomRange(30, 80),
      formality: randomRange(20, 70),
      humorStyle: bias?.humorStyle || randomElement(HUMOR_STYLES),
      conflictStyle: bias?.conflictStyle || randomElement(CONFLICT_STYLES),

      flirtingStyle: bias?.flirtingStyle || randomElement(FLIRTING_STYLES),
      attachmentStyle: bias?.attachmentStyle || randomElement(ATTACHMENT_STYLES),

      values: [...randomElements(VALUES, 4), ...randomElements(occupation.associatedValues, 2)].slice(0, 5),
      interests: [...randomElements(GENERAL_INTERESTS, 4), ...randomElements(occupation.associatedInterests, 3)].slice(0, 6),
      dealbreakers: randomElements(DEALBREAKERS, randomRange(2, 4)),

      quirks: randomElements(QUIRKS, randomRange(2, 4)),
      petPeeves: randomElements(PET_PEEVES, randomRange(2, 4)),
    };

    return base;
  }

  private generateAppearance(gender: Gender, occupation: OccupationTemplate): NPCAppearance {
    const hairStyles = HAIR_STYLES[gender];

    return {
      hairStyle: randomElement(hairStyles),
      hairColor: randomElement(HAIR_COLORS),
      eyeColor: randomElement(EYE_COLORS),
      height: randomElement(HEIGHTS),
      bodyType: randomElement(BODY_TYPES),
      distinguishingFeatures: randomElements(DISTINGUISHING_FEATURES, randomRange(2, 4)),
      usualStyle: randomElement(occupation.commonStyles),
    };
  }

  private generatePreferences(personality: NPCPersonality, occupation: OccupationTemplate): NPCPreferences {
    // Generate gift preferences based on personality
    const giftCategories = Object.keys(GIFT_CATEGORIES) as (keyof typeof GIFT_CATEGORIES)[];
    const favoredCategories = randomElements(giftCategories, 2);
    const dislikedCategories = giftCategories.filter((c) => !favoredCategories.includes(c)).slice(0, 1);

    const lovedGifts = favoredCategories.flatMap((cat) => randomElements(GIFT_CATEGORIES[cat], 2));
    const likedGifts = randomElements(
      giftCategories.flatMap((cat) => GIFT_CATEGORIES[cat]),
      4
    );
    const dislikedGifts = dislikedCategories.flatMap((cat) => GIFT_CATEGORIES[cat]).slice(0, 2);

    // Generate date preferences based on extraversion and interests
    const datePrefs: string[] = [];
    if (personality.extraversion > 60) datePrefs.push('social', 'adventurous');
    if (personality.openness > 60) datePrefs.push('creative', 'intellectual');
    if (personality.extraversion < 50) datePrefs.push('cozy', 'romantic');
    const preferredDateTypes = [...new Set([...datePrefs, ...randomElements(DATE_TYPES, 2)])].slice(0, 4);

    return {
      lovedGifts,
      likedGifts,
      dislikedGifts,
      hatedGifts: randomElements(['generic_gift', 'gas_station_flowers', 'regifted_items'], 1),

      favoriteActivities: personality.interests.slice(0, 4),
      dislikedActivities: randomElements(['loud_clubs', 'sports_bars', 'crowded_places', 'formal_events'], 2),

      preferredDateTypes,

      favoriteTopics: personality.interests.slice(0, 4),
      avoidTopics: [],

      favoriteFoods: randomElements(FAVORITE_FOODS, 3),
      allergies: Math.random() < 0.2 ? [randomElement(['shellfish', 'peanuts', 'gluten', 'dairy'])] : [],
      dietaryRestrictions: Math.random() < 0.15 ? [randomElement(['vegetarian', 'vegan', 'pescatarian'])] : [],
      favoriteDrinks: randomElements(DRINKS, 3),

      favoriteColor: randomElement(COLORS),
      favoriteFlower: randomElement(FLOWERS),
      birthday: {
        month: randomRange(1, 12),
        day: randomRange(1, 28),
      },
    };
  }

  private generateInitialState(occupation: OccupationTemplate, locationId?: string): NPCState {
    const moods: EmotionType[] = ['content', 'happy', 'bored', 'anxious', 'excited'];

    return {
      currentLocationId: locationId || 'downtown_cafe',
      currentActivity: 'Going about their day',
      mood: {
        primary: randomElement(moods),
        intensity: randomRange(40, 70),
        duration: randomRange(60, 240),
      },
      energy: randomRange(50, 90),
      stress: clamp(occupation.stressLevel + randomRange(-20, 20), 0, 100),
      availability: 'available',
      currentThoughts: [],
    };
  }

  private generateSchedule(occupation: OccupationTemplate): ScheduleEntry[] {
    const schedule: ScheduleEntry[] = [];
    const homeLocations = ['npc_home'];
    const socialLocations = ['downtown_cafe', 'the_corner_bar', 'city_park'];

    // Add work schedule
    occupation.workDays.forEach((dayType) => {
      schedule.push({
        dayOfWeek: dayType,
        startHour: occupation.workHours.start,
        endHour: occupation.workHours.end,
        locationId: occupation.workLocation,
        activity: `Working as ${occupation.title}`,
        interruptible: false,
      });
    });

    // Add morning routine
    schedule.push({
      dayOfWeek: 'all',
      startHour: 6,
      endHour: occupation.workHours.start,
      locationId: randomElement(homeLocations),
      activity: 'Morning routine',
      interruptible: false,
    });

    // Add evening social time
    if (occupation.workHours.end < 21) {
      schedule.push({
        dayOfWeek: 'weekday',
        startHour: occupation.workHours.end + 1,
        endHour: 21,
        locationId: randomElement(socialLocations),
        activity: 'Free time',
        interruptible: true,
      });
    }

    // Weekend activities
    schedule.push({
      dayOfWeek: 'weekend',
      startHour: 10,
      endHour: 14,
      locationId: randomElement(['farmers_market', 'city_park', 'downtown_cafe']),
      activity: 'Weekend activities',
      interruptible: true,
    });

    schedule.push({
      dayOfWeek: 'weekend',
      startHour: 19,
      endHour: 23,
      locationId: randomElement(socialLocations),
      activity: 'Evening out',
      interruptible: true,
    });

    return schedule;
  }

  private createInitialRelationship(): NPCRelationship {
    return {
      friendship: 0,
      romance: 0,
      trust: 0,
      respect: 0,

      attraction: {
        physical: randomRange(0, 30), // Initial attraction can vary
        intellectual: 0,
        emotional: 0,
        spiritual: 0,
      },

      status: 'stranger',
      stage: 'unknown',

      milestonesCompleted: [],
      milestonesAvailable: this.generateDefaultMilestones(),

      lastInteraction: null,
      totalInteractions: 0,
      positiveInteractions: 0,
      negativeInteractions: 0,

      daysSinceContact: 0,
      neglectWarning: false,

      hasConfessedFeelings: false,
      isExclusive: false,
      hasMetFamily: false,
      hasSharedSecret: false,
      firstKissDate: null,

      currentTension: 0,
      jealousyLevel: 0,
      jealousyTargets: [],
    };
  }

  private generateDefaultMilestones(): RelationshipMilestone[] {
    return [
      {
        id: 'first_conversation',
        name: 'First Real Conversation',
        description: 'Have a meaningful conversation beyond small talk',
        type: 'friendship',
        requirements: [{ type: 'stat', target: 'friendship', value: 10, met: false }],
        unlocksContent: ['personal_topics'],
        unlocksLocations: [],
        unlocksTopics: ['work', 'interests'],
        completed: false,
      },
      {
        id: 'getting_closer',
        name: 'Getting Closer',
        description: 'Build a genuine friendship',
        type: 'friendship',
        requirements: [
          { type: 'stat', target: 'friendship', value: 30, met: false },
          { type: 'stat', target: 'trust', value: 20, met: false },
        ],
        unlocksContent: ['deeper_topics'],
        unlocksLocations: [],
        unlocksTopics: ['dreams', 'fears'],
        completed: false,
      },
      {
        id: 'first_date',
        name: 'First Date',
        description: 'Go on an official date',
        type: 'romance',
        requirements: [
          { type: 'stat', target: 'romance', value: 30, met: false },
          { type: 'stat', target: 'trust', value: 25, met: false },
        ],
        unlocksContent: ['romantic_options'],
        unlocksLocations: [],
        unlocksTopics: ['relationships', 'future'],
        completed: false,
      },
      {
        id: 'first_kiss',
        name: 'First Kiss',
        description: 'Share your first kiss',
        type: 'romance',
        requirements: [
          { type: 'stat', target: 'romance', value: 50, met: false },
          { type: 'stat', target: 'trust', value: 45, met: false },
        ],
        unlocksContent: ['intimate_topics'],
        unlocksLocations: [],
        unlocksTopics: ['vulnerabilities'],
        completed: false,
      },
      {
        id: 'exclusive',
        name: 'Making It Official',
        description: 'Become exclusive',
        type: 'commitment',
        requirements: [
          { type: 'stat', target: 'romance', value: 70, met: false },
          { type: 'stat', target: 'trust', value: 65, met: false },
          { type: 'time_invested', target: 'days', value: 14, met: false },
        ],
        unlocksContent: ['committed_content'],
        unlocksLocations: [],
        unlocksTopics: ['deep_secrets', 'future_together'],
        completed: false,
      },
    ];
  }

  private generateSecrets(name: string): NPCSecret[] {
    const secretCount = randomRange(1, 3);
    const selectedTemplates = randomElements(SECRET_TEMPLATES, secretCount);

    return selectedTemplates.map((template, index) => ({
      id: `secret_${index}`,
      content: template.template.replace('{name}', name.split(' ')[0]),
      severity: template.severity,
      trustThresholdToReveal: template.minTrust + randomRange(-10, 10),
      revealed: false,
    }));
  }

  private generateHiddenMotives(personality: NPCPersonality): string[] {
    const motives: string[] = [];

    if (personality.neuroticism > 50) {
      motives.push('Looking for emotional security');
    }
    if (personality.openness > 70) {
      motives.push('Seeking new experiences and growth');
    }
    if (personality.extraversion < 40) {
      motives.push('Wants deep connection over many acquaintances');
    }
    if (personality.conscientiousness > 60) {
      motives.push('Looking for a partner with similar ambition');
    }

    // Add some generic motives
    motives.push(
      ...randomElements(
        [
          'Wants to be truly understood',
          'Looking for genuine connection',
          'Afraid of being hurt again',
          'Seeking validation and acceptance',
          'Wants adventure in their life',
        ],
        2
      )
    );

    return motives.slice(0, 4);
  }

  private generateInterNPCConnections(npcs: NPC[]): void {
    if (npcs.length < 2) return;

    // Create some connections between NPCs
    const connectionTypes: NPCConnection['relationshipType'][] = ['friend', 'coworker', 'acquaintance', 'ex', 'rival'];

    for (let i = 0; i < npcs.length; i++) {
      // Each NPC has 0-2 connections to other NPCs
      const connectionCount = randomRange(0, Math.min(2, npcs.length - 1));

      for (let j = 0; j < connectionCount; j++) {
        const targetIndex = (i + 1 + j) % npcs.length;
        if (targetIndex === i) continue;

        const targetNPC = npcs[targetIndex];
        const connectionType = randomElement(connectionTypes);

        // Check if connection already exists
        const existingConnection = npcs[i].connections.find((c) => c.npcId === targetNPC.id);
        if (existingConnection) continue;

        const connection: NPCConnection = {
          npcId: targetNPC.id,
          relationshipType: connectionType,
          closeness: randomRange(30, 80),
          opinion: randomRange(40, 90),
          sharesInfoAboutPlayer: connectionType === 'friend' || connectionType === 'coworker',
          influencesOpinionOfPlayer: connectionType === 'friend',
        };

        npcs[i].connections.push(connection);

        // Create reciprocal connection
        const reciprocalConnection: NPCConnection = {
          npcId: npcs[i].id,
          relationshipType: connectionType,
          closeness: connection.closeness + randomRange(-10, 10),
          opinion: connection.opinion + randomRange(-20, 20),
          sharesInfoAboutPlayer: connection.sharesInfoAboutPlayer,
          influencesOpinionOfPlayer: connection.influencesOpinionOfPlayer,
        };

        targetNPC.connections.push(reciprocalConnection);
      }
    }
  }

  clearUsedNames(): void {
    this.usedNames.clear();
  }
}

// Singleton instance
export const npcGenerator = new NPCGenerator();

// Helper function to generate initial NPCs for new game
export const generateInitialNPCs = (count: number = 5): NPC[] => {
  npcGenerator.clearUsedNames();

  // Generate a diverse set of NPCs
  const npcs = npcGenerator.generateMultipleNPCs(count, {
    ageRange: { min: 23, max: 38 },
  });

  return npcs;
};
