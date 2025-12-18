'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { generateInitialNPCs } from '@/systems/npcGenerator';
import { getStarterLocations } from '@/data/locations';
import type { Gender, PlayerAppearance, PlayerStats } from '@/types';
import { User, Palette, Brain, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

type CreationStep = 'basics' | 'appearance' | 'stats' | 'review';

interface CharacterData {
  name: string;
  age: number;
  gender: Gender;
  appearance: PlayerAppearance;
  stats: PlayerStats;
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

export function CharacterCreation({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<CreationStep>('basics');
  const [isGenerating, setIsGenerating] = useState(false);
  const { initializeGame, addNPC, addLocation } = useGameStore();

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

  const [statPoints, setStatPoints] = useState(20); // Bonus points to distribute

  const updateCharacter = <K extends keyof CharacterData>(key: K, value: CharacterData[K]) => {
    setCharacter((prev) => ({ ...prev, [key]: value }));
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

    // Generate initial NPCs
    const npcs = generateInitialNPCs(5);
    npcs.forEach((npc) => addNPC(npc));

    // Small delay for effect
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsGenerating(false);
    onComplete();
  };

  const canProceed = () => {
    switch (step) {
      case 'basics':
        return character.name.trim().length >= 2 && character.age >= 18 && character.age <= 60;
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
    const steps: CreationStep[] = ['basics', 'appearance', 'stats', 'review'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: CreationStep[] = ['basics', 'appearance', 'stats', 'review'];
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
          <h1 className="text-2xl font-bold text-white text-center">Create Your Character</h1>
          <div className="flex justify-center gap-2 mt-4">
            {(['basics', 'appearance', 'stats', 'review'] as CreationStep[]).map((s, i) => (
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
        <div className="p-6">
          {/* Step: Basics */}
          {step === 'basics' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">Basic Information</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
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

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
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
                <h2 className="text-xl font-semibold text-white">Review Your Character</h2>
              </div>

              <div className="bg-gray-700/30 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white">
                    {character.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{character.name || 'Unnamed'}</h3>
                    <p className="text-gray-400">
                      {character.age} years old • {character.gender}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-600 pt-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Appearance</h4>
                  <p className="text-gray-300">
                    {character.appearance.height} with {character.appearance.bodyType.toLowerCase()} build,{' '}
                    {character.appearance.hairColor.toLowerCase()} {character.appearance.hairStyle.toLowerCase()} hair,{' '}
                    {character.appearance.skinTone.toLowerCase()} skin
                  </p>
                </div>

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

const steps: CreationStep[] = ['basics', 'appearance', 'stats', 'review'];
