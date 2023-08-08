//TODO
export const createCredential = async (
    credentialData,
    issuerDid,
    recipientDid,
    veramoAgent
  ) => {
    let createdAt = new Date();
    let expiresAt = credentialData.expirationDate
      ? new Date(credentialData.expirationDate)
      : new Date(createdAt.getTime() + 1000 * 60 * 60 * 24 * 365);

    let credentialPayload = {
      id: credentialData.credentialId,
      issuer: issuerDid,
      '@context': [],
      expirationDate: expiresAt.toISOString(),
      issuanceDate: issuesAt.toISOString(),
      credentialSubject: {
        id: recipientDid,
        ...credentialData.data,
      },
    };

    vc = await veramoAgent.createVerifiableCredential(
      {
        credential: credentialPayload,
        proofFormat: 'lds',
        now: nowOverride,
      },
      { agent: veramoAgent.agent },
    );

    return vc;
  }



//TODO
export const receiveCredential = async (
    fromDid, 
    credential, 
    message
    ) => {
    let recipientIdentifier = await identifier.findFirst({
      where: {
        did: fromDid,
      },
    });

    if (!recipientIdentifier) {
      throw new Error(`Identifier with did<${fromDid}> is not found`);
    }

    console.log(credential)

    // save credential in the database
}




//TODO
export const createPresentation = async(
    holderDid,
    credentialType,
    veramoAgent
  ) => {

    let credential = 'retrieve credential from the database based on credentialType'
    let presentation = await veramoAgent.createVerifiablePresentation(
      {
        presentation: {
          verifiableCredential: [credential],
          holder: holderDid,
        },
        proofFormat: 'jwt',
      },
      {},
    );

    return presentation;
  }


//TODO
export const verifyPresentation = async (
    verifiablePresentation, 
    veramoAgent
    ) => {
    let verificationResponse = await veramoAgent.verifyPresentation(
      {
        presentation: verifiablePresentation,
        // We only want to check the signature and its general validity
        // The rest we handle manually to throw the correct OCI error codes
        policies: {
          issuanceDate: false,
          expirationDate: false,
          aud: false,
        },
      },
      {},
    );

    return verificationResponse;
  }