
import * as nonRepudiationLibrary from '@i3m/non-repudiation-library'
import { ServerWallet } from '@i3m/server-wallet/types'
import { WalletComponents } from '@i3m/wallet-desktop-openapi/types'
import { HttpInitiatorTransport, Session } from '@i3m/wallet-protocol'
import { WalletApi } from '@i3m/wallet-protocol-api'
import { randBytes } from 'bigint-crypto-utils'
import chai, { expect } from 'chai';
import { hashable } from 'object-sha'
import chaiHttp = require('chai-http');
import 'mocha';
import { TextEncoder, TextDecoder } from 'util';

chai.use(chaiHttp);


const should = chai.should()

const server = require('../index')


// const sessionObjJson = JSON.stringify({"masterKey":{"from":{"name":"Initiator"},"to":{"name":"Wallet desktop"},"port":29170,"na":"z5--oAI5QgRJ8ulTzi33Vw","nb":"Y3mXncUg92gfI7N5dCD88w","secret":"L9xObOmCEJ87iNtRBVjPPEEmdikfC0jMeleF2JOcQ7Y"},"code":"65794a68624763694f694a6b615849694c434a6c626d4d694f694a424d6a553252304e4e496e302e2e5244666f6b30416a4c6671655968354e2e64644c3766534c7a5350595442526e636568423259432d646a7946327367665836327342686f424579677873504e39365059746a5f796f334335654a554f6a3576387043376b3373714f534d505a565976444e79714857517146324a4d4f585668546832396435586759736d4e4337656154325133424f386d794754325a35553646306f454868735166676841554f57757251637a58376f6c35547355575a38515f784342367772737646754551535a623371464a4c3738374d53477656314b39444b726553336e784f49557771464c67506258526664576b494a73696a7a6b597637706c556437636c4d724a2d677a516761583167425745624f5f4e57322d3568334535446d7054764d51666c30446535686e4247553065644838796c5f4f79646b746a4e62775566594b6f6e5537644b6d47414c6434436c4d6c376b62596b5f693338572d597a37743177635377514c69494a7764656574684f3655485530733132455335684c365a7964534f30386767617a3163713845436f61772e55576a335636633378656131734e6270734d51494777"})//process.env.I3M_WALLET_SESSION_TOKEN //as string

// //process.env.I3M_WALLET_SESSION_TOKEN as string
// const IS_BROWSER = false
// if (IS_BROWSER) {
//   console.log('This test is not executed in a browser (server wallet only works on node). Skipping')
// } else if (sessionObjJson === undefined) {
//   console.log(`Skipping test.
// You need to pass a I3M_WALLET_SESSION_TOKEN as env variable.
// Steps for creating a token:
//  - Set your wallet in pairing mode. A PIN appears in the screen
//  - Connect a browser to http://localhost:29170/pairing
//    - If session is ON (PIN is not requested), click "Remove session" and then "Start protocol"
//    - Fill in the PIN
//    - After succesful pairing, click "Session to clipboard"
//  - Edit your .env file or add a new environment variable in you CI provider with key I3M_WALLET_SESSION_TOKEN and value the pasted contents`)
// } else {
//   describe('A complete secure data exchange flow with NRP. A consumer using the I3M-Wallet deskptop application, and the provider using the server wallet', function () {
//     this.timeout(2000000)
//     this.bail() // stop after a test fails

//     const sessionObj = JSON.parse(sessionObjJson)

//     const dids: { [k: string]: string } = {}

//     let consumerWallet: WalletApi
//     let providerWallet: ServerWallet
//     let providerOperatorWallet: ServerWallet

//     let dataSharingAgreement: WalletComponents.Schemas.DataSharingAgreement

//     let join, homedir, serverWalletBuilder, rmSync

//     before(async function () {
//       join = (await import('path')).join
//       homedir = (await import('os')).homedir
//       serverWalletBuilder = (await import('@i3m/server-wallet')).serverWalletBuilder
//       rmSync = (await import('fs')).rmSync

