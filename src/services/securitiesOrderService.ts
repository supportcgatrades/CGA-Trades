import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  runTransaction, 
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { 
  SecuritiesOrderRecord, 
  SecuritiesHoldingRecord, 
  SecuritiesWatchlistItem,
  AssetType,
  OrderSide,
  OrderType,
  OrderStatus,
  findAsset
} from './securitiesData';

export interface PlaceOrderParams {
  userId: string;
  userName: string;
  userEmail: string;
  assetType: AssetType;
  symbol: string;
  name: string;
  side: OrderSide;
  orderType: OrderType;
  quantity: number;
  price: number;
  limitPrice?: number;
  stopPrice?: number;
}

export interface PlaceOrderResult {
  success: boolean;
  orderId?: string;
  status?: OrderStatus;
  message?: string;
  error?: string;
}

/**
 * Place a securities order with strict balance checks and atomic transaction execution.
 * Does NOT corrupt or touch existing CGA wallet deposits, investments, or withdrawal collections.
 */
export async function placeSecuritiesOrder(params: PlaceOrderParams): Promise<PlaceOrderResult> {
  const {
    userId,
    userName,
    userEmail,
    assetType,
    symbol,
    name,
    side,
    orderType,
    quantity,
    price,
    limitPrice,
    stopPrice
  } = params;

  if (!userId) {
    return { success: false, error: 'User is not authenticated' };
  }

  if (quantity <= 0) {
    return { success: false, error: 'Quantity must be greater than zero' };
  }

  const effectivePrice = orderType === 'limit' && limitPrice ? limitPrice : price;
  if (effectivePrice <= 0) {
    return { success: false, error: 'Invalid price provided for order execution' };
  }

  const fee = 0; // Institutional commission-free execution
  const totalAmount = parseFloat((quantity * effectivePrice).toFixed(2));
  const orderRef = doc(collection(db, 'securities_orders'));
  const holdingDocId = `${userId}_${symbol.toUpperCase()}`;
  const holdingRef = doc(db, 'securities_holdings', holdingDocId);
  const userRef = doc(db, 'users', userId);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('User profile record not found');
      }

      const userData = userSnap.data();
      const currentAvailableBalance = Number(userData.available_balance || 0);

      // Check for BUY orders
      if (side === 'buy') {
        const requiredTotal = totalAmount + fee;
        if (currentAvailableBalance < requiredTotal) {
          throw new Error(`Insufficient available funds. Required: $${requiredTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}, Available: $${currentAvailableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        }

        // Determine execution status:
        // Market order -> Filled immediately
        // Limit / Stop / Stop-Limit order -> Pending
        const isMarket = orderType === 'market';
        const finalStatus: OrderStatus = isMarket ? 'filled' : 'pending';

        // Deduct balance
        transaction.update(userRef, {
          available_balance: Math.max(0, currentAvailableBalance - requiredTotal)
        });

        // If market order, update holdings immediately
        if (isMarket) {
          const holdingSnap = await transaction.get(holdingRef);
          if (holdingSnap.exists()) {
            const hData = holdingSnap.data() as SecuritiesHoldingRecord;
            const existingQty = Number(hData.quantity || 0);
            const existingInvested = Number(hData.total_invested || 0);
            const newQty = existingQty + quantity;
            const newInvested = existingInvested + totalAmount;
            const newAvgPrice = newQty > 0 ? parseFloat((newInvested / newQty).toFixed(4)) : effectivePrice;
            const newCurrentValue = parseFloat((newQty * price).toFixed(2));
            const newGainLoss = parseFloat((newCurrentValue - newInvested).toFixed(2));
            const newGainLossPct = newInvested > 0 ? parseFloat(((newGainLoss / newInvested) * 100).toFixed(2)) : 0;

            transaction.update(holdingRef, {
              quantity: newQty,
              average_price: newAvgPrice,
              total_invested: newInvested,
              current_price: price,
              current_value: newCurrentValue,
              unrealized_gain_loss: newGainLoss,
              unrealized_gain_loss_pct: newGainLossPct,
              updated_at: new Date().toISOString()
            });
          } else {
            const newInvested = totalAmount;
            const newCurrentValue = totalAmount;

            transaction.set(holdingRef, {
              id: holdingDocId,
              user_id: userId,
              asset_type: assetType,
              symbol: symbol.toUpperCase(),
              name,
              quantity,
              average_price: effectivePrice,
              total_invested: newInvested,
              current_price: price,
              current_value: newCurrentValue,
              unrealized_gain_loss: 0,
              unrealized_gain_loss_pct: 0,
              category: assetType === 'stock' ? 'Equities' : assetType === 'bond' ? 'Fixed Income' : 'Funds',
              updated_at: new Date().toISOString()
            });
          }
        }

        // Calculate settlement date (T+1)
        const settlementDate = new Date();
        settlementDate.setDate(settlementDate.getDate() + (assetType === 'bond' ? 1 : 1));

        const orderData: SecuritiesOrderRecord = {
          id: orderRef.id,
          user_id: userId,
          user_name: userName,
          user_email: userEmail,
          asset_type: assetType,
          symbol: symbol.toUpperCase(),
          name,
          side: 'buy',
          order_type: orderType,
          quantity,
          price: effectivePrice,
          limit_price: limitPrice,
          stop_price: stopPrice,
          total_amount: totalAmount,
          fee,
          status: finalStatus,
          settlement_date: settlementDate.toISOString(),
          execution_price: isMarket ? effectivePrice : undefined,
          execution_time: isMarket ? new Date().toISOString() : undefined,
          notes: isMarket ? 'Executed at institutional market quote' : `Pending ${orderType.toUpperCase()} trigger`,
          created_at: new Date().toISOString()
        };

        transaction.set(orderRef, orderData);

        // Audit log
        const auditRef = doc(collection(db, 'securities_audit_logs'));
        transaction.set(auditRef, {
          id: auditRef.id,
          order_id: orderRef.id,
          user_id: userId,
          action: `order_placed_${side}_${orderType}`,
          actor: userEmail,
          details: {
            symbol: symbol.toUpperCase(),
            quantity,
            totalAmount,
            status: finalStatus
          },
          timestamp: new Date().toISOString()
        });

        return { success: true, orderId: orderRef.id, status: finalStatus };
      } else {
        // SELL orders
        const holdingSnap = await transaction.get(holdingRef);
        if (!holdingSnap.exists()) {
          throw new Error(`You do not own any shares/units of ${symbol.toUpperCase()} to sell.`);
        }

        const hData = holdingSnap.data() as SecuritiesHoldingRecord;
        const currentQty = Number(hData.quantity || 0);

        if (currentQty < quantity) {
          throw new Error(`Insufficient holding quantity. You hold ${currentQty} units, but requested to sell ${quantity}.`);
        }

        const isMarket = orderType === 'market';
        const finalStatus: OrderStatus = isMarket ? 'filled' : 'pending';

        if (isMarket) {
          const newQty = currentQty - quantity;
          const proceeds = Math.max(0, totalAmount - fee);

          // Credit cash to user balance
          transaction.update(userRef, {
            available_balance: currentAvailableBalance + proceeds
          });

          if (newQty <= 0) {
            transaction.delete(holdingRef);
          } else {
            const avgPrice = Number(hData.average_price || effectivePrice);
            const newInvested = parseFloat((newQty * avgPrice).toFixed(2));
            const newCurrentValue = parseFloat((newQty * price).toFixed(2));
            const newGainLoss = parseFloat((newCurrentValue - newInvested).toFixed(2));
            const newGainLossPct = newInvested > 0 ? parseFloat(((newGainLoss / newInvested) * 100).toFixed(2)) : 0;

            transaction.update(holdingRef, {
              quantity: newQty,
              total_invested: newInvested,
              current_price: price,
              current_value: newCurrentValue,
              unrealized_gain_loss: newGainLoss,
              unrealized_gain_loss_pct: newGainLossPct,
              updated_at: new Date().toISOString()
            });
          }
        }

        const settlementDate = new Date();
        settlementDate.setDate(settlementDate.getDate() + 1);

        const orderData: SecuritiesOrderRecord = {
          id: orderRef.id,
          user_id: userId,
          user_name: userName,
          user_email: userEmail,
          asset_type: assetType,
          symbol: symbol.toUpperCase(),
          name,
          side: 'sell',
          order_type: orderType,
          quantity,
          price: effectivePrice,
          limit_price: limitPrice,
          stop_price: stopPrice,
          total_amount: totalAmount,
          fee,
          status: finalStatus,
          settlement_date: settlementDate.toISOString(),
          execution_price: isMarket ? effectivePrice : undefined,
          execution_time: isMarket ? new Date().toISOString() : undefined,
          notes: isMarket ? 'Executed at institutional market quote' : `Pending ${orderType.toUpperCase()} trigger`,
          created_at: new Date().toISOString()
        };

        transaction.set(orderRef, orderData);

        // Audit log
        const auditRef = doc(collection(db, 'securities_audit_logs'));
        transaction.set(auditRef, {
          id: auditRef.id,
          order_id: orderRef.id,
          user_id: userId,
          action: `order_placed_${side}_${orderType}`,
          actor: userEmail,
          details: {
            symbol: symbol.toUpperCase(),
            quantity,
            totalAmount,
            status: finalStatus
          },
          timestamp: new Date().toISOString()
        });

        return { success: true, orderId: orderRef.id, status: finalStatus };
      }
    });

    return result;
  } catch (err: any) {
    console.error('Error placing securities order:', err);
    return { success: false, error: err.message || 'Failed to place order' };
  }
}

/**
 * Cancel a pending order and release reserved funds or holdings.
 */
export async function cancelSecuritiesOrder(orderId: string, userId: string, actorEmail: string): Promise<{ success: boolean; error?: string }> {
  try {
    const orderRef = doc(db, 'securities_orders', orderId);
    await runTransaction(db, async (transaction) => {
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) {
        throw new Error('Order not found');
      }

      const orderData = orderSnap.data() as SecuritiesOrderRecord;
      if (orderData.status !== 'pending' && orderData.status !== 'submitted') {
        throw new Error(`Order cannot be cancelled because current status is ${orderData.status}`);
      }

      // If it was a buy order, refund the money to user balance
      if (orderData.side === 'buy') {
        const userRef = doc(db, 'users', orderData.user_id);
        const userSnap = await transaction.get(userRef);
        if (userSnap.exists()) {
          const currentBal = Number(userSnap.data().available_balance || 0);
          transaction.update(userRef, {
            available_balance: currentBal + orderData.total_amount + (orderData.fee || 0)
          });
        }
      }

      transaction.update(orderRef, {
        status: 'cancelled',
        notes: `Cancelled by ${actorEmail}`,
        updated_at: new Date().toISOString()
      });

      const auditRef = doc(collection(db, 'securities_audit_logs'));
      transaction.set(auditRef, {
        id: auditRef.id,
        order_id: orderId,
        user_id: orderData.user_id,
        action: 'order_cancelled',
        actor: actorEmail,
        details: { orderId },
        timestamp: new Date().toISOString()
      });
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error cancelling order:', err);
    return { success: false, error: err.message || 'Failed to cancel order' };
  }
}

/**
 * Admin action to manually fill or reject a pending order with full audit logging.
 */
export async function adminUpdateOrderStatus(
  orderId: string, 
  newStatus: 'filled' | 'rejected' | 'cancelled', 
  adminEmail: string, 
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const orderRef = doc(db, 'securities_orders', orderId);
    await runTransaction(db, async (transaction) => {
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) throw new Error('Order not found');

      const orderData = orderSnap.data() as SecuritiesOrderRecord;
      const userRef = doc(db, 'users', orderData.user_id);
      const userSnap = await transaction.get(userRef);
      const holdingDocId = `${orderData.user_id}_${orderData.symbol.toUpperCase()}`;
      const holdingRef = doc(db, 'securities_holdings', holdingDocId);

      if (newStatus === 'filled') {
        // Execute holding allocation
        if (orderData.side === 'buy') {
          const holdingSnap = await transaction.get(holdingRef);
          if (holdingSnap.exists()) {
            const h = holdingSnap.data() as SecuritiesHoldingRecord;
            const newQty = h.quantity + orderData.quantity;
            const newInvested = h.total_invested + orderData.total_amount;
            const newAvg = newQty > 0 ? newInvested / newQty : orderData.price;
            transaction.update(holdingRef, {
              quantity: newQty,
              average_price: newAvg,
              total_invested: newInvested,
              updated_at: new Date().toISOString()
            });
          } else {
            transaction.set(holdingRef, {
              id: holdingDocId,
              user_id: orderData.user_id,
              asset_type: orderData.asset_type,
              symbol: orderData.symbol.toUpperCase(),
              name: orderData.name,
              quantity: orderData.quantity,
              average_price: orderData.price,
              total_invested: orderData.total_amount,
              current_price: orderData.price,
              current_value: orderData.total_amount,
              unrealized_gain_loss: 0,
              unrealized_gain_loss_pct: 0,
              category: orderData.asset_type === 'stock' ? 'Equities' : orderData.asset_type === 'bond' ? 'Fixed Income' : 'Funds',
              updated_at: new Date().toISOString()
            });
          }
        } else if (orderData.side === 'sell') {
          // Credit user cash
          if (userSnap.exists()) {
            const curBal = Number(userSnap.data().available_balance || 0);
            transaction.update(userRef, {
              available_balance: curBal + orderData.total_amount
            });
          }
          const holdingSnap = await transaction.get(holdingRef);
          if (holdingSnap.exists()) {
            const h = holdingSnap.data() as SecuritiesHoldingRecord;
            const newQty = h.quantity - orderData.quantity;
            if (newQty <= 0) {
              transaction.delete(holdingRef);
            } else {
              const newInvested = newQty * h.average_price;
              transaction.update(holdingRef, {
                quantity: newQty,
                total_invested: newInvested,
                updated_at: new Date().toISOString()
              });
            }
          }
        }
      } else if (newStatus === 'rejected' || newStatus === 'cancelled') {
        // If rejected and was buy, refund cash
        if (orderData.side === 'buy' && userSnap.exists()) {
          const curBal = Number(userSnap.data().available_balance || 0);
          transaction.update(userRef, {
            available_balance: curBal + orderData.total_amount + (orderData.fee || 0)
          });
        }
      }

      transaction.update(orderRef, {
        status: newStatus,
        execution_price: newStatus === 'filled' ? orderData.price : undefined,
        execution_time: newStatus === 'filled' ? new Date().toISOString() : undefined,
        notes: notes || `Status updated to ${newStatus} by Cipher Administrator (${adminEmail})`,
        updated_at: new Date().toISOString()
      });

      const auditRef = doc(collection(db, 'securities_audit_logs'));
      transaction.set(auditRef, {
        id: auditRef.id,
        order_id: orderId,
        user_id: orderData.user_id,
        action: `admin_order_${newStatus}`,
        actor: adminEmail,
        details: { orderId, newStatus, notes },
        timestamp: new Date().toISOString()
      });
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error updating order by admin:', err);
    return { success: false, error: err.message || 'Failed to update order status' };
  }
}

/**
 * Toggle watchlist item for authenticated user.
 */
export async function toggleSecuritiesWatchlist(userId: string, symbol: string, assetType: AssetType, name: string): Promise<boolean> {
  if (!userId) return false;
  const docId = `${userId}_${symbol.toUpperCase()}`;
  const ref = doc(db, 'securities_watchlist', docId);

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await deleteDoc(ref);
      return false; // removed
    } else {
      await setDoc(ref, {
        id: docId,
        user_id: userId,
        asset_type: assetType,
        symbol: symbol.toUpperCase(),
        name,
        created_at: new Date().toISOString()
      });
      return true; // added
    }
  } catch (err) {
    console.error('Error toggling watchlist:', err);
    return false;
  }
}
