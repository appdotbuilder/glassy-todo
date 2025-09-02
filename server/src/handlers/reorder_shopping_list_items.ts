import { db } from '../db';
import { shoppingListItemsTable } from '../db/schema';
import { type ReorderShoppingListItemsInput, type ShoppingListItem } from '../schema';
import { eq, and, inArray, SQL } from 'drizzle-orm';

export const reorderShoppingListItems = async (input: ReorderShoppingListItemsInput): Promise<ShoppingListItem[]> => {
  try {
    // Extract item IDs from the input
    const itemIds = input.item_orders.map(item => item.id);

    // First, verify all items belong to the requesting user
    const existingItems = await db.select()
      .from(shoppingListItemsTable)
      .where(
        and(
          inArray(shoppingListItemsTable.id, itemIds),
          eq(shoppingListItemsTable.user_id, input.user_id)
        )
      )
      .execute();

    // Check if all requested items exist and belong to the user
    if (existingItems.length !== itemIds.length) {
      throw new Error('Some items not found or do not belong to the user');
    }

    // Update each item's order_index
    const updatePromises = input.item_orders.map(async (itemOrder) => {
      return db.update(shoppingListItemsTable)
        .set({
          order_index: itemOrder.order_index,
          updated_at: new Date()
        })
        .where(
          and(
            eq(shoppingListItemsTable.id, itemOrder.id),
            eq(shoppingListItemsTable.user_id, input.user_id)
          )
        )
        .execute();
    });

    // Execute all updates
    await Promise.all(updatePromises);

    // Return the updated items ordered by their new order_index
    const updatedItems = await db.select()
      .from(shoppingListItemsTable)
      .where(eq(shoppingListItemsTable.user_id, input.user_id))
      .orderBy(shoppingListItemsTable.order_index)
      .execute();

    return updatedItems;
  } catch (error) {
    console.error('Shopping list items reordering failed:', error);
    throw error;
  }
};