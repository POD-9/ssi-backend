import express from 'express';
import { DwnHelper } from './src/utils/dwn.js';
import { initAgent } from './src/utils/agent.js';
import cors from 'cors'

// Connection to database
import { CosmosClient } from "@azure/cosmos";

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const client = new CosmosClient({ endpoint, key });

// import {
//     AriesRFCsPlugin,
//     MESSAGE_TYPES_0453,
//     DIDCommMessagePacking
//   } from '@spherity/aries-rfcs-veramo-plugin';

const app = express();
const port = 3001;
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // Body parse middleware
app.use(cors())

const dwn = new DwnHelper(process.env.DWN_URL)
let agent
let keys
let identifier

// const ariesPlugin = new AriesRFCsPlugin;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Register
app.get('/setup', async (req, res) => {
  // this is where we need to merge the sign up code. the keys variable holds the data that we need to use to sign/encrypt messages
  let response = await initAgent('test')
  identifier = response.identifier
  keys = response.decodedKeys
  agent = response.agent

  // Connect to container
  const { database } = await client.databases.createIfNotExists({ id: "itemsDB" });
  const { container } = await database.containers.createIfNotExists({ id: "wallet-users" });

  // console.log(agent)
  await dwn.init()
  res.send(agent)
});

app.post('/dwn/init', async (req, res) => {
  const { protocol, definition } = req.body
  const message = await dwn.createProtocol(protocol, definition, keys, identifier)
  const result = await dwn.send(message);
  res.send(result)

})

app.post('/dwn/read', async (req, res) => {
  const { target_did, protocol, schema } = req.body
  let msg = await dwn.createRecordsQuery(protocol, schema, keys, target_did)
  let response = await dwn.send(msg)
  let data = dwn.decodeRecordsQueryData(response)
  res.send(data)
})

app.post('/dwn/write', async (req, res) => {
  const { target_did, protocol, schema, data } = req.body
  const msg = await dwn.createRecordsWrite(protocol, schema, data, keys, target_did)
  const response = await dwn.send(msg);
  res.send(response)
})

app.post('/perms/request', (req, res) => {

})

app.post('/perms/grant', (req, res) => {

})

app.post('/perms/read', (req, res) => {

})

app.post('/perms/read/reject', (req, res) => {

})

app.post('/perms/read/grant', (req, res) => {

})


// FOR THE FOLLOWING FUNCTIONALITY AROUND VCS, REFERENCE
// https://github.com/spherity/aries-rfcs-veramo-plugin#sending-messages

app.get('/vcs', (req, res) => {
  // read credential in the database
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

})

app.post('/vcs/present', (req, res) => {

})

app.post('/vcs/verify', (req, res) => {

})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});