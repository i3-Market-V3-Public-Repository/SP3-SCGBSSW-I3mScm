
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



describe('/GET contractual params', () => {
 
  it('it should retrieve the contractual parameters for an offering id', (done) => {
    
    chai.request('http://localhost:3333')
        .get('/template/63f779b64fdbcb456eff39ac')
        .end((err, res) => {
              should.exist(res.body);
              res.should.have.status(200);
              res.body.should.be.a('object');
              done();

       });
  });
});



describe('Get contractual parameters, create and retrieve agreements ', () => {
  
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
        .then(async res => {
          //(async rawTransaction => {
           console.log(res.body)
            await chai.request('http://localhost:29170')
                .post('/identities/did%3Aethr%3Ai3m%3A0x0243cc9dbc7157ee12ce1898ac0c49b366822f32d57bc108e127f45b6c43a57e90/sign')
                  .send(
                      {
                      "type": "Transaction",
                      "data": 
                          res.body
                      }
                      )
                  res.should.have.status(200);
                })
                .then(async res => {
                  //res.body.then(async signedTransaction => {
                  console.log(res)
                  await chai.request('http://localhost:3333')
                  .post('/deploy_signed_transaction')
                  .send({
                    "signedTransaction": signedTransaction
                  })
                  .end((err, res) => {
                        should.exist(res.body);
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        console.log(res.body)
                        rawTransaction = res.body
                        done();
              
                 });
                
              
          });
         });
 });


   
  
// it('it should sign the raw transaction', (done) => {


//   chai.request('http://localhost:29170')
//       .post('/identities/did:ethr:i3m:0x0243cc9dbc7157ee12ce1898ac0c49b366822f32d57bc108e127f45b6c43a57e90/sign')
//       .send(
        
//           {
//           "type": "Transaction",
//           "data": 
//               rawTransaction
//           }
//           )
//       .end((err, res) => {
//         console.log(res.body)
//             should.exist(res.body);
//             res.should.have.status(200);
//             res.body.should.be.a('object');
//             // res.body.should.have.property('errors');
//             // res.body.errors.should.have.property('pages');
//             // res.body.errors.pages.should.have.property('kind').eql('required');
//             console.log(res.body)
//             signedTransaction=res.body.signature

//             let signed_transaction = 
//             {
//             signedTransaction
//         }
//        chai.request('http://localhost:3333')
//           .post('/deploy_signed_transaction')
//           .send({
//             "signedTransaction": signedTransaction
//           })
//           .end((err, res) => {
//                 should.exist(res.body);
//                 res.should.have.status(200);
//                 res.body.should.be.a('object');
//                 // res.body.should.have.property('errors');
//                 // res.body.errors.should.have.property('pages');
//                 // res.body.errors.pages.should.have.property('kind').eql('required');
//                 console.log(res.body)
//                 rawTransaction = res.body
//                 done();
      
