import express from 'express';
import { DwnHelper } from './src/utils/dwn.js';
import { initAgent } from './src/utils/agent.js';
import cors from 'cors'
import { getUser, connectToContainer } from './database-utils.js';
import { RecordsQuery, RecordsWrite } from 'fork-of-dwn-sdk-js';

const app = express();
const port = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // Body parse middleware
app.use(cors())

const dwn = new DwnHelper(process.env.DWN_URL)
let agent
let keys
let identifier

// const ariesPlugin = new AriesRFCsPlugin;

app.get('/', (req, res) => {
   res.send('Hey dude');
});

// Register
app.post('/setup', async (req, res) => {
   // This is where we need to merge the sign up code. 
   // The keys variable holds the data that we need to use to sign/encrypt messages

   let response = await initAgent('test');
   identifier = response.identifier;
   keys = response.decodedKeys;
   agent = response.agent;

   // Get the data from the request and build up the new user
   let firstName = req.body.firstName.trim();
   let lastName  = req.body.lastName.trim();
   let username  = req.body.username.toLowerCase().trim();
   let password  = req.body.password.trim(); // Plaintext for the POC

   if (!firstName || !lastName || !username || !password) 
      return res.send({ status: "Failed", description: "Missing form data" });

   let user = await getUser(username);

   if (user !== undefined)
      return res.send({ status: "Failed", description: "Username already in use." });

   let newUser = {
      username: username,
      firstName: firstName,
      lastName: lastName,
      password: password,
      identifier: identifier,
      keys: keys,
      agent: agent
   }

   // Add to container
   const container = await connectToContainer();
   await container.items.create(newUser)

   await dwn.init();
   return res.send(newUser); // respond with the new user
});

// Initialise a group of schemas (protocol)
app.post('/dwn/init', async (req, res) => {
   // Use username to query the database and access keys / identifier
   const { username, protocol, definition } = req.body;

   // Get user
   const user = await getUser(username);

   if (user === undefined) 
      return res.json({status: "Failed", description: "Invalid username"});

   const keys = user.keys;
   const identifier = user.identifier.did;

   // Resolve promise
   const message = await dwn.createProtocol(protocol, definition, keys, identifier);
   const result = await dwn.send(message);

   res.send(result)
})

// Reading from a particular schema
// Make sure that keys exist
app.post('/dwn/read', async (req, res) => {
   const { target_did, protocol, schema } = req.body
 
   let msg = await dwn.createRecordsQuery(protocol, schema, keys, target_did)
   let response = await dwn.send(msg)
   let data = dwn.decodeRecordsQueryData(response)

   res.send(data)
})

// Writing to a schema 
// Make sure keys is not undefined
app.post('/dwn/write', async (req, res) => {
   const { target_did, protocol, schema, data } = req.body

   const msg = await dwn.createRecordsWrite(protocol, schema, data, keys, target_did)
   const response = await dwn.send(msg);

   res.send(response)
})

// Create a new permission request
app.post('/perms/request', async (req, res) => {
   const { method, schema, targetDID } = req.body;


   let dwnMethod = method === "write" ? "RecordsWrite" : "RecordsQuery"

   const msg = await dwn.createPermissionsRequest(dwnMethod, schema, keys, targetDID);
   const response = await dwn.send(msg)

   res.send(response);
})


//takes a permission object and grants the permission
app.post('/perms/grant', (req, res) => {
   res.send('Grant Permissions');

})

//takes a permission object and rejects the permission
app.post('/perms/reject', (req, res) => {
   res.send('Reject Permissions');

})

//returns all permisions object
app.post('/perms/read', (req, res) => {
   res.send('Read Permissions');

})

//returns all rejected permissions
app.post('/perms/read/reject', (req, res) => {
   res.send('Permissions rejected');

})

//returns all granted permissions
app.post('/perms/read/grant', (req, res) => {
   res.send('Permissions granted');

})


// FOR THE FOLLOWING FUNCTIONALITY AROUND VCS, REFERENCE
// https://github.com/spherity/aries-rfcs-veramo-plugin#sending-messages

app.get('/vcs', (req, res) => {
   // read credential in the database
   res.send('Read credentials');
})

app.post('/vcs/issue', async (req, res) => {
   const { target_did, credential } = req.body

   let response = await ariesPlugin.send0453(
      {
         to: target_did,
         from: identifier,
         type: MESSAGE_TYPES_0453,
         packingType: DIDCommMessagePacking,
         message: {
            '@type': MESSAGE_TYPES_0453,
            credentialBody: credential
         }
      },
      { agent }
   );

   res.send(response)
})

app.post('/vcs/request', (req, res) => {
   res.send('Requested VCs')
})

app.post('/vcs/present', (req, res) => {
   res.send('present VCs')
})

app.post('/vcs/verify', (req, res) => {
   res.send('Verify VC')
})

app.listen(port, () => {
   console.log(`Server running at http://localhost:${port}/`);
});