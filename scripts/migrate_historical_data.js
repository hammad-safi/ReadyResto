/**
 * Safe Historical Data Migration Script
 * Run this in the browser console, or include it as a hidden admin tool.
 * 
 * Goal: 
 * 1. Find all order_items missing historical costs.
 * 2. Infer cost from historical POs if possible; else mark cost_unknown.
 * 3. Create correcting journal entries for old incorrect POs (where COGS was debited).
 * 4. Create missing COGS/Inventory journal entries for old sales.
 */

export function runSafeMigration(store) {
  let report = [];
  report.push("=== Migration Report ===");
  
  // 1. Snapshot historical costs on order items
  let unknownCostCount = 0;
  let recoveredCostCount = 0;
  
  store.order_items.forEach(item => {
    if (item.cost === undefined || item.cost === null) {
      // Find the most recent PO for this item before the order date
      const order = store.orders.find(o => o.id === item.order_id);
      const orderDate = order ? new Date(order.created_at) : new Date();
      
      const historicalPOs = (store.purchase_orders || [])
        .filter(po => po.status === 'received' && new Date(po.created_at) < orderDate)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
      let foundCost = null;
      for (const po of historicalPOs) {
        if (po.items) {
           const poItems = typeof po.items === 'string' ? JSON.parse(po.items) : po.items;
           // If the PO doesn't map directly to menu items, this gets tricky.
           // In this system, inventory items are purchased, menu items are sold.
           // We have to use store.recipes to find the historical cost of the recipe components!
           
           const recipeLines = store.recipes.filter(r => r.menu_item_id === item.menu_item_id);
           if (recipeLines.length > 0) {
             let calculatedCost = 0;
             let allComponentsFound = true;
             
             for (const line of recipeLines) {
               const poComponent = poItems.find(pi => pi.id === line.inventory_item_id);
               if (poComponent) {
                 calculatedCost += Number(poComponent.price || 0) * line.qty;
               } else {
                 allComponentsFound = false;
                 break;
               }
             }
             if (allComponentsFound && calculatedCost > 0) {
               foundCost = calculatedCost;
               break;
             }
           }
        }
      }
      
      if (foundCost !== null) {
        item.cost = foundCost;
        recoveredCostCount++;
      } else {
        item.cost_unknown = true;
        item.cost = 0; // Prevent NaN
        unknownCostCount++;
      }
      
      // Also snapshot taxes/discounts from the original order if missing
      item.tax_rate = item.tax_rate ?? (order?.tax > 0 ? 10 : 0); // Assuming 10% tax if tax exists
      item.discount_percent = item.discount_percent ?? (order?.discount_percent || 0);
    }
  });
  
  report.push("Snapshot Migration: Recovered costs for " + recoveredCostCount + " items. Could not recover costs for " + unknownCostCount + " items (marked cost_unknown).");
  
  // 2. Correcting Journal Entries for old POs
  let correctedPOCount = 0;
  const incorrectPOEntries = (store.journal_entries || []).filter(e => e.reference_type === 'Purchase' && e.account_code === '5001' && !e.description.includes('Correction'));
  
  incorrectPOEntries.forEach(badEntry => {
    // Reverse it!
    const dateNow = new Date().toISOString().split('T')[0];
    
    // Debit Inventory (1004) instead of COGS
    store.journal_entries.push({
      id: Date.now() + Math.random(),
      date: dateNow,
      reference_type: 'Correction',
      reference_id: badEntry.reference_id,
      account_code: '1004',
      account_name: 'Inventory Assets',
      debit: badEntry.debit,
      credit: 0,
      description: "Correction: Reclassifying PO #" + badEntry.reference_id + " from COGS to Inventory",
      created_by: 'Migration'
    });
    
    // Credit COGS (5001) to reverse the bad debit
    store.journal_entries.push({
      id: Date.now() + Math.random(),
      date: dateNow,
      reference_type: 'Correction',
      reference_id: badEntry.reference_id,
      account_code: '5001',
      account_name: 'Cost of Goods Sold',
      debit: 0,
      credit: badEntry.debit, // Crediting the debit amount
      description: "Correction: Reversing incorrect COGS debit for PO #" + badEntry.reference_id,
      created_by: 'Migration'
    });
    
    correctedPOCount++;
  });
  
  report.push("Correcting Entries: Reclassified " + correctedPOCount + " old Purchase Orders from COGS to Inventory.");
  
  // 3. Post missing COGS entries for old completed orders
  let cogsPostedCount = 0;
  const completedOrders = store.orders.filter(o => ['paid', 'completed'].includes(o.status));
  
  completedOrders.forEach(order => {
    // Check if this order already has COGS posted (we just added this feature, so old ones won't)
    const hasCOGS = store.journal_entries.some(e => e.reference_id === order.id && e.reference_type === 'Order' && e.account_code === '5001');
    
    if (!hasCOGS) {
      const orderItems = store.order_items.filter(it => it.order_id === order.id);
      let totalCogs = 0;
      let hasUnknown = false;
      
      orderItems.forEach(it => {
        if (it.cost_unknown) hasUnknown = true;
        totalCogs += (it.cost || 0) * it.qty;
      });
      
      if (totalCogs > 0 && !hasUnknown) {
        const dateNow = new Date().toISOString().split('T')[0];
        store.journal_entries.push({ id: Date.now() + Math.random(), date: dateNow, reference_type: 'Order', reference_id: order.id, account_code: '5001', account_name: 'Cost of Goods Sold', debit: totalCogs, credit: 0, description: "Backfilled COGS for Order #" + order.id, created_by: 'Migration' });
        store.journal_entries.push({ id: Date.now() + Math.random(), date: dateNow, reference_type: 'Order', reference_id: order.id, account_code: '1004', account_name: 'Inventory Assets', debit: 0, credit: totalCogs, description: "Backfilled Inventory reduction for Order #" + order.id, created_by: 'Migration' });
        cogsPostedCount++;
      }
    }
  });
  
  report.push("Sales COGS: Backfilled missing COGS journal entries for " + cogsPostedCount + " historical orders.");
  report.push("Migration Complete. No original records were deleted.");
  
  return { store, report: report.join('\n') };
}
