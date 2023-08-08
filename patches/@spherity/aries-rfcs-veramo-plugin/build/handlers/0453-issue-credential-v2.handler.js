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
exports.IssueCredential0453MessageHandler = exports.ErrorCodes_0453 = exports.Transition_0453 = exports.ChildMachineState_Request = exports.ChildMachineState_Proposal = exports.ChildMachineState_Offer = exports.MachineState_0453 = exports.MESSAGE_TYPES_0453 = void 0;
const xstate_1 = require("xstate");
const crypto_1 = require("crypto");
const waitFor_1 = require("xstate/lib/waitFor");
const IAriesRFCsPlugin_1 = require("../types/IAriesRFCsPlugin");
var MESSAGE_TYPES_0453;
(function (MESSAGE_TYPES_0453) {
    MESSAGE_TYPES_0453["PROPOSE_CREDENTIAL"] = "https://didcomm.org/issue-credential/2.1/propose-credential";
    MESSAGE_TYPES_0453["OFFER_CREDENTIAL"] = "https://didcomm.org/issue-credential/2.1/offer-credential";
    MESSAGE_TYPES_0453["REQUEST_CREDENTIAL"] = "https://didcomm.org/issue-credential/2.1/request-credential";
    MESSAGE_TYPES_0453["ISSUE_CREDENTIAL"] = "https://didcomm.org/issue-credential/2.1/issue-credential";
    MESSAGE_TYPES_0453["PROBLEM_REPORT"] = "https://didcomm.org/issue-credential/2.1/problem_report";
    MESSAGE_TYPES_0453["COMPLETE"] = "https://didcomm.org/issue-credential/2.1/complete";
})(MESSAGE_TYPES_0453 = exports.MESSAGE_TYPES_0453 || (exports.MESSAGE_TYPES_0453 = {}));
/*
 * All possible states of the protocol for both sides
 * Some states are 'actionable' meaning that a machine should never stop in them (marked with //actionable)
 * Actionable states will have modeled invocations which either advance, or abandon the thread
 * */
var MachineState_0453;
(function (MachineState_0453) {
    MachineState_0453["Start"] = "start";
    MachineState_0453["ProposalSent"] = "proposal-sent";
    MachineState_0453["ProposalReceived"] = "proposal-received";
    MachineState_0453["OfferSent"] = "offer-sent";
    MachineState_0453["OfferReceived"] = "offer-received";
    MachineState_0453["RequestSent"] = "request-sent";
    MachineState_0453["RequestReceived"] = "request-received";
    MachineState_0453["CredentialIssued"] = "credential-issued";
    MachineState_0453["CredentialReceived"] = "credential-received";
    MachineState_0453["Abandoned"] = "abandoned";
    MachineState_0453["AckSent"] = "ack-sent";
    MachineState_0453["AckReceived"] = "ack-received";
    MachineState_0453["ProblemReportSent"] = "send-problem-report";
    MachineState_0453["ProblemReportReceived"] = "receive-problem-report";
    MachineState_0453["Complete"] = "complete";
    MachineState_0453["ContinueOrSendProblemReport"] = "continue-or-send-report";
})(MachineState_0453 = exports.MachineState_0453 || (exports.MachineState_0453 = {}));
var ChildMachineState_Offer;
(function (ChildMachineState_Offer) {
    ChildMachineState_Offer["Pending"] = "offerPending";
    ChildMachineState_Offer["Sent"] = "offerSent";
})(ChildMachineState_Offer = exports.ChildMachineState_Offer || (exports.ChildMachineState_Offer = {}));
var ChildMachineState_Proposal;
(function (ChildMachineState_Proposal) {
    ChildMachineState_Proposal["Pending"] = "proposalPending";
    ChildMachineState_Proposal["Sent"] = "proposalSent";
})(ChildMachineState_Proposal = exports.ChildMachineState_Proposal || (exports.ChildMachineState_Proposal = {}));
var ChildMachineState_Request;
(function (ChildMachineState_Request) {
    ChildMachineState_Request["Pending"] = "requestPending";
    ChildMachineState_Request["Sent"] = "requestSent";
})(ChildMachineState_Request = exports.ChildMachineState_Request || (exports.ChildMachineState_Request = {}));
var Transition_0453;
(function (Transition_0453) {
    Transition_0453["SendProposal"] = "Send Proposal";
    Transition_0453["SendOffer"] = "Send Offer";
    Transition_0453["SendRequest"] = "Send Request";
    Transition_0453["IssueCredential"] = "Issue Credential";
    Transition_0453["ReceiveProposal"] = "Receive Proposal";
    Transition_0453["ReceiveOffer"] = "Receive Offer";
    Transition_0453["ReceiveRequest"] = "Receive Request";
    Transition_0453["ReceiveCredential"] = "Receive Credential";
    Transition_0453["SendAck"] = "Send Ack";
    Transition_0453["ReceiveAck"] = "Receive Ack";
    Transition_0453["SendProblemReport"] = "Send Problem Report";
    Transition_0453["ReceiveProblemReport"] = "Receive Problem Report";
})(Transition_0453 = exports.Transition_0453 || (exports.Transition_0453 = {}));
var ErrorCodes_0453;
(function (ErrorCodes_0453) {
    ErrorCodes_0453["IssuanceAbandoned"] = "issuance-abandoned";
    //ProblemReport = 'problem-report',
})(ErrorCodes_0453 = exports.ErrorCodes_0453 || (exports.ErrorCodes_0453 = {}));
const METADATA_AIP_TYPE = 'AIP_RFC';
const METADATA_AIP_STATE_MACHINE = 'AIP_STATE_MACHINE';
const METADATA_AIP_IN_RESPONSE_TO = 'AIP_IN_RESPONSE_TO';
const METADATA_AIP_RECEIVED_MESSAGE = 'AIP_RECEIVED_MESSAGE';
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

