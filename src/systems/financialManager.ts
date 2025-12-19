import type { Player, GameTime, Transaction } from '@/types';

/**
 * Financial Manager
 * Handles automatic bill payments, paycheck deposits, and financial tracking
 */

interface BillPaymentResult {
  paid: boolean;
  billName: string;
  amount: number;
  overdraft: boolean;
  overdraftFee?: number;
  newBalance: number;
}

export class FinancialManager {
  /**
   * Process bills that are due today
   */
  processDueBills(player: Player, gameTime: GameTime): BillPaymentResult[] {
    const results: BillPaymentResult[] = [];
    const currentDay = gameTime.day;

    player.finances.pendingBills.forEach((bill) => {
      // Check if bill is due today
      if (bill.recurring && !bill.paid && bill.dueDay === (currentDay % 30)) {
        const result = this.payBill(player, bill.amount, bill.name);
        results.push(result);

        // Mark as paid for this cycle
        bill.paid = true;
      }
    });

    return results;
  }

  /**
   * Pay a specific bill
   */
  private payBill(player: Player, amount: number, billName: string): BillPaymentResult {
    const hasEnoughMoney = player.finances.balance >= amount;
    let overdraft = false;
    let overdraftFee = 0;

    if (hasEnoughMoney) {
      // Normal payment
      player.finances.balance -= amount;
    } else {
      // Overdraft - charge the bill plus a $35 overdraft fee
      overdraft = true;
      overdraftFee = 35;
      player.finances.balance -= (amount + overdraftFee);
    }

    return {
      paid: true,
      billName,
      amount,
      overdraft,
      overdraftFee: overdraft ? overdraftFee : undefined,
      newBalance: player.finances.balance,
    };
  }

  /**
   * Process paycheck on payday
   */
  processPaycheck(player: Player, gameTime: GameTime): { received: boolean; amount: number } | null {
    if (!player.career.employed) return null;

    const currentDay = gameTime.day;

    // Check if today is payday
    if (player.career.payFrequency === 'biweekly') {
      // Get paid every 14 days
      if (currentDay % 14 === player.career.nextPayday % 14) {
        const paycheckAmount = this.calculatePaycheck(player);
        player.finances.balance += paycheckAmount;

        return {
          received: true,
          amount: paycheckAmount,
        };
      }
    } else if (player.career.payFrequency === 'weekly') {
      // Get paid every 7 days
      if (currentDay % 7 === player.career.nextPayday % 7) {
        const paycheckAmount = this.calculatePaycheck(player);
        player.finances.balance += paycheckAmount;

        return {
          received: true,
          amount: paycheckAmount,
        };
      }
    } else if (player.career.payFrequency === 'monthly') {
      // Get paid on specific day of month
      if (currentDay % 30 === player.career.nextPayday % 30) {
        const paycheckAmount = this.calculatePaycheck(player);
        player.finances.balance += paycheckAmount;

        return {
          received: true,
          amount: paycheckAmount,
        };
      }
    }

    return null;
  }

  /**
   * Calculate paycheck amount based on salary and frequency
   */
  private calculatePaycheck(player: Player): number {
    const annualSalary = player.career.salary;

    switch (player.career.payFrequency) {
      case 'weekly':
        return Math.round((annualSalary / 52) * 0.72); // ~28% tax withholding
      case 'biweekly':
        return Math.round((annualSalary / 26) * 0.72);
      case 'monthly':
        return Math.round((annualSalary / 12) * 0.72);
      default:
        return 0;
    }
  }

  /**
   * Reset monthly bills at the start of each month
   */
  resetMonthlyBills(player: Player): void {
    player.finances.pendingBills.forEach((bill) => {
      if (bill.recurring) {
        bill.paid = false;
      }
    });
  }

  /**
   * Check if player should receive a raise or promotion
   */
  checkForRaise(player: Player, gameTime: GameTime): { raised: boolean; newSalary?: number; reason?: string } {
    // Check if player has been employed for at least 6 months (180 days)
    if (player.career.employmentDuration < 180) {
      return { raised: false };
    }

    // Check if performance is good (>= 80%)
    if (player.career.performance >= 80 && player.career.bossApproval >= 75) {
      // 3% annual raise
      const raisePercentage = 0.03;
      const newSalary = Math.round(player.career.salary * (1 + raisePercentage));
      player.career.salary = newSalary;

      return {
        raised: true,
        newSalary,
        reason: 'Strong performance and good relationship with management',
      };
    }

    return { raised: false };
  }

  /**
   * Handle credit score changes based on payment history
   */
  updateCreditScore(player: Player, paidOnTime: boolean): void {
    if (paidOnTime && player.finances.balance >= 0) {
      // Paying bills on time with positive balance increases credit score
      player.finances.creditScore = Math.min(850, player.finances.creditScore + 1);
    } else if (player.finances.balance < 0) {
      // Overdrafts hurt credit score
      player.finances.creditScore = Math.max(300, player.finances.creditScore - 5);
    }
  }

  /**
   * Generate financial summary for notifications
   */
  generateFinancialSummary(player: Player): string {
    const balance = player.finances.balance;
    const monthlyIncome = player.finances.monthlyIncome;
    const monthlyExpenses = player.finances.monthlyExpenses;
    const netIncome = monthlyIncome - monthlyExpenses;

    let summary = `Balance: $${balance.toFixed(2)}\n`;
    summary += `Monthly Net: $${netIncome.toFixed(2)}\n`;

    if (balance < 0) {
      summary += `⚠️ OVERDRAFT - You owe the bank $${Math.abs(balance).toFixed(2)}`;
    } else if (balance < monthlyExpenses) {
      summary += `⚠️ Low balance - less than one month of expenses`;
    }

    return summary;
  }

  /**
   * Check if player can afford an expense
   */
  canAfford(player: Player, amount: number, allowOverdraft: boolean = false): boolean {
    if (allowOverdraft) {
      // Most banks allow overdraft up to -$1000
      return player.finances.balance - amount >= -1000;
    }
    return player.finances.balance >= amount;
  }

  /**
   * Process a purchase or expense
   */
  processExpense(
    player: Player,
    amount: number,
    description: string,
    category: Transaction['category']
  ): { success: boolean; overdraft: boolean; overdraftFee?: number } {
    const canPay = this.canAfford(player, amount, true);

    if (!canPay) {
      return { success: false, overdraft: false };
    }

    const hadPositiveBalance = player.finances.balance >= amount;
    player.finances.balance -= amount;

    if (!hadPositiveBalance && player.finances.balance < 0) {
      // Overdraft occurred - charge fee
      const overdraftFee = 35;
      player.finances.balance -= overdraftFee;
      return { success: true, overdraft: true, overdraftFee };
    }

    return { success: true, overdraft: false };
  }
}

export const financialManager = new FinancialManager();