//       // Setup consumer wallet
//       const transport = new HttpInitiatorTransport()
//       const session = await Session.fromJSON(transport, sessionObj)
//       consumerWallet = new WalletApi(session)

//       // Setup provider wallet
//       const providerStoreFilePath = join(homedir(), '.server-wallet', '_test_provider')
//       try {
//         rmSync(providerStoreFilePath)
//       } catch (error) {}
//       providerWallet = await serverWalletBuilder({ password: '4e154asdrwwec42134642ewdqcADFEe&/1', reset: true, filepath: providerStoreFilePath })

//       // Setup provider operator wallet
//       const providerOperatorStoreFilePath = join(homedir(), '.server-wallet', '_test_providerOperator')
//       try {
//         rmSync(providerOperatorStoreFilePath)
//       } catch (error) {}
//       providerOperatorWallet = await serverWalletBuilder({ password: 'qwertqwe1234542134642ewdqcAADFEe&/1', reset: true, filepath: providerOperatorStoreFilePath })
//     })

//     describe('setup identities for the NRP', function () {
//       before('should find the provider identity (which should have funds) already imported in the wallet (use a BOK wallet)', async function () {
//         // Import provider identity (it has funds to operate with the DLT)
        
//         const privateKey = String(process.env.PRIVATE_KEY)
//         if (privateKey === undefined) {
//           throw new Error('You need to pass a PRIVATE_KEY as env variable. The associated address should also hold balance enough to interact with the DLT')
//         }
//         await providerWallet.importDid({
//           alias: 'provider',
//           privateKey: nonRepudiationLibrary.parseHex(privateKey, true)
//         })
//         const availableIdentities = await providerWallet.identityList({ alias: 'provider' })
//         const identity = availableIdentities[0]

//         chai.expect(identity.did).to.not.be.empty

//         dids.provider = identity.did

//         console.log(`Provider identity found: ${identity.did}`)
//       })
//       it('should create a new identity for the provider operator (who signs the data sharing agreement)', async function () {
//         // Create an identity for the consumer
//         const resp = await providerOperatorWallet.identityCreate({
//           alias: 'provider'
//         })
//         console.log(resp)
//         chai.expect(resp.did).to.not.be.empty
//         dids.providerOperator = resp.did
//         console.log(`New provider operator identity created for the tests: ${resp.did}`)
//       })
//       it('should create a new identity for the consumer', async function () {
//         // Create an identity for the consumer
//         const resp = await consumerWallet.identities.create({
//           alias: 'consumer'
//         })
//         chai.expect(resp.did).to.not.be.empty
//         dids.consumer = resp.did
//         console.log(`New consumer identity created for the tests: ${resp.did}`)

//         const info = await consumerWallet.identities.info({ did: resp.did });
//         console.log(info)
//         //const ethereumAddress = info.addresses[0];
//       })
//     })

//     describe('NRP', function () {
//       this.bail() // stop after a test fails

//       let nrpProvider: nonRepudiationLibrary.NonRepudiationProtocol.NonRepudiationOrig
//       let nrpConsumer: nonRepudiationLibrary.NonRepudiationProtocol.NonRepudiationDest

//       let providerWalletAgent: nonRepudiationLibrary.I3mServerWalletAgentOrig
//       let consumerWalletAgent: nonRepudiationLibrary.I3mWalletAgentDest

//       let consumerJwks: nonRepudiationLibrary.JwkPair
//       let providerJwks: nonRepudiationLibrary.JwkPair

//       let dataExchangeAgreement: nonRepudiationLibrary.DataExchangeAgreement

//       let block: Uint8Array

//       before('should prepare agents and check that the provider one has funds to interact with the DLT', async function () {
//         // Prepare consumer agent
//         consumerWalletAgent = new nonRepudiationLibrary.I3mWalletAgentDest(consumerWallet, dids.consumer)

