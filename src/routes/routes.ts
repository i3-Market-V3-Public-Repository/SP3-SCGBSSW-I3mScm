import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as fs from 'fs'
import _fetch = require('isomorphic-fetch')
import { ConvertToTemplate, Template } from '../template'
import {
    ConvertToStaticParametersTemplate,
    StaticParametersTemplate,
} from '../staticParametersTemplate'
import {
    getTemplate,
    getFee,
    createRawTransaction,
    processTemplate,
    formatAgreement,
    formatPricingModel,
    notify,
    getState,
    formatTransaction,
    formatTransactionReceipt,
    parseHex,
    getAgreementId,
    onlyUnique
} from '../common'
import { ethers } from 'ethers'
import * as path from 'path'
import { TextEncoder, TextDecoder } from 'util';


import * as nonRepudiationLibrary from '@i3m/non-repudiation-library'

const dotenv = require('dotenv').config({
    path: path.resolve(__dirname, '../../.env'),
})

const router = express.Router()
router.use(bodyParser.json())

const providerAddress = String(process.env.PROVIDER_ADDRESS)

const contractObj = require('../../DataSharingAgreement.json')
const contractAddress = contractObj.address
const contractABI = contractObj.abi

const contractObjConsent = require('../../ExplicitUserConsent.json')
const contractAddressConsent = contractObjConsent.address
const contractABIConsent = contractObjConsent.abi

const provider = new ethers.providers.JsonRpcProvider(providerAddress)

const contract = new ethers.Contract(contractAddress, contractABI, provider)
const explicitUserConsentContract = new ethers.Contract(contractAddressConsent, contractABIConsent, provider)

const gasLimit = 12500000

const jsonTemplateFile = require('../../template.json')

