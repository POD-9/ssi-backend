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
exports.AriesRFCsPlugin = void 0;
const crypto_1 = require("crypto");
const xstate_1 = require("xstate");
const waitFor_1 = require("xstate/lib/waitFor");
const _0023_did_exchange = require("./handlers/0023-did-exchange.handler");
const _0453_issue_credential_v2 = require("./handlers/0453-issue-credential-v2.handler");
const _0454_present_proof_v2 = require("./handlers/0454-present-proof-v2.handler");
const IAriesRFCsPlugin_1 = require("./types/IAriesRFCsPlugin");

let _0023_did_exchange_handler_1
let _0453_issue_credential_v2_handler_1
let _0454_present_proof_v2_handler_1

_0023_did_exchange.DidExchange0023MessageHandler().then(e => {
    _0023_did_exchange_handler_1 = e
})

_0453_issue_credential_v2.IssueCredential0453MessageHandler().then(e => {
    _0453_issue_credential_v2_handler_1 = e
})

_0454_present_proof_v2.PresentProof0454MessageHandler().then(e => {
    _0454_present_proof_v2_handler_1 = e
})

// !!!!! DO THE SCHEMA FOR THE PLUGIN
/**
 * {@inheritDoc IMyAgentPlugin}
 * @beta
 */
class AriesRFCsPlugin {
    constructor() {
        // readonly schema = schema.IMyAgentPlugin
        // map the methods your plugin is declaring to their implementation
        this.methods = {
            send0023: this.send0023.bind(this),
            send0453: this.send0453.bind(this),
            send0454: this.send0454.bind(this),
        };
        // list the event types that this plugin cares about.
        // When the agent emits an event of these types, `MyAgentPlugin.onEvent()` will get called.
        this.eventTypes = ['validatedMessage'];
    }
    // the event handler for the types listed in `eventTypes`
    onEvent(event, context) {
        return __awaiter(this, void 0, void 0, function* () {
            // you can emit other events
            yield context.agent.emit('my-event', { foo: event.data.id });
            // or call other agent methods that are declared in the context
            const allDIDs = yield context.agent.didManagerFind();
        });
    }
    /** {@inheritDoc IMyAgentPlugin.myPluginFoo} */
    send0023(args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            // you can call other agent methods (that are declared in the `IRequiredContext`)
            const protocol0023 = (0, xstate_1.interpret)(_0023_did_exchange_handler_1.getMachineConfig());
            const threadId = (0, crypto_1.randomUUID)();
            try {
                protocol0023.start();
                protocol0023.send({
                    type: _0023_did_exchange.Transition_0023.SendInvitation,
                    fromDid: args.from,
                    toDid: args.to,
                    threadId: threadId,
                    veramoAgent: context.agent,
                });
                yield (0, waitFor_1.waitFor)(protocol0023, (state) => 
                // Sending an invitations triggers a 'child' machine to handle the two states [sent] and [pending/sending]
                // Waiting for this state means we need to specifically wait to the child state
                state.matches({ [_0023_did_exchange.MachineState_0023.InvitationSent]: [_0023_did_exchange.ChildMachineState_Invitation.Sent] }), { timeout: 20000 });
                return {
                    threadId,
                    protocolState: Object.values(protocol0023.getSnapshot().value)[0],
                };
            }
            catch (exception) {
                console.error(`Failed sending 0023 invitation from [${args.from}] to [${args.to}] with threadId [${threadId}] because of -> ${exception.message}`);
                // Javascript error handling ladies and gentlemen
                // The default timeout error is really ambigious, this enriches the message a bit
                if (exception.message.includes('Timeout')) {
                    throw new Error('Unable to send message. Invitation was not sent out as protocol did not advance after 10 seconds.');
                }
                // If for any reason the error is not a timeout we still want to throw a 500
                throw new Error(exception);
            }
            finally {
                protocol0023.stop();
            }
        });
    }
    /** {@inheritDoc IMyAgentPlugin.myPluginFoo} */
    send0453(args, context) {
        return __awaiter(this, void 0, void 0, function* () {

            const protocol0453 = (0, xstate_1.interpret)(_0453_issue_credential_v2_handler_1.getMachineConfig());
            const threadId = (0, crypto_1.randomUUID)();
            const veramoAgent = context.agent;
            // Check for whether we have an exchange with the did we are trying to start issuing flow with.
            const completedMessages = (yield veramoAgent.dataStoreORMGetMessages({
                // We only want to retrieve messages that can either be sent to us, or received by us with the type complete
                where: [
                    { column: 'to', value: [args.to, args.from] },
                    { column: 'from', value: [args.from, args.to] },
                    { column: 'type', value: ['https://didcomm.org/didexchange/1.0/complete'] },
                ],
                order: [{ column: 'createdAt', direction: 'DESC' }],
            }));
            if (Array.isArray(completedMessages) && completedMessages.length <= 0) {
                throw new Error(`You<${args.from}> have not had a did exchange with the DID<${args.to}>`);
            }
            try {
                protocol0453.start();
                if (args.type === IAriesRFCsPlugin_1.MESSAGE_TYPES_0453.PROPOSE_CREDENTIAL) {
                    protocol0453.send({
                        type: _0453_issue_credential_v2.Transition_0453.SendProposal,
                        fromDid: args.from,
                        toDid: args.to,
                        threadId: threadId,
                        veramoAgent: veramoAgent,
                    });
                    yield (0, waitFor_1.waitFor)(protocol0453, (state) => 
                    // Proposing a credential means the machine will start off in a propose credential flow
                    // Waiting for this state means we need to specifically wait for the child state for the proposal to be send
                    state.matches({ [_0453_issue_credential_v2.MachineState_0453.ProposalSent]: [_0453_issue_credential_v2.ChildMachineState_Proposal.Sent] }), { timeout: 20000 });
                }
                else if (args.type === IAriesRFCsPlugin_1.MESSAGE_TYPES_0453.OFFER_CREDENTIAL) {
                    protocol0453.send({
                        type: _0453_issue_credential_v2.Transition_0453.SendOffer,
                        fromDid: args.from,
                        toDid: args.to,
                        threadId: threadId,
                        message: args.message,
                        veramoAgent: veramoAgent,
                    });
                    yield (0, waitFor_1.waitFor)(protocol0453, (state) => 
                    // Offering a credential means the machine will start off in an offer credential flow
                    // Waiting for this state means we need to specifically wait for the offer to be sent
                    state.matches({ [_0453_issue_credential_v2.MachineState_0453.OfferSent]: [_0453_issue_credential_v2.ChildMachineState_Offer.Sent] }), { timeout: 20000 });
                }
                return {
                    threadId,
                    protocolState: Object.values(protocol0453.getSnapshot().value)[0],
                };
            }
            catch (exception) {
                console.error(`Failed sending 0453 issue credential offer from [${args.from}] to [${args.to}] with threadId [${threadId}] because of -> ${exception.message}`);
                if (exception.message.includes('Timeout')) {
                    throw new Error('Unable to send message. Invitation was not sent out as protocol did not advance after 10 seconds.');
                }
                // If for any reason the error is not a timeout we still want to throw a 500
                throw new Error(exception);
            }
            finally {
                protocol0453.stop();
            }
        });
    }
    /** {@inheritDoc IMyAgentPlugin.myPluginFoo} */
    send0454(args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            // you can call other agent methods (that are declared in the `IRequiredContext`)
            const protocol0454 = (0, xstate_1.interpret)(_0454_present_proof_v2_handler_1.getMachineConfig());
            const threadId = (0, crypto_1.randomUUID)();
            const veramoAgent = context.agent;
            // Check for whether we have an invitation with the DID we are trying to communicate with
            const messages = (yield veramoAgent.dataStoreORMGetMessages({
                // We only want to retrieve messages that are not from ourselves (as in sent by us)
                where: [
                    { column: 'to', value: [args.to, args.from] },
                    { column: 'from', value: [args.from, args.to] },
                    { column: 'type', value: ['https://didcomm.org/didexchange/1.0/complete'] },
                ],
                order: [{ column: 'createdAt', direction: 'DESC' }],
            }));
            if (Array.isArray(messages) && messages.length <= 0) {
                throw new Error(`You<${args.from}> have not had a did exchange with the DID<${args.to}>`);
            }
            try {
                protocol0454.start();
                if (args.type === IAriesRFCsPlugin_1.MESSAGE_TYPES_0454.PROPOSE_PRESENTATION) {
                    protocol0454.send({
                        type: _0454_present_proof_v2.Transition_0454.SendProposal,
                        fromDid: args.from,
                        toDid: args.to,
                        threadId: threadId,
                        message: args.message,
                        veramoAgent: veramoAgent,
                    });
                    yield (0, waitFor_1.waitFor)(protocol0454, (state) => 
                    // Sending a PROPOSAL Initiates the machine.
                    // Waiting for this state means we need are waiting for the proposal to be sent
                    state.matches({ [_0454_present_proof_v2.MachineState_0454.ProposalSent]: [_0453_issue_credential_v2.ChildMachineState_Proposal.Sent] }), { timeout: 20000 });
                }
                else if (args.type === IAriesRFCsPlugin_1.MESSAGE_TYPES_0454.REQUEST_PRESENTATION) {
                    protocol0454.send({
                        type: _0454_present_proof_v2.Transition_0454.SendRequest,
                        fromDid: args.from,
                        toDid: args.to,
                        threadId: threadId,
                        message: args.message,
                        veramoAgent: veramoAgent,
                    });
                    yield (0, waitFor_1.waitFor)(protocol0454, (state) => 
                    // Sending an invitations triggers a 'child' machine to handle the two states [sent] and [pending/sending]
                    // Waiting for this state means we need to specifically wait to the child state
                    state.matches({ [_0454_present_proof_v2.MachineState_0454.RequestSent]: [_0453_issue_credential_v2.ChildMachineState_Request.Sent] }), { timeout: 20000 });
                }
                return {
                    threadId,
                    protocolState: Object.values(protocol0454.getSnapshot().value)[0],
                };
            }
            catch (exception) {
                console.error(`Failed sending 0454 issue credential offer from [${args.from}] to [${args.to}] with threadId [${threadId}] because of -> ${exception.message}`);
                if (exception.message.includes('Timeout')) {
                    throw new Error('Unable to send message. Invitation was not sent out as protocol did not advance after 10 seconds.');
                }
                // If for any reason the error is not a timeout we still want to throw a 500
                throw new Error(exception);
            }
            finally {
                protocol0454.stop();
            }
        });
    }
}
exports.AriesRFCsPlugin = AriesRFCsPlugin;
//# sourceMappingURL=sendAriesRFCMessages.js.map