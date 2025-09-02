import { db } from '../db';
import { shoppingListItemsTable } from '../db/schema';
import { type UpdateShoppingListItemInput, type ShoppingListItem } from '../schema';
import { eq } from 'drizzle-orm';

export const updateShoppingListItem = async (input: UpdateShoppingListItemInput): Promise<ShoppingListItem> => {
  try {
    // First, verify the item exists and get current data
    const existingItems = await db.select()
      .from(shoppingListItemsTable)
      .where(eq(shoppingListItemsTable.id, input.id))
      .execute();

    if (existingItems.length === 0) {
      throw new Error(`Shopping list item with id ${input.id} not found`);
    }

    const existingItem = existingItems[0];

    // Build the update object with only provided fields
    const updateData: Partial<typeof shoppingListItemsTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.quantity !== undefined) {
      updateData.quantity = input.quantity;
    }

    if (input.is_completed !== undefined) {
      updateData.is_completed = input.is_completed;
    }

    // Update the item in the database
    const result = await db.update(shoppingListItemsTable)
      .set(updateData)
      .where(eq(shoppingListItemsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Shopping list item update failed:', error);
    throw error;
  }
};