async function IssueCredential0453MessageHandlerPromise() {
    const { AbstractMessageHandler } = await import("@veramo/message-handler");
    
    return class IssueCredential0453MessageHandler extends AbstractMessageHandler {
        constructor(issueCredentialCallback, receiveCredentialCallback) {
            super();
            // Machine for RFC 0453 - Issue Credential V2
            this._stateMachineConfiguration = (0, xstate_1.createMachine)({
                /** @xstate-layout N4IgpgJg5mDOIC5QCUBiBhADAFgKwGYA6WAFwEMAnEgYgGUwA7CAAgHkAzdsCgbUwF1EoAA4B7WAEsSE0QyEgAHogCM+TIQBsuDQCZsATmwaNyzMp0AaEAE9EADkzq9+-doDsex3eUBfH1bQsPCJSShp6JmYABQpRMVgyABs+QSQQeKkZOTSlBGVsdS1dAyMTM0sbRHwHQmxlY2VXbGx8fFx6vwCMHAJicio6RhZkMABHAFc4EhT5DOlZeVzVQu1nUtNzK1sEb1qXfbbDerd8TpBAnpD+mhGAYzAJADcwaNj4pJm0uazFlQLNVYlBrlLaILRuPYuE7afKYbRnC7BPphah3B7PNicbifETiTILHJ-FbFQzAzaVPL4ZSEfb6fD6HR2HQmOl2BHdJGiLEUAC0sEYNzA9yeLxGEymOPSePm2VAS3p6mCOkwVNamDc+mUoIQGv0tXqula+kwGjc2DZ-nOHN6XK4vP5DEFwoxMVEACNEmAALbMEZiKiS74EuUqBW1AjK1VqDVailuTB2Gn7Yy4Rw6Uz6dlBG3cvkCwi27hRIYSBhQagQWRgQilx6iADW1dCVAA+g6IBw7YHpT9CQgXBpCOm7BqTmoXLhcNq3HY9XZWjoTsozbh9HYLV1s0RhG9xEk847UUL0S9O9iBLMe8HFIh9BpsIQZ5r6W4zfgWlOKTpcDpHwY73UmDMmmWaXIQO5xHuiQHk6J6vO6no+n6ogBheXxXrKN79vej6zqo+ivi0H7aqm1IGveLT3lSq5uKBSIQe80EOiQ4G7gkiTFkwpblpWDDVrWDZNtcbZDK6jHdpIMq-Ag7S4IQOAaHYLTvjO3j4NqBTUsYxgqsoDiOG4+R0b0FBjJMpAwUezovOgpkQAKEgfGhuKSb2Ib9hU2zKMuc6tGo9R2KuGinJaiImWZUwwYQpniqQnEQNxFZVjWDB1o2yKtjF5kkBE0zOVKrnXksbiKXs37fgUd7Lp5KiGPJjgGau-4mBoxnbmx+6mdZEBJXxKVpdWDFQWiIoQCJTBnrw+VBphuSyUORT4FogWYK4sbbKaRDOGuDipu+BFtaxkHsTyXUnj13CxBQ4GJGQJDsChXpHYxI3PGN7aTRJ+KzYg83MtoS24Cta0ke0mgpkpjJuO0SmHYWvJnaNvX8algkFtyr2QONJBitlX1SX25jGkOBE4HCeBaJ+2zKnJmqmjo+AeN5OAhZuYHw6dx5I5dKE3XdD0UE98OY+9Aq4xK00YdJRNOKTBS4BTk7at+RB1MYM46C4djaYdtyyNIDCTDyKEHhAnP+jQvEowNhB646paTC2KHjRAroet6yGoakLnfdJAG4c+BFvsRFLVNSdPq+qBjvhuVpbrb+sO2Axv2kM5soTQPPXcIt33Y9Cf24bYBOxQLtu4hnt5d7BW+32TLauYaiEH5bSqN+DLYLRoXWkQWWRYjb3I-1aN96QIsthIsCwJMtmQA5TnVzN0k-g3GhwkOqbKo43kmNgh2jyQnPddQACSU+TMws-2fbC+XoVP0ILoDeTg+0NAXCDOOPgOi63Z8-QZPaekArJwQAIK3HrPjNyWEFaJnqC0UwehZxLTsM-O8hBUxmAcK+FwBQ97d3jrcP+N9oID2AVbYe6UiFzxIePds6BRBehzmAEgYAoFFV+trWow4iZjkBg3PS1IW4GHTEURch0yAQKPudIeAl0qSPrOPPWTDPSsPYQ-bWRAXB6H-J3IwaDEwNR0IyKk5MJFSOYrI1G8iIG5RbMo5hajJb32luqIgKpjT3m0HeVoAjdjCIZPUVYXc2ZInbDyCC7svTpwGBQuRg1YhRMrrldRy81wYJnKYNxJjsA1UpOaR8m98iGQVpqQ64TImIRieEIY8Eom+jABbVJfZVyJlwJkgy395y5IbprRM34zBaHVJOTW+DQnhWshExJVTTIWysTbSpHtGkZxFs09yHgG6dwhAMyMBg4Srh-mcBgoh7LwDSGFfAd9a7uR5BobUPJaa0iefsYx5TrhXIJu5HpocagRyMARNoSDcBw1zMxD50DcgzgfMoAGHjmgmG-NqU0EJ5xdIIGaTuS0QV2iivDeK3FwUcJ2N-QgMLgpwqMOYKmiASpyT8syE4ZhGbQ2xdwXF3JcqEofuYIC9UZwzmMGoTWbhpwjgwfORcZpwRrlagQsCQ0TpgvQi4vsmsnC5OXJ3BMrQjDqS-LOcGDR0U7UaKzOO8qOpMXzAqpI+Kyxcukq0fpGqzTxlRbq7UzLSUpgBSaGcQMzUXOelBKKNrEicuVdcrCZpfx3lWqaPA7STR5PpHqNWa9XU8o0HSfeEULJKp9p8rCMKwY4EMtqkca9UEUiZPVRw7TjFuMIrm2Kh9mLRTzSQO1UAHWE1XHqMtph5yVoTKvPUmC4TLTMArMZ5qkQHyigfCNhaIW1XXM3Y0d4VblECg3TUhTHDq2aO0ycwK5X0UtdI0avb3JdI3jOFUbjKotCRe+SEa5Xyziaoc8ZRAOZkIgDe4t5hBwMzwJ3GFDINlfnyIa00Dh6TeVMGe39BcDZGxNuE2ZGcgNLHcI+JDBFzDa1ySmuo77Fxf0PbOoNC6AO4ZUO0h8-1FJKQoiqacJV9SCpKnpTRNGe622IdIfcgDJiAcjUW3IS1BwEAZG0UcJw2NoIhEYhMypny-xoSJ0hXM3oMYQNUPUBEtCLkCqoe8+gBHaEIKixkSklJbvMfWK9+nJOrsfi4GkmtXBFFMK+PJMKTgYO3qadpyCGTOZggZ40iYTPtO8hK0i1nBx2fXOaAwuhylp0WdE7DVADNGZpLSsz7QloGAbqYut6Zj2YoVrmyZuXqkGfqIuZusk6SvhKoZEVFJTTqAjvAwFGoJFujIEwKsEmV1EuHUODMjMRzpkMtWryuqQtMtnK4VamZz29AcaosALXNZyVTAF+8eEUHP3Xdq0iMZlzvj8H4IAA */
                id: 'RFC0453',
                initial: MachineState_0453.Start,
                context: {
                    problemcode: undefined,
                },
                states: {
                    // Starting States for the Machine,
                    // 1. The Issuer can start by sending the Offer
                    // 2. The holder can start by sending a Proposal
                    // 3. The holder can start by sending a Request
                    [MachineState_0453.Start]: {
                        on: {
                            [Transition_0453.SendOffer]: {
                                target: MachineState_0453.OfferSent,
                            },
                            [Transition_0453.SendProposal]: {
                                target: MachineState_0453.ProposalSent,
                            },
                            [Transition_0453.SendRequest]: {
                                target: MachineState_0453.RequestSent,
                            },
                            [Transition_0453.ReceiveProposal]: {
                                target: MachineState_0453.ProposalReceived,
                            },
                            [Transition_0453.ReceiveOffer]: {
                                target: MachineState_0453.OfferReceived,
                            },
                            [Transition_0453.SendProblemReport]: {
                                target: MachineState_0453.ProblemReportSent,
                            },
                        },
                    },
                    // Offer Sent State is an Issuer State
                    // This has children states, because from Start to Offer Sent, you can have an intermediate state of Pending.
                    [MachineState_0453.OfferSent]: {
                        initial: ChildMachineState_Offer.Pending,
                        states: {
                            // Sending the offer if the children state is Pending
                            [ChildMachineState_Offer.Pending]: {
                                invoke: {
                                    id: 'start_sendOffer',
                                    src: (_, event) => __awaiter(this, void 0, void 0, function* () { return yield this.sendOffer(event); }),
                                    onDone: {
                                        target: ChildMachineState_Offer.Sent,
                                    },
                                },
                            },
                            // If the offer is sent, then the children state is Sent and Final.
                            [ChildMachineState_Offer.Sent]: {
                                type: 'final',
                            },
                        },
                        // This state can go down 3 routes.
                        on: {
                            // 1. If issuer receives a Proposal on his Offer (Receive Proposal -> Proposal Received)
                            // [Transition_0453.ReceiveProposal]: {
                            //   target: MachineState_0453.ProposalReceived,
                            // },
                            // 2. If issuer receives a Request on his Offer (Receive Ruquest -> Request Received)
                            [Transition_0453.ReceiveRequest]: {
                                target: MachineState_0453.RequestReceived,
                            },
                            // 3. If issuer receives a problem report on his Offer (Receive Problem Report -> Abandoned)
                            [Transition_0453.ReceiveProblemReport]: {
                                target: MachineState_0453.ProblemReportReceived,
                            },
                        },
                    },
                    // Proposal Sent State is a holder State
                    // This has children states, because from Start to Proposal Sent, you can have an intermediate state of Pending.
                    [MachineState_0453.ProposalSent]: {
                        initial: ChildMachineState_Proposal.Pending,
                        states: {
                            // Sending the proposal if the children state is Pending
                            [ChildMachineState_Proposal.Pending]: {
                                invoke: {
                                    id: 'start_sendProposal',
                                    src: (_, event) => __awaiter(this, void 0, void 0, function* () { return yield this.sendProposal(event); }),
                                    onDone: {
                                        target: ChildMachineState_Proposal.Sent,
                                    },
                                },
                            },
                            // If the Proposal is sent, then the children state is Sent and Final.
                            [ChildMachineState_Proposal.Sent]: {
                                type: 'final',
                            },
                        },
                        // This state can go down 2 routes.
                        on: {
                            // 1. If holder receives an Offer (Receive Offer -> Offer Received)
                            [Transition_0453.ReceiveOffer]: {
                                target: MachineState_0453.OfferReceived,
                            },
                            // 2. If holder receives a Problem Report on his Offer (Receive Problem Report -> Abandoned)
                            [Transition_0453.ReceiveProblemReport]: {
                                target: MachineState_0453.ProblemReportReceived,
                            },
                        },
                    },
                    // Request Sent is a holder state
                    // This has children states, because from Start to Request Sent, you can have an intermediate state of Pending.
                    [MachineState_0453.RequestSent]: {
                        initial: ChildMachineState_Request.Pending,
                        states: {
                            // Sending the Request if the children state is Pending
                            [ChildMachineState_Request.Pending]: {
                                invoke: {
                                    id: 'start_requestSent',
                                    src: (_) => __awaiter(this, void 0, void 0, function* () { return console.log('sent request 0453'); }),
                                    onDone: {
                                        target: ChildMachineState_Request.Sent,
                                    },
                                },
                            },
                            // If the Request is sent, then the children state is Sent and Final.
                            [ChildMachineState_Request.Sent]: {
                                type: 'final',
                            },
                        },
                        // This state can go down 1 route.
                        on: {
                            // 1. The holder gets a credential issued to his Request.
                            [Transition_0453.ReceiveCredential]: {
                                target: MachineState_0453.CredentialReceived,
                            },
                        },
                    },
                    // Proposal Received is an Issuer State
                    [MachineState_0453.ProposalReceived]: {
                        invoke: {
                            id: 'proposalReceived_sendOffer',
                            src: (_, event) => __awaiter(this, void 0, void 0, function* () { return yield this.sendOffer(event); }),
                            onDone: {
                                target: MachineState_0453.OfferSent,
                            },
                            onError: {
                                target: MachineState_0453.ProblemReportSent,
                            },
                        },
                    },
                    // TODO: This doesn't respect the retry flow for the Offer Received, which would make it go back to propose credential
                    [MachineState_0453.OfferReceived]: {
                        invoke: {
                            id: 'offerReceived_sentRequest',
                            src: (_, event) => __awaiter(this, void 0, void 0, function* () { return yield this.sendRequest(event); }),
                            onDone: {
                                target: MachineState_0453.RequestSent,
                            },
                            onError: {
                                target: MachineState_0453.ProblemReportSent,
                            },
                        },
                    },
                    [MachineState_0453.ContinueOrSendProblemReport]: {
                        invoke: {
                            id: 'continue_or_sendProblemReport',
                            src: (_, _event) => __awaiter(this, void 0, void 0, function* () { return yield console.log('decide to whether want credential or propose something new or send problem'); }),
                            onDone: {
                                target: MachineState_0453.ProposalSent,
                            },
                            onError: {
                                target: MachineState_0453.ProblemReportSent,
                            },
                        },
                    },
                    [MachineState_0453.RequestReceived]: {
                        invoke: {
                            id: 'requestReceived_issueCredential',
                            src: (_, event) => __awaiter(this, void 0, void 0, function* () { return yield this.issueCredential(event); }),
                            onDone: {
                                target: MachineState_0453.CredentialIssued,
                            },
                        },
                        on: {
                            [Transition_0453.IssueCredential]: {
                                target: MachineState_0453.CredentialIssued,
                            },
                        },
                    },
                    [MachineState_0453.CredentialIssued]: {
                        on: {
                            [Transition_0453.ReceiveAck]: {
                                target: MachineState_0453.AckReceived,
                            },
                        },
                    },
                    [MachineState_0453.CredentialReceived]: {
                        invoke: {
                            id: 'credentialReceived_sendComplete',
                            src: (_, event) => __awaiter(this, void 0, void 0, function* () { return yield this.receiveCredentialAndSendAck(event); }),
                            onDone: {
                                target: MachineState_0453.AckSent,
                            },
                        },
                    },
                    [MachineState_0453.AckReceived]: {
                        invoke: {
                            id: 'ackReceived_complete',
                            src: (_, _event) => __awaiter(this, void 0, void 0, function* () { return console.log('the ack is received, done'); }),
                            onDone: {
                                target: MachineState_0453.Complete,
                            },
                        },
                    },
                    [MachineState_0453.AckSent]: {
                        invoke: {
                            id: 'ackSent_complete',
                            src: (_, _event) => __awaiter(this, void 0, void 0, function* () { return console.log('the ack is sent, done'); }),
                            onDone: {
                                target: MachineState_0453.Complete,
                            },
                        },
                    },
                    [MachineState_0453.ProblemReportSent]: {
                        invoke: {
                            id: 'problemReportSent',
                            src: (_, event) => __awaiter(this, void 0, void 0, function* () { return yield this.sendProblemReport(event); }),
                            onDone: {
                                target: MachineState_0453.Abandoned,
                            },
                        },
                    },
                    [MachineState_0453.ProblemReportReceived]: {
                        invoke: {
                            id: 'problemReportReceived',
                            src: (_, event) => __awaiter(this, void 0, void 0, function* () { return yield this.storeReceivedMessages(event, MESSAGE_TYPES_0453.PROBLEM_REPORT, MachineState_0453.Abandoned); }),
                            onDone: {
                                target: MachineState_0453.Abandoned,
                            },
                        },
                    },
                    [MachineState_0453.Abandoned]: {
                        type: 'final',
                    },
                    [MachineState_0453.Complete]: {
                        type: 'final',
                    },
                },
                schema: {
                    events: {},
                },
                predictableActionArguments: true,
                preserveActionOrder: true,
            });
            this.issueCredentialFunction = issueCredentialCallback;
            this.receiveCredentialFunction = receiveCredentialCallback;
        }
        get stateMachineConfiguration() {
            return this._stateMachineConfiguration;
        }
        checkforFinal(_) {
            return false;
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
                if (!Object.values(MESSAGE_TYPES_0453).includes(message.data['@type'])) {
                    console.log(`Received didcomm message of type: [${message.data['@type']}] which is not handled by DidExchange0453MessageHandler. Passing to next handler.`);
                    return _super.handle.call(this, message, context);
                }
                try {
                    if (!message.threadId || !message.to || !message.from || !message.id || !message.data) {
                        throw new Error(`Incoming aries 0453 message has missing required fields for evaluation [${message}]`);
                    }
                    console.log(`Received didcomm message of type: [${message.data['@type']}] from did [${message.from}] for thread [${message.threadId}]`);
                    const stateMachineService = (0, xstate_1.interpret)(this._stateMachineConfiguration);
                    // check if we have stored an abandoned on this thread (recived a problem report)
                    const recievedSavedMessages = yield context.agent.dataStoreORMGetMessages({
                        where: [
                            { column: 'threadId', value: [message.threadId] },
                            { column: 'from', value: [message.from] },
                        ],
                        order: [{ column: 'createdAt', direction: 'DESC' }],
                    });
                    if (recievedSavedMessages && recievedSavedMessages.length !== 0) {
                        const lastReceivedMessageInThread = recievedSavedMessages[0];
                        if (lastReceivedMessageInThread.metaData) {
                            const stateMetadataObj = lastReceivedMessageInThread.metaData.reduce((obj, metaData) => {
                                if (metaData.type === METADATA_AIP_RECEIVED_MESSAGE && metaData.value === true.toString()) {
                                    return Object.assign(Object.assign({}, obj), { received: true });
                                }
                                if (metaData.type === METADATA_AIP_STATE_MACHINE) {
                                    return Object.assign(Object.assign({}, obj), { state: metaData.value });
                                }
                                return obj;
                            }, { received: false, state: MachineState_0453.Start });
                            if (!!stateMetadataObj &&
                                stateMetadataObj['received'] === true &&
                                stateMetadataObj['state'] === MachineState_0453.Abandoned) {
                                throw new Error(`Communication with the thread [${message.threadId}] is already abandoned start a new flow`);
                            }
                        }
                    }
                    const messages = yield context.agent.dataStoreORMGetMessages({
                        // We only want to retrieve messages that we sent
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
                                if (stateMetadataString[0] === MachineState_0453.RequestSent) {
                                    stateMachineService.start({
                                        [MachineState_0453.RequestSent]: 'requestSent',
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
                    console.error('Error while processing an aries 0453 message.', exception);
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
                // Check if the current state is abandoned then we should throw an error or dont react
                if (currentState === MachineState_0453.Abandoned) {
                    // or throw an error depending on what we want to do here
                    return;
                }
                // If we receive a PROPOSAL initiated the flow and should therefore be in the current state of ReceiveProposal
                if (messageType === MESSAGE_TYPES_0453.PROPOSE_CREDENTIAL && currentState === MachineState_0453.Start) {
                    stateMachine.send({
                        type: Transition_0453.ReceiveProposal,
                        message: incomingMessage,
                        veramoAgent: context.agent,
                    });
                    yield (0, waitFor_1.waitFor)(stateMachine, (state) => state.matches(MachineState_0453.ProposalReceived));
                    return;
                }
                if (messageType === MESSAGE_TYPES_0453.OFFER_CREDENTIAL && currentState === MachineState_0453.Start) {
                    stateMachine.send({
                        type: Transition_0453.ReceiveOffer,
                        message: incomingMessage,
                        veramoAgent: context.agent,
                    });
                    yield (0, waitFor_1.waitFor)(stateMachine, (state) => state.matches(MachineState_0453.RequestSent) || state.matches(MachineState_0453.Abandoned));
                    return;
                }
                if (messageType === MESSAGE_TYPES_0453.REQUEST_CREDENTIAL && currentState === MachineState_0453.OfferSent) {
                    stateMachine.send({
                        type: Transition_0453.ReceiveRequest,
                        message: incomingMessage,
                        veramoAgent: context.agent,
                    });
                    yield (0, waitFor_1.waitFor)(stateMachine, (state) => state.matches(MachineState_0453.CredentialIssued));
                    return;
                }
                if (messageType === MESSAGE_TYPES_0453.ISSUE_CREDENTIAL && currentState === MachineState_0453.RequestSent) {
                    stateMachine.send({
                        type: Transition_0453.ReceiveCredential,
                        message: incomingMessage,
                        veramoAgent: context.agent,
                    });
                    // should wait for acksent here but not currently sending an acknowledgement
                    yield (0, waitFor_1.waitFor)(stateMachine, (state) => state.matches(MachineState_0453.CredentialReceived));
                    return;
                }
                // TODO we need to discuss how to handle better  cause not all states have a problem report route.
                if (messageType === MESSAGE_TYPES_0453.PROBLEM_REPORT) {
                    stateMachine.send({
                        type: Transition_0453.ReceiveProblemReport,
                        message: incomingMessage,
                        veramoAgent: context.agent,
                        problem: ErrorCodes_0453.IssuanceAbandoned,
                    });
                    yield (0, waitFor_1.waitFor)(stateMachine, (state) => state.matches(MachineState_0453.Abandoned));
                    return;
                }
                // Nothing could be determined. We send a problem report.
                // TODO Not very spec compliant cause you should not send problem report on start
                return stateMachine.send({ type: Transition_0453.SendProblemReport });
            });
        }
        // Protocol initializer
        sendProposal(event) {
            return __awaiter(this, void 0, void 0, function* () {
                const threadId = event.threadId;
                const messageId = (0, crypto_1.randomUUID)();
                const fromDid = event.fromDid;
                const toDid = event.toDid;
                const veramoAgent = event.veramoAgent;
                const ariesIssueCredentialProposal = {
                    '@id': threadId,
                    '@type': MESSAGE_TYPES_0453.PROPOSE_CREDENTIAL,
                    goal_code: '<goal-code>',
                    comment: 'no comment',
                    credential_preview: {},
                    formats: [
                        {
                            attach_id: '',
                            format: '',
                        },
                    ],
                };
                const didCommMessage = {
                    id: (0, crypto_1.randomUUID)(),
                    from: fromDid,
                    to: toDid,
                    thid: threadId,
                    body: ariesIssueCredentialProposal,
                    type: MESSAGE_TYPES_0453.PROPOSE_CREDENTIAL,
                };
                yield this.storeMessage(messageId, fromDid, toDid, threadId, didCommMessage.body, 'proposal triggered by holder', MESSAGE_TYPES_0453.PROPOSE_CREDENTIAL, MachineState_0453.ProposalSent, veramoAgent);
                yield this.packAndSendMessage(didCommMessage, toDid, veramoAgent);
            });
        }
        sendOffer(event) {
            return __awaiter(this, void 0, void 0, function* () {
                const threadId = event.threadId;
                const messageId = (0, crypto_1.randomUUID)();
                const fromDid = event.fromDid;
                const toDid = event.toDid;
                const veramoAgent = event.veramoAgent;
                const credentialMessage = event.message.credentialBody;
                const ariesIssueCredentialOffer = {
                    '@id': threadId,
                    '@type': MESSAGE_TYPES_0453.OFFER_CREDENTIAL,
                    goal_code: '<goal-code>',
                    comment: "We'd issue you a credential just like this one",
                    credential_preview: {
                        data: credentialMessage.data,
                        credentialId: credentialMessage.credentialId,
                        issuanceDate: credentialMessage.issuanceDate || undefined,
                        expirationDate: credentialMessage.expirationDate || undefined,
                        credentialType: credentialMessage.credentialType || undefined,
                        credentialStatusId: credentialMessage.credentialStatusId || undefined,
                        onboardingId: credentialMessage.onboardingId || undefined,
                    },
                };
                const didCommMessage = {
                    id: (0, crypto_1.randomUUID)(),
                    from: fromDid,
                    to: toDid,
                    thid: threadId,
                    body: ariesIssueCredentialOffer,
                    type: MESSAGE_TYPES_0453.OFFER_CREDENTIAL,
                };
                yield this.storeMessage(messageId, fromDid, toDid, threadId, didCommMessage.body, 'offer sent by issuer', MESSAGE_TYPES_0453.OFFER_CREDENTIAL, MachineState_0453.OfferSent, veramoAgent);
                yield this.packAndSendMessage(didCommMessage, toDid, veramoAgent);
            });
        }
        sendRequest(event) {
            return __awaiter(this, void 0, void 0, function* () {
                const messageId = (0, crypto_1.randomUUID)();
                const fromDid = event.message.to;
                const toDid = event.message.from;
                const veramoAgent = event.veramoAgent;
                const ariesThreadId = event.message.data['@id'];
                // Thread Id for the DIDCOM... the same with the above id(to help readability)
                const didCommThreadId = event.message.threadId;
                // An example of throwing an error to fit event message (to be handled by sendProblemReport)
                // throw {incomingMessage:{ ...event.message}, problem: "We dont accept the type of credential you want to issue", veramoAgent}
                // DO a basic check for the credential data received with rules and stuff and then send credential request
                const ariesIssueCredentialRequest = {
                    '@id': messageId,
                    '@type': MESSAGE_TYPES_0453.REQUEST_CREDENTIAL,
                    '~thread': { thid: ariesThreadId },
                    goal_code: '<goal-code>',
                    comment: 'yes please give me the credential',
                };
                const didCommMessage = {
                    id: messageId,
                    from: fromDid,
                    to: toDid,
                    thid: didCommThreadId,
                    body: ariesIssueCredentialRequest,
                    type: MESSAGE_TYPES_0453.REQUEST_CREDENTIAL,
                };
                yield this.storeMessage(messageId, fromDid, toDid, didCommThreadId, didCommMessage.body, 'request sent by holder', MESSAGE_TYPES_0453.REQUEST_CREDENTIAL, MachineState_0453.RequestSent, veramoAgent);
                yield this.packAndSendMessage(didCommMessage, toDid, veramoAgent);
            });
        }
        issueCredential(event) {
            return __awaiter(this, void 0, void 0, function* () {
                const threadId = event.message.threadId;
                const messageId = (0, crypto_1.randomUUID)();
                const fromDid = event.message.to;
                const toDid = event.message.from;
                const veramoAgent = event.veramoAgent;
                const ariesThreadId = event.message.data['~thread'].thid;
                const messages = (yield veramoAgent.dataStoreORMGetMessages({
                    // We only want to retrieve messages that are not from ourselves (as in sent by us)
                    where: [
                        { column: 'threadId', value: [threadId] },
                        { column: 'from', value: [fromDid] },
                    ],
                    order: [{ column: 'createdAt', direction: 'DESC' }],
                }, {}));
                const credential_preview = messages[0].data.credential_preview;
                let createdCredential;
                try {
                    createdCredential = yield this.issueCredentialFunction(credential_preview, fromDid, toDid, veramoAgent);
                }
                catch (e) {
                    throw Error(e);
                }
                const ariesIssueCredential = {
                    '@id': messageId,
                    '@type': MESSAGE_TYPES_0453.ISSUE_CREDENTIAL,
                    '~thread': {
                        thid: ariesThreadId,
                    },
                    goal_code: '<goal-code>',
                    comment: 'here is your credential',
                    credentials: [createdCredential],
                    onboardingId: credential_preview.onboardingId || undefined,
                    formats: [
                        {
                            attach_id: '',
                            format: '',
                        },
                    ],
                };
                const didCommMessage = {
                    id: messageId,
                    from: fromDid,
                    to: toDid,
                    thid: threadId,
                    body: ariesIssueCredential,
                    type: MESSAGE_TYPES_0453.ISSUE_CREDENTIAL,
                };
                yield this.storeMessage(messageId, fromDid, toDid, threadId, didCommMessage.body, 'credential issued by issuer', MESSAGE_TYPES_0453.ISSUE_CREDENTIAL, MachineState_0453.CredentialIssued, veramoAgent);
                yield this.packAndSendMessage(didCommMessage, toDid, veramoAgent);
            });
        }
        receiveCredentialAndSendAck(event) {
            return __awaiter(this, void 0, void 0, function* () {
                const message = event.message;
                const threadId = message.threadId;
                const messageId = (0, crypto_1.randomUUID)();
                const fromDid = message.to;
                const toDid = message.from;
                const veramoAgent = event.veramoAgent;
                const credential = message.data.credentials[0];
                try {
                    yield this.receiveCredentialFunction(fromDid, credential, message);
                    // If need to send Ack please create a merge request for it.
                }
                catch (e) {
                    throw Error(e);
                }
            });
        }
        sendProblemReport(event) {
            return __awaiter(this, void 0, void 0, function* () {
                const eventData = event.data || event;
                const veramoAgent = eventData.veramoAgent;
                const incomingMessage = eventData.incomingMessage;
                const problem = eventData.problem === 'undefined' ? ErrorCodes_0453.IssuanceAbandoned : event.problem;
                const toDid = incomingMessage.from;
                const fromDid = incomingMessage.to;
                const threadId = incomingMessage.threadId;
                if (toDid === undefined || fromDid === undefined || threadId === undefined) {
                    throw new Error(`Incoming aries 0453 message [${incomingMessage.id}] has missing required fields for evaluation`);
                }
                const messageId = (0, crypto_1.randomUUID)();
                const ariesProblemReport = {
                    '@type': MESSAGE_TYPES_0453.PROBLEM_REPORT,
                    '@id': messageId,
                    '~thread': { thid: threadId },
                    description: { en: 'localized message', code: problem },
                };
                const didCommMessage = {
                    id: messageId,
                    from: fromDid,
                    to: toDid,
                    thid: threadId,
                    body: ariesProblemReport,
                    type: MESSAGE_TYPES_0453.PROBLEM_REPORT,
                };
                yield this.storeMessage(messageId, fromDid, toDid, threadId, ariesProblemReport, incomingMessage, MESSAGE_TYPES_0453.PROBLEM_REPORT, MachineState_0453.Abandoned, veramoAgent);
                yield this.packAndSendMessage(didCommMessage, toDid, veramoAgent);
            });
        }
        storeReceivedMessages(event, messageType, machineStateToStore) {
            return __awaiter(this, void 0, void 0, function* () {
                const message = event.message;
                const threadId = message.threadId;
                const messageId = message.data['@id'];
                const fromDid = message.from;
                const toDid = message.to;
                const veramoAgent = event.veramoAgent;
                yield this.storeMessage((0, crypto_1.randomUUID)(), //TODO remove this should not be important but since its the same DB the last message is overwritten
                fromDid, toDid, threadId, message.data, `receive message of type ${event.message.type}`, messageType, machineStateToStore, veramoAgent, true);
            });
        }
        packAndSendMessage(message, recipientDid, veramoAgent) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const packedMessage = yield veramoAgent.packDIDCommMessage({
                        packing: IAriesRFCsPlugin_1.DIDCommMessagePacking.AUTHCRYPT,
                        message: message,
                    }, {});
                    yield veramoAgent
                        .sendDIDCommMessage({
                        messageId: message.id,
                        packedMessage,
                        recipientDidUrl: recipientDid,
                    }, {})
                        .then(() => {
                        console.debug(`[Aries 0453 Sent didcomm message of type [${message.type}] to did [${recipientDid}]`);
                    })
                        .catch((err) => {
                        console.error({ err }, `Unable to send didcomm message for aries 0453 flow with threadId [${message.thid}]`);
                        throw err;
                    });
                }
                catch (err) {
                    console.error({ err }, `Unable to pack and send didcomm message for aries 0453 flow with threadId [${message.thid}]`);
                    throw err;
                }
            });
        }
        storeMessage(messageId, fromDid, toDid, threadId, ariesData, inResponseTo, messageType, machineState, veramoAgent, receivedMessage = false) {
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
                            {
                                type: METADATA_AIP_RECEIVED_MESSAGE,
                                value: receivedMessage.toString(),
                            },
                        ],
                    };
                    yield veramoAgent.dataStoreSaveMessage({
                        message: storedMessage,
                    });
                }
                catch (exception) {
                    console.error(`Unable to save message for aries 0453 flow with threadId [${threadId}]`, exception);
                    throw exception;
                }
            });
        }
        static getMachineConfig() {
            return new this(() => { }, () => { }).stateMachineConfiguration;
        }
    }
}
exports.IssueCredential0453MessageHandler = IssueCredential0453MessageHandlerPromise;
//# sourceMappingURL=0453-issue-credential-v2.handler.js.map