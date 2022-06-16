const chai = require('chai');
const expect = chai.expect
const should = chai.should()
const chaiHttp = require('chai-http')
const server = require('../index')

chai.use(chaiHttp)

describe('/First Test Collection', function() {

    // it('test default api',function(done) {
    //     //actual test content in here
    //     console.log(server)
    //     chai.request(server)
    //     .get('/check_active_agreements')
    //     .end((err,res) => {
    //         res.should.have.status(200)
    //         done()
    //     })
    // })
        

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
                    "DataOfferingDescription": {
                      "dataOfferingId": "627cebbbd348c942dab514e3",
                      "provider": "siemens",
                      "description": "This is a P&ID diagram of the Lube Oil supply Unit. It contains the lastest and approved version of the document and represents the as-build status of the system.",
                      "title": "P&ID diagram for 1st stage Lube Oil Supply Unit",
                      "category": "Manufacturing",
                      "isActive": true
                    },
                    "Purpose": "NA",
                    "hasParties": {
                      "Parties": {
                        "dataProvider": "siemens", 
                        "dataConsumer": "consumer12"
                      }
                    },
                    "hasDuration": {
                      "Duration": {
                        "creationDate": 1653646600,
                        "startDate": 1653646889,
                        "endDate": 35660403394
                      }
                    },
                    "hasDuties/Obligations": {
                      "Duties/Obligations": {
                        "qualityOfData": 10,
                        "characteristics": "enum",
                        "dataAvailability": true
                      }
                    },
                    "hasIntendedUse": {
                      "IntendedUse": {
                        "processData": true,
                        "shareDataWithThirdParty": true,
                        "editData": true
                      }
                    },
                    "hasLicenseGrant": {
                      "LicenseGrant": {
                        "copyData": true,
                        "transferable": true,
                        "exclusiveness": false,
                        "revocable": true
                      }
                    },
                    "DataStream": false,
                    "DataExchangeAgreement": {
                      "orig": "{\"kty\":\"EC\",\"crv\":\"P-256\",\"x\":\"4sxPPpsZomxPmPwDAsqSp94QpZ3iXP8xX4VxWCSCfms\",\"y\":\"8YI_bvVrKPW63bGAsHgRvwXE6uj3TlnHwoQi9XaEBBE\",\"alg\":\"ES256\"}",
                      "dest": "{\"kty\":\"EC\",\"crv\":\"P-256\",\"x\":\"6MGDu3EsCdEJZVV2KFhnF2lxCRI5yNpf4vWQrCIMk5M\",\"y\":\"0OZbKAdooCqrQcPB3Bfqy0g-Y5SmnTyovFoFY35F00M\",\"alg\":\"ES256\"}",
                      "encAlg": "A256GCM",
                      "signingAlg": "ES256",
                      "hashAlg": "SHA-256",
                      "ledgerContractAddress": "0x7B7C7c0c8952d1BDB7E4D90B1B7b7C48c13355D1",
                      "ledgerSignerAddress": "0x17bd12C2134AfC1f6E9302a532eFE30C19B9E903",
                      "pooToPorDelay": 10000,
                      "pooToPopDelay": 20000,
                      "pooToSecretDelay": 150000
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

