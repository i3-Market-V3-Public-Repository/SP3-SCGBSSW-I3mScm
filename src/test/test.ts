
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

chai.use(chaiHttp);


const should = chai.should()

const server = require('../index')

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
                  should.exist(res.body);
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  // res.body.should.have.property('errors');
                  // res.body.errors.should.have.property('pages');
                  // res.body.errors.pages.should.have.property('kind').eql('required');
                  console.log(res.body)
                  signedTransaction=res.body.signature
              done();
            });

           
        });
    
    it('it should deploy the signed transaction', (done) => {
        let signed_transaction = 
            {
            signedTransaction
        }
       chai.request('http://localhost:3333')
          .post('/deploy_signed_transaction')
          .send({
            "signed_transaction": signedTransaction
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
    });
})




// const sessionObjJson = JSON.stringify({"masterKey":{"from":{"name":"Initiator"},"to":{"name":"Wallet desktop"},"port":29170,"na":"RunniT1FSJnBItvpdkgU2Q","nb":"2sYEK5XFcE2BaZiYVSbbZQ","secret":"Sqrp4C_hVsOnkzhl6QcMFrtFsUaxH7VkAlyduJH5pKY"},"code":"65794a68624763694f694a6b615849694c434a6c626d4d694f694a424d6a553252304e4e496e302e2e5f6a4e766a346c6c5954714d455a5a4e2e5a416a365937534e7177713573757a53654d386144353953367279475147316c5a59314643715a354d4655494a79614b69634835646c772d7a467262755261704e57705f44706d365f7a75465f534a5a5f61352d57744a7051645833584e63453836525f57436372697665544e6a6676714b44673247735a32655f504530455a37684956656f56497646594c5f774d79367170507233355f5a594953324a46664b387067595177336f455a526d6759333251494f374f4b4f30576c5a62746b586e54774d7a6467696a4d546b46484156626c356a2d4c4f697759757676665f415f644a38687159426138774955535461774339426f5669665444717044626d436d74716861344d4b6473315a3757476d62616e6d52536a65636169446f55387a346c7a6a513834584f575071315475784a6e5037384f615851474c656c6e78447977345757454433704b554e446c6a535349706d4c3446387a7568496f2d646b6d4355694464686f364b7777715439495a70327658316a43555a687474672e664962715772424d4c53444f715a2d45394935794177"})//process.env.I3M_WALLET_SESSION_TOKEN //as string

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
//         const privateKey = "0x1dcc51a138fe79d3d49e131d8c7e104b712988813f073c25db95fc4f7ed4a192" //process.env.PRIVATE_KEY
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



  