import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, shoppingListItemsTable } from '../db/schema';
import { type UpdateShoppingListItemInput } from '../schema';
import { updateShoppingListItem } from '../handlers/update_shopping_list_item';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  email: 'test@example.com',
  name: 'Test User'
};

const testItem = {
  name: 'Test Item',
  quantity: 2,
  is_completed: false,
  order_index: 1
};

describe('updateShoppingListItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update item name only', async () => {
    // Create user and item
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const itemResult = await db.insert(shoppingListItemsTable)
      .values({ ...testItem, user_id: userId })
      .returning()
      .execute();
    const itemId = itemResult[0].id;

    // Update only the name
    const updateInput: UpdateShoppingListItemInput = {
      id: itemId,
      name: 'Updated Item Name'
    };

    const result = await updateShoppingListItem(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(itemId);
    expect(result.name).toEqual('Updated Item Name');
    // Verify unchanged fields
    expect(result.quantity).toEqual(2);
    expect(result.is_completed).toEqual(false);
    expect(result.order_index).toEqual(1);
    expect(result.user_id).toEqual(userId);
    // Verify timestamps
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > result.created_at).toBe(true);
  });

  it('should update quantity only', async () => {
    // Create user and item
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const itemResult = await db.insert(shoppingListItemsTable)
      .values({ ...testItem, user_id: userId })
      .returning()
      .execute();
    const itemId = itemResult[0].id;

    // Update only the quantity
    const updateInput: UpdateShoppingListItemInput = {
      id: itemId,
      quantity: 5
    };

    const result = await updateShoppingListItem(updateInput);

    // Verify updated fields
    expect(result.quantity).toEqual(5);
    // Verify unchanged fields
    expect(result.name).toEqual('Test Item');
    expect(result.is_completed).toEqual(false);
    expect(result.order_index).toEqual(1);
  });

  it('should update completion status only', async () => {
    // Create user and item
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const itemResult = await db.insert(shoppingListItemsTable)
      .values({ ...testItem, user_id: userId })
      .returning()
      .execute();
    const itemId = itemResult[0].id;

    // Update only the completion status
    const updateInput: UpdateShoppingListItemInput = {
      id: itemId,
      is_completed: true
    };

    const result = await updateShoppingListItem(updateInput);

    // Verify updated fields
    expect(result.is_completed).toEqual(true);
    // Verify unchanged fields
    expect(result.name).toEqual('Test Item');
    expect(result.quantity).toEqual(2);
    expect(result.order_index).toEqual(1);
  });

  it('should update multiple fields at once', async () => {
    // Create user and item
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const itemResult = await db.insert(shoppingListItemsTable)
      .values({ ...testItem, user_id: userId })
      .returning()
      .execute();
    const itemId = itemResult[0].id;

    // Update multiple fields
    const updateInput: UpdateShoppingListItemInput = {
      id: itemId,
      name: 'Completely New Name',
      quantity: 10,
      is_completed: true
    };

    const result = await updateShoppingListItem(updateInput);

    // Verify all updated fields
    expect(result.name).toEqual('Completely New Name');
    expect(result.quantity).toEqual(10);
    expect(result.is_completed).toEqual(true);
    // Verify unchanged fields
    expect(result.order_index).toEqual(1);
    expect(result.user_id).toEqual(userId);
  });

  it('should save updated item to database', async () => {
    // Create user and item
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const itemResult = await db.insert(shoppingListItemsTable)
      .values({ ...testItem, user_id: userId })
      .returning()
      .execute();
    const itemId = itemResult[0].id;

    // Update the item
    const updateInput: UpdateShoppingListItemInput = {
      id: itemId,
      name: 'Updated in Database',
      quantity: 7
    };

    await updateShoppingListItem(updateInput);

    // Verify in database
    const items = await db.select()
      .from(shoppingListItemsTable)
      .where(eq(shoppingListItemsTable.id, itemId))
      .execute();

    expect(items).toHaveLength(1);
    expect(items[0].name).toEqual('Updated in Database');
    expect(items[0].quantity).toEqual(7);
    expect(items[0].is_completed).toEqual(false); // Unchanged
    expect(items[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when item does not exist', async () => {
    const updateInput: UpdateShoppingListItemInput = {
      id: 99999,
      name: 'Non-existent Item'
    };

    await expect(updateShoppingListItem(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update updated_at timestamp', async () => {
    // Create user and item
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const itemResult = await db.insert(shoppingListItemsTable)
      .values({ ...testItem, user_id: userId })
      .returning()
      .execute();
    const itemId = itemResult[0].id;
    const originalUpdatedAt = itemResult[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update the item
    const updateInput: UpdateShoppingListItemInput = {
      id: itemId,
      name: 'Updated Name'
    };

    const result = await updateShoppingListItem(updateInput);

    // Verify updated_at has changed
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalUpdatedAt).toBe(true);
    // Verify created_at is unchanged
    expect(result.created_at).toEqual(itemResult[0].created_at);
  });
});