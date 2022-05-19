import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';
import _fetch = require('isomorphic-fetch')
import { ConvertToTemplate, Template } from "../template";
import { ConvertToStaticParametersTemplate, StaticParametersTemplate } from "../staticParametersTemplate";
import { getTemplate, /*createAgreements,*/ processTemplate, formatAgreement, notify, getState, formatTransaction, formatTransactionReceipt, parseHex } from "../common";
import { ethers } from 'ethers';
import * as path from 'path';
import * as objectSha from 'object-sha'

import * as nonRepudiationLibrary from '@i3m/non-repudiation-library'
import { DisputeRequestPayload } from '@i3m/non-repudiation-library';


const dotenv = require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

const router = express.Router()
router.use(bodyParser.json());

const privateKey = String(process.env.PRIVATE_KEY)
const providerAddress = String(process.env.PROVIDER_ADDRESS)

const contractObj = require('../../DataSharingAgreement.json');
const contractAddress = contractObj.address;
const contractABI = contractObj.abi;

const provider = new ethers.providers.JsonRpcProvider(providerAddress);
//const signer = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, contractABI, provider);

const gasLimit = 12500000;

const jsonTemplateFile = require('../../template.json');

export default async (): Promise<typeof router> => {

    router.get('/openapi', (req, res) => {
        let oas = fs.readFileSync('./openapi/openapi.json', { encoding: 'utf-8', flag: 'r' })
        res.send(oas)
    })

    router.get('/template/:template_id', async (req, res) => {
        
        let staticParameters: any = await _fetch(`${process.env.BACKPLANE_URL}/semantic-engine/api/registration/contract-parameter/${req.params.template_id}/offeringId`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        }).catch((error: any) => {
            console.error('Error:', error);
        })

        const staticParametersJson = await staticParameters.json();

        let parsedToJson = JSON.parse(JSON.stringify(staticParametersJson))

        if (parsedToJson != undefined) {

            try {
                // Add static parameters to JSON template
                const staticTemplate: StaticParametersTemplate = ConvertToStaticParametersTemplate.toStaticParametersTemplate(JSON.stringify(parsedToJson))
                const jsonTemplate: Template = ConvertToTemplate.toTemplate(JSON.stringify(jsonTemplateFile))

                const template: Template = getTemplate(jsonTemplate, staticTemplate)

                const response = JSON.parse(JSON.stringify(template))

                res.status(200).send(response)

            } catch (error) {
                if (error instanceof Error) {
                    console.log(`${error.message}`)
                    res.status(500).send({ name: `${error.name}`, message: `${error.message}` })
                }

            }
        }
    })

    // router.post('/create_agreement', async (req ,res, next) => {
    //     try {
    //         const template = ConvertToTemplate.toTemplate(JSON.stringify(req.body))
    //         const processedTemplate = processTemplate(template)

    //         // process input data
    //         const dataOfferingId = processedTemplate.dataOfferingId
    //         const purpose = processedTemplate.purpose
    //         const providerId = processedTemplate.providerId
    //         const consumerId = processedTemplate.consumerId
    //         const dates = processedTemplate.dates
    //         const descriptionOfData = processedTemplate.descriptionOfData
    //         const intendedUse = processedTemplate.intendedUse
    //         const licenseGrant = processedTemplate.licenseGrant
    //         const dataStream = processedTemplate.dataStream

    //         const agreementId = await createAgreements(contract, dataOfferingId, purpose, providerId, consumerId, dates, descriptionOfData, intendedUse, licenseGrant, dataStream)

    //         const origin = "scm"
    //         const predefined = true
    //         const type = "agreement.pending"
    //         const message = {msg: "Agreement created"}
    //         const status = "pending"

    //         await notify(origin, predefined, type, `${consumerId}`, message, status)
    //         await notify(origin, predefined, type, `${providerId}`, message, status)

    //         res.status(200).send({agreement_id: `${agreementId}`})

    //     } catch (error) {
    //         if (error instanceof Error) {
    //              console.log(`${error.message}`)
    //              res.status(500).send({name: `${error.name}`, message: `${error.message}`})
    //         }
    //     }
    //   })

    //   router.post('/update_agreement/:agreement_id', async(req,res) => {

    //     try {
    //         const agreementId = req.params.agreement_id
    //         const template = ConvertToTemplate.toTemplate(JSON.stringify(req.body))
    //         const processedTemplate = processTemplate(template)

    //         // process input data
    //         const dataOfferingId = processedTemplate.dataOfferingId
    //         const purpose = processedTemplate.purpose
    //         const providerId = processedTemplate.providerId
    //         const consumerId = processedTemplate.consumerId
    //         const dates = processedTemplate.dates
    //         const descriptionOfData = processedTemplate.descriptionOfData
    //         const intendedUse = processedTemplate.intendedUse
    //         const licenseGrant = processedTemplate.licenseGrant
    //         const dataStream = processedTemplate.dataStream

    //         const update = await contract.updateAgreement(agreementId ,dataOfferingId, purpose, providerId, consumerId, dates, descriptionOfData, intendedUse, licenseGrant, dataStream)

    //         const origin = "scm"
    //         const predefined = true
    //         const type = "agreement.update"
    //         const message = {msg: "Agreement updated"}
    //         const status = "update"

    //         await notify(origin, predefined, type, `${consumerId}`, message, status)
    //         await notify(origin, predefined, type, `${providerId}`, message, status)

    //         res.status(200).send({msg: `Agreement with id ${agreementId} was updated`})

    //     } catch (error) {
    //         if (error instanceof Error) {
    //             console.log(`${error.message}`)
    //             res.status(500).send({name: `${error.name}`, message: `${error.message}`})
    //        } 
    //     }

    //   })

    //   router.get('/sign_agreement/:agreement_id/:consumer_id/:provider_id', async(req,res) => {

    //     try {
    //         const agreementId = req.params.agreement_id
    //         const consumerId = req.params.consumer_id
    //         const providerId = req.params.provider_id

    //         const signAgreement = await contract.signAgreement(agreementId, consumerId, {gasLimit: gasLimit});

    //         const origin = "scm"
    //         const predefined = true
    //         const type = "agreement.accepted"
    //         const message = {msg: "Agreement signed"}
    //         const status = "accepted"

    //         await notify(origin, predefined, type, `${consumerId}`, message, status)
    //         await notify(origin, predefined, type, `${providerId}`, message, status)

    //         res.status(200).send({msg: `Agreement with id ${agreementId} was signed`})
    //     } catch (error) {
    //         if(error instanceof Error){
    //             console.log(`${error.message}`)
    //             res.status(500).send({name: `${error.name}`, message: `${error.message}`})
    //         }
    //     }
    //   })

    router.get('/get_agreement/:agreement_id', async (req, res) => {

        try {

            const agreementId = req.params.agreement_id
            const agreement_length = await contract.getAgreementsLength()
            if(agreementId<agreement_length){
                const agreement = await contract.getAgreement(agreementId)
                console.log(agreement)
                const response = JSON.parse(JSON.stringify(formatAgreement(agreement)))
                res.status(200).send(response)
            }
            else{ 
                res.status(400).send('Invalid agreement id.')
        }

        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
                res.status(500).send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })


    router.get('/check_active_agreements', async (req, res) => {

        try {
            const formatedAgreements: ReturnType<typeof formatAgreement>[] = []
            const activeAgreements = await contract.checkActiveAgreements();

            activeAgreements.forEach(agreement => {

                const formatedAgreement = formatAgreement(agreement)
                console.log(formatedAgreement)
                formatedAgreements.push(formatedAgreement)
            })

            console.log("Number of active agreements: " + formatedAgreements.length)

            res.status(200).send(formatedAgreements)

        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
                res.status(500).send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

    router.get('/check_agreements_by_consumer/:consumer_id', async (req, res) => {

        try {

            const consumer_id = req.params.consumer_id
            const formatedAgreements: ReturnType<typeof formatAgreement>[] = []
            const activeAgreements = await contract.checkAgreementsByConsumer(consumer_id);

            activeAgreements.forEach(agreement => {

                const formatedAgreement = formatAgreement(agreement)
                formatedAgreements.push(formatedAgreement)
            })

            console.log("Number of active agreements by Consumer: " + formatedAgreements.length)

            res.status(200).send(formatedAgreements)

        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
                res.status(500).send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

    router.get('/check_agreements_by_provider/:provider_id', async (req, res) => {

        try {

            const provider_id = req.params.provider_id
            const formatedAgreements: ReturnType<typeof formatAgreement>[] = []
            const activeAgreements = await contract.checkAgreementsByProvider(provider_id);

            activeAgreements.forEach(agreement => {

                const formatedAgreement = formatAgreement(agreement)
                console.log(formatedAgreement.providerId)
                formatedAgreements.push(formatedAgreement)
            })

            console.log("Number of active agreements by Provider: " + formatedAgreements.length)

            res.status(200).send(formatedAgreements)

        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
                res.status(500).send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

    router.get('/get_state/:agreement_id', async (req, res) => {

        try {

            const agreement_id = req.params.agreement_id
            const agreementState = await contract.getState(agreement_id);
            const response = getState(agreementState)

            res.status(200).send(response)

        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
                res.status(500).send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

    router.post('/create_agreement_raw_transaction/:sender_address', async (req, res, next) => {
        try {

            const sender_address = req.params.sender_address
            const template = ConvertToTemplate.toTemplate(JSON.stringify(req.body))
            const processedTemplate = processTemplate(template)

            // process input data
            const providerPublicKey = processedTemplate.providerPublicKey
            const consumerPublicKey = processedTemplate.consumerPublicKey
            const dataExchangeAgreementHash = processedTemplate.dataExchangeAgreementHash
            const dataOfferingId = processedTemplate.dataOfferingId
            const purpose = processedTemplate.purpose
            const providerId = processedTemplate.providerId
            const consumerId = processedTemplate.consumerId
            const dates = processedTemplate.dates
            const descriptionOfData = processedTemplate.descriptionOfData
            const intendedUse = processedTemplate.intendedUse
            const licenseGrant = processedTemplate.licenseGrant
            const dataStream = processedTemplate.dataStream

            // add pulic keys + add to format agreement
            console.log(providerPublicKey+" "+consumerPublicKey+" "+dataExchangeAgreementHash)

            const unsignedCreateAgreementTx = await contract.populateTransaction.createAgreement(providerPublicKey, consumerPublicKey, dataExchangeAgreementHash,[dataOfferingId, '0'], purpose, providerId, consumerId, dates, intendedUse, licenseGrant, dataStream, { gasLimit: gasLimit }) as any
            unsignedCreateAgreementTx.nonce = await provider.getTransactionCount(sender_address)
            unsignedCreateAgreementTx.gasLimit = unsignedCreateAgreementTx.gasLimit?._hex
            unsignedCreateAgreementTx.gasPrice = (await provider.getGasPrice())._hex
            unsignedCreateAgreementTx.chainId = (await provider.getNetwork()).chainId
            unsignedCreateAgreementTx.from = parseHex(sender_address, true)

            const formatedRawTransaction = formatTransaction(unsignedCreateAgreementTx)
            res.status(200).send(formatedRawTransaction)

        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
                res.status(500).send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })
    router.post('/deploy_signed_transaction', async (req, res, next) => {
        try {

            const signedTx = (req.body).signed_transaction

            const agreementTx = await provider.sendTransaction(signedTx)

            console.log(agreementTx)
            const hash = agreementTx.hash

            await provider.waitForTransaction(hash)
            const receipt = await provider.getTransactionReceipt(hash)

            const formatedTransactionReceipt = formatTransactionReceipt(receipt)

            let logs = new ethers.utils.Interface(contractABI).parseLog(receipt.logs[0])
            const eventName = logs.eventFragment.name

            // console.log(eventName)
            // console.log(event.args.consumerId+" " + event.args.consumerId + " " + parseInt(event.args.id))

            let type: string = 'unrecognizedEvent'
            let message: Object = {}
            let status: string = 'unrecognizedEvent'
            const agreementId = logs.args.id

            if (eventName === "AgreementCreated") {
                type = "agreement.pending"
                message = { msg: `Agreement with the id: ${agreementId} was created` }
                status = "pending"
            }
            else if (eventName === "AgreementUpdated") {
                type = "agreement.update"
                message = { msg: `Agreement with the id: ${agreementId} was updated` }
                status = "update"
            }
            else if (eventName === "AgreementSigned") {
                type = "agreement.accepted"
                message = { msg: `Agreement with id: ${agreementId} was signed` }
                status = "accepted"
            }

            const origin = "scm"
            const predefined = true
            await notify(origin, predefined, type, `${logs.args.providerId}`, message, status)
            await notify(origin, predefined, type, `${logs.args.consumerId}`, message, status)
            


            res.status(200).send(formatedTransactionReceipt)

        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
                res.status(500).send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

 
router.put('/update_agreement_raw_transaction/:agreement_id/:sender_address', async (req, res) => {

    try {
        const agreementId = req.params.agreement_id
        const sender_address = req.params.sender_address
        const template = ConvertToTemplate.toTemplate(JSON.stringify(req.body))
        const processedTemplate = processTemplate(template)

        // process input data
        const dataOfferingId = processedTemplate.dataOfferingId
        const purpose = processedTemplate.purpose
        const providerId = processedTemplate.providerId
        const consumerId = processedTemplate.consumerId
        const dates = processedTemplate.dates
        const descriptionOfData = processedTemplate.descriptionOfData
        const intendedUse = processedTemplate.intendedUse
        const licenseGrant = processedTemplate.licenseGrant
        const dataStream = processedTemplate.dataStream

        const unsignedUpdateAgreementTx = await contract.populateTransaction.updateAgreement(agreementId, dataOfferingId, purpose, providerId, consumerId, dates, descriptionOfData, intendedUse, licenseGrant, dataStream) as any
        unsignedUpdateAgreementTx.nonce = await provider.getTransactionCount(sender_address)
        unsignedUpdateAgreementTx.gasLimit = gasLimit
        unsignedUpdateAgreementTx.gasPrice = (await provider.getGasPrice())._hex
        unsignedUpdateAgreementTx.chainId = (await provider.getNetwork()).chainId
        unsignedUpdateAgreementTx.from = parseHex(sender_address, true)

        const formatedRawTransaction = formatTransaction(unsignedUpdateAgreementTx)
        res.status(200).send(formatedRawTransaction)

    } catch (error) {
        if (error instanceof Error) {
            console.log(`${error.message}`)
            res.status(500).send({ name: `${error.name}`, message: `${error.message}` })
        }
    }

})

router.put('/sign_agreement_raw_transaction', async (req, res) => {

    try {
        const agreementId = req.body.agreement_id
        const consumerId = req.body.consumer_id
        const consumerPublicKey = req.body.consumer_public_key
        const senderAdress = req.body.consumer_ethereum_address


        const unsignedSignAgreementTx = await contract.populateTransaction.signAgreement(agreementId, consumerId, consumerPublicKey, { gasLimit: gasLimit }) as any
        unsignedSignAgreementTx.nonce = await provider.getTransactionCount(senderAdress)
        unsignedSignAgreementTx.gasLimit = gasLimit
        unsignedSignAgreementTx.gasPrice = (await provider.getGasPrice())._hex
        unsignedSignAgreementTx.chainId = (await provider.getNetwork()).chainId
        unsignedSignAgreementTx.from = parseHex(senderAdress, true)

        const formatedRawTransaction = formatTransaction(unsignedSignAgreementTx)
        res.status(200).send(formatedRawTransaction)

    } catch (error) {
        if (error instanceof Error) {
            console.log(`${error.message}`)
            res.status(500).send({ name: `${error.name}`, message: `${error.message}` })
        }
    }
})

router.get('/retrieve_agreements/:consumer_public_key', async (req, res) => {
    try {

        const consumer_public_key = req.params.consumer_public_key
        const formatedAgreements: ReturnType<typeof formatAgreement>[] = []
        const activeAgreements = await contract.retrieveAgreements(consumer_public_key);

        activeAgreements.forEach(agreement => {

            const formatedAgreement = formatAgreement(agreement)
            formatedAgreements.push(formatedAgreement)
        })

        console.log("Number of active agreements by Consumer Public key: " + formatedAgreements.length)

        res.status(200).send(formatedAgreements)


    } catch (error) {
        if (error instanceof Error) {
            console.log(`${error.message}`)
            res.status(500).send({ name: `${error.name}`, message: `${error.message}` })
        }
    }
})

// router.put('/map_data_exchange_to_agreement/', async (req, res) => {

//     try {
//         const dataExchangeId = req.body.data_exchange_id
//         const agreementId = req.body.agreement_id
//         console.log(dataExchangeId+" "+agreementId)

//         //const signer = new ethers.Wallet(privateKey, provider);
//         //const contract = new ethers.Contract(contractAddress, contractABI, signer);

//         const agreement_length = await contract.getAgreementsLength()
//         if(agreementId<agreement_length){
//             const mapAgreementToDataExchangeTx = await contract.mapAgreementIdByExchangeId(dataExchangeId, agreementId)
//             await mapAgreementToDataExchangeTx.wait();
//             res.status(200).send(mapAgreementToDataExchangeTx)
//         }
//         else{ 
//             res.status(400).send('Invalid agreement id.')
//     }

//     } catch (error) {
//         if (error instanceof Error) {
//             console.log(`${error.message}`)
//             res.status(500).send({ name: `${error.name}`, message: `${error.message}` })
//         }
//     }
// })

// router.post('/evaluate_signed_resolution', async (req, res, next) => {
//     try {
//         const signedResolution = req.body.proof
//         console.log(signedResolution)
//         const decodedResolution = await nonRepudiationLibrary.ConflictResolution.verifyResolution(signedResolution)
        
//         //const resolutionPayload = await nonRepudiationLibrary.ConflictResolution.verifyResolution<DisputeResolution>(signedResolution)

//         // proofType: 'resolution'
//         // type: 'dispute'
//         // resolution: 'accepted' | 'denied' // resolution is 'denied' if the cipherblock can be properly decrypted; otherwise is 'accepted'
//         // dataExchangeId: string // the unique id of this data exchange
//         // iat: number // unix timestamp stating when it was resolved
//         // iss: string // the public key of the CRS in JWK
//         // sub: string // the public key (JWK) of the entity that requested a resolution

//         //  // We will receive a signed resolution. Let us assume that is in variable disputeResolution
//         // const resolutionPayload = await nonRepudiationLibrary.ConflictResolution.verifyResolution<DisputeResolution>(disputeResolution)
//         // if (resolutionPayload.resolution === 'accepted') {
//         //     // We were right about our claim: the cipherblock cannot be decrypted and we can't be invoiced for it.
//         // } else { // resolutionPayload.resolution === 'denied'
//         // // The cipherblock can be decrypted with the published secret, so either we had a malicious intention or we have an issue with our software.
//         // }
        
//         const trustedIssuers = [
//             '{"alg":"ES256","crv":"P-256","d":"ugSiI9ILGgMc5Nc0nAa3qFN3AN0oGba33IAakHqdvmg","kty":"EC","x":"L6WfVXGbH0io6Jpm94S1lpdi6yGtT1OmZ65A_kS_hk8","y":"6YE0oPOpWBqC75D_jtJUfy5lsXlGjO5g6QXivDwMDKc"}'
//         ]
//         const proofType = decodedResolution.payload.proofType
//         const type = decodedResolution.payload.type
//         const resolution = decodedResolution.payload.resolution
//         const dataExchangeId = decodedResolution.payload.dataExchangeId
//         const iat = decodedResolution.payload.iat
//         const iss = decodedResolution.payload.iss
//         if (!trustedIssuers.includes(iss)) {
//             throw new Error('untrusted issuer')
//         }
//         const sub = decodedResolution.payload.sub

//         //smart contract
//         //evaluateSignedResolution(string memory _proofType, string memory _type, string memory _resolution,string memory _dataExchangeId, uint256 _iat, string memory _iss, string memory _sub)
//         //presentPenaltyChoicesForAgreement(string memory _dataExchangeId)
//         //get list of penalties + agreement id

//         res.status(200).send(decodedResolution.payload)

//     } catch (error) {
//         if (error instanceof Error) {
//             console.log(`${error.message}`)
//             res.status(500).send({ name: `${error.name}`, message: `${error.message}` })
//         }
//     }
// })

// router.put('/terminate', async (req, res, next) => {
//     try {
//         const signedResolution = req.body.proof
//         console.log(signedResolution)
//         const decodedResolution = await nonRepudiationLibrary.ConflictResolution.verifyResolution(signedResolution)
        
//         //const resolutionPayload = await nonRepudiationLibrary.ConflictResolution.verifyResolution<DisputeResolution>(signedResolution)

//         // proofType: 'resolution'
//         // type: 'dispute'
//         // resolution: 'accepted' | 'denied' // resolution is 'denied' if the cipherblock can be properly decrypted; otherwise is 'accepted'
//         // dataExchangeId: string // the unique id of this data exchange
//         // iat: number // unix timestamp stating when it was resolved
//         // iss: string // the public key of the CRS in JWK
//         // sub: string // the public key (JWK) of the entity that requested a resolution

//         //  // We will receive a signed resolution. Let us assume that is in variable disputeResolution
//         // const resolutionPayload = await nonRepudiationLibrary.ConflictResolution.verifyResolution<DisputeResolution>(disputeResolution)
//         // if (resolutionPayload.resolution === 'accepted') {
//         //     // We were right about our claim: the cipherblock cannot be decrypted and we can't be invoiced for it.
//         // } else { // resolutionPayload.resolution === 'denied'
//         // // The cipherblock can be decrypted with the published secret, so either we had a malicious intention or we have an issue with our software.
//         // }
        
//         const trustedIssuers = [
//             '{"alg":"ES256","crv":"P-256","d":"ugSiI9ILGgMc5Nc0nAa3qFN3AN0oGba33IAakHqdvmg","kty":"EC","x":"L6WfVXGbH0io6Jpm94S1lpdi6yGtT1OmZ65A_kS_hk8","y":"6YE0oPOpWBqC75D_jtJUfy5lsXlGjO5g6QXivDwMDKc"}'
//         ]
//         const proofType = decodedResolution.payload.proofType
//         const type = decodedResolution.payload.type
//         const resolution = decodedResolution.payload.resolution
//         const dataExchangeId = decodedResolution.payload.dataExchangeId
//         const iat = decodedResolution.payload.iat
//         const iss = decodedResolution.payload.iss
//         if (!trustedIssuers.includes(iss)) {
//             throw new Error('untrusted issuer')
//         }
//         const sub = decodedResolution.payload.sub

//         if(resolution === "completed" || resolution==="denied"){
//             console.log("Call terminate function SC")
//         }
//         else console.log("Cannot terminate agreement")

//         //smart contract
//         //evaluateSignedResolution(string memory _proofType, string memory _type, string memory _resolution,string memory _dataExchangeId, uint256 _iat, string memory _iss, string memory _sub)
//         //presentPenaltyChoicesForAgreement(string memory _dataExchangeId)
//         //get list of penalties + agreement id

//         res.status(200).send(decodedResolution.payload)

//     } catch (error) {
//         if (error instanceof Error) {
//             console.log(`${error.message}`)
//             res.status(500).send({ name: `${error.name}`, message: `${error.message}` })
//         }
//     }
// })

return router;
}


