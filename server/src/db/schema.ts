import { serial, text, pgTable, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Shopping list items table
export const shoppingListItemsTable = pgTable('shopping_list_items', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull().default(1),
  is_completed: boolean('is_completed').notNull().default(false),
  order_index: integer('order_index').notNull().default(0), // For drag and drop ordering
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
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

export const tableRelations = {
  usersRelations,
  shoppingListItemsRelations
};