export default async (): Promise<typeof router> => {
    router.get('/openapi', (req, res) => {
        let oas = fs.readFileSync('./openapi/openapi.json', {
            encoding: 'utf-8',
            flag: 'r',
        })
        res.send(oas)
    })

    router.get('/template/:offering_id', async (req, res) => {

        try {

            let staticParameters: any = await _fetch(
                `${process.env.BACKPLANE_URL}/semantic-engine/api/registration/federated-contract-parameter/${req.params.offering_id}/offeringId`,
                {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                },)

            const staticParametersJson = await staticParameters.json()

            if (staticParametersJson.offeringId != undefined) {

                let parsedToJson = JSON.parse(JSON.stringify(staticParametersJson))

                try {
                    const staticTemplate: StaticParametersTemplate = ConvertToStaticParametersTemplate.toStaticParametersTemplate(
                        JSON.stringify(parsedToJson),
                    )
                    const jsonTemplate: Template = ConvertToTemplate.toTemplate(
                        JSON.stringify(jsonTemplateFile),
                    )

                    let template: Template = getTemplate(jsonTemplate, staticTemplate)
                    if(template.dataStream)
                        template.pricingModel.fee = parseFloat(await getFee(template.pricingModel.hasPaymentOnSubscription.hasSubscriptionPrice))
                    else template.pricingModel.fee = parseFloat(await getFee(template.pricingModel.basicPrice))
                    const response = JSON.parse(JSON.stringify(template))

                    res.status(200).send(response)

                } catch (error) {
                    if (error instanceof Error) {
                        res
                            .status(500)
                            .send({ name: `${error.name}`, message: `${error.message}` })
                    }
                }
            }
            else {
                res
                    .status(staticParametersJson.error.statusCode)
                    .send (staticParametersJson.error)
            }    
          } catch (error) {
                if (error instanceof Error) {
                    res
                        .status(500)
                        .send({ name: `${error.name}`, message: `${error.message}` })
                }
            }
    })

    router.get('/get_agreement/:agreement_id', async (req, res) => {
        try {
            const agreementId = parseInt(req.params.agreement_id)
            const agreement = await contract.getAgreement(agreementId)
            if (agreement.agreementId == 0) 
                     res.status(400).send('Invalid agreement id.')
            else {
                const response = JSON.parse(JSON.stringify(formatAgreement(agreement)))
                res.status(200).send(response)
            }
        } catch (error) {
            if (error instanceof Error) {
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

    router.get('/get_pricing_model/:agreement_id', async (req, res) => {
        try {
            const agreementId = parseInt(req.params.agreement_id)
            const agreement = await contract.getAgreement(agreementId)
            if (agreement.agreementId == 0) 
                     res.status(400).send('Invalid agreement id.')
            else {
                const pricingModel = await contract.retrievePricingModel(agreementId) 
                const response = JSON.parse(JSON.stringify(formatPricingModel(pricingModel)))
                res.status(200).send(response)
            } 
        } catch (error) {
            if (error instanceof Error) {
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

    router.post('/check_agreements_by_consumer', async (req, res) => {
        try {

            let consumerPublicKeys : string[] = req.body.public_keys
            const active : boolean = JSON.parse(req.body.active)

            consumerPublicKeys = consumerPublicKeys.filter(onlyUnique);
            
            const formatedAgreements: ReturnType<typeof formatAgreement>[] = []
            
            const promises = consumerPublicKeys.map((consumerPublicKey) =>
                        contract.getAgreementsByConsumer(
                        consumerPublicKey,
                        active,
                    ).then((agreement) => {
                        if(parseInt(agreement.agreementId)){
                            formatedAgreements.push(formatAgreement(agreement))
                        }
                    })
            );
            await Promise.all(promises);

            res.status(200).send(formatedAgreements)

        } catch (error) {
            if (error instanceof Error) {
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

    router.post('/check_agreements_by_provider', async (req, res) => {
        try {

            let providerPublicKeys : string[] = req.body.public_keys
            const active : boolean = JSON.parse(req.body.active)

            providerPublicKeys = providerPublicKeys.filter(onlyUnique);
            
            const formatedAgreements: ReturnType<typeof formatAgreement>[] = []
            
            const promises = providerPublicKeys.map((providerPublicKey) =>
                        contract.getAgreementsByProvider(
                        providerPublicKey,
                        active,
                    ).then((agreement) => {
                        if(parseInt(agreement.agreementId)){
                            formatedAgreements.push(formatAgreement(agreement))
                        }
                    })
            );
            await Promise.all(promises);

            res.status(200).send(formatedAgreements)
        
            
        } catch (error) {
            if (error instanceof Error) {
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

    router.get('/check_agreements_by_data_offering/:offering_id', async (req, res) => {
        try {
            const offeringId = req.params.offering_id
            const formatedAgreements: ReturnType<typeof formatAgreement>[] = []
            const agreementIds = await contract.checkAgreementsByDataOffering(
                offeringId,
            )
                
            const promises = agreementIds.map((agreementId : number) =>
                     contract.getAgreement(agreementId)
                     .then((agreement) => (formatedAgreements.push(formatAgreement(agreement)))
                    )
                );
            await Promise.all(promises);

            res.status(200).send(formatedAgreements)

        } catch (error) {
            if (error instanceof Error) {

                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

    router.get('/get_state/:agreement_id', async (req, res) => {
        try {
            const agreement_id = req.params.agreement_id
            const agreementState = await contract.getState(agreement_id)
            const response = getState(agreementState)

            res.status(200).send(response)
        } catch (error) {
            if (error instanceof Error) {
             
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

    router.post(
        '/create_agreement_raw_transaction/:sender_address',
        async (req, res, next) => {
            try {
                const senderAddress = req.params.sender_address
                const dataSharingAgreement : nonRepudiationLibrary.DataSharingAgreement = req.body
                nonRepudiationLibrary.validateDataSharingAgreementSchema(dataSharingAgreement)
                const template = ConvertToTemplate.toTemplate(JSON.stringify(req.body))
                let consentGiven : boolean = true
                if(template.personalData){
                    const consents = await explicitUserConsentContract.checkConsentStatus(template.dataOfferingDescription.dataOfferingId, "")
                    if(consents.length!=0)
                        consents.forEach((consent) => {
                            if(parseInt(consent) == 0){
                                consentGiven = false;
                            }
                    })
                    else throw new Error("Consent was not given for offering " + template.dataOfferingDescription.dataOfferingId)
                }
                
                if(template.personalData == false || consentGiven == true){
                        const processedTemplate = processTemplate(template)

                        const providerPublicKey = processedTemplate.providerPublicKey
                        const consumerPublicKey = processedTemplate.consumerPublicKey
                        const dataExchangeAgreementHash =
                            processedTemplate.dataExchangeAgreementHash

                        const signatures = processedTemplate.signatures
                        const dataOfferingId = processedTemplate.dataOfferingId
                        const version = processedTemplate.dataOfferingVersion
                        const dataOfferingTitle = processedTemplate.dataOfferingTitle

                        const purpose = processedTemplate.purpose
                        const dates = processedTemplate.dates

                        const intendedUse = processedTemplate.intendedUse
                        const licenseGrant = processedTemplate.licenseGrant
                        const typeOfData = processedTemplate.typeOfData

                        const pricingModel= processedTemplate.pricingModel
                        

                        const unsignedCreateAgreementTx = (await contract.populateTransaction.createAgreement(
                            providerPublicKey,
                            consumerPublicKey,
                            dataExchangeAgreementHash,
                            signatures,
                            [dataOfferingId, version, dataOfferingTitle],
                            purpose,
                            dates,
                            intendedUse,
                            licenseGrant,
                            pricingModel,
                            typeOfData,
                            { gasLimit: gasLimit },
                        )) as any

                        const formatedRawTransaction = formatTransaction(
                            await createRawTransaction(
                                provider,
                                unsignedCreateAgreementTx,
                                senderAddress,
                            ),
                        )
                        res.status(200).send(formatedRawTransaction)
                }
            } catch (error) {
                if (error instanceof Error) {
                    res
                        .status(500)
                        .send({ name: `${error.name}`, message: `${error.message}` })
                }
            }
        },
    )
    router.post('/deploy_signed_transaction', async (req, res, next) => {
        try {
            const signedTx = req.body.signedTransaction

            const agreementTx = await provider.sendTransaction(signedTx)

            const hash = agreementTx.hash

            await provider.waitForTransaction(hash)
            const receipt = await provider.getTransactionReceipt(hash)

            const formatedTransactionReceipt = formatTransactionReceipt(receipt)

            if (receipt.status == 1) {
                if (receipt.logs.length > 0) {
                    let logs = new ethers.utils.Interface(contractABI).parseLog(
                        receipt.logs[0],
                    )
                    
                    const eventName = logs.eventFragment.name

                    let type: string = 'unrecognizedEvent'
                    let message: Object = {}
                    let status: string = 'unrecognizedEvent'
                    const agreementId = parseInt(logs.args.id)
                    switch (eventName) {
                        case 'AgreementActive':
                            type = 'agreement.accepted' 
                            message = { 
                                msg: `Agreement with id: ${agreementId} is active`,
                                agreementId: agreementId 
                            }
                            status = 'accepted'
                            break
                        case 'AgreementTerminated':
                            type = 'agreement.termination'
                            message = {
                                msg: `Agreement with id: ${agreementId} is terminated`,
                                agreementId: agreementId
                            }
                            status = 'termination'
                            break
                        case 'PenaltyChoices':
                                const penalties = logs.args.penaltyChoices
                                type = 'agreement.penaltychoices'
                                message = {
                                    msg: `Agreement with id: ${agreementId} is violated. `,
                                    agreementId: agreementId,
                                    penalties: penalties
                                }
                                status = 'penalties'
                                break
                        case 'AgreeOnPenalty':
                                const chosenPenalty = logs.args.chosenPenalty
                                const newEndDate = parseInt(logs.args.newEndDate)
                                const price = parseInt(logs.args.price)/100
                                const fee = parseInt(logs.args.fee)/100
                                type = 'agreement.agreeonpenalty'
                                message = {
                                    msg: `The penalty was enforced for agreement with id: ${agreementId}. `,
                                    agreementId: agreementId,
                                    chosenPenalty: chosenPenalty,
                                    newEndDate: newEndDate,
                                    price: price,
                                    fee: fee
                                }
                                status = 'penalties'
                                break
                    }

                const origin = 'i3-market'
                const predefined = true
                let publicKey1 : string = logs.args.providerPublicKey
                const publicKey2 : string = logs.args.consumerPublicKey
               
                if(publicKey1!=undefined)
                {
                    const publickeyJsonObj1 = JSON.parse(publicKey1)
                    const strData = JSON.stringify(message)
                    const uint8Data = new TextEncoder().encode(strData)
                    const jwe1 = await nonRepudiationLibrary.jweEncrypt(uint8Data, publickeyJsonObj1, "A256GCM")
                  
                    await notify(
                        origin,
                        predefined,
                        type,
                        publicKey1, 
                        {jwe: jwe1},
                        status,
                    )
                }
                
                if(publicKey2!= undefined)
                {
                    const publickeyJsonObj2 = JSON.parse(publicKey2)
                    const strData2 = JSON.stringify(message)
                    const uint8Data2 = new TextEncoder().encode(strData2)
                    const jwe2 = await nonRepudiationLibrary.jweEncrypt(uint8Data2, publickeyJsonObj2, "A256GCM")

                    await notify(
                        origin,
                        predefined,
                        type,
                        publicKey2, 
                        {jwe: jwe2},
                        status,
                    )
                }
                res.status(200).send(formatedTransactionReceipt)
                } else throw new Error('The transaction has no logs.')
            } else throw new Error('Transaction unsuccessful. Status:' + receipt.status)
        } catch (error) {
            if (error instanceof Error) {
             
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })


    router.get('/retrieve_agreements/:consumer_public_key', async (req, res) => {
        try {
            const consumerPublicKey = req.params.consumer_public_key

            const formatedAgreements: ReturnType<typeof formatAgreement>[] = []
            
            let  agreement = await contract.getAgreementsByConsumer(
                    consumerPublicKey,
                    true,
                )
         
            if(parseInt(agreement.agreementId) && parseInt(agreement.agreementDates[1])<= Math.floor(new Date().getTime() / 1000)){
                    const formatedAgreement = formatAgreement(agreement)
                    formatedAgreements.push(formatedAgreement)
                    res.status(200).send(formatedAgreements)
                }
            else if(parseInt(agreement.agreementDates[1])>= Math.floor(new Date().getTime() / 1000))
                    res.status(400).send("Start date not reached.")
            else 
                    res.status(404).send("Agreement not found.")
            

        } catch (error) {
            if (error instanceof Error) {
               
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

    router.post('/evaluate_signed_resolution', async (req, res, next) => {
        try {
            const signedResolution = req.body.proof

            const decodedResolution = await nonRepudiationLibrary.ConflictResolution.verifyResolution(
                signedResolution,
            )

            const trustedIssuers = [
                '{"alg":"ES256","crv":"P-256","d":"ugSiI9ILGgMc5Nc0nAa3qFN3AN0oGba33IAakHqdvmg","kty":"EC","x":"L6WfVXGbH0io6Jpm94S1lpdi6yGtT1OmZ65A_kS_hk8","y":"6YE0oPOpWBqC75D_jtJUfy5lsXlGjO5g6QXivDwMDKc"}',
                '{"alg":"ES256","crv":"P-256","d":"-C4voepzHNpinEkDK6LdC0pdvqhohpZ60jo3qj9MUeY","kty":"EC","x":"4d3u9jd5Ch8oOF3FAqH-EDpzA7VhXxscVwbF5yA-Ds8","y":"SWqpZyQ1GREbLq1oUpO-8zFCq5d64OhCz3sTGnblhzY"}'

            ]
            const proofType = decodedResolution.payload.proofType
            const type = decodedResolution.payload.type
            const resolution = decodedResolution.payload.resolution 
            const dataExchangeId = decodedResolution.payload.dataExchangeId
            const iat = decodedResolution.payload.iat
            const iss = decodedResolution.payload.iss
            if (!trustedIssuers.includes(iss)) {
                throw new Error('untrusted issuer')
            }
            const sub = decodedResolution.payload.sub

            const agreementIdJson = await getAgreementId(dataExchangeId)

            if(agreementIdJson.AgreementId == undefined)
                throw new Error(agreementIdJson.msg)
            const agreementId = parseInt(agreementIdJson.AgreementId);

            
            const senderAddress = req.body.sender_address
            const unsignedEvaluateResolutionTx = (await contract.populateTransaction.evaluateSignedResolution(
                agreementId,
                proofType,
                type,
                resolution,
                dataExchangeId,
                iat,
                iss,
                sub,
                { gasLimit: gasLimit },
            )) as any
            unsignedEvaluateResolutionTx.nonce = await provider.getTransactionCount(
                senderAddress,
            )
            unsignedEvaluateResolutionTx.gasLimit =
            unsignedEvaluateResolutionTx.gasLimit?._hex
            unsignedEvaluateResolutionTx.gasPrice = (await provider.getGasPrice())._hex
            unsignedEvaluateResolutionTx.chainId = (await provider.getNetwork()).chainId
            unsignedEvaluateResolutionTx.from = parseHex(senderAddress, true)

            const formatedRawTransaction = formatTransaction(
                unsignedEvaluateResolutionTx,
            )

            res.status(200).send(formatedRawTransaction)

        } catch (error) {
            if (error instanceof Error) {
               
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

    router.post('/propose_penalty', async (req, res, next) => {
        try {

            const agreementId = req.body.agreementId
            const chosenPenalty = req.body.chosenPenalty
            const paymentPercentage = req.body.paymentPercentage
            const date = new Date()
            const now = Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate(),).getTime() / 1000)
            const newEndDate = req.body.newEndDate
            if(newEndDate < now)
                throw new Error("End date must be after current date.")
            const agreement = await contract.getAgreement(agreementId)
            const providerPublicKey = agreement.providerPublicKey
        
            if(agreement.state == 1){
                const type = 'agreement.proposepenalty'
                const message = {
                    agreementId: agreementId,
                    chosenPenalty: chosenPenalty,
                    paymentPercentage: paymentPercentage,
                    newEndDate: newEndDate,
                }
                const status = 'penalty'

                const origin = 'i3-market'
                const predefined = true

                const publickeyJsonObj1 = JSON.parse(providerPublicKey)
                const strData = JSON.stringify(message)
                const uint8Data = new TextEncoder().encode(strData)
                const jwe = await nonRepudiationLibrary.jweEncrypt(uint8Data, publickeyJsonObj1, "A256GCM")

                await notify(
                    origin,
                    predefined,
                    type,
                    providerPublicKey,
                    {jwe: jwe},
                    status,
                    )
                res.status(200).send(chosenPenalty)
            }
            else throw new Error("Agreement is not violated.")
        } catch (error) {
            if (error instanceof Error) {
              
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

    router.put('/enforce_penalty', async (req, res) => {
        try {
            const agreementId = req.body.agreementId
            const chosenPenalty = req.body.chosenPenalty
            const paymentPercentage = req.body.paymentPercentage
            const newEndDate = req.body.newEndDate
            const senderAddress = req.body.senderAddress
            let price = 0
            let fee = 0
            if(chosenPenalty == "NewEndDateForProviderAndReductionOfPayment"){
                const pricingModel = await contract.retrievePricingModel(agreementId) 
                const oldPrice = pricingModel.price 
                price = oldPrice - (oldPrice * paymentPercentage/100)
                fee = parseInt(await getFee(price))
            }
        
            const unsignedEnforcePenaltyTx = (await contract.populateTransaction.enforcePenalty(
                agreementId,
                chosenPenalty,
                price,
                fee,
                newEndDate,
                { gasLimit: gasLimit },
            )) as any
        
            const formatedRawTransaction = formatTransaction(
                await createRawTransaction(
                    provider,
                    unsignedEnforcePenaltyTx,
                    senderAddress,
                ),
            )
            res.status(200).send(formatedRawTransaction)

        } catch (error) {
            if (error instanceof Error) {
              
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

    router.put('/terminate', async (req, res, next) => {
        try {
            
            const senderAddress = req.body.senderAddress
            const agreementId = parseInt(req.body.agreementId)
            const agreement = await contract.getAgreement(agreementId)
            const dataStream : boolean = agreement.typeOfData.dataStream
            if(dataStream == true)
            {
                const date = new Date()
                const now = Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate(),).getTime() / 1000)
                if(parseInt(agreement.agreementDates[2])<now)
                {
                    const unsignedTerminateAgreementTx = (await contract.populateTransaction.terminateAgreement(
                        agreementId,
                        true,
                        { gasLimit: gasLimit },
                        )) as any
                    const formatedRawTransaction = formatTransaction(
                            await createRawTransaction(
                                provider,
                                unsignedTerminateAgreementTx,
                                senderAddress,
                                ),
                        )
                    res.status(200).send(formatedRawTransaction)
                }
                else {
                    res.status(400).send("End date of the agreement is not reached.")
                }
            }
            else{
                const signedResolution = req.body.signedResolution
                    
                const decodedResolution = await nonRepudiationLibrary.ConflictResolution.verifyResolution(
                    signedResolution,
                )

                const trustedIssuers = [
                    '{"alg":"ES256","crv":"P-256","d":"ugSiI9ILGgMc5Nc0nAa3qFN3AN0oGba33IAakHqdvmg","kty":"EC","x":"L6WfVXGbH0io6Jpm94S1lpdi6yGtT1OmZ65A_kS_hk8","y":"6YE0oPOpWBqC75D_jtJUfy5lsXlGjO5g6QXivDwMDKc"}',
                    '{"alg":"ES256","crv":"P-256","d":"-C4voepzHNpinEkDK6LdC0pdvqhohpZ60jo3qj9MUeY","kty":"EC","x":"4d3u9jd5Ch8oOF3FAqH-EDpzA7VhXxscVwbF5yA-Ds8","y":"SWqpZyQ1GREbLq1oUpO-8zFCq5d64OhCz3sTGnblhzY"}'
                ]
                
                const resolution = decodedResolution.payload.resolution 
                const dataExchangeId = decodedResolution.payload.dataExchangeId
                const iat = decodedResolution.payload.iat
                const iss = decodedResolution.payload.iss
                if (!trustedIssuers.includes(iss)) {
                    throw new Error('untrusted issuer')
                }

                const agreementIdJson = await getAgreementId(dataExchangeId)

                if(agreementIdJson.AgreementId == undefined)
                    throw new Error(agreementIdJson.msg)
                const agreementIdBatchData = parseInt(agreementIdJson.AgreementId);

                if(agreementIdBatchData == agreementId && (resolution === "completed" || resolution === "denied")){
                    const unsignedTerminateAgreementTx = (await contract.populateTransaction.terminateAgreement(
                        agreementId,
                        true,
                        { gasLimit: gasLimit },
                        )) as any
                    const formatedRawTransaction = formatTransaction(
                            await createRawTransaction(
                                provider,
                                unsignedTerminateAgreementTx,
                                senderAddress,
                                ),
                        )
                     res.status(200).send(formatedRawTransaction)
                }
            }
        } catch (error) {
            if (error instanceof Error) {
           
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

    router.post('/give_consent', async (req, res, next) => {
        try {
            const dataOfferingId = req.body.dataOfferingId
            const consentSubjects = req.body.consentSubjects
            const consentFormHash = req.body.consentFormHash
            const startDate = req.body.startDate
            const endDate = req.body.endDate
            const senderAddress = req.body.senderAddress

            const unsignedGiveConsentTx = (await explicitUserConsentContract.populateTransaction.giveConsent(
                dataOfferingId,
                consentSubjects,
                consentFormHash,
                startDate,
                endDate,
                { gasLimit: gasLimit },
                )) as any
                const formatedRawTransaction = formatTransaction(
                        await createRawTransaction(
                            provider,
                            unsignedGiveConsentTx,
                            senderAddress,
                        ),
                )
            res.status(200).send(formatedRawTransaction)
        } catch (error) {
            if (error instanceof Error) {
           
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })


    router.get('/check_consent_status/:dataOfferingId', async (req, res, next) => {
        try {
            const dataOfferingId = req.params.dataOfferingId
            let consentSubject = req.query.consentSubject
            if(consentSubject == undefined)
                consentSubject = ""
        
            const formatedConsents : any = []
            const consents = await explicitUserConsentContract.checkConsentStatus(dataOfferingId, consentSubject)
            consents.forEach((consent) => {
                formatedConsents.push(parseInt(consent))
            })

            res.status(200).send(formatedConsents)

        } catch (error) {
            if (error instanceof Error) {
      
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })


    router.put('/revoke_consent', async (req, res, next) => {
        try {
            const dataOfferingId = req.body.dataOfferingId
            const consentSubjects = req.body.consentSubjects
            const senderAddress = req.body.senderAddress

            const unsignedRevokeConsentTx = (await explicitUserConsentContract.populateTransaction.revokeConsent(
                contractAddress,
                dataOfferingId,
                consentSubjects,
                { gasLimit: gasLimit },
                )) as any
                const formatedRawTransaction = formatTransaction(
                        await createRawTransaction(
                            provider,
                            unsignedRevokeConsentTx,
                            senderAddress,
                        ),
                )
            res.status(200).send(formatedRawTransaction)
        } catch (error) {
            if (error instanceof Error) {
            
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })


    router.post('/deploy_consent_signed_transaction', async (req, res, next) => {
        try {
            const signedTx = req.body.signedTransaction

            const agreementTx = await provider.sendTransaction(signedTx)

            const hash = agreementTx.hash

            await provider.waitForTransaction(hash)
            const receipt = await provider.getTransactionReceipt(hash)

            const formatedTransactionReceipt = formatTransactionReceipt(receipt)
            
            if (receipt.status == 1) {
                if (receipt.logs.length > 0) {
                    let logs = new ethers.utils.Interface(contractABIConsent).parseLog(
                        receipt.logs[0],
                    )
                    
                    const eventName = logs.eventFragment.name
                    
                    let type: string = 'unrecognizedEvent'
                    let message: Object = {}
                    let status: string = 'unrecognizedEvent'
                    const origin = 'i3-market'
                    const predefined = true
                    const dataOfferingId = logs.args.dataOfferingId
                    const consentSubjects = logs.args.consentSubjects
                    if (eventName == 'ConsentRevoked') {
                                    type = 'consent.revoked'
                                    message = {
                                        msg: `Consent was revoked for offering: ${dataOfferingId}. `,
                                        dataOfferingId: dataOfferingId,
                                        consentSubjects: consentSubjects
                                    }
                                   status = 'revoked'
                    }
                    
                    const consumerPublicKeys : string[] = logs.args.consumerPublicKeys
                    if(consumerPublicKeys != undefined){
                        for(let i =0; i < consumerPublicKeys.length; i++){
                            const publickeyJsonObj1 = JSON.parse(consumerPublicKeys[i])
                            const strData = JSON.stringify(message)
                            const uint8Data = new TextEncoder().encode(strData)
                            const jwe = await nonRepudiationLibrary.jweEncrypt(uint8Data, publickeyJsonObj1, "A256GCM")

                            await notify(
                                origin,
                                predefined,
                                type,
                                consumerPublicKeys[i], 
                                {jwe: jwe},
                                status,
                            )
                        }
                    }
                
                res.status(200).send(formatedTransactionReceipt)
                } else throw new Error('The transaction has no logs.')
            } else throw new Error('Transaction unsuccessful. Status:' + receipt.status)
        } catch (error) {
            if (error instanceof Error) {
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
        
    })

    return router
}
