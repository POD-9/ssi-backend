"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DidExchange0023MessageHandler = exports.ErrorCodes_0023 = exports.Transition_0023 = exports.ChildMachineState_Invitation = exports.MachineState_0023 = void 0;
const xstate_1 = require("xstate");
const crypto_1 = require("crypto");
const waitFor_1 = require("xstate/lib/waitFor");
const IAriesRFCsPlugin_1 = require("../types/IAriesRFCsPlugin");
var MESSAGE_TYPE;
(function (MESSAGE_TYPE) {
    MESSAGE_TYPE["INVITATION"] = "https://didcomm.org/out-of-band/1.1/invitation";
    MESSAGE_TYPE["REQUEST"] = "https://didcomm.org/didexchange/1.0/request";
    MESSAGE_TYPE["RESPONSE"] = "https://didcomm.org/didexchange/1.0/response";
    MESSAGE_TYPE["PROBLEM_REPORT"] = "https://didcomm.org/didexchange/1.0/problem_report";
    MESSAGE_TYPE["COMPLETE"] = "https://didcomm.org/didexchange/1.0/complete";
})(MESSAGE_TYPE || (MESSAGE_TYPE = {}));
/*
 * All possible states of the protocol for both sides
 * Some states are 'actionable' meaning that a machine should never stop in them (marked with //actionable)
 * Actionable states will have modeled invocations which either advance, or abandon the thread
 * */
var MachineState_0023;
(function (MachineState_0023) {
    MachineState_0023["Start"] = "start";
    MachineState_0023["InvitationSent"] = "invitation-sent";
    MachineState_0023["InvitationReceived"] = "invitation-received";
    MachineState_0023["RequestSent"] = "request-sent";
    MachineState_0023["RequestReceived"] = "request-received";
    MachineState_0023["ResponseSent"] = "response-sent";
    MachineState_0023["ResponseReceived"] = "response-received";
    MachineState_0023["Abandoned"] = "abandoned";
    MachineState_0023["Completed"] = "completed";
})(MachineState_0023 = exports.MachineState_0023 || (exports.MachineState_0023 = {}));
var ChildMachineState_Invitation;
(function (ChildMachineState_Invitation) {
    ChildMachineState_Invitation["Pending"] = "invitationPending";
    ChildMachineState_Invitation["Sent"] = "invitationSent";
})(ChildMachineState_Invitation = exports.ChildMachineState_Invitation || (exports.ChildMachineState_Invitation = {}));
var Transition_0023;
(function (Transition_0023) {
    Transition_0023["SendInvitation"] = "Send Invitation";
    Transition_0023["SendRequest"] = "Send Request";
    Transition_0023["SendProblemReport"] = "Send Problem Report";
    Transition_0023["ReceiveProblemReport"] = "Receive Problem Report";
    Transition_0023["SendComplete"] = "Send Complete";
    Transition_0023["SendResponse"] = "Send Response";
    Transition_0023["ReceiveResponse"] = "Receive Response";
    Transition_0023["ReceiveRequest"] = "Receive Request";
    Transition_0023["ReceiveComplete"] = "Receive Complete";
    Transition_0023["ReceiveInvitation"] = "Receive Invitation";
})(Transition_0023 = exports.Transition_0023 || (exports.Transition_0023 = {}));
var ErrorCodes_0023;
(function (ErrorCodes_0023) {
    ErrorCodes_0023["RequestNotAccepted"] = "request_not_accepted";
    ErrorCodes_0023["RequestProcessingError"] = "request_processing_error";
    ErrorCodes_0023["ResponseNotAccepted"] = "response_not_accepted";
    ErrorCodes_0023["ResponseProcessingError"] = "response_processing_error";
    ErrorCodes_0023["ProblemReport"] = "problem-report";
})(ErrorCodes_0023 = exports.ErrorCodes_0023 || (exports.ErrorCodes_0023 = {}));
const METADATA_AIP_TYPE = 'AIP_RFC';
const METADATA_AIP_STATE_MACHINE = 'AIP_STATE_MACHINE';
const METADATA_AIP_IN_RESPONSE_TO = 'AIP_IN_RESPONSE_TO';
/*
 *                                         (This Handler)
 *                                 ┌───────────────────────────┐
 *                                 │                           │
 * ┌────────────────────┐          │ Check requirements        │
 * │                    │          │                           │
 * │  Receive message   │ ────────►│ Rehydrate state machine   │
 * │                    │          │                           │
 * └────────────────────┘          │ Create message structure  │
 *                                 │                           │
 * ┌────────────────────┐          └────────────────┬──────────┘
 * │                    │                           │
 * │    Send Answer     │ ◄─────────────────────────┘
 * │                    │
 * └────────────────────┘
 *
 */

