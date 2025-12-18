'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import type { NPC, RelationshipStatus } from '@/types';
import {
  X,
  Heart,
  Users,
  Shield,
  Star,
  MessageSquare,
  MapPin,
  Clock,
  Gift,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  AlertCircle,
} from 'lucide-react';

interface NPCProfileProps {
  npc: NPC;
  isOpen: boolean;
  onClose: () => void;
  onStartChat: () => void;
}

const RELATIONSHIP_STATUS_LABELS: Record<RelationshipStatus, string> = {
  stranger: 'Stranger',
  acquaintance: 'Acquaintance',
  friend: 'Friend',
  close_friend: 'Close Friend',
  romantic_interest: 'Romantic Interest',
  dating: 'Dating',
  exclusive: 'Exclusive',
  committed: 'In a Relationship',
  engaged: 'Engaged',
  married: 'Married',
  ex: 'Ex',
  estranged: 'Estranged',
  enemy: 'Enemy',
};

const RELATIONSHIP_STATUS_COLORS: Record<RelationshipStatus, string> = {
  stranger: 'text-gray-400',
  acquaintance: 'text-blue-400',
  friend: 'text-green-400',
  close_friend: 'text-emerald-400',
  romantic_interest: 'text-pink-400',
  dating: 'text-rose-400',
  exclusive: 'text-red-400',
  committed: 'text-red-500',
  engaged: 'text-purple-400',
  married: 'text-purple-500',
  ex: 'text-gray-500',
  estranged: 'text-orange-400',
  enemy: 'text-red-600',
};

