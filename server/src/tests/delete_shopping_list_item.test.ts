import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, shoppingListItemsTable } from '../db/schema';
import { type DeleteShoppingListItemInput } from '../schema';
import { deleteShoppingListItem } from '../handlers/delete_shopping_list_item';
import { eq, and } from 'drizzle-orm';

describe('deleteShoppingListItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a shopping list item', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create test shopping list item
    const itemResult = await db.insert(shoppingListItemsTable)
      .values({
        user_id: user.id,
        name: 'Test Item',
        quantity: 2,
        order_index: 0
      })
      .returning()
      .execute();
    const item = itemResult[0];

    const input: DeleteShoppingListItemInput = {
      id: item.id,
      user_id: user.id
    };

    const result = await deleteShoppingListItem(input);

    expect(result.success).toBe(true);

    // Verify item is deleted from database
    const remainingItems = await db.select()
      .from(shoppingListItemsTable)
      .where(eq(shoppingListItemsTable.id, item.id))
      .execute();

    expect(remainingItems).toHaveLength(0);
  });

  it('should reorder remaining items after deletion', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create multiple shopping list items with specific order
    const items = await db.insert(shoppingListItemsTable)
      .values([
        { user_id: user.id, name: 'Item 1', quantity: 1, order_index: 0 },
        { user_id: user.id, name: 'Item 2', quantity: 1, order_index: 1 },
        { user_id: user.id, name: 'Item 3', quantity: 1, order_index: 2 },
        { user_id: user.id, name: 'Item 4', quantity: 1, order_index: 3 }
      ])
      .returning()
      .execute();

    // Delete the second item (index 1)
    const itemToDelete = items[1];
    const input: DeleteShoppingListItemInput = {
      id: itemToDelete.id,
      user_id: user.id
    };

    await deleteShoppingListItem(input);

    // Verify remaining items are reordered correctly
    const remainingItems = await db.select()
      .from(shoppingListItemsTable)
      .where(eq(shoppingListItemsTable.user_id, user.id))
      .orderBy(shoppingListItemsTable.order_index)
      .execute();

    expect(remainingItems).toHaveLength(3);
    
    // Check order indices are correct (0, 1, 2)
    expect(remainingItems[0].name).toEqual('Item 1');
    expect(remainingItems[0].order_index).toEqual(0);
    
    expect(remainingItems[1].name).toEqual('Item 3');
    expect(remainingItems[1].order_index).toEqual(1); // Was 2, now 1
    
    expect(remainingItems[2].name).toEqual('Item 4');
    expect(remainingItems[2].order_index).toEqual(2); // Was 3, now 2
  });

  it('should only allow user to delete their own items', async () => {
    // Create two test users
    const users = await db.insert(usersTable)
      .values([
        { email: 'user1@example.com', name: 'User 1' },
        { email: 'user2@example.com', name: 'User 2' }
      ])
      .returning()
      .execute();
    const user1 = users[0];
    const user2 = users[1];

    // Create shopping list item for user1
    const itemResult = await db.insert(shoppingListItemsTable)
      .values({
        user_id: user1.id,
        name: 'User 1 Item',
        quantity: 1,
        order_index: 0
      })
      .returning()
      .execute();
    const item = itemResult[0];

    // Try to delete user1's item as user2
    const input: DeleteShoppingListItemInput = {
      id: item.id,
      user_id: user2.id // Wrong user!
    };

    await expect(deleteShoppingListItem(input)).rejects.toThrow(/not found or does not belong to user/i);

    // Verify item still exists
    const remainingItems = await db.select()
      .from(shoppingListItemsTable)
      .where(eq(shoppingListItemsTable.id, item.id))
      .execute();

    expect(remainingItems).toHaveLength(1);
  });

  it('should handle deletion of non-existent item', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    const input: DeleteShoppingListItemInput = {
      id: 99999, // Non-existent item ID
      user_id: user.id
    };

    await expect(deleteShoppingListItem(input)).rejects.toThrow(/not found or does not belong to user/i);
  });

  it('should update updated_at timestamp for reordered items', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create multiple shopping list items
    const items = await db.insert(shoppingListItemsTable)
      .values([
        { user_id: user.id, name: 'Item 1', quantity: 1, order_index: 0 },
        { user_id: user.id, name: 'Item 2', quantity: 1, order_index: 1 },
        { user_id: user.id, name: 'Item 3', quantity: 1, order_index: 2 }
      ])
      .returning()
      .execute();

    const beforeDeletion = new Date();

    // Delete the first item
    const input: DeleteShoppingListItemInput = {
      id: items[0].id,
      user_id: user.id
    };

    await deleteShoppingListItem(input);

    // Check that remaining items have updated timestamps
    const remainingItems = await db.select()
      .from(shoppingListItemsTable)
      .where(eq(shoppingListItemsTable.user_id, user.id))
      .execute();

    remainingItems.forEach(item => {
      expect(item.updated_at).toBeInstanceOf(Date);
      expect(item.updated_at.getTime()).toBeGreaterThan(beforeDeletion.getTime());
    });
  });

  it('should handle deletion when item has highest order_index', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create multiple items
    const items = await db.insert(shoppingListItemsTable)
      .values([
        { user_id: user.id, name: 'Item 1', quantity: 1, order_index: 0 },
        { user_id: user.id, name: 'Item 2', quantity: 1, order_index: 1 },
        { user_id: user.id, name: 'Item 3', quantity: 1, order_index: 2 }
      ])
      .returning()
      .execute();

    // Delete the last item (highest order_index)
    const input: DeleteShoppingListItemInput = {
      id: items[2].id,
      user_id: user.id
    };

    const result = await deleteShoppingListItem(input);

    expect(result.success).toBe(true);

    // Verify remaining items maintain their order indices
    const remainingItems = await db.select()
      .from(shoppingListItemsTable)
      .where(eq(shoppingListItemsTable.user_id, user.id))
      .orderBy(shoppingListItemsTable.order_index)
      .execute();

    expect(remainingItems).toHaveLength(2);
    expect(remainingItems[0].order_index).toEqual(0);
    expect(remainingItems[1].order_index).toEqual(1);
  });
});