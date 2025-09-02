import { db } from '../db';
import { shoppingListItemsTable } from '../db/schema';
import { type GetUserShoppingListInput, type ShoppingListItem } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getUserShoppingList = async (input: GetUserShoppingListInput): Promise<ShoppingListItem[]> => {
  try {
    // Query shopping list items for the specific user, ordered by order_index
    const results = await db.select()
      .from(shoppingListItemsTable)
      .where(eq(shoppingListItemsTable.user_id, input.user_id))
      .orderBy(asc(shoppingListItemsTable.order_index))
      .execute();

    // Return results - no numeric conversions needed as all fields are integers/booleans/text
    return results;
  } catch (error) {
    console.error('Failed to fetch user shopping list:', error);
    throw error;
  }
};