export function NPCProfile({ npc, isOpen, onClose, onStartChat }: NPCProfileProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('relationship');
  const { gameTime, locations } = useGameStore();

  if (!isOpen) return null;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const formatScheduleTime = (hour: number) => {
    const h = hour % 12 || 12;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${h}${ampm}`;
  };

  const getCurrentActivity = () => {
    const schedule = npc.defaultSchedule.find((s) => {
      const matchesDay =
        s.dayOfWeek === 'all' ||
        s.dayOfWeek === gameTime.dayOfWeek ||
        (s.dayOfWeek === 'weekday' && !['saturday', 'sunday'].includes(gameTime.dayOfWeek)) ||
        (s.dayOfWeek === 'weekend' && ['saturday', 'sunday'].includes(gameTime.dayOfWeek));
      return matchesDay && gameTime.hour >= s.startHour && gameTime.hour < s.endHour;
    });
    return schedule;
  };

  const currentActivity = getCurrentActivity();
  const currentLocation = locations.get(npc.currentState.currentLocationId);

  const StatBar = ({ value, max = 100, color = 'purple' }: { value: number; max?: number; color?: string }) => (
    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full bg-${color}-500 transition-all`}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md h-full bg-gray-900 border-l border-gray-700 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative">
          <div className="h-32 bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/30 rounded-full text-white hover:bg-black/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Avatar */}
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-4 border-gray-900 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">{npc.name.charAt(0)}</span>
            </div>
            {npc.relationship.romance > 50 && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center border-2 border-gray-900">
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div className="pt-14 px-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{npc.name}</h2>
              <p className="text-gray-400">{npc.occupation} • {npc.age} years old</p>
            </div>
            <span className={`text-sm font-medium ${RELATIONSHIP_STATUS_COLORS[npc.relationship.status]}`}>
              {RELATIONSHIP_STATUS_LABELS[npc.relationship.status]}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={onStartChat}
              className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </button>
            <button className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors">
              <Gift className="w-4 h-4" />
              Gift
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
          {/* Current Status */}
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-gray-300">Current Status</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-white">{currentLocation?.name || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gray-500" />
                <span className="text-white">{npc.currentState.currentActivity}</span>
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
                <span className="text-gray-400 capitalize">{npc.currentState.availability}</span>
              </div>
            </div>
          </div>

          {/* Relationship Stats */}
          <div className="bg-gray-800/50 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('relationship')}
              className="w-full px-4 py-3 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400" />
                <span className="font-medium text-white">Relationship</span>
              </div>
              {expandedSection === 'relationship' ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {expandedSection === 'relationship' && (
              <div className="px-4 pb-4 space-y-4">
                {/* Main Stats */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Friendship</span>
                      <span className="text-white">{npc.relationship.friendship}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${npc.relationship.friendship}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Romance</span>
                      <span className="text-white">{npc.relationship.romance}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-pink-500 transition-all"
                        style={{ width: `${npc.relationship.romance}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Trust</span>
                      <span className="text-white">{npc.relationship.trust}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${npc.relationship.trust}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Respect</span>
                      <span className="text-white">{npc.relationship.respect}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all"
                        style={{ width: `${npc.relationship.respect}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Attraction Types */}
                <div className="pt-2 border-t border-gray-700">
                  <p className="text-sm text-gray-400 mb-2">Attraction</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center justify-between bg-gray-700/50 rounded px-2 py-1">
                      <span className="text-gray-400">Physical</span>
                      <span className="text-white">{npc.relationship.attraction.physical}%</span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-700/50 rounded px-2 py-1">
                      <span className="text-gray-400">Intellectual</span>
                      <span className="text-white">{npc.relationship.attraction.intellectual}%</span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-700/50 rounded px-2 py-1">
                      <span className="text-gray-400">Emotional</span>
                      <span className="text-white">{npc.relationship.attraction.emotional}%</span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-700/50 rounded px-2 py-1">
                      <span className="text-gray-400">Spiritual</span>
                      <span className="text-white">{npc.relationship.attraction.spiritual}%</span>
                    </div>
                  </div>
                </div>

                {/* Warnings */}
                {npc.relationship.neglectWarning && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-500/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-yellow-400">Feeling neglected - reach out soon!</span>
                  </div>
                )}

                {npc.relationship.jealousyLevel > 30 && (
                  <div className="flex items-center gap-2 p-2 bg-red-500/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-400">Jealousy detected ({npc.relationship.jealousyLevel}%)</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Known Facts */}
          <div className="bg-gray-800/50 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('facts')}
              className="w-full px-4 py-3 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="font-medium text-white">Known Facts</span>
                <span className="text-xs text-gray-500">({npc.knownFacts.length})</span>
              </div>
              {expandedSection === 'facts' ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {expandedSection === 'facts' && (
              <div className="px-4 pb-4">
                {npc.knownFacts.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    You don&apos;t know much about {npc.name.split(' ')[0]} yet. Keep talking to learn more!
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {npc.knownFacts.map((fact) => (
                      <li key={fact.id} className="flex items-start gap-2 text-sm">
                        <span className="text-purple-400 mt-1">•</span>
                        <span className="text-gray-300">{fact.fact}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Preferences (if known) */}
                {npc.relationship.friendship >= 20 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Preferences</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-300">
                        <span className="text-gray-500">Favorite Color:</span> {npc.preferences.favoriteColor}
                      </p>
                      <p className="text-gray-300">
                        <span className="text-gray-500">Birthday:</span>{' '}
                        {new Date(2000, npc.preferences.birthday.month - 1, npc.preferences.birthday.day).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                      </p>
                      {npc.relationship.friendship >= 40 && (
                        <p className="text-gray-300">
                          <span className="text-gray-500">Favorite Flower:</span> {npc.preferences.favoriteFlower}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Milestones */}
          <div className="bg-gray-800/50 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('milestones')}
              className="w-full px-4 py-3 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="font-medium text-white">Milestones</span>
              </div>
              {expandedSection === 'milestones' ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {expandedSection === 'milestones' && (
              <div className="px-4 pb-4 space-y-3">
                {/* Completed */}
                {npc.relationship.milestonesCompleted.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Completed</p>
                    {npc.relationship.milestonesCompleted.map((milestone) => (
                      <div
                        key={milestone.id}
                        className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg mb-2"
                      >
                        <Unlock className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="text-sm text-white">{milestone.name}</p>
                          <p className="text-xs text-gray-400">{milestone.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Available */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">Next Milestones</p>
                  {npc.relationship.milestonesAvailable.slice(0, 3).map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-lg mb-2"
                    >
                      <Lock className="w-4 h-4 text-gray-500" />
                      <div className="flex-1">
                        <p className="text-sm text-white">{milestone.name}</p>
                        <p className="text-xs text-gray-400">{milestone.description}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {milestone.requirements.map((req, i) => (
                            <span
                              key={i}
                              className={`text-xs px-2 py-0.5 rounded ${
                                req.met ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'
                              }`}
                            >
                              {req.target}: {String(req.value)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="bg-gray-800/50 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('schedule')}
              className="w-full px-4 py-3 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="font-medium text-white">Schedule</span>
              </div>
              {expandedSection === 'schedule' ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {expandedSection === 'schedule' && (
              <div className="px-4 pb-4">
                {npc.relationship.trust >= 30 ? (
                  <div className="space-y-2">
                    {npc.defaultSchedule.slice(0, 6).map((entry, i) => {
                      const location = locations.get(entry.locationId);
                      return (
                        <div
                          key={i}
                          className={`flex items-center justify-between p-2 rounded ${
                            currentActivity?.locationId === entry.locationId &&
                            currentActivity?.activity === entry.activity
                              ? 'bg-purple-500/20'
                              : 'bg-gray-700/30'
                          }`}
                        >
                          <div>
                            <p className="text-sm text-white">{entry.activity}</p>
                            <p className="text-xs text-gray-400">{location?.name || entry.locationId}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-300">
                              {formatScheduleTime(entry.startHour)} - {formatScheduleTime(entry.endHour)}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">{entry.dayOfWeek}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Build more trust with {npc.name.split(' ')[0]} to learn their schedule.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
