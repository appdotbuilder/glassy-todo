import { serial, text, pgTable, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Shopping list items table
export const shoppingListItemsTable = pgTable('shopping_list_items', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'), // Nullable by default
  quantity: integer('quantity').notNull().default(1),
  is_completed: boolean('is_completed').notNull().default(false),
  position: integer('position').notNull().default(0), // For drag and drop ordering
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  shoppingListItems: many(shoppingListItemsTable),
}));

export const shoppingListItemsRelations = relations(shoppingListItemsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [shoppingListItemsTable.user_id],
    references: [usersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type ShoppingListItem = typeof shoppingListItemsTable.$inferSelect;
export type NewShoppingListItem = typeof shoppingListItemsTable.$inferInsert;

// Important: Export all tables and relations for proper query building
export const tables = { 
  users: usersTable,
  shoppingListItems: shoppingListItemsTable
};