//          });
//         done();
//       });

     
//   });

  
it('it should GET the agreements of the consumer', (done) => {

  chai.request('http://localhost:3333')
  .post('/check_agreements_by_consumer')
  .send(
      {
      "public_keys": [
      "{\"alg\":\"ES256\",\"crv\":\"P-256\",\"kty\":\"EC\",\"x\":\"XBBs-nJuQxQCsDaG7sdOhOY3u3llxOpvlGmgk1za2gY\",\"y\":\"mGruvvG8W2XMYxBWo3nmKOCURS2fTOWELxV_RmJWFGo\"}",
      "{\"alg\":\"ES256\",\"crv\":\"P-256\",\"kty\":\"EC\",\"x\":\"GDTUYKFdOgo8zb7Wr-V22EPwmREiBlE09L1THz6ThkE\",\"y\":\"0sA0gkzzeIyXXm9lZLOyHHyV-56PPfix0nT214GHzxU\"}",
      "{\"alg\":\"ES256\",\"crv\":\"P-256\",\"kty\":\"EC\",\"x\":\"jZ_SXtH47E3iBBAWNN7Vgsl4kPNwF4MQKcjJ89xEdiA\",\"y\":\"xp73nfZ7DNl3i2xHOmRROSIWMcjEIn5U7IfH0LkiyNU\"}",
      "{\"alg\":\"ES256\",\"crv\":\"P-256\",\"kty\":\"EC\",\"x\":\"tHlJNWtq2sQEOk670R8Wq_45BsSa0CHR0-4b0KIg4Vg\",\"y\":\"vqA9-E2CfMBA-kHv_bHasAzGvt4N3CwdLpHnIRWajM8\"}",
      "{\"alg\":\"ES256\",\"crv\":\"P-256\",\"kty\":\"EC\",\"x\":\"gHpWvNkogRz3ZLrNo3xBPFH6aaNGLn69LkML5_EDr_Y\",\"y\":\"0U3EzB3A_aF6ngInYFznNGexAGLDvB5iQLqmrfqJs_8\"}",
      "{\"alg\":\"ES256\",\"crv\":\"P-256\",\"kty\":\"EC\",\"x\":\"y0t2CXh1yVhw1Ogy8HV2Lr6vXbaBS3T2htKszUv2NhQ\",\"y\":\"5xedYxrnP1XmaN5jnZU3nTy66s6_QuTeiUwywtLjGDE\"}",
      "{\"alg\":\"ES256\",\"crv\":\"P-256\",\"kty\":\"EC\",\"x\":\"r9Ef45L_QKr_K3SRJx9fHh1FCtFJRYqUoW09vpEdnrA\",\"y\":\"gAOR0YIr6IiY4VmlHObCDE_Zk0WD5zGNTpbTYLmGlhQ\"}",
      "{\"alg\":\"ES256\",\"crv\":\"P-256\",\"kty\":\"EC\",\"x\":\"mIurNnMlVdsQuxtSoLZg2aOH0RSWmMImEuovavFM1bc\",\"y\":\"OB-PsqSwOcyKF3wL6RTEvsN9U3AiDfLEVjOwbNOSSWU\"}",
      "{\"alg\":\"ES256\",\"crv\":\"P-256\",\"kty\":\"EC\",\"x\":\"3dx5Iqz0_bd_-JqGCfIwfNsERRdDL4ZyTt6fNMxOMLk\",\"y\":\"eJODFA9XUzjBT3KYkLC4efggMbEUYWN6g6DmIqG3TS8\"}",
      "{\"alg\":\"ES256\",\"crv\":\"P-256\",\"kty\":\"EC\",\"x\":\"WW8uD9neFiG8pLBnFoaz9mdONkQZO7-TGbh4NcymMME\",\"y\":\"aQ_yeDr86tAn4lv8L_yVy-U233aw58ftMjXZFrExhgE\"}",
      "{\"alg\":\"ES256\",\"crv\":\"P-256\",\"kty\":\"EC\",\"x\":\"-KVgDFtTt2Ax89Ik4fk4RGu5j2Sj9AL-9h5-ameDLWA\",\"y\":\"5IVEjYaomr3S7HJDOACnd3zHJyqov2lTbUh0gn4iiWc\"}",
      "{\"alg\":\"ES256\",\"crv\":\"P-256\",\"kty\":\"EC\",\"x\":\"5n_UyliesCROg_q3-IkljLEuMuBcCbxhpK4swyXy7wA\",\"y\":\"A4ojyZ82gVrMo8vObM520hlGCnWDfR3_GDlSBE9TZYs\"}",
      "{\"alg\":\"ES256\",\"crv\":\"P-256\",\"kty\":\"EC\",\"x\":\"FJ_Wv17oLfLOtnVrnx7jhN62WIqBfv6dw1gkhy1mNgs\",\"y\":\"frNX_DBWTnxbVRaKcSBB7ssBU7sFMaP6BghBsum9Oq0\"}",
      "{\"alg\":\"ES256\",\"crv\":\"P-256\",\"kty\":\"EC\",\"x\":\"Z3_jgnKI6T1geW-tniCEYhW2ODgTljbi2nM4u_SU5-Q\",\"y\":\"3D7c0KymWIzgu-2v7WxJgRkEVJmC5f_MU-w9e-mOmHY\"}",
      "{\"alg\":\"ES256\",\"crv\":\"P-256\",\"kty\":\"EC\",\"x\":\"7VONxhvPHsDdwD9CgDQe4ow-Ubf-5c22lXrIhf6xO5E\",\"y\":\"b08Xcjgl6T_y0xsRZnlEB9BcPwbm21SBakQpTlTvQRI\"}",
      "{\"alg\":\"ES256\",\"crv\":\"P-256\",\"kty\":\"EC\",\"x\":\"_UfazrNTnTqISEp8-mchTN1DccrpCQJKPDPvjrk5PAs\",\"y\":\"Sjg8q9i_wJER8iWjoUInOdjHrnbu0SydDLWLrg0wNHM\"}",
      "{\"alg\":\"ES256\",\"crv\":\"P-256\",\"kty\":\"EC\",\"x\":\"bHQ4TxMIpF5aL2iSHPzX6ZRc8JQEDaqfefTo6UY3bbs\",\"y\":\"ABakPpULKsnIcW-9PRKZDz0YkOC1kcWdpH3XNjuU8ac\"}",
      "{\"alg\":\"ES256\",\"crv\":\"P-256\",\"kty\":\"EC\",\"x\":\"BS439hfBLYEuNRw0aLtW8r7vTfIpwTUZUFpgIiV5afw\",\"y\":\"lD7I6zsHfS0aqspya5QAc3W3aqKwDum94unbz4VY26A\"}",
      "{\"alg\":\"ES256\",\"crv\":\"P-256\",\"kty\":\"EC\",\"x\":\"MH27viCKFdUgFdOKn6OsUX4D6067RscUNvcTVdngkZk\",\"y\":\"EpbqJrG5PI_Tn1GyHclZ0k3uv_eVqFo-qFUzHZP8s9g\"}"
    ],
      "active": 
          false
      }
      )
  .end((err, res) => {
            should.exist(res.body);
            res.should.have.status(200);
            res.body.should.be.a('array');
            //expect(res.body[0]).to.have.property("state").to.equal(0)
            done();
  })
})

