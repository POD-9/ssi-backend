
// Connection to database
import { CosmosClient } from "@azure/cosmos";


export async function connectToContainer() {
   const endpoint = process.env.COSMOS_ENDPOINT;
   const key = process.env.COSMOS_KEY;
   const client = new CosmosClient({ endpoint, key });

   // Connect to container
   const { database } = await client.databases.createIfNotExists({ id: "itemsDB" });
   const { container } = await database.containers.createIfNotExists({ id: "wallet-users" });
   return container;
}

// Get user by username
export async function getUserByUsername(username) {

   let container = await connectToContainer();

   // Query the database 
   let { resources } = await container.items
      .query({
         query: "SELECT * from container WHERE container.username = @username",
         parameters: [{ name: "@username", value: username }]
      }).fetchAll();

   return resources[0];
}

// Get a user's keys from their DID
export async function getUserKeys(did) {
   let container = await connectToContainer();

   // Query the database 
   let { resources } = await container.items
      .query({
         query: "SELECT * from container WHERE container.identifier.did = @did",
         parameters: [{ name: "@did", value: did }]
      }).fetchAll();

   return resources[0] ? resources[0].keys : undefined;
}
