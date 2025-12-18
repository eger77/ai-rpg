'use client';

import { useGameStore } from '@/stores/gameStore';
import type { Quest, QuestObjective } from '@/types';
import {
  X,
  Target,
  Clock,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Star,
  Gift,
  Trophy,
} from 'lucide-react';
import { useState } from 'react';

interface QuestsUIProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUEST_TYPE_COLORS = {
  main: 'from-purple-500 to-pink-500',
  side: 'from-blue-500 to-cyan-500',
  personal: 'from-green-500 to-emerald-500',
  discovery: 'from-yellow-500 to-orange-500',
  timed: 'from-red-500 to-rose-500',
};

const URGENCY_COLORS = {
  none: 'text-gray-400',
  low: 'text-blue-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
};

export function QuestsUI({ isOpen, onClose }: QuestsUIProps) {
  const { quests, gameTime, npcs } = useGameStore();
  const [expandedQuest, setExpandedQuest] = useState<string | null>(null);
  const [filter, setFilter] = useState<'active' | 'completed' | 'failed' | 'all'>('active');

  if (!isOpen) return null;

  const allQuests = Array.from(quests.values());

  const filteredQuests = allQuests.filter((quest) => {
    if (filter === 'all') return true;
    if (filter === 'active') return quest.status === 'active';
    if (filter === 'completed') return quest.status === 'completed';
    if (filter === 'failed') return quest.status === 'failed' || quest.status === 'expired';
    return true;
  });

  const activeQuests = allQuests.filter((q) => q.status === 'active');
  const completedQuests = allQuests.filter((q) => q.status === 'completed');

  const getDaysUntilDeadline = (deadline: number) => {
    return deadline - gameTime.day;
  };

  const getQuestProgress = (quest: Quest) => {
    const total = quest.objectives.length;
    const completed = quest.objectives.filter((o) => o.completed).length;
    return { total, completed, percentage: Math.round((completed / total) * 100) };
  };

  const getGiverName = (npcId?: string) => {
    if (!npcId) return null;
    const npc = npcs.get(npcId);
    return npc?.name || 'Unknown';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl h-[80vh] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Objectives</h2>
            <span className="px-2 py-1 bg-white/20 rounded text-sm text-white">
              {activeQuests.length} Active
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="px-6 py-3 bg-gray-800/50 border-b border-gray-700 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-gray-300">
              <span className="text-white font-medium">{activeQuests.length}</span> Active
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-300">
              <span className="text-white font-medium">{completedQuests.length}</span> Completed
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-2 bg-gray-800/30 border-b border-gray-700 flex gap-2">
          {(['active', 'completed', 'failed', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                filter === f
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredQuests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Target className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">No {filter === 'all' ? '' : filter} quests</p>
              <p className="text-sm">
                {filter === 'active'
                  ? 'Explore the world to find new objectives!'
                  : 'Complete quests to see them here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuests.map((quest) => {
                const progress = getQuestProgress(quest);
                const isExpanded = expandedQuest === quest.id;
                const colorClass = QUEST_TYPE_COLORS[quest.type] || QUEST_TYPE_COLORS.side;
                const daysLeft = quest.deadline ? getDaysUntilDeadline(quest.deadline) : null;
                const giverName = getGiverName(quest.giverNpcId);

                return (
                  <div
                    key={quest.id}
                    className={`bg-gray-800/50 rounded-xl overflow-hidden border ${
                      quest.status === 'completed'
                        ? 'border-green-500/30'
                        : quest.status === 'failed' || quest.status === 'expired'
                        ? 'border-red-500/30'
                        : 'border-gray-700'
                    }`}
                  >
                    {/* Quest Header */}
                    <button
                      onClick={() => setExpandedQuest(isExpanded ? null : quest.id)}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClass}`}>
                          {quest.status === 'completed' ? (
                            <Trophy className="w-5 h-5 text-white" />
                          ) : (
                            <Target className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">{quest.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                              quest.type === 'main'
                                ? 'bg-purple-500/20 text-purple-400'
                                : quest.type === 'timed'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {quest.type}
                            </span>
                            {quest.urgency !== 'none' && (
                              <span className={`text-xs ${URGENCY_COLORS[quest.urgency]}`}>
                                {quest.urgency === 'critical' && <AlertCircle className="w-3 h-3 inline mr-1" />}
                                {quest.urgency.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">{quest.description}</p>
                          {giverName && (
                            <p className="text-xs text-gray-500 mt-1">From: {giverName}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {quest.status === 'active' && (
                            <>
                              <div className="text-right">
                                <span className="text-sm text-white font-medium">
                                  {progress.completed}/{progress.total}
                                </span>
                                <span className="text-xs text-gray-400 ml-1">objectives</span>
                              </div>
                              {daysLeft !== null && (
                                <span className={`text-xs ${
                                  daysLeft <= 1 ? 'text-red-400' : daysLeft <= 3 ? 'text-yellow-400' : 'text-gray-400'
                                }`}>
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  {daysLeft} days left
                                </span>
                              )}
                            </>
                          )}
                          {quest.status === 'completed' && (
                            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                              Completed
                            </span>
                          )}
                          {(quest.status === 'failed' || quest.status === 'expired') && (
                            <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded">
                              {quest.status === 'expired' ? 'Expired' : 'Failed'}
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {quest.status === 'active' && (
                        <div className="mt-3">
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${colorClass} transition-all`}
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-700 pt-4">
                        {/* Objectives */}
                        <h4 className="text-sm font-medium text-gray-400 mb-3">Objectives</h4>
                        <div className="space-y-2 mb-4">
                          {quest.objectives.map((objective) => (
                            <div
                              key={objective.id}
                              className={`flex items-center gap-3 p-2 rounded-lg ${
                                objective.completed ? 'bg-green-500/10' : 'bg-gray-700/30'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                  objective.completed
                                    ? 'border-green-500 bg-green-500'
                                    : 'border-gray-500'
                                }`}
                              >
                                {objective.completed && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <span
                                className={`text-sm ${
                                  objective.completed ? 'text-green-400 line-through' : 'text-gray-300'
                                }`}
                              >
                                {objective.description}
                              </span>
                              {objective.targetValue && objective.currentValue !== undefined && (
                                <span className="text-xs text-gray-500 ml-auto">
                                  {objective.currentValue}/{objective.targetValue}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Rewards */}
                        {quest.rewards.length > 0 && (
                          <>
                            <h4 className="text-sm font-medium text-gray-400 mb-2">Rewards</h4>
                            <div className="flex flex-wrap gap-2">
                              {quest.rewards.map((reward, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 rounded text-yellow-400 text-sm"
                                >
                                  {reward.type === 'money' && <span>💰</span>}
                                  {reward.type === 'item' && <Gift className="w-3 h-3" />}
                                  {reward.type === 'relationship' && <span>❤️</span>}
                                  {reward.type === 'achievement' && <Star className="w-3 h-3" />}
                                  <span>{String(reward.value)}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {/* Failure Consequences */}
                        {quest.failureConsequences && quest.failureConsequences.length > 0 && quest.status === 'active' && (
                          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-sm text-red-400 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              Failure consequences:
                            </p>
                            <ul className="mt-1 text-xs text-red-300/80">
                              {quest.failureConsequences.map((consequence, i) => (
                                <li key={i}>• {consequence}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
