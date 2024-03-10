const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse
} = require('@simplewebauthn/server');
const { VerifyToken, GetUsernameFromToken, SetPasskeyRegisterInfo, GetPasskeyRegisterInfo, SetFinalPasskeyInfo, GetFinalPasskeyInfo, SetUserPasskeyChallenge, GetUserPasskeyChallenge } = require('./accountHandler');
const { error } = require('okayulogger');
const { validationResult, matchedData } = require('express-validator');


const rpName = 'OkayuCDN';
const rpID = 'localhost';
const expectedOrigin = 'http://localhost:2773';

/**
 * Handles starting the passkey registration
 * @param {Request} req 
 * @param {Response} res 
 */
async function RegisterStart(req, res) {
    let result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(400).json({success:false,code:'PASSKEY_REG_FAIL',reason:'Bad request'});
        return;
    }
    const data = matchedData(req);

    if (!VerifyToken(data.token)) {
        res.status(400).json({success:false,code:'PASSKEY_REG_FAIL',reason:'Login failed'});
        return;
    }

    const username = GetUsernameFromToken(data.token);

    // passkey stuff starts here
    const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userID: username,
        userName: username,
        attestationType: 'none',
        authenticatorSelection: {
            residentKey: 'discouraged',
            userVerification: 'preferred',
            authenticatorAttachment: 'platform'
        }
    });

    SetPasskeyRegisterInfo(username, options);
    res.json(options);
}

/**
 * Handles finishing the passkey registration
 * @param {Request} req 
 * @param {Response} res 
 */
async function RegisterFinish(req, res) {
    let result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(400).json({success:false,code:'PASSKEY_REG_FAIL',reason:'Bad request'});
        return;
    }
    const data = matchedData(req);

    if (!VerifyToken(data.token)) {
        res.status(400).json({success:false,code:'PASSKEY_REG_FAIL',reason:'Login failed'});
        return;
    }

    const username = GetUsernameFromToken(data.token);
    const expectedChallenge = GetPasskeyRegisterInfo(username).challenge;

    let verification;
    try {
        verification = await verifyRegistrationResponse({
            response: req.body,
            expectedChallenge,
            expectedOrigin,
            expectedRPID: rpID,
        });

        const {verified} = verification;

        res.json({success:true,code:'PASSKEY_REG_SUCCESS',reason:'Passkey verified successfully',verified});

        // store it
        const { registrationInfo } = verification;
        const {
          credentialPublicKey,
          credentialID,
          counter,
          credentialDeviceType,
          credentialBackedUp,
        } = registrationInfo;
        const newAuthenticator = {
            credentialID,
            credentialPublicKey,
            counter,
            credentialDeviceType,
            credentialBackedUp,
            // `body` here is from Step 2
            transports: req.body.response.transports,
          };
        SetFinalPasskeyInfo(username, newAuthenticator);
    } catch (err) {
        error('passkey', err);
        return res.status(400).send({error: err.message});
    }
}

async function LoginStart(req, res) {
    let result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(400).json({success:false,code:'PASSKEY_LOGIN_FAIL',reason:'Bad request'});
        return;
    }
    const data = matchedData(req);
    const userPasskeyData = GetFinalPasskeyInfo(data.username);

    if (!userPasskeyData.usesPasskey) {
        return res.status(401).json({success:false,code:'PASSKEY_NO_REG',reason:'The specified user has no passkey associated with their account.'});
    }

    const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: userPasskeyData.authenticators.map(authenticator => ({
            id: new Uint8Array(Object.values(authenticator.credentialID)), // very important as we are storing the values as json! otherwise, 'id' is empty.
            type: 'public-key',
            transports: authenticator.transports
        })),
        userVerification: 'preferred'
    });

    SetUserPasskeyChallenge(data.username, options);
    res.json(options);
}

async function LoginFinish(req, res) {
    let result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(400).json({success:false,code:'PASSKEY_LOGIN_FAIL',reason:'Bad request'});
        return;
    }
    const data = matchedData(req);
    const {body} = req;

    const options = GetUserPasskeyChallenge(data.username);
    const userPasskeyData = GetFinalPasskeyInfo(data.username);

    let authenticator = userPasskeyData.authenticators[0];

    let verification;
    try {
        verification = await verifyAuthenticationResponse({
            response: body,
            expectedChallenge: options.challenge,
            expectedOrigin,
            expectedRPID: rpID,
            authenticator
        });
    } catch (err) {
        error('passkey', err);
        return res.status(400).json({success:false,code:'PASSKEY_LOGIN_FAIL',reason:'Passkey could not be verified.'});
    }

    return res.json({success:verification.verified,code:'PASSKEY_RESULT',reason:'Passkey has been processed.'});
}

module.exports = {RegisterStart, RegisterFinish, LoginStart, LoginFinish};