//         // Prepare provider agent
//         providerWalletAgent = new nonRepudiationLibrary.I3mServerWalletAgentOrig(providerWallet, dids.provider)

//         const providerLedgerAddress = await providerWalletAgent.getAddress()
//         console.log(`Provider ledger address: ${providerLedgerAddress}`)

//         const providerBalance = await providerWalletAgent.provider.getBalance(providerLedgerAddress)
//         console.log(`Provider balance: ${providerBalance.toString()}`)

//         expect(providerBalance.toBigInt() > 50000000000000n).to.be.true
//       })

//       it('should prepare a valid data sharing agreeemt', async function () {
//         // Create a random block of data for the data exchange
//         block = new Uint8Array(await randBytes(256))

//         // Create random fresh keys for the data exchange
//         consumerJwks = await nonRepudiationLibrary.generateKeys('ES256')
//         providerJwks = await nonRepudiationLibrary.generateKeys('ES256')

//         // Prepare the data sharing agreeement
//         //dataSharingAgreement = (await import('./dataSharingAgreementTemplate.json')).default as WalletComponents.Schemas.DataSharingAgreement
//         dataSharingAgreement= {
//             "dataOfferingDescription": {
//               "dataOfferingId": "string",
//               "version": 0,
//               "title": "Well-being data #14",
//               "category": "string",
//               "active": true
//             },
//             "parties": {
//               "providerDid": "string",
//               "consumerDid": "string"
//             },
//             "purpose": "string",
//             "duration": {
//               "creationDate": 0,
//               "startDate": 0,
//               "endDate": 0
//             },
//             "intendedUse": {
//               "processData": false,
//               "shareDataWithThirdParty": false,
//               "editData": false
//             },
//             "licenseGrant": {
//               "transferable": false,
//               "exclusiveness": false,
//               "paidUp": false,
//               "revocable": false,
//               "processing": false,
//               "modifying": false,
//               "analyzing": false,
//               "storingData": false,
//               "storingCopy": false,
//               "reproducing": false,
//               "distributing": false,
//               "loaning": false,
//               "selling": false,
//               "renting": false,
//               "furtherLicensing": false,
//               "leasing": false
//             },
//             "dataStream": false,
//             "personalData": false,
//             "pricingModel": {
//               "paymentType": "string",
//               "pricingModelName": "string",
//               "basicPrice": 0,
//               "currency": "string",
//               "fee": 0,
//               "hasPaymentOnSubscription": {
//                 "paymentOnSubscriptionName": "string",
//                 "paymentType": "string",
//                 "timeDuration": "string",
//                 "description": "string",
//                 "repeat": "string",
//                 "hasSubscriptionPrice": 0
//               },
//               "hasFreePrice": {
//                 "hasPriceFree": true
//               }
//             },
//             "dataExchangeAgreement": {
//               "orig": "string",
//               "dest": "string",
//               "encAlg": "A256GCM",
//               "signingAlg": "ES256",
//               "hashAlg": "SHA-256",
//               "ledgerContractAddress": "0x8d407A1722633bDD1dcf221474be7a44C05d7c2F",
//               "ledgerSignerAddress": "string",
//               "pooToPorDelay": 10000,
//               "pooToPopDelay": 20000,
//               "pooToSecretDelay": 180000
//             },
//             "signatures": {
//               "providerSignature": "string",
//               "consumerSignature": "string"
//             }
//           } as WalletComponents.Schemas.DataSharingAgreement
//         dataExchangeAgreement = {
//           ...dataSharingAgreement.dataExchangeAgreement,
//           orig: await nonRepudiationLibrary.parseJwk(providerJwks.publicJwk, true),
//           dest: await nonRepudiationLibrary.parseJwk(consumerJwks.publicJwk, true),
//           encAlg: 'A256GCM',
//           signingAlg: 'ES256',
//           hashAlg: 'SHA-256',
//           ledgerSignerAddress: await providerWalletAgent.getAddress()
//         }

