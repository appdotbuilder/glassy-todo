import { db } from '../db';
import { shoppingListItemsTable } from '../db/schema';
import { type DeleteShoppingListItemInput } from '../schema';
import { eq, and, gt, sql } from 'drizzle-orm';

export const deleteShoppingListItem = async (input: DeleteShoppingListItemInput): Promise<{ success: boolean }> => {
  try {
    // First, verify the item exists and belongs to the user
    const itemToDelete = await db.select()
      .from(shoppingListItemsTable)
      .where(
        and(
          eq(shoppingListItemsTable.id, input.id),
          eq(shoppingListItemsTable.user_id, input.user_id)
        )
      )
      .execute();

    if (itemToDelete.length === 0) {
      throw new Error('Shopping list item not found or does not belong to user');
    }

    const deletedItem = itemToDelete[0];

    // Delete the item
    await db.delete(shoppingListItemsTable)
      .where(
        and(
          eq(shoppingListItemsTable.id, input.id),
          eq(shoppingListItemsTable.user_id, input.user_id)
        )
      )
      .execute();

    // Reorder remaining items - decrement order_index for items that come after the deleted item
    await db.update(shoppingListItemsTable)
      .set({ 
        order_index: sql`${shoppingListItemsTable.order_index} - 1`,
        updated_at: new Date()
      })
      .where(
        and(
          eq(shoppingListItemsTable.user_id, input.user_id),
          gt(shoppingListItemsTable.order_index, deletedItem.order_index)
        )
      )
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Shopping list item deletion failed:', error);
    throw error;
  }
};