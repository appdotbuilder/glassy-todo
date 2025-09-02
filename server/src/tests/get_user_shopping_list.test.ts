import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, shoppingListItemsTable } from '../db/schema';
import { type GetUserShoppingListInput } from '../schema';
import { getUserShoppingList } from '../handlers/get_user_shopping_list';

describe('getUserShoppingList', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return shopping list items for specific user', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        { email: 'user1@example.com', name: 'User One' },
        { email: 'user2@example.com', name: 'User Two' }
      ])
      .returning()
      .execute();

    const user1Id = users[0].id;
    const user2Id = users[1].id;

    // Create shopping list items for both users
    await db.insert(shoppingListItemsTable)
      .values([
        { user_id: user1Id, name: 'Apples', quantity: 5, order_index: 1 },
        { user_id: user1Id, name: 'Bread', quantity: 2, order_index: 0, is_completed: true },
        { user_id: user2Id, name: 'Milk', quantity: 1, order_index: 0 }, // Different user
        { user_id: user1Id, name: 'Cheese', quantity: 1, order_index: 2 }
      ])
      .execute();

    const input: GetUserShoppingListInput = { user_id: user1Id };
    const result = await getUserShoppingList(input);

    // Should only return items for user1
    expect(result).toHaveLength(3);
    
    // Verify all items belong to user1
    result.forEach(item => {
      expect(item.user_id).toEqual(user1Id);
    });

    // Verify items are ordered by order_index
    expect(result[0].name).toEqual('Bread'); // order_index: 0
    expect(result[1].name).toEqual('Apples'); // order_index: 1
    expect(result[2].name).toEqual('Cheese'); // order_index: 2
  });

  it('should return empty array when user has no items', async () => {
    // Create user but no items
    const user = await db.insert(usersTable)
      .values({ email: 'empty@example.com', name: 'Empty User' })
      .returning()
      .execute();

    const input: GetUserShoppingListInput = { user_id: user[0].id };
    const result = await getUserShoppingList(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent user', async () => {
    const input: GetUserShoppingListInput = { user_id: 999 };
    const result = await getUserShoppingList(input);

    expect(result).toHaveLength(0);
  });

  it('should maintain proper order with mixed completion status', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({ email: 'test@example.com', name: 'Test User' })
      .returning()
      .execute();

    const userId = user[0].id;

    // Create items with mixed completion status but specific order
    await db.insert(shoppingListItemsTable)
      .values([
        { user_id: userId, name: 'First Item', quantity: 1, order_index: 0, is_completed: true },
        { user_id: userId, name: 'Second Item', quantity: 2, order_index: 1, is_completed: false },
        { user_id: userId, name: 'Third Item', quantity: 1, order_index: 2, is_completed: true }
      ])
      .execute();

    const input: GetUserShoppingListInput = { user_id: userId };
    const result = await getUserShoppingList(input);

    expect(result).toHaveLength(3);
    
    // Verify order is maintained regardless of completion status
    expect(result[0].name).toEqual('First Item');
    expect(result[0].is_completed).toEqual(true);
    expect(result[0].order_index).toEqual(0);
    
    expect(result[1].name).toEqual('Second Item');
    expect(result[1].is_completed).toEqual(false);
    expect(result[1].order_index).toEqual(1);
    
    expect(result[2].name).toEqual('Third Item');
    expect(result[2].is_completed).toEqual(true);
    expect(result[2].order_index).toEqual(2);
  });

  it('should return all item fields correctly', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({ email: 'fields@example.com', name: 'Fields User' })
      .returning()
      .execute();

    const userId = user[0].id;

    // Create item with all fields populated
    await db.insert(shoppingListItemsTable)
      .values({
        user_id: userId,
        name: 'Test Item',
        quantity: 3,
        is_completed: false,
        order_index: 5
      })
      .execute();

    const input: GetUserShoppingListInput = { user_id: userId };
    const result = await getUserShoppingList(input);

    expect(result).toHaveLength(1);
    
    const item = result[0];
    expect(item.id).toBeDefined();
    expect(item.user_id).toEqual(userId);
    expect(item.name).toEqual('Test Item');
    expect(item.quantity).toEqual(3);
    expect(item.is_completed).toEqual(false);
    expect(item.order_index).toEqual(5);
    expect(item.created_at).toBeInstanceOf(Date);
    expect(item.updated_at).toBeInstanceOf(Date);
  });
});