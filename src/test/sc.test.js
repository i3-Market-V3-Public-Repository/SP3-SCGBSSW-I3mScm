const chai = require('chai');
const expect = chai.expect
const should = chai.should()
const chaiHttp = require('chai-http')
const server = require('../index')
const nrp = require()

chai.use(chaiHttp)

describe('/First Test Collection', function() {

    it('test default api',function(done) {
        //actual test content in here
        // console.log(server)
        // chai.request(server)
        // .get('/check_active_agreements')
        // .end((err,res) => {
        //     res.should.have.status(200)
        //     done()
        // })

        //"eyJhbGciOiJFQ0RILUVTIiwiZW5jIjoiQTI1NkdDTSIsImVwayI6eyJ4IjoiQ2VueUJjclg5elFTTlVuNVlBZzRqZ2UtS20wX0ZwcjZzTkh5MXY1UGkwcyIsImNydiI6IlAtMjU2Iiwia3R5IjoiRUMiLCJ5IjoiM3g1ZDAzNW5kOEg3MGlTUTVNam9aT0hjcldqRUlwMENZODRUejF1SndSMCJ9fQ..ZnocS9ZO0YdqpvOc.Kl90QWPIG8Oor9hf_cyfwzGcld3_1zfUzvLEraOt2wcgZPvxYv7Pd4Ym3E4H0WcIpcYPUNDKZKsimQ.-Hwh0OJSs850_h6aP5yLxA"
    })
        

    it('it should GET active agreements', (done) => {
        chai.request('http://localhost:3333')
            .get('/check_active_agreements')
            .end((err, res) => {
                  should.exist(res.body);
                  res.should.have.status(200);
                  res.body.should.be.a('array');
                  expect(res.body[0]).to.have.property("state").to.equal(1)
              done();
            })
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
              .post('/create_agreement_raw_transaction/0xCe02Fe0c65285AC850D2E9B6494446E59f0B48e6')
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
            .post('/identities/did:ethr:i3m:0x02b6b4e416dae94b00729fe82bdce4a8480e457be2f177a82b5eb6128ece05b35c/sign')
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

        // describe('/POST/identities/did/sign', () => {
        //     it('it should sign the raw transaction', (done) => {
        //       chai.request('http://localhost:3333')
        //           .post('/create_agreement_raw_transaction/0xCe02Fe0c65285AC850D2E9B6494446E59f0B48e6')
        //           .send(rawTransaction)
        //           .end((err, res) => {
        //                 should.exist(res.body);
        //                 res.should.have.status(200);
        //                 res.body.should.be.a('object');
        //                 // res.body.should.have.property('errors');
        //                 // res.body.errors.should.have.property('pages');
        //                 // res.body.errors.pages.should.have.property('kind').eql('required');
        //             done();
        //           });
    
        //     });
    

        //http://localhost:29170/identities/did%3Aethr%3Arinkeby%3A0x031bee96cfae8bad99ea0dd3d08d1a3296084f894e9ddfe1ffe141133e81ac5863/sign
  
    //})