//         dataSharingAgreement.dataExchangeAgreement = dataExchangeAgreement

//         const { signatures, ...payload } = dataSharingAgreement

//         dataSharingAgreement.parties.providerDid = dids.providerOperator
//         dataSharingAgreement.parties.consumerDid = dids.consumer

//         dataSharingAgreement.signatures.providerSignature = (await providerOperatorWallet.identitySign({ did: dids.providerOperator }, { type: 'JWT', data: { payload } })).signature
//         dataSharingAgreement.signatures.consumerSignature = (await consumerWallet.identities.sign({ did: dids.consumer }, { type: 'JWT', data: { payload } })).signature

//         console.log(JSON.stringify({
//           dataSharingAgreement,
//           providerJwks,
//           consumerJwks
//         }, undefined, 2))

//         const errors = await nonRepudiationLibrary.validateDataSharingAgreementSchema(dataSharingAgreement)
//         if (errors.length > 0) console.log(errors)
//         expect(errors.length).to.equal(0)
//       })
//       it('provider operator, provider and consumer should be able to store the agreement', async function () {
//         // provider stores agreement
//         const resource = await providerWallet.resourceCreate({
//           type: 'Contract',
//           resource: {
//             dataSharingAgreement,
//             keyPair: {
//               publicJwk: await nonRepudiationLibrary.parseJwk(providerJwks.publicJwk, true),
//               privateJwk: await nonRepudiationLibrary.parseJwk(providerJwks.privateJwk, true)
//             }
//           }
//         })
//         console.log('Provider stores data sharing agreement with id: ', resource.id)
//         chai.expect(resource.id).to.not.be.undefined

//         // consumer stores agreement
//         const resource2 = await consumerWallet.resources.create({
//           type: 'Contract',
//           identity: dids.consumer,
//           resource: {
//             dataSharingAgreement,
//             keyPair: {
//               publicJwk: await nonRepudiationLibrary.parseJwk(consumerJwks.publicJwk, true),
//               privateJwk: await nonRepudiationLibrary.parseJwk(consumerJwks.privateJwk, true)
//             }
//           }
//         })
//         console.log('Consumer stores data sharing agreement with id: ', resource2.id)
//         chai.expect(resource2.id).to.not.be.undefined

//         expect(resource.id).to.be.equal(resource2.id)

//         // Ready for starting the NRP
//         nrpProvider = new nonRepudiationLibrary.NonRepudiationProtocol.NonRepudiationOrig(dataExchangeAgreement, providerJwks.privateJwk, block, providerWalletAgent)
//         nrpConsumer = new nonRepudiationLibrary.NonRepudiationProtocol.NonRepudiationDest(dataExchangeAgreement, consumerJwks.privateJwk, consumerWalletAgent)
//       })
//     })
// })
// }


describe('/GET contractual params', () => {
 
  let rawTransaction;
  let signedTransaction;
  it('it should retrieve the contractual parameters for an offering id', (done) => {
    
    chai.request('http://localhost:3333')
        .get('/template/63f779b64fdbcb456eff39ac')
        .end((err, res) => {
              should.exist(res.body);
              res.should.have.status(200);
              res.body.should.be.a('object');
              // res.body.should.have.property('errors');
              // res.body.errors.should.have.property('pages');
              // res.body.errors.pages.should.have.property('kind').eql('required');
              console.log(res.body)
              rawTransaction = res.body
              done();

       });
  });
});



