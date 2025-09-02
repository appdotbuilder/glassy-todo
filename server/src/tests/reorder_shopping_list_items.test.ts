import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, shoppingListItemsTable } from '../db/schema';
import { type ReorderShoppingListItemsInput } from '../schema';
import { reorderShoppingListItems } from '../handlers/reorder_shopping_list_items';
import { eq } from 'drizzle-orm';

describe('reorderShoppingListItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should reorder shopping list items correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create test shopping list items
    const itemsResult = await db.insert(shoppingListItemsTable)
      .values([
        {
          user_id: userId,
          name: 'Item 1',
          quantity: 1,
          order_index: 0
        },
        {
          user_id: userId,
          name: 'Item 2',
          quantity: 2,
          order_index: 1
        },
        {
          user_id: userId,
          name: 'Item 3',
          quantity: 3,
          order_index: 2
        }
      ])
      .returning()
      .execute();

    // Test reordering: reverse the order
    const reorderInput: ReorderShoppingListItemsInput = {
      user_id: userId,
      item_orders: [
        { id: itemsResult[2].id, order_index: 0 }, // Item 3 first
        { id: itemsResult[1].id, order_index: 1 }, // Item 2 second
        { id: itemsResult[0].id, order_index: 2 }  // Item 1 last
      ]
    };

    const result = await reorderShoppingListItems(reorderInput);

    // Verify the result is ordered correctly
    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Item 3');
    expect(result[0].order_index).toEqual(0);
    expect(result[1].name).toEqual('Item 2');
    expect(result[1].order_index).toEqual(1);
    expect(result[2].name).toEqual('Item 1');
    expect(result[2].order_index).toEqual(2);

    // Verify updated_at timestamps were updated
    result.forEach(item => {
      expect(item.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should update items in database with new order indices', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create test items
    const itemsResult = await db.insert(shoppingListItemsTable)
      .values([
        {
          user_id: userId,
          name: 'First Item',
          quantity: 1,
          order_index: 0
        },
        {
          user_id: userId,
          name: 'Second Item',
          quantity: 1,
          order_index: 1
        }
      ])
      .returning()
      .execute();

    // Reorder items
    const reorderInput: ReorderShoppingListItemsInput = {
      user_id: userId,
      item_orders: [
        { id: itemsResult[1].id, order_index: 0 }, // Second item first
        { id: itemsResult[0].id, order_index: 1 }  // First item second
      ]
    };

    await reorderShoppingListItems(reorderInput);

    // Verify database was updated
    const updatedFirstItem = await db.select()
      .from(shoppingListItemsTable)
      .where(eq(shoppingListItemsTable.id, itemsResult[0].id))
      .execute();

    const updatedSecondItem = await db.select()
      .from(shoppingListItemsTable)
      .where(eq(shoppingListItemsTable.id, itemsResult[1].id))
      .execute();

    expect(updatedFirstItem[0].order_index).toEqual(1);
    expect(updatedSecondItem[0].order_index).toEqual(0);
  });

  it('should throw error when item does not belong to user', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        name: 'User 1'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        name: 'User 2'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create item for user 1
    const itemResult = await db.insert(shoppingListItemsTable)
      .values({
        user_id: user1Id,
        name: 'User 1 Item',
        quantity: 1,
        order_index: 0
      })
      .returning()
      .execute();

    // Try to reorder user 1's item as user 2
    const reorderInput: ReorderShoppingListItemsInput = {
      user_id: user2Id,
      item_orders: [
        { id: itemResult[0].id, order_index: 0 }
      ]
    };

    expect(reorderShoppingListItems(reorderInput)).rejects.toThrow(/not found or do not belong to the user/i);
  });

  it('should throw error when item does not exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Try to reorder non-existent item
    const reorderInput: ReorderShoppingListItemsInput = {
      user_id: userId,
      item_orders: [
        { id: 99999, order_index: 0 } // Non-existent item ID
      ]
    };

    expect(reorderShoppingListItems(reorderInput)).rejects.toThrow(/not found or do not belong to the user/i);
  });

  it('should handle partial reordering correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create multiple items
    const itemsResult = await db.insert(shoppingListItemsTable)
      .values([
        {
          user_id: userId,
          name: 'Item A',
          quantity: 1,
          order_index: 0
        },
        {
          user_id: userId,
          name: 'Item B',
          quantity: 1,
          order_index: 1
        },
        {
          user_id: userId,
          name: 'Item C',
          quantity: 1,
          order_index: 2
        }
      ])
      .returning()
      .execute();

    // Only reorder two of the three items
    const reorderInput: ReorderShoppingListItemsInput = {
      user_id: userId,
      item_orders: [
        { id: itemsResult[1].id, order_index: 0 }, // Item B to position 0
        { id: itemsResult[0].id, order_index: 1 }  // Item A to position 1
      ]
    };

    const result = await reorderShoppingListItems(reorderInput);

    // Should return all user's items, ordered by order_index
    expect(result).toHaveLength(3);
    
    // Find items by name to verify positions
    const itemB = result.find(item => item.name === 'Item B');
    const itemA = result.find(item => item.name === 'Item A');
    const itemC = result.find(item => item.name === 'Item C');

    expect(itemB?.order_index).toEqual(0);
    expect(itemA?.order_index).toEqual(1);
    expect(itemC?.order_index).toEqual(2); // Unchanged
  });

  it('should return items ordered by order_index', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create items with specific order
    const itemsResult = await db.insert(shoppingListItemsTable)
      .values([
        {
          user_id: userId,
          name: 'Third',
          quantity: 1,
          order_index: 5
        },
        {
          user_id: userId,
          name: 'First',
          quantity: 1,
          order_index: 1
        },
        {
          user_id: userId,
          name: 'Second',
          quantity: 1,
          order_index: 3
        }
      ])
      .returning()
      .execute();

    // Reorder one item
    const reorderInput: ReorderShoppingListItemsInput = {
      user_id: userId,
      item_orders: [
        { id: itemsResult[0].id, order_index: 2 } // Move "Third" to middle
      ]
    };

    const result = await reorderShoppingListItems(reorderInput);

    // Verify items are returned in order_index order
    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('First');   // order_index: 1
    expect(result[1].name).toEqual('Third');   // order_index: 2 (updated)
    expect(result[2].name).toEqual('Second');  // order_index: 3
  });
});