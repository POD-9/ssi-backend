
// Connection to database
import { CosmosClient } from "@azure/cosmos";

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const client = new CosmosClient({ endpoint, key });

export async function connectToContainer() {
  // Connect to container
  const { database } = await client.databases.createIfNotExists({ id: "itemsDB" });
  const { container } = await database.containers.createIfNotExists({ id: "wallet-users" });
  return container;
}

// Get user by username
export async function getUser(username) {

   let container = await connectToContainer();

   // Query the database 
   let { resources } = await container.items
   .query({
      query: "SELECT * from container WHERE container.username = @username",
      parameters: [{ name: "@username", value: username }]
   }).fetchAll();

   return resources;
}