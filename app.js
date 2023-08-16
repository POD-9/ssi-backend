import express from 'express';
import { DwnHelper } from './src/utils/dwn.js';
import { initAgent } from './src/utils/agent.js';
import cors from 'cors'
import { connectToContainer, getUserByUsername, getUserKeys } from './database-utils.js';
import { RecordsQuery, RecordsWrite } from 'fork-of-dwn-sdk-js';

const app = express();
const port = 8080;
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // Body parse middleware
app.use(cors())

const dwn = new DwnHelper(process.env.DWN_URL)

// const ariesPlugin = new AriesRFCsPlugin;

app.get('/', (req, res) => {
   res.send('Hey dude');
});

// Register
app.post('/setup', async (req, res) => {
   // This is where we need to merge the sign up code. 
   // The keys variable holds the data that we need to use to sign/encrypt messages
   const { identifier, keys, agent }  = await initAgent('test');

   // Get the data from the request and build up the new user
   let firstName = req.body.firstName;
   let lastName  = req.body.lastName;
   let username  = req.body.username;
   let password  = req.body.password; // Plaintext for the POC

   if (!firstName || !lastName || !username || !password) 
      return res.send({ status: "Failed", description: "Missing form data" });

   let user = await getUserByUsername(username);

   if (user !== undefined)
      return res.send({ status: "Failed", description: "Username already in use." });

   let newUser = {
      username: username.trim().toLowerCase(),
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
   res.json({ username:  newUser.username,
              firstName: newUser.firstName,
              lastName:  newUser.lastName,
              did:       identifier.did
            });
});


// Login
app.post('/login', async (req, res) => {
   const { username, password } = req.body;

   // Check username exists
   const user = await getUserByUsername(username);

   if (!user)
      return res.json({status: "Failed", description: "Invalid username or password"});

   if (user.password !== password) 
      return res.json({status: "Failed", description: "Invalid username or password"});

   res.json({ username:  user.username,
              firstName: user.firstName,
              lastName:  user.lastName,
              did:       user.identifier.did
            });
});


// Initialise a group of schemas (protocol)
// **** TODO: Hardcode into register ****
app.post('/dwn/init', async (req, res) => {
   // Use username to query the database and access keys / identifier
   const { did, protocol, definition } = req.body;

   // Get user
   const keys = await getUserKeys(did);

   if (keys === undefined) 
      return res.json({status: "Failed", description: "Unable to find user with matching DID"});

   // Resolve promise
   const message = await dwn.createProtocol(protocol, definition, keys, did);
   const result = await dwn.send(message);

   res.json(result);
});


// Reading from a particular schema
// Make sure that keys exist
app.post('/dwn/read', async (req, res) => {
   const { target_did, protocol, schema } = req.body;
 
   let msg = await dwn.createRecordsQuery(protocol, schema, keys, target_did);
   let response = await dwn.send(msg);
   let data = dwn.decodeRecordsQueryData(response);

   res.json(data);
});


// Endpoint for returning all schemas
app.post('/dwn/read/all', async (req, res) => {
   const schemas = ['personal', 'orderHistory', 'payment', 'delivery'];
   const { target_did, protocol } = req.body;

   // Loop through schemas and read from each schema
   let Data = {};
   let msg, response, schemaData;
   for (let schema of schemas) {
      msg = await dwn.createRecordsQuery(protocol, protocol + '/' + schema, keys, target_did);
      response = await dwn.send(msg);
      schemaData = dwn.decodeRecordsQueryData(response);

      Data[schema] = schemaData;
   }

   res.json(Data);
});


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

   let dwnMethod;
   if (method == 'write')
      dwnMethod = "RecordsWrite";
   else if (method == 'read')
      dwnMethod = "RecordsQuery";
   else
      return res.send({status: "Failed", description: "Invalid DWN Method. Expected read or write."})

   const msg = await dwn.createPermissionsRequest(dwnMethod, schema, keys, targetDID);
   const response = await dwn.send(msg)

   res.json(response);
})


//takes a permission object and grants the permission
app.post('/perms/grant', async (req, res) => {
   const { permissionRequest } = req.body;

   const msg = await dwn.processPermission(permissionRequest, keys, true);
   const response = await dwn.send(msg);

   res.json(response);
})


//takes a permission object and rejects the permission
app.post('/perms/reject', async (req, res) => {
   const { permissionRequest } = req.body;

   const msg = await dwn.processPermission(permissionRequest, keys, false);
   const response = await dwn.send(msg);

   res.json(response);
})


//returns all permisions object
app.post('/perms/read', async (req, res) => {
   const { targetDID, status } = req.body

   if (status != "all" && status != "rejected" && status != "granted" && status != "requested")
      return res.json({ status: "Failed", description: "Invalid status" });

   const msg = await dwn.createPermissionsRead(keys, targetDID, status);
   const response = await dwn.send(msg);

   res.json(response);

})

app.listen(port, () => {
   console.log(`Server running at http://localhost:${port}/`);
});

// FOR THE FOLLOWING FUNCTIONALITY AROUND VCS, REFERENCE
// https://github.com/spherity/aries-rfcs-veramo-plugin#sending-messages

/*
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
*/