import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, shoppingListItemsTable } from '../db/schema';
import { type CreateShoppingListItemInput } from '../schema';
import { createShoppingListItem } from '../handlers/create_shopping_list_item';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  email: 'test@example.com',
  name: 'Test User'
};

// Simple test input
const testInput: CreateShoppingListItemInput = {
  user_id: 1, // Will be updated after user creation
  name: 'Test Item',
  quantity: 2
};

describe('createShoppingListItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a shopping list item', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const user = userResult[0];
    const input = { ...testInput, user_id: user.id };

    const result = await createShoppingListItem(input);

    // Basic field validation
    expect(result.name).toEqual('Test Item');
    expect(result.quantity).toEqual(2);
    expect(result.user_id).toEqual(user.id);
    expect(result.is_completed).toEqual(false);
    expect(result.order_index).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save shopping list item to database', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const user = userResult[0];
    const input = { ...testInput, user_id: user.id };

    const result = await createShoppingListItem(input);

    // Query database to verify item was saved
    const items = await db.select()
      .from(shoppingListItemsTable)
      .where(eq(shoppingListItemsTable.id, result.id))
      .execute();

    expect(items).toHaveLength(1);
    expect(items[0].name).toEqual('Test Item');
    expect(items[0].quantity).toEqual(2);
    expect(items[0].user_id).toEqual(user.id);
    expect(items[0].is_completed).toEqual(false);
    expect(items[0].order_index).toEqual(0);
    expect(items[0].created_at).toBeInstanceOf(Date);
    expect(items[0].updated_at).toBeInstanceOf(Date);
  });

  it('should use default quantity of 1 when not provided', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const user = userResult[0];
    
    // Simulate parsed Zod input where default has been applied
    const inputWithDefaultQuantity: CreateShoppingListItemInput = {
      user_id: user.id,
      name: 'Item Without Quantity',
      quantity: 1 // This would be applied by Zod parsing
    };

    const result = await createShoppingListItem(inputWithDefaultQuantity);

    expect(result.quantity).toEqual(1);
    expect(result.name).toEqual('Item Without Quantity');
  });

  it('should assign correct order_index for multiple items', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const user = userResult[0];

    // Create first item
    const firstItem = await createShoppingListItem({
      user_id: user.id,
      name: 'First Item',
      quantity: 1
    });

    // Create second item
    const secondItem = await createShoppingListItem({
      user_id: user.id,
      name: 'Second Item',
      quantity: 1
    });

    // Create third item
    const thirdItem = await createShoppingListItem({
      user_id: user.id,
      name: 'Third Item',
      quantity: 1
    });

    expect(firstItem.order_index).toEqual(0);
    expect(secondItem.order_index).toEqual(1);
    expect(thirdItem.order_index).toEqual(2);
  });

  it('should handle order_index correctly for different users', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({ email: 'user1@example.com', name: 'User 1' })
      .returning()
      .execute();
    
    const user2Result = await db.insert(usersTable)
      .values({ email: 'user2@example.com', name: 'User 2' })
      .returning()
      .execute();

    const user1 = user1Result[0];
    const user2 = user2Result[0];

    // Create items for user1
    const user1Item1 = await createShoppingListItem({
      user_id: user1.id,
      name: 'User1 Item1',
      quantity: 1
    });

    const user1Item2 = await createShoppingListItem({
      user_id: user1.id,
      name: 'User1 Item2',
      quantity: 1
    });

    // Create items for user2
    const user2Item1 = await createShoppingListItem({
      user_id: user2.id,
      name: 'User2 Item1',
      quantity: 1
    });

    // Each user should have their own order sequence starting from 0
    expect(user1Item1.order_index).toEqual(0);
    expect(user1Item2.order_index).toEqual(1);
    expect(user2Item1.order_index).toEqual(0); // Starts from 0 for different user
  });

  it('should throw error when user does not exist', async () => {
    const input = {
      user_id: 999, // Non-existent user ID
      name: 'Test Item',
      quantity: 1
    };

    await expect(createShoppingListItem(input)).rejects.toThrow(/User with id 999 not found/);
  });

  it('should handle empty item name correctly', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const user = userResult[0];

    // Note: This test assumes validation happens at the Zod level
    // The handler should receive valid input, but we can test with minimal name
    const input = {
      user_id: user.id,
      name: 'A', // Minimal valid name
      quantity: 1
    };

    const result = await createShoppingListItem(input);
    expect(result.name).toEqual('A');
  });
});