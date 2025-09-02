import { db } from '../db';
import { shoppingListItemsTable, usersTable } from '../db/schema';
import { type CreateShoppingListItemInput, type ShoppingListItem } from '../schema';
import { eq, max } from 'drizzle-orm';

export const createShoppingListItem = async (input: CreateShoppingListItemInput): Promise<ShoppingListItem> => {
  try {
    // First verify the user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .limit(1)
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    // Get the highest order_index for this user's shopping list items
    const maxOrderResult = await db.select({
      maxOrder: max(shoppingListItemsTable.order_index)
    })
    .from(shoppingListItemsTable)
    .where(eq(shoppingListItemsTable.user_id, input.user_id))
    .execute();

    // Calculate next order_index (0 if no items exist, or max + 1)
    const nextOrderIndex = (maxOrderResult[0]?.maxOrder ?? -1) + 1;

    // Insert the new shopping list item
    const result = await db.insert(shoppingListItemsTable)
      .values({
        user_id: input.user_id,
        name: input.name,
        quantity: input.quantity, // Already has default of 1 from Zod schema
        is_completed: false, // Default value
        order_index: nextOrderIndex
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Shopping list item creation failed:', error);
    throw error;
  }
};