async function DidExchange0023MessageHandlerPromise() {
    const { AbstractMessageHandler } = await import("@veramo/message-handler");
  
    return class DidExchange0023MessageHandler extends AbstractMessageHandler {
        get stateMachineConfiguration() {
            return this._stateMachineConfiguration;
        }
        constructor(resolver) {
            super();
            this.resolver = resolver;
            this._stateMachineConfiguration = (0, xstate_1.createMachine)({
                /** @xstate-layout N4IgpgJg5mDOIC5QCUBiBhADJgTATgDpYAXAQwCdiBiZMAYzAEsA3MAAgEkA7Zxs4xgHsuAbUwBdRKAAOg2HyFcpIAB6IAjAGZMBTJvU51ADiN5TANnM4ANCACeGzABYCTvO7zn15vN-UBWIwBfINs0LFxCEgpqAGUwLghOHj5SAWExSSQQWXl0pWy1BC0dPQNjUwsrWwcEf0xCJ29LbEsncxNzELCMbHwCRhT+RQBacnomVggqCGEwAZ5BAGt5wd5h4VoGFkgAfVgEiFoARwBXOGJM5VyFYWUi-2MCAKtNAHZNI3U3pzfzGsQOHqug8njeRk0lhwwVCIHCfUIa1S+TGEx20zA5HIgnIBGkABs0gAzHEAWwW6zSii2kz2B0SJ3OJCu2Ru+XuGgMAOKhhwzwh+icejemECXVh8MiFORo3G2ymVHiiTYjIuLJkcluBVAD2hz38rw+Xx+f256ncBH8oLef3egUC3ThvSlSI2XFR8sgisObAACtiAEb4sCklVgWSUdU5TXswqIepGfWGz7fX7-eyITSaPnGLPacyYEVOJyOyX9cZnC4jenUGk7MOwWRcA5RtmKDkIPBvdSufz6PSBIxC3zcnDYVx5-tdhrmnCl53lsCVkjVhJxH3+wRBkNhiOXCTXGPtuOdmwZ4pWt4EDrZ8FuHDmN7ziKLxvCA4e2nTWZcVaLFYEOMb7NmAdZTNwzCCHQVIZAerJHncJ76P417dkOxjFtgbhmimBB4HmmBWE4hhaDCPQvoQQFNh+cpflQmLYriBLEmSgFwNRoFouBizQfkrYIdqqiZqKqEYRhQrOHgZrEY0Wb4A+BhNOK5EImxwE0VxXpKkk6CCKSBJgMQYD8Xkx46pmASiehQ4Sdh55aPoE5ZoWOCuWOnjPqpVHvmAn7ot6yqbtuoa0HuJlah2+AoY+Yk2VhUn2WmeFyeCZg4GhnkukMMHujWNCaWGy77lkGqmYh5mdv4V4eEYbx4GOBiPpo3K-ImgRyUYeg4JojzdZl-Sujlq5cLWBVBcGIXhjixWHmVglFHgVV4e4tX1ZgjUfNyRhWNeAoBOt3b+MW-WItlKI1tKbq+ocgxQDMcwUss8zRJQ+yHBBMqwSV0ZzR29SEGUfj+NCHw4L83J9joljQ1aHR6JgZFOhRbFFX5Co-n+kEARWTLEGBdKHLQ6nGXBpURSeDnmAQ4LqAj9R6ItHQQ3oTnZr4kJ4NgmglhKC6UUuuNo16DE4nihLECS5DkjjFz4xAb0MuxPnhbGFXVOeDU9vh2ZGN1j7dd4J0o4LtH+dpDYcSrZlCcUWZUzTdNc4zRgtcDyUEeo3juF4RsyyupsKvjfqBhNu7TVb5U21o3jU18jsMwaLvnj8Wt5gE9RvGOQK+0rIHDaNnpsLp+nBkZEfzYCTjRQa3XyaY9XZmaEKELm6VvL1VVOJoOfE-n+WF+NO6heHpM-eTFVg9Xrx1+4tdN6Yu23uYfZg3eISwlwggQHAyhlngs3jzbIzprUx+6Ng62uU4tVuMYy9Gy9xAH6rNvEWanuuM0KY-GYord7zyNBoogDpAZ+1sij6EaB0bs3ZPi2iMP4LaPY3CggCD1Qw20c6oxrGAyORRdYuHwNAiEY5NB4DfhrQsBAeoXyqlCYi6ge4cSFhAXBFdiiFhwtzXQAoEblHqv4I2QDRg4Pgr9E80Icw31coWdo2B1AtSeNDZeBggT6AsEIs6Ii1yXRytdRIt02EdmcvyH4MifgFnWszKmzQoRWHbpzPQmjKTnR0cI4QSon5iMPkUI014DSe3cN2XAXgIZ6iUlCPszdBEAK8gLKsIDWHeJfkUT2ZDrwNCBAjdy8lXYoXalmWm3huwBCYT5fORiTy1Sbu0EE7hzSPGblmI2dA9IGSMkksmKTEBWETMYH4tVoTqCFFmHCdVF7aCGavRGe8CCkADKQRIcxOlj26QgXppjr6Zy+CM5q9kfAuFzNmQi0IyHA3XkEIAA */
                id: 'RFC0029',
                initial: MachineState_0023.Start,
                context: {
                    problemCode: undefined,
                },
                states: {
                    [MachineState_0023.Start]: {
                        on: {
                            [Transition_0023.ReceiveInvitation]: {
                                target: MachineState_0023.InvitationReceived,
                            },
                            [Transition_0023.SendInvitation]: {
                                target: MachineState_0023.InvitationSent,
                            },
                        },
                    },
                    [MachineState_0023.InvitationReceived]: {
                        // When we receive an invitation we check:
                        // Do we want to respond? Is the message ok? Do we trust the other party? Done in DidExchange0023MessageHandler.sendRequest
                        // If that's the case -> target the state onDone -> SendRequest which puts us in 'RequestSent'
                        invoke: {
                            id: 'invitationReceived_sendRequest',
                            src: (_, event) => __awaiter(this, void 0, void 0, function* () { return yield this.sendRequest(event); }),
                            onDone: {
                                target: MachineState_0023.RequestSent,
                            },
                            onError: {
                                target: MachineState_0023.Abandoned,
                            },
                        },
                        on: {
                            [Transition_0023.SendRequest]: {
                                target: MachineState_0023.RequestSent,
                            },
                            [Transition_0023.SendProblemReport]: {
                                target: MachineState_0023.Abandoned,
                            },
                        },
                    },
                    [MachineState_0023.RequestSent]: {
                        on: {
                            [Transition_0023.ReceiveResponse]: {
                                target: MachineState_0023.ResponseReceived,
                            },
                            [Transition_0023.SendProblemReport]: {
                                target: MachineState_0023.Abandoned,
                            },
                        },
                    },
                    [MachineState_0023.ResponseReceived]: {
                        invoke: {
                            id: 'responseReceivedInvocation',
                            src: (_, event) => __awaiter(this, void 0, void 0, function* () { return yield this.sendComplete(event); }),
                            onDone: {
                                target: MachineState_0023.Completed,
                            },
                            onError: {
                                target: MachineState_0023.Abandoned,
                            },
                        },
                        on: {
                            [Transition_0023.SendComplete]: {
                                target: MachineState_0023.Completed,
                            },
                            [Transition_0023.SendProblemReport]: {
                                target: MachineState_0023.Abandoned,
                            },
                        },
                    },
                    [MachineState_0023.InvitationSent]: {
                        initial: ChildMachineState_Invitation.Pending,
                        states: {
                            [ChildMachineState_Invitation.Pending]: {
                                invoke: {
                                    id: 'start_sendInvitation',
                                    src: (_, event) => __awaiter(this, void 0, void 0, function* () { return yield this.sendInvitation(event); }),
                                    onDone: {
                                        target: ChildMachineState_Invitation.Sent,
                                    },
                                },
                            },
                            [ChildMachineState_Invitation.Sent]: {
                                type: 'final',
                            },
                        },
                        on: {
                            [Transition_0023.ReceiveRequest]: {
                                target: MachineState_0023.RequestReceived,
                            },
                            [Transition_0023.ReceiveProblemReport]: {
                                target: MachineState_0023.Abandoned,
                            },
                        },
                    },
                    [MachineState_0023.RequestReceived]: {
                        invoke: {
                            id: 'requestReceived_sendResponse',
                            src: (_, event) => __awaiter(this, void 0, void 0, function* () { return yield this.sendResponse(event); }),
                            onDone: {
                                target: MachineState_0023.ResponseSent,
                            },
                            onError: {
                                target: MachineState_0023.Abandoned,
                            },
                        },
                        on: {
                            [Transition_0023.SendResponse]: {
                                target: MachineState_0023.ResponseSent,
                            },
                            [Transition_0023.ReceiveProblemReport]: {
                                target: MachineState_0023.Abandoned,
                            },
                        },
                    },
                    [MachineState_0023.ResponseSent]: {
                        on: {
                            [Transition_0023.ReceiveComplete]: {
                                target: MachineState_0023.Completed,
                            },
                            [Transition_0023.ReceiveProblemReport]: {
                                target: MachineState_0023.Abandoned,
                            },
                        },
                    },
                    [MachineState_0023.Completed]: {
                        type: 'final',
                    },
                    [MachineState_0023.Abandoned]: {
                        invoke: {
                            id: 'any_sendProblemReport',
                            src: (_, event) => this.sendProblemReport(event),
                        },
                        type: 'final',
                    },
                },
                schema: {
                    events: {},
                },
                predictableActionArguments: true,
                preserveActionOrder: true,
            });
            this.trustResolver = resolver;
        }
        handle(message, context) {
            const _super = Object.create(null, {
                handle: { get: () => super.handle }
            });
            return __awaiter(this, void 0, void 0, function* () {
                // Check if this is actually a message we want to handle
                // If not, we pass the message to the next handler
                //
                // This is the only and last point we can pass the message to the next handler. If we determine this is indeed a message
                // **_this_** handler should handle, we are not passing it to the next one in case of errors.
                if (!Object.values(MESSAGE_TYPE).includes(message.data['@type'])) {
                    console.log(`Received didcomm message of type: [${message.data['@type']}] which is not handled by DidExchange0023MessageHandler. Passing to next handler.`);
                    return _super.handle.call(this, message, context);
                }
                try {
                    if (!message.threadId || !message.to || !message.from || !message.id || !message.id || !message.data) {
                        throw new Error(`Incoming aries 0023 message has missing required fields for evaluation [${message}]`);
                    }
                    console.log(`Received didcomm message of type: [${message.data['@type']}] from did [${message.from}] for thread [${message.threadId}]`);
                    const stateMachineService = (0, xstate_1.interpret)(this._stateMachineConfiguration);
                    const messages = yield context.agent.dataStoreORMGetMessages({
                        // We only want to retrieve messages that are not from ourselves (as in sent by us)
                        where: [
                            { column: 'threadId', value: [message.threadId] },
                            { column: 'from', value: [message.to] },
                        ],
                        order: [{ column: 'createdAt', direction: 'DESC' }],
                    });
                    // In every incoming valid message either one of these scenarios is true:
                    // 1. Communication already happened. The thread should then be filled with at least 1 previous message -> We hydrate the machine with the newest message in the thread
                    // 2, Communication never has happened before (new invitation). The thread is empty -> We do not hydrate the machine and start it fresh
                    if (messages && messages.length !== 0) {
                        const lastMessageInThread = messages[0];
                        if (lastMessageInThread.metaData) {
                            const stateMetadataString = lastMessageInThread.metaData
                                .map((metaData) => {
                                if (metaData.type === METADATA_AIP_STATE_MACHINE) {
                                    return metaData.value;
                                }
                            })
                                .filter((value) => value !== undefined);
                            if (!!stateMetadataString) {
                                // Exception if we are the inviter we have to manually advance the state to child state
                                // 'invitationSent' as there is no state before sending an invitation we can 'remember' via sent messages.
                                if (stateMetadataString[0] === MachineState_0023.InvitationSent) {
                                    stateMachineService.start({
                                        [MachineState_0023.InvitationSent]: 'invitationSent',
                                    });
                                }
                                else {
                                    stateMachineService.start(stateMetadataString[0]);
                                }
                            }
                        }
                    }
                    else {
                        stateMachineService.start();
                    }
                    yield this.advanceProtocol(message, stateMachineService, context);
                    stateMachineService.stop();
                }
                catch (exception) {
                    console.error('Error while processing an aries 0023 message.', exception);
                    console.error(exception.message);
                    throw exception;
                }
                return message;
            });
        }
        advanceProtocol(incomingMessage, stateMachine, context) {
            return __awaiter(this, void 0, void 0, function* () {
                let currentState;
                const machineSnapshotValue = stateMachine.getSnapshot().value;
                // The current State the thread is in
                if (typeof machineSnapshotValue === 'object') {
                    currentState = Object.keys(machineSnapshotValue)[0];
                }
                else {
                    currentState = machineSnapshotValue;
                }
                const messageType = incomingMessage.data['@type'];
                // If we receive a request WE initiated the flow and should therefore be in the current state of InvitationSent
                if (messageType === MESSAGE_TYPE.REQUEST && currentState === MachineState_0023.InvitationSent) {
                    stateMachine.send({
                        type: Transition_0023.ReceiveRequest,
                        message: incomingMessage,
                        veramoAgent: context.agent,
                    });
                    yield (0, waitFor_1.waitFor)(stateMachine, (state) => state.matches(MachineState_0023.RequestReceived));
                    return;
                }
                // If we receive an invitation, we already started the machine in mode that will trigger the sending of the request.
                if (messageType === MESSAGE_TYPE.INVITATION && currentState === MachineState_0023.Start) {
                    stateMachine.send({
                        type: Transition_0023.ReceiveInvitation,
                        message: incomingMessage,
                        veramoAgent: context.agent,
                    });
                    yield (0, waitFor_1.waitFor)(stateMachine, (state) => state.matches(MachineState_0023.RequestSent));
                    return;
                }
                // We received a response after sending a request.
                if (messageType === MESSAGE_TYPE.RESPONSE && currentState === MachineState_0023.RequestSent) {
                    stateMachine.send({
                        type: Transition_0023.ReceiveResponse,
                        message: incomingMessage,
                        veramoAgent: context.agent,
                    });
                    yield (0, waitFor_1.waitFor)(stateMachine, (state) => state.matches(MachineState_0023.Completed));
                    console.log(`Aries 0023 Invitation flow for invitee [${incomingMessage.to}] and didcomm threadId [${incomingMessage.threadId}] completed.`);
                    return;
                }
                // We received a complete after sending a response
                if (messageType === MESSAGE_TYPE.COMPLETE && currentState === MachineState_0023.ResponseSent) {
                    stateMachine.send({ type: Transition_0023.ReceiveComplete });
                    yield (0, waitFor_1.waitFor)(stateMachine, (state) => state.matches(MachineState_0023.Completed));
                    console.log(`Aries 0023 Invitation flow for inviter [${incomingMessage.to}] and didcomm threadId [${incomingMessage.threadId}] completed.`);
                    return;
                }
                // Always possible to receive a problem report. We then navigate the state into 'Abandoned'
                if (messageType === MESSAGE_TYPE.PROBLEM_REPORT) {
                    stateMachine.send({
                        type: Transition_0023.ReceiveProblemReport,
                        message: incomingMessage,
                        veramoAgent: context.agent,
                        problem: ErrorCodes_0023.ProblemReport,
                    });
                    yield (0, waitFor_1.waitFor)(stateMachine, (state) => state.matches(MachineState_0023.Abandoned));
                }
                // Nothing could be determined. We send a problem report.
                return stateMachine.send({ type: Transition_0023.SendProblemReport });
            });
        }
        // Protocol initializer
        sendInvitation(event) {
            return __awaiter(this, void 0, void 0, function* () {
                const threadId = event.threadId;
                const messageId = (0, crypto_1.randomUUID)();
                const fromDid = event.fromDid;
                const toDid = event.toDid;
                const veramoAgent = event.veramoAgent;
                const ariesInvitationMessage = {
                    '@id': threadId,
                    '@type': MESSAGE_TYPE.INVITATION,
                    services: [fromDid],
                };
                const didCommMessage = {
                    id: (0, crypto_1.randomUUID)(),
                    from: fromDid,
                    to: toDid,
                    thid: threadId,
                    body: ariesInvitationMessage,
                    type: MESSAGE_TYPE.INVITATION,
                };
                yield this.storeMessage(messageId, fromDid, toDid, threadId, didCommMessage.body, 'New invitation triggered by user', MESSAGE_TYPE.INVITATION, MachineState_0023.InvitationSent, veramoAgent);
                yield this.packAndSendMessage(didCommMessage, toDid, veramoAgent);
            });
        }
        // Answer to [invitation]
        sendRequest(event) {
            return __awaiter(this, void 0, void 0, function* () {
                const veramoAgent = event.veramoAgent;
                //The invitation we get in
                const invitation = event.message;
                // The incoming invitation message contains the did we should contact
                const toDid = invitation.data.services[0];
                const fromDid = invitation.to;
                // When a request responds to an explicit invitation,
                // its ~thread.pthid MUST be equal to the @id property of the invitation as described in the out-of-band RFC.
                const parentThreadId = invitation.data['@id'];
                // New Thread as we answer to an invitation and this request is a new flow
                // This is aries specific - The didcomm thread is going to keep its unique ID across the protocol for easiness
                const threadId = (0, crypto_1.randomUUID)();
                if (!fromDid || !invitation.to) {
                    const errorMessage = 'Received invitation with missing required parameters. Not sending request.';
                    console.error(errorMessage);
                    throw Error(errorMessage);
                }
                const retrievedIdentifier = yield veramoAgent.didManagerGet({
                    did: invitation.to,
                });
                // Execute the trust check if we want to answer this did
                if (this.trustResolver !== undefined && (invitation === null || invitation === void 0 ? void 0 : invitation.from)) {
                    const trusted = yield this.trustResolver.checkTrustStatus(invitation.from);
                    if (!trusted) {
                        console.log(`did [${fromDid}] is not answering invitation from did [${toDid}] as it is considered not trusted`);
                        return;
                    }
                }
                const ariesRequestMessage = {
                    '@id': threadId,
                    '@type': MESSAGE_TYPE.REQUEST,
                    '~thread': { pthid: parentThreadId, thid: threadId },
                    label: retrievedIdentifier.alias,
                    //TODO: This should probably be configurable
                    goal_code: 'aries.rel.build',
                    goal: 'To create a trusted relationship',
                    did: retrievedIdentifier.did,
                };
                const messageId = (0, crypto_1.randomUUID)();
                const didCommMessage = {
                    type: MESSAGE_TYPE.REQUEST,
                    id: messageId,
                    // We can be sure this exists as the message had to be decrypted somehow
                    from: fromDid,
                    to: toDid,
                    thid: invitation.threadId,
                    body: ariesRequestMessage,
                    packingType: IAriesRFCsPlugin_1.DIDCommMessagePacking.AUTHCRYPT,
                };
                yield this.storeMessage(messageId, fromDid, toDid, parentThreadId, ariesRequestMessage, invitation, MESSAGE_TYPE.REQUEST, MachineState_0023.RequestSent, veramoAgent);
                yield this.packAndSendMessage(didCommMessage, toDid, veramoAgent);
            });
        }
        // Answer to [request]
        sendResponse(event) {
            return __awaiter(this, void 0, void 0, function* () {
                //The request we receive
                const request = event.message;
                const fromDid = request.to;
                if (fromDid === undefined) {
                    throw new Error(`Incoming aries 0023 request [${request.id}] has missing required fields for evaluation `);
                }
                const didcommThreadId = request.threadId;
                const ariesThreadId = request.data['~thread'].thid;
                // The incoming request defines the did we should answer on
                const requestDid = request.data.did;
                const messageId = (0, crypto_1.randomUUID)();
                const veramoAgent = event.veramoAgent;
                const ariesResponseMessage = {
                    '@type': MESSAGE_TYPE.RESPONSE,
                    '@id': messageId,
                    '~thread': {
                        thid: ariesThreadId,
                    },
                    did: request.to,
                };
                const didCommMessage = {
                    id: messageId,
                    from: fromDid,
                    to: requestDid,
                    thid: didcommThreadId,
                    body: ariesResponseMessage,
                    type: MESSAGE_TYPE.RESPONSE,
                };
                yield this.storeMessage(messageId, fromDid, requestDid, didcommThreadId, ariesResponseMessage, request, MESSAGE_TYPE.RESPONSE, MachineState_0023.ResponseSent, veramoAgent);
                yield this.packAndSendMessage(didCommMessage, requestDid, veramoAgent);
            });
        }
        // Answer to [response]
        sendComplete(event) {
            return __awaiter(this, void 0, void 0, function* () {
                const response = event.message;
                const veramoAgent = event.veramoAgent;
                const toDid = response.from;
                const fromDid = response.to;
                if (fromDid === undefined || response.threadId === undefined || toDid === undefined) {
                    throw new Error(`Incoming aries 0023 response [${response.id}] has missing required fields for evaluation`);
                }
                let requestThreadId;
                // Determine which request we sent to properly include the thid and pthid of it into this complete message
                const messages = yield veramoAgent.dataStoreORMGetMessages({
                    where: [
                        { column: 'threadId', value: [response.threadId] },
                        { column: 'from', value: [fromDid] },
                    ],
                    order: [{ column: 'createdAt', direction: 'DESC' }],
                }, {});
                // Retrieve the last request and threadId we've sent as the protocol requires the information
                // for the complete message
                //TODO: Refactor this lol
                for (const message of messages) {
                    if (message.metaData) {
                        for (const metaData of message.metaData) {
                            if (metaData.type === METADATA_AIP_TYPE && metaData.value === MESSAGE_TYPE.REQUEST) {
                                if (message.data) {
                                    const messageData = message.data;
                                    if (messageData['~thread'].pthid) {
                                        requestThreadId = messageData['~thread'].pthid;
                                    }
                                }
                            }
                        }
                    }
                }
                const didcommThreadId = response.threadId;
                const ariesThreadId = response.data['~thread'].thid;
                const messageId = (0, crypto_1.randomUUID)();
                const ariesCompleteMessage = {
                    '@type': MESSAGE_TYPE.COMPLETE,
                    '@id': messageId,
                    '~thread': {
                        thid: ariesThreadId,
                        pthid: requestThreadId,
                    },
                };
                const didCommMessage = {
                    id: messageId,
                    from: fromDid,
                    to: toDid,
                    thid: didcommThreadId,
                    body: ariesCompleteMessage,
                    type: MESSAGE_TYPE.COMPLETE,
                };
                yield this.storeMessage(messageId, fromDid, toDid, didcommThreadId, ariesCompleteMessage, response, MESSAGE_TYPE.COMPLETE, MachineState_0023.Completed, veramoAgent);
                yield this.packAndSendMessage(didCommMessage, toDid, veramoAgent);
            });
        }
        // May always occur
        sendProblemReport(event) {
            return __awaiter(this, void 0, void 0, function* () {
                const veramoAgent = event.veramoAgent;
                const incomingMessage = event.incomingMessage;
                const problem = event.problem === 'undefined' ? ErrorCodes_0023.ProblemReport : event.problem;
                const relatedMessageId = event.message.data['@id'];
                const toDid = incomingMessage.from;
                const fromDid = incomingMessage.to;
                const didcommThreadId = incomingMessage.threadId;
                if (toDid === undefined || fromDid === undefined || didcommThreadId === undefined) {
                    throw new Error(`Incoming aries 0023 message [${incomingMessage.id}] has missing required fields for evaluation`);
                }
                let explainMessage;
                switch (problem) {
                    case ErrorCodes_0023.ProblemReport:
                        explainMessage = `An unexpected error occurred while handling the message of type [${incomingMessage.type}] with id [${relatedMessageId}]`;
                        break;
                    case ErrorCodes_0023.RequestProcessingError:
                        explainMessage = 'The request could not be processed due to malformed or missing properties';
                        break;
                    case ErrorCodes_0023.ResponseProcessingError:
                        explainMessage = 'The response could not be processed due to malformed or missing properties';
                        break;
                }
                const messageId = (0, crypto_1.randomUUID)();
                const ariesProblemReport = {
                    '@type': MESSAGE_TYPE.PROBLEM_REPORT,
                    '@id': messageId,
                    '~thread': { thid: relatedMessageId },
                    'problem-code': problem,
                    explain: explainMessage,
                };
                const didCommMessage = {
                    id: messageId,
                    from: fromDid,
                    to: toDid,
                    thid: didcommThreadId,
                    body: ariesProblemReport,
                    type: MESSAGE_TYPE.PROBLEM_REPORT,
                };
                yield this.storeMessage(messageId, fromDid, toDid, didcommThreadId, ariesProblemReport, incomingMessage, MESSAGE_TYPE.PROBLEM_REPORT, MachineState_0023.Abandoned, veramoAgent);
                yield this.packAndSendMessage(didCommMessage, toDid, veramoAgent);
            });
        }
        packAndSendMessage(message, recipientDid, veramoAgent) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const packedMessage = yield veramoAgent.packDIDCommMessage({
                        packing: IAriesRFCsPlugin_1.DIDCommMessagePacking.AUTHCRYPT,
                        message: message,
                    }, {});
                    veramoAgent
                        .sendDIDCommMessage({
                        messageId: message.id,
                        packedMessage,
                        recipientDidUrl: recipientDid,
                    }, {})
                        .then(() => {
                        console.debug(`[Aries 0023] Sent didcomm message of type [${message.type}] to did [${recipientDid}]`);
                    })
                        .catch((err) => {
                        console.error({ err }, `Unable to pack and send didcomm message for aries 0023 flow with threadId [${message.thid}]`);
                        throw err;
                    });
                }
                catch (err) {
                    console.error({ err }, `Unable to pack and send didcomm message for aries 0023 flow with threadId [${message.thid}]`);
                    throw err;
                }
            });
        }
        storeMessage(messageId, fromDid, toDid, threadId, ariesData, inResponseTo, messageType, machineState, veramoAgent) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const storedMessage = {
                        id: messageId,
                        createdAt: new Date().toISOString(),
                        type: messageType,
                        from: fromDid,
                        to: toDid,
                        threadId: threadId,
                        data: ariesData,
                        metaData: [
                            {
                                type: METADATA_AIP_TYPE,
                                value: messageType,
                            },
                            {
                                type: METADATA_AIP_STATE_MACHINE,
                                value: machineState,
                            },
                            {
                                type: METADATA_AIP_IN_RESPONSE_TO,
                                value: JSON.stringify(inResponseTo),
                            },
                        ],
                    };
                    yield veramoAgent.dataStoreSaveMessage({
                        message: storedMessage,
                    });
                }
                catch (exception) {
                    console.error(`Unable to save message for aries 0023 flow with threadId [${threadId}]`, exception);
                    throw exception;
                }
            });
        }
        static getMachineConfig() {
            return new this(() => { }).stateMachineConfiguration;
        }
    }
}

exports.DidExchange0023MessageHandler = DidExchange0023MessageHandlerPromise
// export { DidExchange0023MessageHandlerPromise };
//# sourceMappingURL=0023-did-exchange.handler.js.map