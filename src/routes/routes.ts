import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';
import _fetch = require('isomorphic-fetch')
import { ConvertToTemplate, Template } from "../template";
import { ConvertToStaticParametersTemplate, StaticParametersTemplate } from "../staticParametersTemplate";
import { getTemplate, /*createAgreements,*/ processTemplate, formatAgreement, notify, checkState, formatTransaction, formatTransactionReceipt, parseHex } from "../common";
import { ethers } from 'ethers';
import * as path from 'path';

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
            const agreement = await contract.getAgreement(agreementId)
            const response = JSON.parse(JSON.stringify(formatAgreement(agreement)))

            res.status(200).send(response)

        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
                res.status(500).send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })


    router.get('/check_active_agreements', async (req, res) => {

        try {
            const formatedAgreements = []
            const activeAgreements = await contract.checkActiveAgreements();

            activeAgreements.forEach(agreement => {

                const formatedAgreement = formatAgreement(agreement)
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
            const formatedAgreements = []
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
            const formatedAgreements = []
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

    router.get('/state/:agreement_id', async (req, res) => {

        try {

            const agreement_id = req.params.agreement_id
            const agreementState = await contract.getState(agreement_id);
            const response = checkState(agreementState)

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
            const dataOfferingId = processedTemplate.dataOfferingId
            const purpose = processedTemplate.purpose
            const providerId = processedTemplate.providerId
            const consumerId = processedTemplate.consumerId
            const dates = processedTemplate.dates
            const descriptionOfData = processedTemplate.descriptionOfData
            const intendedUse = processedTemplate.intendedUse
            const licenseGrant = processedTemplate.licenseGrant
            const dataStream = processedTemplate.dataStream

            const unsignedCreateAgreementTx = await contract.populateTransaction.createAgreement(dataOfferingId, purpose, providerId, consumerId, dates, descriptionOfData, intendedUse, licenseGrant, dataStream, { gasLimit: gasLimit }) as any
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

            const hash = agreementTx.hash

            await provider.waitForTransaction(hash)
            const receipt = await provider.getTransactionReceipt(hash)

            const formatedTransactionReceipt = formatTransactionReceipt(receipt)

            let event = new ethers.utils.Interface(contractABI).parseLog(receipt.logs[0])
            const eventName = event.eventFragment.name

            // console.log(eventName)
            // console.log(event.args.consumerId+" " + event.args.consumerId + " " + parseInt(event.args.id))

            let type: string, message: Object, status: string
            const agreementId = event.args.id

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
            await notify(origin, predefined, type, `${event.args.providerId}`, message, status)
            await notify(origin, predefined, type, `${event.args.consumerId}`, message, status)
            


            res.status(200).send(formatedTransactionReceipt)

        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
                res.status(500).send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

    return router;
}

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

router.put('/sign_agreement_raw_transaction/:agreement_id/:consumer_id/:sender_address', async (req, res) => {

    try {
        const agreementId = req.params.agreement_id
        const consumerId = req.params.consumer_id
        const senderAdress = req.params.sender_address


        const unsignedSignAgreementTx = await contract.populateTransaction.signAgreement(agreementId, consumerId, { gasLimit: gasLimit }) as any
        unsignedSignAgreementTx.nonce = await provider.getTransactionCount(senderAdress)
        unsignedSignAgreementTx.gasLimit = gasLimit
        unsignedSignAgreementTx.gasPrice = (await provider.getGasPrice())._hex
        unsignedSignAgreementTx.chainId = (await provider.getNetwork()).chainId
        unsignedSignAgreementTx.from = parseHex(senderAdress, true)

        // const origin = "scm"
        // const predefined = true
        // const type = "agreement.accepted"
        // const message = {msg: `Agreement with id: ${agreementId} was signed`}
        // const status = "accepted"

        // await notify(origin, predefined, type, `${consumerId}`, message, status)
        // await notify(origin, predefined, type, `${providerId}`, message, status)

        const formatedRawTransaction = formatTransaction(unsignedSignAgreementTx)
        res.status(200).send(formatedRawTransaction)

    } catch (error) {
        if (error instanceof Error) {
            console.log(`${error.message}`)
            res.status(500).send({ name: `${error.name}`, message: `${error.message}` })
        }
    }
})



