'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import type { ClothingItem, ClothingSlot, Outfit } from '@/types';
import {
  X,
  Shirt,
  Check,
  AlertCircle,
  Droplets,
  Sparkles,
  Sun,
  Snowflake,
} from 'lucide-react';

interface WardrobeUIProps {
  isOpen: boolean;
  onClose: () => void;
}

const SLOT_LABELS: Record<ClothingSlot, string> = {
  hat: 'Hat',
  top: 'Top',
  bottom: 'Bottom',
  shoes: 'Shoes',
  outerwear: 'Outerwear',
  accessory: 'Accessory',
  underwear: 'Underwear',
  sleepwear: 'Sleepwear',
  swimwear: 'Swimwear',
};

const FORMALITY_LABELS = ['Very Casual', 'Casual', 'Smart Casual', 'Formal', 'Black Tie'];

const STYLE_COLORS: Record<string, string> = {
  casual: 'bg-blue-500/20 text-blue-400',
  business: 'bg-gray-500/20 text-gray-400',
  formal: 'bg-purple-500/20 text-purple-400',
  athletic: 'bg-green-500/20 text-green-400',
  vintage: 'bg-amber-500/20 text-amber-400',
  streetwear: 'bg-red-500/20 text-red-400',
  artistic: 'bg-pink-500/20 text-pink-400',
  luxury: 'bg-yellow-500/20 text-yellow-400',
};

