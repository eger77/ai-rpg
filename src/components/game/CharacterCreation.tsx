'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { generateInitialNPCs } from '@/systems/npcGenerator';
import { getStarterLocations } from '@/data/locations';
import { generateCityMap, generateCharacterPortrait } from '@/services/imageService';
import type { Gender, PlayerAppearance, PlayerStats, WorldSettings } from '@/types';
import { User, Palette, Brain, ChevronRight, ChevronLeft, Sparkles, MapPin, Briefcase, Globe } from 'lucide-react';

type CreationStep = 'basics' | 'world' | 'appearance' | 'stats' | 'review';

interface CharacterData {
  name: string;
  age: number;
  gender: Gender;
  appearance: PlayerAppearance;
  stats: PlayerStats;
}

interface WorldData {
  cityName: string;
  cityStyle: WorldSettings['cityStyle'];
  citySize: WorldSettings['citySize'];
  climate: WorldSettings['climate'];
  careerPath: string;
  startingScenario: string;
  artStyle: WorldSettings['artStyle'];
}

const HAIR_STYLES = {
  male: ['Short', 'Medium', 'Long', 'Buzz Cut', 'Fade', 'Slicked Back', 'Messy', 'Undercut'],
  female: ['Long Straight', 'Long Wavy', 'Long Curly', 'Bob', 'Pixie Cut', 'Shoulder Length', 'Braided', 'Ponytail'],
  nonbinary: ['Short', 'Medium', 'Long', 'Undercut', 'Asymmetric', 'Buzz Cut', 'Natural'],
};

const HAIR_COLORS = ['Black', 'Dark Brown', 'Brown', 'Light Brown', 'Blonde', 'Dirty Blonde', 'Red', 'Auburn', 'Gray'];
const BODY_TYPES = ['Slim', 'Athletic', 'Average', 'Muscular', 'Curvy', 'Petite', 'Tall'];
const SKIN_TONES = ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Brown', 'Dark'];
const HEIGHTS = ['Short', 'Below Average', 'Average', 'Above Average', 'Tall'];

const CITY_STYLES: { value: WorldSettings['cityStyle']; label: string; desc: string }[] = [
  { value: 'modern', label: 'Modern', desc: 'Contemporary urban city with skyscrapers and tech' },
  { value: 'medieval', label: 'Medieval', desc: 'Castle towns, cobblestone streets, and fantasy' },
  { value: 'futuristic', label: 'Futuristic', desc: 'Neon lights, hovercars, and advanced tech' },
  { value: 'cyberpunk', label: 'Cyberpunk', desc: 'Dark, gritty, high-tech low-life aesthetic' },
  { value: 'victorian', label: 'Victorian', desc: 'Elegant 19th century architecture and culture' },
  { value: 'fantasy', label: 'Fantasy', desc: 'Magic, mythical creatures, and enchanted places' },
];

const CLIMATES: { value: WorldSettings['climate']; label: string }[] = [
  { value: 'temperate', label: 'Temperate (Mild seasons)' },
  { value: 'tropical', label: 'Tropical (Warm & humid)' },
  { value: 'mediterranean', label: 'Mediterranean (Warm & sunny)' },
  { value: 'arctic', label: 'Arctic (Cold & snowy)' },
  { value: 'desert', label: 'Desert (Hot & dry)' },
];

const CITY_SIZES: { value: WorldSettings['citySize']; label: string }[] = [
  { value: 'small', label: 'Small Town (Cozy, everyone knows everyone)' },
  { value: 'medium', label: 'Medium City (Good balance of urban and suburban)' },
  { value: 'large', label: 'Large Metropolis (Bustling, diverse, endless opportunities)' },
];

const ART_STYLES: { value: WorldSettings['artStyle']; label: string }[] = [
  { value: 'anime', label: 'Anime Style' },
  { value: 'realistic', label: 'Realistic' },
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'painterly', label: 'Painterly/Artistic' },
];

const SCENARIO_PRESETS = [
  'Just moved to town for a fresh start after a difficult breakup',
  'Starting a new job and looking to build connections',
  'Returned to hometown after years away, reconnecting with old friends',
  'College graduate navigating the real world for the first time',
  'Inheriting a small business and learning to run it',
  'Artist pursuing their passion while working a day job',
];

