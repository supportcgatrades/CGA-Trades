import { query } from '../lib/db.js';

export class ROIEngine {
  /**
   * Identifies all active investments due for ROI and processes them.
   * Business Rules:
   * 1. Only 'active' status qualifies.
   * 2. Prevents double-payment via `last_roi_at` check.
   * 3. Increments both internal balance and withdrawable (available) balance.
   */
  static async processDailyDistributions() {
    const logPrefix = "[ROI Engine]";
    console.log(`${logPrefix} Audit started at ${new Date().toISOString()}`);

    try {
      // Find active nodes that haven't received ROI today
      const eligibleNodes = await query(
        `SELECT * FROM investments 
         WHERE status = 'active' 
         AND (last_roi_at IS NULL OR last_roi_at < CURRENT_DATE)`
      );

      if (eligibleNodes.rowCount === 0) {
        console.log(`${logPrefix} No nodes eligible for distribution today.`);
        return { processed: 0 };
      }

      let processedCount = 0;

      for (const node of eligibleNodes.rows) {
        // Calculation: amount * ROI % (truncated to exactly two decimal places, never round upward)
        const dailyRate = parseFloat(node.daily_roi_rate) / 100;
        const profit = Math.floor((parseFloat(node.amount) * dailyRate) * 100) / 100;

        // Perform atomic updates
        // In a high-scale environment, these would be wrapped in a START TRANSACTION
        try {
          // 1. Record ROI Log
          await query(
            "INSERT INTO roi_logs (investment_id, amount) VALUES ($1, $2)",
            [node.id, profit]
          );

          // 2. Update Wallet (Available Balance)
          await query(
            `UPDATE wallets 
             SET balance = balance + $1, 
                 total_earned = total_earned + $1, 
                 withdrawable_balance = withdrawable_balance + $1 
             WHERE user_id = $2`,
            [profit, node.user_id]
          );

          // 3. Update Investment Timestamp
          await query(
            "UPDATE investments SET last_roi_at = CURRENT_TIMESTAMP WHERE id = $1",
            [node.id]
          );

          // 4. Create Transaction Record
          await query(
            `INSERT INTO transactions (user_id, type, amount, status, metadata) 
             VALUES ($1, 'roi_payout', $2, 'completed', $3)`,
            [node.user_id, profit, JSON.stringify({ investmentId: node.id, roiRate: node.daily_roi_rate })]
          );

          processedCount++;
        } catch (error) {
          console.error(`${logPrefix} Failed to process node #${node.id}:`, error);
        }
      }

      console.log(`${logPrefix} Lifecycle complete. Distributed ROI to ${processedCount} nodes.`);
      return { processed: processedCount };
    } catch (error) {
      console.error(`${logPrefix} Critical Engine Failure:`, error);
      throw error;
    }
  }
}