export function WardrobeUI({ isOpen, onClose }: WardrobeUIProps) {
  const { player, updatePlayer, gameTime } = useGameStore();
  const [selectedSlot, setSelectedSlot] = useState<keyof Outfit>('top');
  const [previewOutfit, setPreviewOutfit] = useState<Outfit | null>(null);

  if (!isOpen || !player) return null;

  const currentOutfit = previewOutfit || player.currentOutfit;

  const getSlotItem = (slot: keyof Outfit): ClothingItem | undefined => {
    return currentOutfit[slot];
  };

  const getItemsForSlot = (slot: keyof Outfit): ClothingItem[] => {
    return player.wardrobe.filter((item) => {
      if (slot === 'accessory') {
        return item.slot === 'accessory';
      }
      return item.slot === slot;
    });
  };

  const selectItem = (item: ClothingItem, slot: keyof Outfit) => {
    const newOutfit = { ...currentOutfit, [slot]: item };
    setPreviewOutfit(newOutfit);
  };

  const removeItem = (slot: keyof Outfit) => {
    if (slot === 'top' || slot === 'bottom' || slot === 'shoes') return; // Required slots
    const newOutfit = { ...currentOutfit };
    delete newOutfit[slot];
    setPreviewOutfit(newOutfit);
  };

  const applyOutfit = () => {
    if (previewOutfit) {
      updatePlayer({ currentOutfit: previewOutfit });
      setPreviewOutfit(null);
    }
  };

  const cancelChanges = () => {
    setPreviewOutfit(null);
  };

  const calculateOutfitStats = (outfit: Outfit) => {
    const items = Object.values(outfit).filter(Boolean) as ClothingItem[];
    const avgFormality = items.reduce((sum, item) => sum + item.formalityLevel, 0) / items.length || 0;
    const totalWarmth = items.reduce((sum, item) => sum + item.warmth, 0);
    const avgCleanliness = items.reduce((sum, item) => sum + item.cleanliness, 0) / items.length || 0;
    const avgCondition = items.reduce((sum, item) => sum + item.condition, 0) / items.length || 0;
    const confidenceBonus = items.reduce((sum, item) => sum + (item.confidenceBonus || 0), 0);

    return { avgFormality, totalWarmth, avgCleanliness, avgCondition, confidenceBonus };
  };

  const outfitStats = calculateOutfitStats(currentOutfit);

  const getWeatherAppropriate = () => {
    const coldWeather = ['snowy', 'rainy', 'stormy'];
    const isCold = coldWeather.includes(gameTime.weather) || gameTime.season === 'winter';

    if (isCold && outfitStats.totalWarmth < 8) {
      return { appropriate: false, message: 'Too light for the weather!' };
    }
    if (!isCold && outfitStats.totalWarmth > 12) {
      return { appropriate: false, message: 'Too warm for the weather!' };
    }
    return { appropriate: true, message: 'Weather appropriate' };
  };

  const weatherStatus = getWeatherAppropriate();

  const MAIN_SLOTS: (keyof Outfit)[] = ['hat', 'top', 'bottom', 'shoes', 'outerwear'];
  const ACCESSORY_SLOTS: (keyof Outfit)[] = ['accessory1', 'accessory2'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl h-[85vh] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shirt className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Wardrobe</h2>
          </div>
          <div className="flex items-center gap-3">
            {previewOutfit && (
              <>
                <button
                  onClick={cancelChanges}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={applyOutfit}
                  className="px-4 py-2 bg-white text-purple-600 font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Apply Changes
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Current Outfit Display */}
          <div className="w-80 bg-gray-800/50 border-r border-gray-700 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Current Outfit</h3>

            {/* Outfit Stats */}
            <div className="bg-gray-700/30 rounded-xl p-4 mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Formality</span>
                <span className="text-white text-sm">{FORMALITY_LABELS[Math.round(outfitStats.avgFormality) - 1] || 'Casual'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  Condition
                </span>
                <span className="text-white text-sm">{Math.round(outfitStats.avgCondition)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm flex items-center gap-1">
                  <Droplets className="w-4 h-4" />
                  Cleanliness
                </span>
                <span className={`text-sm ${outfitStats.avgCleanliness > 60 ? 'text-green-400' : outfitStats.avgCleanliness > 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {Math.round(outfitStats.avgCleanliness)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm flex items-center gap-1">
                  {gameTime.weather === 'snowy' ? <Snowflake className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  Warmth
                </span>
                <span className="text-white text-sm">{outfitStats.totalWarmth}</span>
              </div>
              {outfitStats.confidenceBonus > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Confidence Bonus</span>
                  <span className="text-green-400 text-sm">+{outfitStats.confidenceBonus}</span>
                </div>
              )}
            </div>

            {/* Weather Warning */}
            {!weatherStatus.appropriate && (
              <div className="mb-6 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-yellow-400">{weatherStatus.message}</span>
              </div>
            )}

            {/* Outfit Slots */}
            <div className="space-y-2">
              {MAIN_SLOTS.map((slot) => {
                const item = getSlotItem(slot);
                const isRequired = slot === 'top' || slot === 'bottom' || slot === 'shoes';

                return (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      selectedSlot === slot
                        ? 'bg-purple-600/20 border-2 border-purple-500'
                        : 'bg-gray-700/30 hover:bg-gray-600/30 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 uppercase tracking-wide">
                        {SLOT_LABELS[slot as ClothingSlot]}
                        {isRequired && <span className="text-red-400">*</span>}
                      </span>
                      {item && (
                        <span className={`text-xs px-2 py-0.5 rounded ${STYLE_COLORS[item.style] || 'bg-gray-500/20 text-gray-400'}`}>
                          {item.style}
                        </span>
                      )}
                    </div>
                    <p className="text-white font-medium mt-1">
                      {item ? item.name : <span className="text-gray-500">None</span>}
                    </p>
                    {item && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{item.color}</span>
                        {item.hasStain && (
                          <span className="text-xs text-yellow-400">Stained</span>
                        )}
                        {item.isWet && (
                          <span className="text-xs text-blue-400">Wet</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Accessories */}
              <div className="pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Accessories</p>
                {ACCESSORY_SLOTS.map((slot) => {
                  const item = getSlotItem(slot);
                  return (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`w-full p-3 rounded-xl text-left transition-all mb-2 ${
                        selectedSlot === slot
                          ? 'bg-purple-600/20 border-2 border-purple-500'
                          : 'bg-gray-700/30 hover:bg-gray-600/30 border-2 border-transparent'
                      }`}
                    >
                      <p className="text-white font-medium">
                        {item ? item.name : <span className="text-gray-500">None</span>}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Available Items */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Select {SLOT_LABELS[selectedSlot as ClothingSlot] || 'Accessory'}
              </h3>
              {getSlotItem(selectedSlot) && selectedSlot !== 'top' && selectedSlot !== 'bottom' && selectedSlot !== 'shoes' && (
                <button
                  onClick={() => removeItem(selectedSlot)}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              )}
            </div>

            {getItemsForSlot(selectedSlot).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Shirt className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">No items available</p>
                <p className="text-sm">Visit shops to buy more clothes</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {getItemsForSlot(selectedSlot).map((item) => {
                  const isEquipped = getSlotItem(selectedSlot)?.id === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => selectItem(item, selectedSlot)}
                      className={`p-4 rounded-xl text-left transition-all ${
                        isEquipped
                          ? 'bg-purple-600/20 border-2 border-purple-500'
                          : 'bg-gray-800/50 hover:bg-gray-700/50 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${STYLE_COLORS[item.style] || 'bg-gray-500/20 text-gray-400'}`}>
                          {item.style}
                        </span>
                        {isEquipped && (
                          <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                            Equipped
                          </span>
                        )}
                      </div>

                      <h4 className="text-white font-medium mb-1">{item.name}</h4>
                      <p className="text-sm text-gray-400 mb-3">{item.color}</p>

                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Formality</span>
                          <span className="text-gray-300">{FORMALITY_LABELS[item.formalityLevel - 1]}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Warmth</span>
                          <span className="text-gray-300">{item.warmth}/5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Condition</span>
                          <span className={item.condition > 60 ? 'text-green-400' : item.condition > 30 ? 'text-yellow-400' : 'text-red-400'}>
                            {item.condition}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Clean</span>
                          <span className={item.cleanliness > 60 ? 'text-green-400' : item.cleanliness > 30 ? 'text-yellow-400' : 'text-red-400'}>
                            {item.cleanliness}%
                          </span>
                        </div>
                      </div>

                      {(item.hasStain || item.isWet) && (
                        <div className="mt-2 flex gap-2">
                          {item.hasStain && (
                            <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                              Stained
                            </span>
                          )}
                          {item.isWet && (
                            <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                              Wet
                            </span>
                          )}
                        </div>
                      )}

                      {item.confidenceBonus && item.confidenceBonus > 0 && (
                        <div className="mt-2 text-xs text-green-400">
                          +{item.confidenceBonus} Confidence
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
