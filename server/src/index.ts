import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createShoppingListItemInputSchema,
  getUserShoppingListInputSchema,
  updateShoppingListItemInputSchema,
  deleteShoppingListItemInputSchema,
  reorderShoppingListItemsInputSchema
} from './schema';

// Import handlers
import { createShoppingListItem } from './handlers/create_shopping_list_item';
import { getUserShoppingList } from './handlers/get_user_shopping_list';
import { updateShoppingListItem } from './handlers/update_shopping_list_item';
import { deleteShoppingListItem } from './handlers/delete_shopping_list_item';
import { reorderShoppingListItems } from './handlers/reorder_shopping_list_items';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Create a new shopping list item
  createShoppingListItem: publicProcedure
    .input(createShoppingListItemInputSchema)
    .mutation(({ input }) => createShoppingListItem(input)),

  // Get all shopping list items for a user
  getUserShoppingList: publicProcedure
    .input(getUserShoppingListInputSchema)
    .query(({ input }) => getUserShoppingList(input)),

  // Update an existing shopping list item
  updateShoppingListItem: publicProcedure
    .input(updateShoppingListItemInputSchema)
    .mutation(({ input }) => updateShoppingListItem(input)),

  // Delete a shopping list item
  deleteShoppingListItem: publicProcedure
    .input(deleteShoppingListItemInputSchema)
    .mutation(({ input }) => deleteShoppingListItem(input)),

  // Reorder shopping list items (for drag and drop)
  reorderShoppingListItems: publicProcedure
    .input(reorderShoppingListItemsInputSchema)
    .mutation(({ input }) => reorderShoppingListItems(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();