'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import type { Bill, Transaction } from '@/types';
import {
  X,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Briefcase,
  CreditCard,
  PiggyBank,
  AlertCircle,
  Clock,
  ChevronRight,
  Target,
} from 'lucide-react';

interface FinanceUIProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FinanceUI({ isOpen, onClose }: FinanceUIProps) {
  const { player, gameTime, payBill } = useGameStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'bills' | 'transactions' | 'career'>('overview');

  if (!isOpen || !player) return null;

  const { finances, career } = player;

  const getDaysUntilPayday = () => {
    const daysLeft = career.nextPayday - gameTime.day;
    return daysLeft > 0 ? daysLeft : 0;
  };

  const getUpcomingBills = () => {
    return finances.pendingBills
      .filter((b) => !b.paid)
      .sort((a, b) => a.dueDay - b.dueDay);
  };

  const getTotalUpcomingBills = () => {
    return getUpcomingBills().reduce((sum, b) => sum + b.amount, 0);
  };

  const getBillStatus = (bill: Bill) => {
    const daysUntilDue = bill.dueDay - (gameTime.day % 30);
    if (daysUntilDue <= 0) return { status: 'overdue', color: 'text-red-400', bg: 'bg-red-500/20' };
    if (daysUntilDue <= 3) return { status: 'urgent', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { status: 'upcoming', color: 'text-gray-400', bg: 'bg-gray-500/20' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getTransactionIcon = (amount: number) => {
    return amount >= 0 ? TrendingUp : TrendingDown;
  };

  const recentTransactions = [...finances.transactions].reverse().slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl h-[85vh] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Finances</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800/50 border-b border-gray-700 px-6">
          <div className="flex gap-4">
            {(['overview', 'bills', 'transactions', 'career'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? 'text-green-400 border-green-400'
                    : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Balance Card */}
              <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-2xl p-6">
                <p className="text-green-400 text-sm mb-1">Current Balance</p>
                <p className="text-4xl font-bold text-white mb-4">{formatCurrency(finances.balance)}</p>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-green-500/20">
                  <div>
                    <p className="text-gray-400 text-sm">Monthly Income</p>
                    <p className="text-lg text-green-400">{formatCurrency(finances.monthlyIncome)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Monthly Expenses</p>
                    <p className="text-lg text-red-400">{formatCurrency(finances.monthlyExpenses)}</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Next Paycheck */}
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-400 text-sm">Next Paycheck</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{formatCurrency(career.salary / (career.payFrequency === 'monthly' ? 12 : career.payFrequency === 'biweekly' ? 26 : 52))}</p>
                  <p className="text-sm text-gray-400">{getDaysUntilPayday()} days</p>
                </div>

                {/* Upcoming Bills */}
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-red-400" />
                    <span className="text-gray-400 text-sm">Upcoming Bills</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{formatCurrency(getTotalUpcomingBills())}</p>
                  <p className="text-sm text-gray-400">{getUpcomingBills().length} bills pending</p>
                </div>

                {/* Credit Score */}
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-400 text-sm">Credit Score</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{finances.creditScore}</p>
                  <p className={`text-sm ${finances.creditScore >= 700 ? 'text-green-400' : finances.creditScore >= 650 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {finances.creditScore >= 750 ? 'Excellent' : finances.creditScore >= 700 ? 'Good' : finances.creditScore >= 650 ? 'Fair' : 'Poor'}
                  </p>
                </div>
              </div>

              {/* Savings Goals */}
              {finances.savingsGoals.length > 0 && (
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <PiggyBank className="w-5 h-5 text-yellow-400" />
                    <span className="font-medium text-white">Savings Goals</span>
                  </div>
                  <div className="space-y-3">
                    {finances.savingsGoals.map((goal) => {
                      const progress = (goal.currentAmount / goal.targetAmount) * 100;
                      return (
                        <div key={goal.id}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300">{goal.name}</span>
                            <span className="text-gray-400">
                              {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-500 transition-all"
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Low Balance Warning */}
              {finances.balance < getTotalUpcomingBills() && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-400">Low Balance Warning</p>
                    <p className="text-sm text-red-300/80">
                      You may not have enough to cover upcoming bills. Consider working overtime or reducing expenses.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bills Tab */}
          {activeTab === 'bills' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-red-400" />
                Pending Bills
              </h3>
              {getUpcomingBills().length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>All bills are paid!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getUpcomingBills().map((bill) => {
                    const status = getBillStatus(bill);
                    const canAfford = finances.balance >= bill.amount;

                    return (
                      <div
                        key={bill.id}
                        className="bg-gray-800/50 rounded-xl p-4 flex items-center gap-4"
                      >
                        <div className={`p-3 rounded-xl ${status.bg}`}>
                          <CreditCard className={`w-6 h-6 ${status.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-white">{bill.name}</h4>
                            {bill.recurring && (
                              <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                                Monthly
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">
                            Due: Day {bill.dueDay} of month
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-white">{formatCurrency(bill.amount)}</p>
                          <p className={`text-xs ${status.color}`}>
                            {status.status === 'overdue' ? 'Overdue!' : status.status === 'urgent' ? 'Due soon' : `${bill.dueDay - (gameTime.day % 30)} days`}
                          </p>
                        </div>
                        <button
                          disabled={!canAfford}
                          onClick={() => canAfford && payBill(bill.id)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            canAfford
                              ? 'bg-green-600 hover:bg-green-500 text-white'
                              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Pay
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Recent Transactions
              </h3>
              {recentTransactions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentTransactions.map((tx) => {
                    const Icon = getTransactionIcon(tx.amount);
                    const isIncome = tx.amount >= 0;

                    return (
                      <div
                        key={tx.id}
                        className="bg-gray-800/50 rounded-xl p-4 flex items-center gap-4"
                      >
                        <div className={`p-2 rounded-lg ${isIncome ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                          <Icon className={`w-5 h-5 ${isIncome ? 'text-green-400' : 'text-red-400'}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white">{tx.description}</p>
                          <p className="text-sm text-gray-400">
                            Day {tx.timestamp.day} • {tx.category}
                          </p>
                        </div>
                        <p className={`text-lg font-bold ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
                          {isIncome ? '+' : ''}{formatCurrency(tx.amount)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Career Tab */}
          {activeTab === 'career' && (
            <div className="space-y-6">
              {/* Job Info */}
              <div className="bg-gray-800/50 rounded-xl p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <Briefcase className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{career.position}</h3>
                    <p className="text-gray-400">{career.companyName} • {career.department}</p>
                    <p className="text-green-400 mt-1">{formatCurrency(career.salary)}/year</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Employment</p>
                    <p className="text-white">{Math.floor(career.employmentDuration / 30)} months</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Pay Frequency</p>
                    <p className="text-white capitalize">{career.payFrequency}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Work Hours</p>
                    <p className="text-white">{career.workStartHour}:00 - {career.workEndHour}:00</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Work Days</p>
                    <p className="text-white capitalize">{career.workDays.join(', ')}</p>
                  </div>
                </div>
              </div>

              {/* Performance */}
              <div className="bg-gray-800/50 rounded-xl p-6">
                <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Performance Metrics
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Performance Rating</span>
                      <span className="text-white">{career.performance}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          career.performance >= 80 ? 'bg-green-500' : career.performance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${career.performance}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Boss Approval</span>
                      <span className="text-white">{career.bossApproval}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          career.bossApproval >= 80 ? 'bg-green-500' : career.bossApproval >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${career.bossApproval}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Promotion Requirements */}
              {career.promotionRequirements.length > 0 && (
                <div className="bg-gray-800/50 rounded-xl p-6">
                  <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    Promotion Requirements
                  </h4>
                  <div className="space-y-2">
                    {career.promotionRequirements.map((req, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          req.met ? 'bg-green-500/10' : 'bg-gray-700/30'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          req.met ? 'border-green-500 bg-green-500' : 'border-gray-500'
                        }`}>
                          {req.met && <span className="text-white text-xs">✓</span>}
                        </div>
                        <span className={req.met ? 'text-green-400' : 'text-gray-300'}>{req.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Projects */}
              {career.workProjects.length > 0 && (
                <div className="bg-gray-800/50 rounded-xl p-6">
                  <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-400" />
                    Active Projects
                  </h4>
                  <div className="space-y-3">
                    {career.workProjects.map((project) => (
                      <div key={project.id} className="p-4 bg-gray-700/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-white">{project.name}</h5>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            project.importance === 'critical' ? 'bg-red-500/20 text-red-400' :
                            project.importance === 'high' ? 'bg-orange-500/20 text-orange-400' :
                            project.importance === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {project.importance}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{project.description}</p>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 transition-all"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-gray-400">{project.progress}%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Deadline: Day {project.deadline} ({project.deadline - gameTime.day} days left)
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