it('it should retrieve the agreements of the provider', (done) => {
  chai.request('http://localhost:3333')
  .post('/check_agreements_by_provider')
  .send(
      {
      "public_keys": [  
      "{\"alg\":\"ES256\",\"crv\":\"P-256\",\"kty\":\"EC\",\"x\":\"94CnWtsUwXXvYhijEoR8XcV-h7rVQeIXpFiu4xu2sKg\",\"y\":\"M8F1P7_fmFYLT2XK2JM97Xy7wZcqJ44kapHokicI3JU\"}",
      "{\"kty\":\"EC\",\"crv\":\"P-256\",\"x\":\"6MGDu3EsCdEJZVV2KFhnF2lxCRI5yNpf4vWQrCIMk5M\",\"y\":\"0OZbKAdooCqrQcPB3Bfqy0g-Y5SmnTyovFoFY35F00N\",\"alg\":\"ES256\"}",
      "{\"alg\":\"ES256\",\"crv\":\"P-256\",\"kty\":\"EC\",\"x\":\"O4GNSCOcLvAjptN6U4YUkgFPpyjOzXHBzRR6BC6wU9s\",\"y\":\"PPBrZ9MmMCDrsJPnI3NUs8DPPiVTHsIA0ktvkQm5N80\"}",
      "{\"alg\":\"ES256\",\"crv\":\"P-256\",\"kty\":\"EC\",\"x\":\"xNFZo3hgzNvR4I7Sv2Q3iNpftV0r0VjRsJH-qF8gu6w\",\"y\":\"50YZnevH6ix7_99RmP_s-yR8faJbdKB_LPI5031IgcM\"}",
      "{\"alg\":\"ES256\",\"crv\":\"P-256\",\"kty\":\"EC\",\"x\":\"94CnWtsUwXXvYhijEoR8XcV-h7rVQeIXpFiu4xu2sKg\",\"y\":\"M8F1P7_fmFYLT2XK2JM97Xy7wZcqJ44kapHokicI3JU\"}"
      ],
      "active": 
          false
      }
      )
      .end((err, res) => {
            should.exist(res.body);
            res.should.have.status(200);
            res.body.should.be.a('array');
            //expect(res.body[0]).to.have.property("state").to.equal(0)
        done();
      })
})


it('it should GET the agreements of a data offering', (done) => {
  chai.request('http://localhost:3333')
  .get('/check_agreements_by_data_offering/692534rt36a6d550a177a3f2')
      .end((err, res) => {
            should.exist(res.body);
            res.should.have.status(200);
            res.body.should.be.a('array');
          
        done();
      })
})


it('it should decrypt notification', async () => {

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

      const uint8Decrypted4 = await nonRepudiationLibrary.jweDecrypt(
      "eyJhbGciOiJFQ0RILUVTIiwiZW5jIjoiQTI1NkdDTSIsImVwayI6eyJ4IjoieVQzbmlDS1R2RjI3bTRXQWJ5U1FYRFB3MlVHaXJyUGloVGVSZ0RKUW50VSIsImNydiI6IlAtMjU2Iiwia3R5IjoiRUMiLCJ5IjoidjdmTXBUYjIzSWRKVmw2Nkxhdnp1NDh0Q25GeFUtSXhXam5yZnZKZVRrbyJ9fQ..h4fttL5Jdx2X1Nxy.BWaJaOevWPiEtTfUZRqZNnLxZtOWbtUMjXTtYmdQwQXeaL4GH1GflsQ-WyR3MbfrfP4F6gr_sEk.Nb_6-6NtwBNPMYRgxw5SxA",
      {"alg":"ES256","crv":"P-256","d":"JFRsB1tkDhvBaMzgJYe1WVCcrt1Op5xLhggKLCONa1I","kty":"EC","x":"EDGhnn5i5Jlic0UpNtd1MA90S1RSAxjwyj5ThAo0R_E","y":"m_voTJn1_truFTg02I6yUEvtPXyrqwD9prbdXI1s48c"})
      const strDecrypted4 = new TextDecoder().decode(new Uint8Array(uint8Decrypted4.plaintext))
      const jsonDecrypted4 = JSON.parse(strDecrypted4)

      console.log('Decrypted: ', jsonDecrypted4)

})



 
 




  