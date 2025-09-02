import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Shopping list item schema
export const shoppingListItemSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  quantity: z.number().int().positive(),
  is_completed: z.boolean(),
  order_index: z.number().int().nonnegative(), // For drag and drop ordering
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ShoppingListItem = z.infer<typeof shoppingListItemSchema>;

// Input schema for creating shopping list items
export const createShoppingListItemInputSchema = z.object({
  user_id: z.number(),
  name: z.string().min(1, "Item name is required"),
  quantity: z.number().int().positive().default(1)
});

export type CreateShoppingListItemInput = z.infer<typeof createShoppingListItemInputSchema>;

// Input schema for updating shopping list items
export const updateShoppingListItemInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  quantity: z.number().int().positive().optional(),
  is_completed: z.boolean().optional()
});

export type UpdateShoppingListItemInput = z.infer<typeof updateShoppingListItemInputSchema>;

// Input schema for reordering items (drag and drop)
export const reorderShoppingListItemsInputSchema = z.object({
  user_id: z.number(),
  item_orders: z.array(z.object({
    id: z.number(),
    order_index: z.number().int().nonnegative()
  }))
});

export type ReorderShoppingListItemsInput = z.infer<typeof reorderShoppingListItemsInputSchema>;

// Input schema for deleting shopping list items
export const deleteShoppingListItemInputSchema = z.object({
  id: z.number(),
  user_id: z.number() // To ensure user can only delete their own items
});

export type DeleteShoppingListItemInput = z.infer<typeof deleteShoppingListItemInputSchema>;

// Input schema for getting user's shopping list
export const getUserShoppingListInputSchema = z.object({
  user_id: z.number()
});

export type GetUserShoppingListInput = z.infer<typeof getUserShoppingListInputSchema>;