describe('/POST create agreement', () => {
  
  let rawTransaction;
  let signedTransaction;
  it('it should create an agreement raw transaction', (done) => {
      let agreement = 
      {
        "dataOfferingDescription": {
          "dataOfferingId": "63662ebdb7d5dd78b7159566",
          "version": 0,
          "title": "Oil Supply Unit",
          "category": "manufacturing",
          "active": true
        },
        "parties": {
          "providerDid": "did:ethr:i3m:0x0243cc9dbc7157ee12ce1898ac0c49b366822f32d57bc108e127f45b6c43a57e90",
          "consumerDid": "did:ethr:i3m:0x03878572e4476a6b7b0223d07f53159ef923c874084ea56760fd130d80c51409ad"
        },
        "purpose": "P&ID diagram of the Lube Oil supply Unit",
        "duration": {
          "creationDate": 1678997655,
          "startDate": 1786678869,
          "endDate": 1886678869
        },
        "intendedUse": {
          "processData": true,
          "shareDataWithThirdParty": false,
          "editData": true
        },
        "licenseGrant": {
          "transferable": false,
          "exclusiveness": false,
          "paidUp": true,
          "revocable": true,
          "processing": true,
          "modifying": true,
          "analyzing": true,
          "storingData": true,
          "storingCopy": true,
          "reproducing": true,
          "distributing": false,
          "loaning": false,
          "selling": false,
          "renting": false,
          "furtherLicensing": false,
          "leasing": false
        },
        "dataStream": false,
        "personalData": false,
        "pricingModel": {
          "paymentType": "one-time purchase",
          "pricingModelName": "string",
          "basicPrice": 125.68,
          "currency": "$",
          "fee": 6.28,
          "hasPaymentOnSubscription": {
            "paymentOnSubscriptionName": "string",
            "paymentType": "string",
            "timeDuration": "string",
            "description": "string",
            "repeat": "string",
            "hasSubscriptionPrice": 0
          },
          "hasFreePrice": {
            "hasPriceFree": false
          }
        },
        "dataExchangeAgreement": {
          "orig": "{\"kty\":\"EC\",\"crv\":\"P-256\",\"x\":\"4sxPPpsZomxPmPwDAsqSp94QpZ3iXP8xX4VxWCSCfms\",\"y\":\"8YI_bvVrKPW63bGAsHgRvwXE6uj3TlnHwoQi9XaEBBE\",\"alg\":\"ES256\"}",
          "dest": "{\"kty\":\"EC\",\"crv\":\"P-256\",\"x\":\"6MGDu3EsCdEJZVV2KFhnF2lxCRI5yNpf4vWQrCIMk5M\",\"y\":\"0OZbKAdooCqrQcPB3Bfqy0g-Y5SmnTyovFoFY35F00N\",\"alg\":\"ES256\"}",
          "encAlg": "A256GCM",
          "signingAlg": "ES256",
          "hashAlg": "SHA-256",
          "ledgerContractAddress": "0x7B7C7c0c8952d1BDB7E4D90B1B7b7C48c13355D1",
          "ledgerSignerAddress": "0x17bd12C2134AfC1f6E9302a532eFE30C19B9E903",
          "pooToPorDelay": 10000,
          "pooToPopDelay": 20000,
          "pooToSecretDelay": 150000
        },
        "signatures": {
           "providerSignature": "eyJhbGciOiJQUzM4NCIsImtpZCI6ImJpbGJvLmJhZ2dpbnNAaG9iYml0b24uZXhhbXBsZSJ9.SXTigJlzIGEgZGFuZ2Vyb3VzIGJ1c2luZXNzLCBGcm9kbywgZ29pbmcgb3V0IHlvdXIgZG9vci4gWW91IHN0ZXAgb250byB0aGUgcm9hZCwgYW5kIGlmIHlvdSBkb24ndCBrZWVwIHlvdXIgZmVldCwgdGhlcmXigJlzIG5vIGtub3dpbmcgd2hlcmUgeW91IG1pZ2h0IGJlIHN3ZXB0IG9mZiB0by4.cu22eBqkYDKgIlTpzDXGvaFfz6WGoz7fUDcfT0kkOy42miAh2qyBzk1xEsnk2IpN6tPid6VrklHkqsGqDqHCdP6O8TTB5dDDItllVo6_1pcbUrhiUSMxbbXUvdvWXzg-UD8biiReQFlfz28zGWVsdiNAUf8ZnyPEgVFn442ZdNqiVJRmBqrYRXe8P_ijQ7p8Vdz0TTrxUeT3lm8d9shnr2lfJT8ImUjvAA2Xez2Mlp8cBE5awDzT0qI0n6uiP1aCN_2_jLAeQTlqRHtfa64QQSUmFAAjVKPbByi7xho0uTOcbH510a6GYmJUAfmWjwZ6oD4ifKo8DYM-X72Eaw",
          "consumerSignature": "eyJhbGciOiJQUzM4NCIsImtpZCI6ImJpbGJvLmJhZ2dpbnNAaG9iYml0b24uZXhhbXBsZSJ9.SXTigJlzIGEgZGFuZ2Vyb3VzIGJ1c2luZXNzLCBGcm9kbywgZ29pbmcgb3V0IHlvdXIgZG9vci4gWW91IHN0ZXAgb250byB0aGUgcm9hZCwgYW5kIGlmIHlvdSBkb24ndCBrZWVwIHlvdXIgZmVldCwgdGhlcmXigJlzIG5vIGtub3dpbmcgd2hlcmUgeW91IG1pZ2h0IGJlIHN3ZXB0IG9mZiB0by4.cu22eBqkYDKgIlTpzDXGvaFfz6WGoz7fUDcfT0kkOy42miAh2qyBzk1xEsnk2IpN6tPid6VrklHkqsGqDqHCdP6O8TTB5dDDItllVo6_1pcbUrhiUSMxbbXUvdvWXzg-UD8biiReQFlfz28zGWVsdiNAUf8ZnyPEgVFn442ZdNqiVJRmBqrYRXe8P_ijQ7p8Vdz0TTrxUeT3lm8d9shnr2lfJT8ImUjvAA2Xez2Mlp8cBE5awDzT0qI0n6uiP1aCN_2_jLAeQTlqRHtfa64QQSUmFAAjVKPbByi7xho0uTOcbH510a6GYmJUAfmWjwZ6oD4ifKo8DYM-X72Eaw"
        }
      }

     chai.request('http://localhost:3333')
        .post('/create_agreement_raw_transaction/0xC6b8cf76BD7078e56C6CE8C357dD91caeEa70170')
        .send(agreement)
        .end((err, res) => {
              should.exist(res.body);
              res.should.have.status(200);
              res.body.should.be.a('object');
              // res.body.should.have.property('errors');
              // res.body.errors.should.have.property('pages');
              // res.body.errors.pages.should.have.property('kind').eql('required');
              console.log(res.body)
              rawTransaction = res.body
              done();

       });
  });

it('it should sign the raw transaction', (done) => {
  chai.request('http://localhost:29170')
      .post('/identities/did:ethr:i3m:0x0243cc9dbc7157ee12ce1898ac0c49b366822f32d57bc108e127f45b6c43a57e90/sign')
      .send(
          {
          "type": "Transaction",
          "data": 
              rawTransaction
          }
          )
      .end((err, res) => {
        console.log(res.body)
            should.exist(res.body);
            res.should.have.status(200);
            res.body.should.be.a('object');
            // res.body.should.have.property('errors');
            // res.body.errors.should.have.property('pages');
            // res.body.errors.pages.should.have.property('kind').eql('required');
            console.log(res.body)
            signedTransaction=res.body.signature

            let signed_transaction = 
            {
            signedTransaction
        }
       chai.request('http://localhost:3333')
          .post('/deploy_signed_transaction')
          .send({
            "signedTransaction": signedTransaction
          })
          .end((err, res) => {
                should.exist(res.body);
                res.should.have.status(200);
                res.body.should.be.a('object');
                // res.body.should.have.property('errors');
                // res.body.errors.should.have.property('pages');
                // res.body.errors.pages.should.have.property('kind').eql('required');
                console.log(res.body)
                rawTransaction = res.body
                done();
      
         });
        done();
      });

     
  });

  
it('it should GET the agreements of the consumer', (done) => {
  chai.request('http://localhost:3333')
  .post('/check_agreements_by_consumer')
  .send(
      {
      "public_keys": ["{\"kty\":\"EC\",\"crv\":\"P-256\",\"x\":\"6MGDu3EsCdEJZVV2KFhnF2lxCRI5yNpf4vWQrCIMk5M\",\"y\":\"0OZbKAdooCqrQcPB3Bfqy0g-Y5SmnTyovFoFY35F00N\",\"alg\":\"ES256\"}"],
      "active": 
          false
      }
      )
      .end((err, res) => {
            should.exist(res.body);
            res.should.have.status(200);
            res.body.should.be.a('array');
            expect(res.body[0]).to.have.property("state").to.equal(2)
        done();
      })
})

it('it should GET the agreements of the provider', (done) => {
  chai.request('http://localhost:3333')
  .post('/check_agreements_by_provider')
  .send(
      {
      "public_keys": ["{\"kty\":\"EC\",\"crv\":\"P-256\",\"x\":\"4sxPPpsZomxPmPwDAsqSp94QpZ3iXP8xX4VxWCSCfms\",\"y\":\"8YI_bvVrKPW63bGAsHgRvwXE6uj3TlnHwoQi9XaEBBE\",\"alg\":\"ES256\"}"],
      "active": 
          false
      }
      )
      .end((err, res) => {
            should.exist(res.body);
            res.should.have.status(200);
            res.body.should.be.a('array');
            expect(res.body[0]).to.have.property("state").to.equal(2)
        done();
      })
})

it('it should GET active agreements', (done) => {
  chai.request('http://localhost:3333')
      .get('/check_active_agreements')
      .end((err, res) => {
            should.exist(res.body);
            res.should.have.status(200);
            res.body.should.be.a('array');
            expect(res.body[0]).to.have.property("state").to.equal(0)
        done();
      })
})

// it('it should deploy the signed transaction', (done) => {
//   let signed_transaction = 
//       {
//       signedTransaction
//   }
//  chai.request('http://localhost:3333')
//     .post('/deploy_signed_transaction')
//     .send({
//       "signedTransaction": signedTransaction
//     })
//     .end((err, res) => {
//           should.exist(res.body);
//           res.should.have.status(200);
//           res.body.should.be.a('object');
//           // res.body.should.have.property('errors');
//           // res.body.errors.should.have.property('pages');
//           // res.body.errors.pages.should.have.property('kind').eql('required');
//           console.log(res.body)
//           rawTransaction = res.body
//           done();

//    });
// });

it('it should decrypt notification', async () => {
      
  // "keyPair": {
  //     "publicJwk": "{\"alg\":\"ES256\",\"crv\":\"P-256\",\"kty\":\"EC\",\"x\":\"XNCMLZWLMb8VVpU_xHd8el9xkR7F5FMRNMW8If6P_KQ\",\"y\":\"obOu65Q7bSEEInHhanpt5cl4f-goW_iSoXtzMzacksM\"}",
  //     "privateJwk": "{\"alg\":\"ES256\",\"crv\":\"P-256\",\"d\":\"E3DQTLPSSsJN0WS1v3XziVKq3TnoPnOa2cKW64FZiT8\",\"kty\":\"EC\",\"x\":\"XNCMLZWLMb8VVpU_xHd8el9xkR7F5FMRNMW8If6P_KQ\",\"y\":\"obOu65Q7bSEEInHhanpt5cl4f-goW_iSoXtzMzacksM\"}"
  //   }

const uint8Decrypted = await nonRepudiationLibrary.jweDecrypt(
    "eyJhbGciOiJFQ0RILUVTIiwiZW5jIjoiQTI1NkdDTSIsImVwayI6eyJ4IjoiWWZGOW5BaElwem01M2k2M0NpOHNzaTAtMElPMWp3ZzZQN3ZhRXF4VHloayIsImNydiI6IlAtMjU2Iiwia3R5IjoiRUMiLCJ5IjoibEc0R0hFeEN3NHluQ0lfODNNS2M3T2JSNlRrVXE5UFR2N20xOEdGdnZEbyJ9fQ..93IB7CiTB7VZxCnq.p5WtwvMC42O-1WoD7uuSVHiJD4YeIQrdFJ5_f4CGOw1oNWA1RMVx73lD-VHReYANzNRcsPBTTY0.pXAJ4YBwHIPAHNYc85iM2Q",
 {"alg":"ES256","crv":"P-256","d":"E3DQTLPSSsJN0WS1v3XziVKq3TnoPnOa2cKW64FZiT8","kty":"EC","x":"XNCMLZWLMb8VVpU_xHd8el9xkR7F5FMRNMW8If6P_KQ","y":"obOu65Q7bSEEInHhanpt5cl4f-goW_iSoXtzMzacksM"})
const strDecrypted = new TextDecoder().decode(new Uint8Array(uint8Decrypted.plaintext))
const jsonDecrypted = JSON.parse(strDecrypted)

console.log('Decrypted: ', jsonDecrypted)

const uint8Decrypted2 = await nonRepudiationLibrary.jweDecrypt(
  "eyJhbGciOiJFQ0RILUVTIiwiZW5jIjoiQTI1NkdDTSIsImVwayI6eyJ4IjoicnlhUzBmdDdaelo5N25pWVJ6Z0VpeUNqUVJMWk11djhNYTZnaHUycWJLQSIsImNydiI6IlAtMjU2Iiwia3R5IjoiRUMiLCJ5IjoiWnZ4dm9HakFPejczd3RpWndyU0xxUEM2ZjhwVUJhREdLQWc3M2JCT2RPSSJ9fQ..kmfNcsp-Th8OPvl8.DuRvP4DTgJSb3qiBV9VX_PItH1XSPffEHOkyAj16Zih6JBJlopaIlGRFlcLpnI4Ol8jtz9QTG-voDg.0b0vqlwr1BPCUqVzFYi39A",
  {"alg":"ES256","crv":"P-256","d":"BciQbSgMcogZwV2E31MZNXrIh-smQ8hiXmX43726EaU","kty":"EC","x":"1bUMLq4TBXlXYoDHrdKwGB4JNpuwIdrWOWeFQdAyThw","y":"ZrU4SnYjBgY957lQPiBZMmsSv7WUdly-Tkav8zd8nNE"})
const strDecrypted2 = new TextDecoder().decode(new Uint8Array(uint8Decrypted2.plaintext))
const jsonDecrypted2 = JSON.parse(strDecrypted2)

console.log('Decrypted: ', jsonDecrypted2)

})
 })


 /*
  const api = await walletApi();
        const info = await api.identities.info({ did: user.DID });
        const ethereumAddress = info.addresses[0];

        fetch('/api/offerings/createAgreement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                template: data.template,
                senderAddress: ethereumAddress
            })
        }).then(res => {
            res.json().then(async rawTransaction => {
                const body = {
                    type: 'Transaction',
                    data: rawTransaction
                };
                const signRes = await api.identities.sign({ did: user.DID }, body);

                fetch('/api/offerings/deployTransaction', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(signRes),
                }).then(res => {
                    res.json().then(deployRes => {
                        console.log('transaction deployed', deployRes);

                        fetch('/api/notifications', {
                            method: 'DELETE',
                            body: JSON.stringify({ notificationId: id })
                        }).then(() => {
                            router.back();
                        });
                    });
                });
            });
        });
    }

*/



  