'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import type { Location, NPC, LocationActivity } from '@/types';
import {
  MapPin,
  Clock,
  Users,
  Volume2,
  Lock,
  Unlock,
  ChevronRight,
  Play,
  DollarSign,
  Zap,
  Smile,
  User,
  X,
} from 'lucide-react';

interface LocationViewProps {
  location: Location;
  isOpen: boolean;
  onClose: () => void;
  onTravelTo: () => void;
  onViewNPC: (npc: NPC) => void;
}

const NOISE_LEVELS = {
  quiet: { label: 'Quiet', color: 'text-green-400', icon: '🤫' },
  moderate: { label: 'Moderate', color: 'text-yellow-400', icon: '🔉' },
  loud: { label: 'Loud', color: 'text-orange-400', icon: '🔊' },
  very_loud: { label: 'Very Loud', color: 'text-red-400', icon: '📢' },
};

const CROWD_LEVELS = {
  empty: { label: 'Empty', color: 'text-green-400' },
  sparse: { label: 'Sparse', color: 'text-blue-400' },
  moderate: { label: 'Moderate', color: 'text-yellow-400' },
  crowded: { label: 'Crowded', color: 'text-orange-400' },
  packed: { label: 'Packed', color: 'text-red-400' },
};

export function LocationView({ location, isOpen, onClose, onTravelTo, onViewNPC }: LocationViewProps) {
  const [selectedActivity, setSelectedActivity] = useState<LocationActivity | null>(null);
  const { player, gameTime, getNPCsAtLocation, advanceTime, changeEnergy, changeMood, changeStress, addTransaction, canAfford } = useGameStore();

  if (!isOpen || !player) return null;

  const npcsHere = getNPCsAtLocation(location.id);
  const isPlayerHere = player.currentLocationId === location.id;

  const formatHour = (hour: number) => {
    const h = hour % 12 || 12;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${h}${ampm}`;
  };

  const isLocationOpen = () => {
    if (location.openHours === 'always') return true;
    if (location.closedDays.includes(gameTime.dayOfWeek)) return false;
    return gameTime.hour >= location.openHours.open && gameTime.hour < location.openHours.close;
  };

  const checkUnlockRequirements = () => {
    if (location.unlocked) return { unlocked: true, missing: [] };

    const missing: string[] = [];
    location.unlockRequirements.forEach((req) => {
      if (!req.met) {
        missing.push(`${req.type}: ${req.target} (${req.value})`);
      }
    });

    return { unlocked: missing.length === 0, missing };
  };

  const doActivity = (activity: LocationActivity) => {
    if (!canAfford(activity.moneyCost)) return;
    if (player.energy < activity.energyCost && activity.energyCost > 0) return;

    // Advance time
    advanceTime(activity.duration);

    // Apply effects
    changeEnergy(-activity.energyCost);
    if (activity.moodChange) changeMood(activity.moodChange);
    if (activity.stressChange) changeStress(activity.stressChange);

    // Deduct money
    if (activity.moneyCost > 0) {
      addTransaction({
        amount: -activity.moneyCost,
        description: activity.name,
        category: 'activity',
      });
    }

    setSelectedActivity(null);
  };

  const { unlocked, missing } = checkUnlockRequirements();
  const open = isLocationOpen();
  const noise = NOISE_LEVELS[location.noiseLevel];
  const crowd = CROWD_LEVELS[location.crowdLevel];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
        {/* Header Image */}
        <div className="relative h-48 bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600">
          <div className="absolute inset-0 bg-black/30" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/30 rounded-full text-white hover:bg-black/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-5 h-5 text-white/80" />
              <span className="text-sm text-white/80 capitalize">{location.type}</span>
            </div>
            <h2 className="text-3xl font-bold text-white">{location.name}</h2>
          </div>
        </div>

        <div className="p-6">
          {/* Status Bar */}
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-700">
            {/* Open Status */}
            <div className={`flex items-center gap-2 ${open ? 'text-green-400' : 'text-red-400'}`}>
              {open ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span className="text-sm font-medium">{open ? 'Open' : 'Closed'}</span>
            </div>

            {/* Hours */}
            {location.openHours !== 'always' && (
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  {formatHour(location.openHours.open)} - {formatHour(location.openHours.close)}
                </span>
              </div>
            )}

            {/* Noise Level */}
            <div className={`flex items-center gap-1 ${noise.color}`}>
              <Volume2 className="w-4 h-4" />
              <span className="text-sm">{noise.label}</span>
            </div>

            {/* Crowd */}
            <div className={`flex items-center gap-1 ${crowd.color}`}>
              <Users className="w-4 h-4" />
              <span className="text-sm">{crowd.label}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-300 mb-6">{location.description}</p>

          {/* Ambiance */}
          <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400 italic">{location.ambiance}</p>
          </div>

          {/* Unlock Requirements */}
          {!unlocked && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <Lock className="w-5 h-5" />
                <span className="font-medium">Location Locked</span>
              </div>
              <ul className="space-y-1">
                {missing.map((req, i) => (
                  <li key={i} className="text-sm text-red-300/80">• {req}</li>
                ))}
              </ul>
            </div>
          )}

          {/* NPCs Present */}
          {npcsHere.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                People Here
              </h3>
              <div className="grid gap-2">
                {npcsHere.map((npc) => (
                  <button
                    key={npc.id}
                    onClick={() => onViewNPC(npc)}
                    className="flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {npc.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{npc.name}</p>
                      <p className="text-sm text-gray-400">{npc.currentState.currentActivity}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          npc.currentState.availability === 'available'
                            ? 'bg-green-500'
                            : npc.currentState.availability === 'busy'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                      />
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Activities */}
          {unlocked && open && isPlayerHere && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Play className="w-5 h-5 text-green-400" />
                Activities
              </h3>
              <div className="grid gap-2">
                {location.availableActivities.map((activity) => {
                  const canDo = canAfford(activity.moneyCost) && (player.energy >= activity.energyCost || activity.energyCost < 0);

                  return (
                    <button
                      key={activity.id}
                      onClick={() => setSelectedActivity(activity)}
                      disabled={!canDo}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                        canDo
                          ? 'bg-gray-800/50 hover:bg-gray-700/50'
                          : 'bg-gray-800/30 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="text-white font-medium">{activity.name}</p>
                        <p className="text-sm text-gray-400">{activity.description}</p>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1 text-gray-400">
                          <Clock className="w-4 h-4" />
                          {activity.duration}m
                        </div>
                        {activity.energyCost !== 0 && (
                          <div className={`flex items-center gap-1 ${activity.energyCost < 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                            <Zap className="w-4 h-4" />
                            {activity.energyCost < 0 ? '+' : '-'}{Math.abs(activity.energyCost)}
                          </div>
                        )}
                        {activity.moneyCost > 0 && (
                          <div className="flex items-center gap-1 text-green-400">
                            <DollarSign className="w-4 h-4" />
                            {activity.moneyCost}
                          </div>
                        )}
                        {activity.moodChange && activity.moodChange !== 0 && (
                          <div className={`flex items-center gap-1 ${activity.moodChange > 0 ? 'text-pink-400' : 'text-red-400'}`}>
                            <Smile className="w-4 h-4" />
                            {activity.moodChange > 0 ? '+' : ''}{activity.moodChange}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interaction Points */}
          {location.interactionPoints.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Areas</h3>
              <div className="flex flex-wrap gap-2">
                {location.interactionPoints.map((point) => (
                  <div
                    key={point.id}
                    className="px-3 py-2 bg-gray-800/50 rounded-lg text-sm"
                  >
                    <p className="text-white">{point.name}</p>
                    <p className="text-xs text-gray-400">{point.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Travel Button */}
          {!isPlayerHere && unlocked && open && (
            <button
              onClick={onTravelTo}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <MapPin className="w-5 h-5" />
              Travel Here
            </button>
          )}

          {isPlayerHere && (
            <div className="text-center text-green-400 py-3">
              <MapPin className="w-5 h-5 inline mr-2" />
              You are here
            </div>
          )}
        </div>
      </div>

      {/* Activity Confirmation Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-2">{selectedActivity.name}</h3>
            <p className="text-gray-400 mb-4">{selectedActivity.description}</p>

            <div className="flex flex-wrap gap-3 mb-6">
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-full text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-white">{selectedActivity.duration} minutes</span>
              </div>
              {selectedActivity.moneyCost > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-full text-sm">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-white">${selectedActivity.moneyCost}</span>
                </div>
              )}
              {selectedActivity.energyCost !== 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-full text-sm">
                  <Zap className={`w-4 h-4 ${selectedActivity.energyCost < 0 ? 'text-green-400' : 'text-yellow-400'}`} />
                  <span className="text-white">
                    {selectedActivity.energyCost < 0 ? 'Restores' : 'Uses'} {Math.abs(selectedActivity.energyCost)} energy
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedActivity(null)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => doActivity(selectedActivity)}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition-colors"
              >
                Do It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
