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
} from '../common'
import { ethers } from 'ethers'
import * as path from 'path'
import * as objectSha from 'object-sha'

import * as nonRepudiationLibrary from '@i3m/non-repudiation-library'
import { DisputeRequestPayload, exchangeId } from '@i3m/non-repudiation-library'

const dotenv = require('dotenv').config({
    path: path.resolve(__dirname, '../../.env'),
})

const router = express.Router()
router.use(bodyParser.json())

const privateKey = String(process.env.PRIVATE_KEY)
const providerAddress = String(process.env.PROVIDER_ADDRESS)

const contractObj = require('../../DataSharingAgreement.json')
const contractAddress = contractObj.address
const contractABI = contractObj.abi

const contractObjConsent = require('../../ExplicitUserConsent.json')
const contractAddressConsent = contractObjConsent.address
const contractABIConsent = contractObjConsent.abi

const provider = new ethers.providers.JsonRpcProvider(providerAddress)
//const signer = new ethers.Wallet(privateKey, provider);
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

    router.get('/template/:template_id', async (req, res) => {
        let staticParameters: any = await _fetch(
            `${process.env.BACKPLANE_URL}/semantic-engine/api/registration/contract-parameter/${req.params.template_id}/offeringId`,
            {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            },
        ).catch((error: any) => {
            console.error('Error:', error)
        })

        const staticParametersJson = await staticParameters.json()

        let parsedToJson = JSON.parse(JSON.stringify(staticParametersJson))

        if (parsedToJson != undefined) {
            try {
                // if(!parsedToJson.active){
                //     throw new Error("Not allowed to purchase, data offering is not active")
                // }
                //if(parsedToJson.personalData){
                    //check consent
                //}
                // Add static parameters to JSON template
                const staticTemplate: StaticParametersTemplate = ConvertToStaticParametersTemplate.toStaticParametersTemplate(
                    JSON.stringify(parsedToJson),
                )
                const jsonTemplate: Template = ConvertToTemplate.toTemplate(
                    JSON.stringify(jsonTemplateFile),
                )

                let template: Template = getTemplate(jsonTemplate, staticTemplate)

                template.pricingModel.fee = parseFloat(await getFee(template.pricingModel.basicPrice))

                const response = JSON.parse(JSON.stringify(template))

                res.status(200).send(response)
            } catch (error) {
                if (error instanceof Error) {
                    console.log(`${error.message}`)
                    res
                        .status(500)
                        .send({ name: `${error.name}`, message: `${error.message}` })
                }
            }
        }
    })

    router.get('/get_agreement/:agreement_id', async (req, res) => {
        try {
            const agreementId = req.params.agreement_id
            const agreement_length = await contract.getAgreementsLength()
            if (agreementId < agreement_length) {
                const agreement = await contract.getAgreement(agreementId)
                console.log(agreement)
                const response = JSON.parse(JSON.stringify(formatAgreement(agreement)))
                res.status(200).send(response)
            } else {
                res.status(400).send('Invalid agreement id.')
            }
        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

    router.get('/get_pricing_model/:agreement_id', async (req, res) => {
        try {
            const agreementId = req.params.agreement_id
            const agreement_length = await contract.getAgreementsLength()
            if (agreementId < agreement_length) {
                const pricingModel = await contract.retrievePricingModel(agreementId) 
                const response = JSON.parse(JSON.stringify(formatPricingModel(pricingModel)))
                res.status(200).send(response)
            } else {
                res.status(400).send('Invalid agreement id.')
            }
        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

    router.get('/check_active_agreements', async (req, res) => {
        try {
            const formatedAgreements: ReturnType<typeof formatAgreement>[] = []
            const activeAgreements = await contract.checkActiveAgreements()

            activeAgreements.forEach((agreement) => {
                const formatedAgreement = formatAgreement(agreement)
                console.log(formatedAgreement)
                formatedAgreements.push(formatedAgreement)
            })

            console.log('Number of active agreements: ' + formatedAgreements.length)

            res.status(200).send(formatedAgreements)
        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

    router.get('/check_agreements_by_consumer/:consumer_public_key/:active', async (req, res) => {
        try {
            const consumerPublicKey = req.params.consumer_public_key
            const active :boolean = JSON.parse(req.params.active)
            
            const formatedAgreements: ReturnType<typeof formatAgreement>[] = []
            const activeAgreements = await contract.checkAgreementsByConsumer(
                consumerPublicKey,
                active
            )

            activeAgreements.forEach((agreement) => {
                const formatedAgreement = formatAgreement(agreement)
                formatedAgreements.push(formatedAgreement)
            })

            console.log(
                'Number of active agreements by Consumer: ' + formatedAgreements.length,
            )

            res.status(200).send(formatedAgreements)
        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

    router.get('/check_agreements_by_provider/:provider_public_key/:active', async (req, res) => {
        try {
            const providerPublicKey = req.params.provider_public_key
            const active :boolean = JSON.parse(req.params.active)
            
            const formatedAgreements: ReturnType<typeof formatAgreement>[] = []
            const activeAgreements = await contract.checkAgreementsByProvider(
                providerPublicKey,
                active
            )
            activeAgreements.forEach((agreement) => {
                const formatedAgreement = formatAgreement(agreement)
                console.log(formatedAgreement.providerPublicKey)
                formatedAgreements.push(formatedAgreement)
            })

            console.log(
                'Number of active agreements by Provider: ' + formatedAgreements.length,
            )

            res.status(200).send(formatedAgreements)
        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
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
            const agreements = await contract.checkAgreementsByDataOffering(
                offeringId,
            )

            agreements.forEach((agreement) => {
                const formatedAgreement = formatAgreement(agreement)
                console.log(formatedAgreement.providerPublicKey)
                formatedAgreements.push(formatedAgreement)
            })

            res.status(200).send(formatedAgreements)
        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
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
                console.log(`${error.message}`)
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
                const template = ConvertToTemplate.toTemplate(JSON.stringify(req.body))
                let consentGiven : boolean = true
                if(template.personalData){
                    const consents = await explicitUserConsentContract.checkConsentStatus(template.dataOfferingDescription.dataOfferingId, "")
                    console.log(consents)
                    consents.forEach((consent) => {
                        if(parseInt(consent) == 0){
                            consentGiven = false;
                            throw new Error("Consent was not given for offering " + template.dataOfferingDescription.dataOfferingId)
                        }

                    })
                }
                else if(template.personalData == false || consentGiven == true){
                        const processedTemplate = processTemplate(template)

                        // process input data
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
                    console.log(`${error.message}`)
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

            console.log(receipt.logs[0])

            if (receipt.status == 1) {
                if (receipt.logs.length > 0) {
                    let logs = new ethers.utils.Interface(contractABI).parseLog(
                        receipt.logs[0],
                    )
                    
                    console.log(logs.eventFragment)
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
                        case 'TerminationProposal':
                            type = 'agreement.terminationproposal'
                            message = {
                                agreementId: agreementId
                            }
                            status = 'terminationproposal'
                            break
                        case 'AgreementTerminated':
                            console.log('terminated')
                            type = 'agreement.termination'
                            message = {
                                msg: `Agreement with id: ${agreementId} is terminated`,
                                agreementId: agreementId
                            }
                            status = 'termination'
                            break
                        case 'PenaltyChoices':
                                console.log('penalties')
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
                        case 'ConsentGiven':
                                    console.log('consent given')
                                    const dataOfferingId = logs.args.dataOfferingId
                                    //type = 'consent.revoked'
                                    //iterate through consumers
                                    message = {
                                        msg: `Consent was given for offering: ${dataOfferingId}. `,
                                        agreementId: agreementId,
                                        offeringId: dataOfferingId
                                    }
                                    status = 'given'
                                    break
                        case 'ConsentRevoked':
                                    console.log('consent revoked')
                                    const consumers = logs.args.consumers
                                    const offeringId = logs.args.dataOfferingId
                                    //type = 'consent.revoked'
                                    //iterate through consumers
                                    message = {
                                        msg: `Consent was revoked for offering: ${offeringId}. `,
                                        agreementId: agreementId,
                                        offeringId: offeringId
                                    }
                                    status = 'revoked'
                                    break
                    }

                const origin = 'i3-market'
                const predefined = true
                let publicKey1 = logs.args.providerPublicKey
                const publicKey2 = logs.args.consumerPublicKey
                if(type == 'agreement.terminationproposal')
                    publicKey1 = logs.args.publicKey

                await notify(
                    origin,
                    predefined,
                    type,
                    publicKey1, //`${logs.args.providerPublicKey}`,
                    message,
                    status,
                )
                await notify(
                    origin,
                    predefined,
                    type,
                    publicKey2, //`${logs.args.consumerPublicKey}`,
                    message,
                    status,
                )
                res.status(200).send(formatedTransactionReceipt)
                } else throw new Error('The transaction has no logs.')
            } else throw new Error('Transaction unsuccessful. Status:' + receipt.status)
        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })


    router.get('/retrieve_agreements/:consumer_public_key', async (req, res) => {
        try {
            const consumer_public_key = req.params.consumer_public_key
            const formatedAgreements: ReturnType<typeof formatAgreement>[] = []
            const agreementsTx = await contract.retrieveAgreements(
                consumer_public_key,
            )
            const activeAgreements = agreementsTx[0]
            const length = agreementsTx[1]      //csak a hosszusagig ird ki
            if(length!=0){
                activeAgreements.forEach((agreement) => {
                    const formatedAgreement = formatAgreement(agreement)
                    formatedAgreements.push(formatedAgreement)
                })

                console.log(
                    'Number of active agreements by Consumer Public key: ' +
                    formatedAgreements.length,
                )
                }
                res.status(200).send(formatedAgreements)
        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

    router.post('/evaluate_signed_resolution', async (req, res, next) => {
        try {
            const signedResolution = req.body.proof
            console.log(signedResolution)
            const decodedResolution = await nonRepudiationLibrary.ConflictResolution.verifyResolution(
                signedResolution,
            )

            const trustedIssuers = [
                '{"alg":"ES256","crv":"P-256","d":"ugSiI9ILGgMc5Nc0nAa3qFN3AN0oGba33IAakHqdvmg","kty":"EC","x":"L6WfVXGbH0io6Jpm94S1lpdi6yGtT1OmZ65A_kS_hk8","y":"6YE0oPOpWBqC75D_jtJUfy5lsXlGjO5g6QXivDwMDKc"}',
                '{"alg":"ES256","crv":"P-256","d":"-C4voepzHNpinEkDK6LdC0pdvqhohpZ60jo3qj9MUeY","kty":"EC","x":"4d3u9jd5Ch8oOF3FAqH-EDpzA7VhXxscVwbF5yA-Ds8","y":"SWqpZyQ1GREbLq1oUpO-8zFCq5d64OhCz3sTGnblhzY"}'

            ]
            const proofType = decodedResolution.payload.proofType
            const type = decodedResolution.payload.type
            const resolution = 'accepted' //decodedResolution.payload.resolution //'accepted' - penalties
            const dataExchangeId = decodedResolution.payload.dataExchangeId
            const iat = decodedResolution.payload.iat
            const iss = decodedResolution.payload.iss
            if (!trustedIssuers.includes(iss)) {
                throw new Error('untrusted issuer')
            }
            const sub = decodedResolution.payload.sub


            console.log(dataExchangeId)
            //get agreement id from data access
            const agreementIdJson = await getAgreementId(dataExchangeId)

            if(agreementIdJson.AgreementId == undefined)
                throw new Error(agreementIdJson.msg)
            const agreementId = 0//parseInt(agreementIdJson.AgreementId);

            
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

            //res.status(200).send(decodedResolution.payload)
        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
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
            console.log(agreement.state)
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
                await notify(
                    origin,
                    predefined,
                    type,
                    providerPublicKey,
                    message,
                    status,
                    )
                res.status(200).send(chosenPenalty)
            }
            else throw new Error("Agreement is not violated.")
        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
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
                console.log(`${error.message}`)
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })


    router.put('/request_termination', async (req, res, next) => {
        try {
            const agreementId = req.body.agreementId
            const publicKey = req.body.publicKey
            const senderAddress = req.body.senderAddress
            console.log(publicKey)
            const agreementLength = await contract.getAgreementsLength()
            if (agreementId < agreementLength) {
                const unsignedRequestAgreementTerminationTx = (await contract.populateTransaction.requestAgreementTermination(
                    agreementId,
                    publicKey,
                    { gasLimit: gasLimit },
                    )) as any
                    const formatedRawTransaction = formatTransaction(
                            await createRawTransaction(
                                provider,
                                unsignedRequestAgreementTerminationTx,
                                senderAddress,
                            ),
                    )
            res.status(200).send(formatedRawTransaction)
           } else {
               res.status(400).send('Invalid agreement id.')
           }
            
        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

    router.put('/terminate', async (req, res, next) => {
        try {
            
            const senderAddress = req.body.senderAddress
            const agreementId = req.body.agreementId
            
            const unsignedTerminateAgreementTx = (await contract.populateTransaction.terminateAgreement(
                    agreementId,
                    2,
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
          
        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

    router.post('/give_consent', async (req, res, next) => {
        try {
            const dataOfferingId = req.body.dataOfferingId
            const consentSubject = req.body.consentSubject
            const consentFormHash = req.body.consentFormHash
            const startDate = req.body.startDate
            const endDate = req.body.endDate
            const senderAddress = req.body.senderAddress

            const unsignedGiveConsentTx = (await explicitUserConsentContract.populateTransaction.giveConsent(
                dataOfferingId,
                consentSubject,
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
                console.log(`${error.message}`)
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })


    router.get('/check_consent_status/:dataOfferingId/:consentSubject', async (req, res, next) => {
        try {
            const dataOfferingId = req.params.dataOfferingId
            const consentSubject = req.params.consentSubject
        
            const formatedConsents : any = []
            const consents = await explicitUserConsentContract.checkConsentStatus(dataOfferingId, consentSubject)
            console.log(consents)
            consents.forEach((consent) => {
                formatedConsents.push(parseInt(consent))
            })

            res.status(200).send(formatedConsents)

        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
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
                console.log(`${error.message}`)
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

            console.log(receipt.logs[0])

            if (receipt.status == 1) {
                if (receipt.logs.length > 0) {
                    let logs = new ethers.utils.Interface(contractABIConsent).parseLog(
                        receipt.logs[0],
                    )
                    
                    const eventName = logs.eventFragment.name
                    
                    let message: Object = {}
                    
                    switch (eventName) {
                       
                        case 'ConsentGiven':
                                    console.log('consent given')
                                    const dataOfferingId = logs.args.dataOfferingId
                                    //type = 'consent.revoked'
                                    //iterate through consumers
                                    message = {
                                        msg: `Consent was given for offering: ${dataOfferingId}. `,
                                        offeringId: dataOfferingId
                                    }
                                    
                                    break
                        case 'ConsentRevoked':
                                    const consumers = logs.args.consumers
                                    const offeringId = logs.args.dataOfferingId
                                    //type = 'consent.revoked'
                                    //iterate through consumers
                                    message = {
                                        msg: `Consent was revoked for offering: ${offeringId}. `,
                                        offeringId: offeringId,
                                        consumers:consumers
                                    }
                                   
                                    break
                    }
               
                res.status(200).send(message)
                } else throw new Error('The transaction has no logs.')
            } else throw new Error('Transaction unsuccessful. Status:' + receipt.status)
        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
        
    })


    return router
}