const DEFAULT_STATS: PlayerStats = {
  charisma: 50,
  intelligence: 50,
  empathy: 50,
  humor: 50,
  confidence: 50,
  fitness: 50,
  creativity: 50,
  cooking: 30,
  dancing: 30,
};

const STAT_DESCRIPTIONS: Record<keyof PlayerStats, string> = {
  charisma: 'Your ability to charm and persuade others',
  intelligence: 'Problem-solving and knowledge',
  empathy: 'Understanding others\' emotions',
  humor: 'Making people laugh and lightening the mood',
  confidence: 'Self-assurance in social situations',
  fitness: 'Physical health and athletic ability',
  creativity: 'Artistic and creative thinking',
  cooking: 'Culinary skills',
  dancing: 'Grace and rhythm on the dance floor',
};

const steps: CreationStep[] = ['basics', 'world', 'appearance', 'stats', 'review'];

export function CharacterCreation({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<CreationStep>('basics');
  const [isGenerating, setIsGenerating] = useState(false);
  const { initializeGame, addNPC, addLocation, setWorldSettings, setNPCPortrait } = useGameStore();

  const [character, setCharacter] = useState<CharacterData>({
    name: '',
    age: 25,
    gender: 'male',
    appearance: {
      hairStyle: 'Short',
      hairColor: 'Brown',
      bodyType: 'Average',
      skinTone: 'Medium',
      height: 'Average',
    },
    stats: { ...DEFAULT_STATS },
  });

  const [world, setWorld] = useState<WorldData>({
    cityName: '',
    cityStyle: 'modern',
    citySize: 'medium',
    climate: 'temperate',
    careerPath: '',
    startingScenario: '',
    artStyle: 'anime',
  });

  const [statPoints, setStatPoints] = useState(20);

  const updateCharacter = <K extends keyof CharacterData>(key: K, value: CharacterData[K]) => {
    setCharacter((prev) => ({ ...prev, [key]: value }));
  };

  const updateWorld = <K extends keyof WorldData>(key: K, value: WorldData[K]) => {
    setWorld((prev) => ({ ...prev, [key]: value }));
  };

  const updateAppearance = <K extends keyof PlayerAppearance>(key: K, value: PlayerAppearance[K]) => {
    setCharacter((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, [key]: value },
    }));
  };

  const updateStat = (stat: keyof PlayerStats, delta: number) => {
    const currentValue = character.stats[stat];
    const newValue = currentValue + delta;

    if (newValue < 20 || newValue > 90) return;
    if (delta > 0 && statPoints <= 0) return;

    setCharacter((prev) => ({
      ...prev,
      stats: { ...prev.stats, [stat]: newValue },
    }));
    setStatPoints((prev) => prev - delta);
  };

  const handleComplete = async () => {
    setIsGenerating(true);

    // Generate city map image with DALL-E (async, don't block)
    const cityMapPromise = generateCityMap({
      cityName: world.cityName || 'New Haven',
      cityStyle: world.cityStyle,
      climate: world.climate,
      size: world.citySize,
    });

    // Set world settings
    const worldSettings: WorldSettings = {
      cityName: world.cityName || 'New Haven',
      cityStyle: world.cityStyle,
      citySize: world.citySize,
      climate: world.climate,
      careerPath: world.careerPath || 'Office Worker',
      startingScenario: world.startingScenario || 'Starting a new chapter in life',
      artStyle: world.artStyle,
      locationImages: {},
      generatedLocations: [],
    };
    setWorldSettings(worldSettings);

    // Initialize the game with player data
    initializeGame({
      name: character.name,
      age: character.age,
      gender: character.gender,
      appearance: character.appearance,
      stats: character.stats,
    });

    // Add starter locations
    const locations = getStarterLocations();
    locations.forEach((location) => addLocation(location));

    // Generate initial NPCs with portraits
    const npcs = generateInitialNPCs(5);
    npcs.forEach((npc) => {
      addNPC(npc);
      // Generate NPC portrait asynchronously
      generateCharacterPortrait({
        gender: npc.gender,
        age: npc.age,
        hairColor: npc.appearance.hairColor,
        hairStyle: npc.appearance.hairStyle,
        eyeColor: npc.appearance.eyeColor,
        skinTone: 'medium', // Default
        style: world.artStyle,
        expression: npc.currentState.mood.primary,
      }).then((portraitUrl) => {
        if (portraitUrl) {
          setNPCPortrait(npc.id, portraitUrl);
        }
      }).catch((err) => console.warn('Portrait generation failed:', err));
    });

    // Wait for city map
    const cityMapUrl = await cityMapPromise;
    if (cityMapUrl) {
      useGameStore.getState().updateWorldSettings({ cityMapUrl });
    }

    // Small delay for effect
    await new Promise((resolve) => setTimeout(resolve, 500));

    setIsGenerating(false);
    onComplete();
  };

  const canProceed = () => {
    switch (step) {
      case 'basics':
        return character.name.trim().length >= 2 && character.age >= 18 && character.age <= 60;
      case 'world':
        return world.cityName.trim().length >= 2 && world.careerPath.trim().length >= 2;
      case 'appearance':
        return true;
      case 'stats':
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-gray-800/80 backdrop-blur rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
          <h1 className="text-2xl font-bold text-white text-center">Create Your Story</h1>
          <div className="flex justify-center gap-2 mt-4">
            {steps.map((s, i) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-colors ${
                  step === s ? 'bg-white' : steps.indexOf(step) > i ? 'bg-white/60' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Step: Basics */}
          {step === 'basics' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">Who Are You?</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Your Name</label>
                <input
                  type="text"
                  value={character.name}
                  onChange={(e) => updateCharacter('name', e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Age</label>
                <input
                  type="number"
                  value={character.age}
                  onChange={(e) => updateCharacter('age', parseInt(e.target.value) || 18)}
                  min={18}
                  max={60}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
                <div className="flex gap-3">
                  {(['male', 'female', 'nonbinary'] as Gender[]).map((g) => (
                    <button
                      key={g}
                      onClick={() => updateCharacter('gender', g)}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                        character.gender === g
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step: World Settings */}
          {step === 'world' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Globe className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">Your World</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  City Name
                </label>
                <input
                  type="text"
                  value={world.cityName}
                  onChange={(e) => updateWorld('cityName', e.target.value)}
                  placeholder="e.g., New Haven, Starlight Bay, Crimson City..."
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">City Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {CITY_STYLES.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => updateWorld('cityStyle', style.value)}
                      className={`p-3 rounded-lg text-left transition-colors ${
                        world.cityStyle === style.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      <span className="font-medium">{style.label}</span>
                      <p className="text-xs opacity-70 mt-1">{style.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">City Size</label>
                  <select
                    value={world.citySize}
                    onChange={(e) => updateWorld('citySize', e.target.value as WorldSettings['citySize'])}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {CITY_SIZES.map((size) => (
                      <option key={size.value} value={size.value}>
                        {size.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Climate</label>
                  <select
                    value={world.climate}
                    onChange={(e) => updateWorld('climate', e.target.value as WorldSettings['climate'])}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {CLIMATES.map((climate) => (
                      <option key={climate.value} value={climate.value}>
                        {climate.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-1" />
                  Your Career/Job
                </label>
                <input
                  type="text"
                  value={world.careerPath}
                  onChange={(e) => updateWorld('careerPath', e.target.value)}
                  placeholder="e.g., Software Developer, Artist, Cafe Owner, Doctor..."
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  Your Starting Scenario
                </label>
                <textarea
                  value={world.startingScenario}
                  onChange={(e) => updateWorld('startingScenario', e.target.value)}
                  placeholder="Describe your character's situation at the start of the story..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-2">Quick scenarios:</p>
                  <div className="flex flex-wrap gap-2">
                    {SCENARIO_PRESETS.slice(0, 4).map((preset, i) => (
                      <button
                        key={i}
                        onClick={() => updateWorld('startingScenario', preset)}
                        className="px-2 py-1 text-xs bg-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-600/50 rounded transition-colors"
                      >
                        {preset.slice(0, 30)}...
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Art Style</label>
                <div className="flex gap-2">
                  {ART_STYLES.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => updateWorld('artStyle', style.value)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        world.artStyle === style.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step: Appearance */}
          {step === 'appearance' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Palette className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">Appearance</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Hair Style</label>
                  <select
                    value={character.appearance.hairStyle}
                    onChange={(e) => updateAppearance('hairStyle', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {HAIR_STYLES[character.gender].map((style) => (
                      <option key={style} value={style}>
                        {style}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Hair Color</label>
                  <select
                    value={character.appearance.hairColor}
                    onChange={(e) => updateAppearance('hairColor', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {HAIR_COLORS.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Body Type</label>
                  <select
                    value={character.appearance.bodyType}
                    onChange={(e) => updateAppearance('bodyType', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {BODY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Height</label>
                  <select
                    value={character.appearance.height}
                    onChange={(e) => updateAppearance('height', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {HEIGHTS.map((height) => (
                      <option key={height} value={height}>
                        {height}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Skin Tone</label>
                  <select
                    value={character.appearance.skinTone}
                    onChange={(e) => updateAppearance('skinTone', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {SKIN_TONES.map((tone) => (
                      <option key={tone} value={tone}>
                        {tone}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step: Stats */}
          {step === 'stats' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Brain className="w-6 h-6 text-purple-400" />
                  <h2 className="text-xl font-semibold text-white">Attributes</h2>
                </div>
                <div className="px-4 py-2 bg-purple-600/30 rounded-lg">
                  <span className="text-purple-300 font-medium">{statPoints} points left</span>
                </div>
              </div>

              <div className="space-y-3">
                {(Object.keys(character.stats) as (keyof PlayerStats)[]).map((stat) => (
                  <div key={stat} className="bg-gray-700/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-white font-medium capitalize">{stat}</span>
                        <p className="text-xs text-gray-400">{STAT_DESCRIPTIONS[stat]}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateStat(stat, -5)}
                          disabled={character.stats[stat] <= 20}
                          className="w-8 h-8 rounded bg-gray-600 text-white hover:bg-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          -
                        </button>
                        <span className="w-12 text-center text-white font-bold">{character.stats[stat]}</span>
                        <button
                          onClick={() => updateStat(stat, 5)}
                          disabled={character.stats[stat] >= 90 || statPoints <= 0}
                          className="w-8 h-8 rounded bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                        style={{ width: `${character.stats[stat]}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step: Review */}
          {step === 'review' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">Your Story Begins</h2>
              </div>

              <div className="bg-gray-700/30 rounded-lg p-4 space-y-4">
                {/* Character */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white">
                    {character.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{character.name || 'Unnamed'}</h3>
                    <p className="text-gray-400">
                      {character.age} years old • {character.gender} • {world.careerPath || 'Undecided'}
                    </p>
                  </div>
                </div>

                {/* World */}
                <div className="border-t border-gray-600 pt-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    World
                  </h4>
                  <p className="text-gray-300">
                    <span className="text-white font-medium">{world.cityName || 'Unknown City'}</span> - A{' '}
                    {world.citySize} {world.cityStyle} city with {world.climate} climate
                  </p>
                </div>

                {/* Scenario */}
                <div className="border-t border-gray-600 pt-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Starting Scenario
                  </h4>
                  <p className="text-gray-300 italic">
                    "{world.startingScenario || 'Beginning a new chapter in life...'}"
                  </p>
                </div>

                {/* Appearance */}
                <div className="border-t border-gray-600 pt-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Appearance</h4>
                  <p className="text-gray-300">
                    {character.appearance.height} with {character.appearance.bodyType.toLowerCase()} build,{' '}
                    {character.appearance.hairColor.toLowerCase()} {character.appearance.hairStyle.toLowerCase()} hair,{' '}
                    {character.appearance.skinTone.toLowerCase()} skin
                  </p>
                </div>

                {/* Top Attributes */}
                <div className="border-t border-gray-600 pt-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Top Attributes</h4>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(character.stats) as [keyof PlayerStats, number][])
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                      .map(([stat, value]) => (
                        <span
                          key={stat}
                          className="px-3 py-1 bg-purple-600/30 rounded-full text-purple-300 text-sm capitalize"
                        >
                          {stat}: {value}
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              {isGenerating && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 text-purple-400">
                    <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    <span>Generating your world...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-900/50 flex justify-between">
          <button
            onClick={prevStep}
            disabled={step === 'basics'}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          {step === 'review' ? (
            <button
              onClick={handleComplete}
              disabled={isGenerating || !canProceed()}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? 'Creating...' : 'Start Your Story'}
              <Sparkles className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
