import { createAgent } from "@veramo/core";
import {
    DIDCommMessageHandler,
} from "@veramo/did-comm";
import { DIDManager, MemoryDIDStore } from "@veramo/did-manager";
import { DIDResolverPlugin } from "@veramo/did-resolver";
import { Resolver } from "did-resolver";
import { MessageHandler } from "@veramo/message-handler";
import {
    MemoryKeyStore,
    KeyManager,
    MemoryPrivateKeyStore,
} from "@veramo/key-manager";
const veramo_plugin = import('@spherity/aries-rfcs-veramo-plugin')
// const PresentProof0454MessageHandlerPromise = import ('@spherity/aries-rfcs-veramo-plugin');
// const IssueCredential0453MessageHandlerPromise = import ('@spherity/aries-rfcs-veramo-plugin');
import {
     createCredential,
     createPresentation,
     receiveCredential,
     verifyPresentation,
} from './callbacks.js'
import { KeyManagementSystem } from "@veramo/kms-local";
import { IonDIDProvider, getDidIonResolver } from "@veramo/did-provider-ion";
import {
    toIonPrivateKeyJwk,
    toIonPublicKeyJwk,
} from "../../node_modules/@veramo/did-provider-ion/build/functions.js";
import { DataStore, Entities, migrations } from "@veramo/data-store";
import { IonPublicKeyPurpose } from "@decentralized-identity/ion-sdk";
import { DataSource } from "typeorm";
import fs from "fs";
import dotenv from "dotenv";
import fetch from 'node-fetch';
dotenv.config();

//20.4.240.150

export class TrustResolver {
    async checkTrustStatus(did) {
      return true
    }
}

let handle0023
let handle0453
let handle0454

veramo_plugin.then(res => {
    return res.DidExchange0023MessageHandler
}).then(res => {
    return res()
}).then(res => {
    handle0023 = new res(new TrustResolver())
})

veramo_plugin.then(res => {
    return res.IssueCredential0453MessageHandler
}).then(res => {
    return res()
}).then(res => {
    handle0453 = new res(createCredential, receiveCredential)
})

veramo_plugin.then(res => {
    return res.PresentProof0454MessageHandler
}).then(res => {
    return res()
}).then(res => {
    handle0454 = new res(createPresentation,verifyPresentation)
})


export const initAgent = async (name) => {
    const dbConnection = new DataSource({
        type: "sqlite",
        database: `${process.env.DATABASE_FILE}.${name}`,
        synchronize: false,
        migrations,
        migrationsRun: true,
        logging: ["error", "info", "warn"],
        entities: Entities,
    }).initialize();
    console.log("here1")
    // const didcommReceiver = {
    //     eventTypes: ['DIDCommV2Message-received'],
    //     onEvent: async (event, context) => {
    //       fn(event, context)
    //     }
    //   }

    const keyManager = new KeyManager({
        store: new MemoryKeyStore(),
        kms: {
            mem: new KeyManagementSystem(new MemoryPrivateKeyStore()),
        },
    });
    console.log('here2')

    const agent = createAgent({
        plugins: [
            // didcommReceiver,
            keyManager,
            new DIDManager({
                providers: {
                    "did:ion": new IonDIDProvider({
                        defaultKms: "mem",
                    }),
                },
                defaultProvider: "did:ion",
                store: new MemoryDIDStore(),
            }),
            new DIDResolverPlugin({
                resolver: new Resolver(getDidIonResolver()),
            }),
            new MessageHandler({
                messageHandlers: [
                    new DIDCommMessageHandler(),
                    handle0023,
                    handle0453,
                    handle0454
                    
                ],
            }),
            new DataStore(dbConnection),
        ],
    });

    console.log('here3')

    const keys = readKeysFromFile(name);
    const getKey = (keys, kid) => {
        const key = keys ? keys.filter((k) => k.kid === kid)[0] : undefined;

        return {
            kid,
            ...(key
                ? { key: { privateKeyHex: key.privateKeyHex }, type: key.type }
                : {}),
        };
    };

    const createIdentifierOpts = async () => ({
        anchor: !keys,
        recoveryKey: getKey(keys, "recovery"),
        updateKey: getKey(keys, "update"),
        verificationMethods: [
            {
                ...getKey(keys, "didcomm"),
                // type: "Ed25519",
                type: 'Ed25519',
                purposes: [
                    IonPublicKeyPurpose.KeyAgreement,
                    IonPublicKeyPurpose.Authentication,
                    IonPublicKeyPurpose.AssertionMethod,
                ],
            },
        ],
        services: [
            {
                id: "dwn",
                type: "DecentralizedWebNode",
                serviceEndpoint: {
                    "nodes": [process.env.DWN_URL]
                },
            },
            {
                id: "didcomm",
                type: "DIDCommMessaging",
                serviceEndpoint: `${process.env.IP}/${name}/messaging`,
            },
        ],
    });

    console.log('here4')
    const identifier = await agent.didManagerCreate({
        options: await createIdentifierOpts(),
    });

    if (!keys) {
        for (const km of Object.values(keyManager.kms)) {
            const { privateKeys } = km.keyStore;
            const data = Object.values(privateKeys)
                .map(
                    ({ kid, type, privateKeyHex }) => `${kid},${type},${privateKeyHex}`
                )
                .join("\n");
            fs.writeFileSync(`keys.csv.${name}`, data, "utf-8");
        }
    }

    // This is for debug purposes
    // console.log("FIND ME")
    displayKeys(name);

    let key
    try{
        key = keys[2]
    }catch{
        for (const km of Object.values(keyManager.kms)) {
            const { privateKeys } = km.keyStore;
            const data = Object.values(privateKeys)
            key = data[2]
        }
    }
    
    console.log(key)
    const { kid, type, privateKeyHex } = key;

    let pubKeyHex = privateKeyHex.slice(64,128)


    let decodedKeys = {
        did: identifier.did,
        keyId: identifier.did+'#'+kid,
        keyPair: {
            privateJwk: toIonPrivateKeyJwk(privateKeyHex, type),
            publicJwk: toIonPublicKeyJwk(pubKeyHex, type),
        }
        
    }

    return { identifier, agent, decodedKeys };
};


const readKeysFromFile = (name) => {
    const filePath = `keys.csv.${name}`;
    if (!fs.existsSync(filePath)) {
        return undefined;
    }
    const fileContents = fs.readFileSync(filePath, "utf-8");
    const lines = fileContents.split("\n");
    const keys = lines.map((line) => {
        const [kid, type, privateKeyHex] = line.split(",");
        return { kid, type, privateKeyHex };
    });
    return keys;
};

const displayKeys = (name) => {
    const keys = readKeysFromFile(name);
    for (const key of keys) {
        const { kid, type, privateKeyHex } = key;
        console.log(`Key: ${kid} (${type})`);
        console.log({
            private: toIonPrivateKeyJwk(privateKeyHex, type),
            public: toIonPublicKeyJwk(privateKeyHex, type),
        });
    }
};