import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Shopping list item schema
export const shoppingListItemSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  quantity: z.number().int(),
  is_completed: z.boolean(),
  position: z.number().int(), // For drag and drop ordering
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ShoppingListItem = z.infer<typeof shoppingListItemSchema>;

// Input schema for creating shopping list items
export const createShoppingListItemInputSchema = z.object({
  user_id: z.number(),
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  quantity: z.number().int().positive().default(1),
  position: z.number().int().nonnegative().optional() // Will be calculated if not provided
});

export type CreateShoppingListItemInput = z.infer<typeof createShoppingListItemInputSchema>;

// Input schema for updating shopping list items
export const updateShoppingListItemInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  quantity: z.number().int().positive().optional(),
  is_completed: z.boolean().optional(),
  position: z.number().int().nonnegative().optional()
});

export type UpdateShoppingListItemInput = z.infer<typeof updateShoppingListItemInputSchema>;

// Input schema for reordering items (drag and drop)
export const reorderShoppingListItemsInputSchema = z.object({
  user_id: z.number(),
  item_ids: z.array(z.number()) // Array of item IDs in their new order
});

export type ReorderShoppingListItemsInput = z.infer<typeof reorderShoppingListItemsInputSchema>;

// Input schema for creating users
export const createUserInputSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Valid email is required")
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Input schema for getting user's shopping list
export const getUserShoppingListInputSchema = z.object({
  user_id: z.number()
});

export type GetUserShoppingListInput = z.infer<typeof getUserShoppingListInputSchema>;

// Input schema for deleting shopping list items
export const deleteShoppingListItemInputSchema = z.object({
  id: z.number(),
  user_id: z.number() // For security - ensure user owns the item
});

export type DeleteShoppingListItemInput = z.infer<typeof deleteShoppingListItemInputSchema>;