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

const provider = new ethers.providers.JsonRpcProvider(providerAddress)
//const signer = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, contractABI, provider)

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
                //parsedToJson.active = false
                // if(!parsedToJson.active){
                //     //notification
                //     console.log("Not allowed to purchase, data offering is not active")
                // }
                // Add static parameters to JSON template
                const staticTemplate: StaticParametersTemplate = ConvertToStaticParametersTemplate.toStaticParametersTemplate(
                    JSON.stringify(parsedToJson),
                )
                const jsonTemplate: Template = ConvertToTemplate.toTemplate(
                    JSON.stringify(jsonTemplateFile),
                )

                let template: Template = getTemplate(jsonTemplate, staticTemplate)

                template.pricingModel.fee = parseInt(await getFee(template.pricingModel.basicPrice))

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
                const processedTemplate = processTemplate(template)

                // process input data
                const providerPublicKey = processedTemplate.providerPublicKey
                const consumerPublicKey = processedTemplate.consumerPublicKey
                const dataExchangeAgreementHash =
                    processedTemplate.dataExchangeAgreementHash
                const dataOfferingId = processedTemplate.dataOfferingId
                const version = processedTemplate.dataOfferingVersion
                const dataOfferingTitle = processedTemplate.dataOfferingTitle
                const purpose = processedTemplate.purpose
                const dates = processedTemplate.dates
                //const descriptionOfData = processedTemplate.descriptionOfData
                const obligation = processedTemplate.obligation;
                const intendedUse = processedTemplate.intendedUse
                const licenseGrant = processedTemplate.licenseGrant
                const typeOfData = processedTemplate.typeOfData
                //const dataStream = processedTemplate.dataStream
                const pricingModel= processedTemplate.pricingModel

                //invalid BigNumber string (argument="value", value="payment on subscription", code=INVALID_ARGUMENT, version=bignumber/5.6.0)
                //nem kell az egesz pricingModel

                const unsignedCreateAgreementTx = (await contract.populateTransaction.createAgreement(
                    providerPublicKey,
                    consumerPublicKey,
                    dataExchangeAgreementHash,
                    [dataOfferingId, version, dataOfferingTitle],
                    purpose,
                    dates,
                    obligation,
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
            const signedTx = req.body.signed_transaction

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
                    //filter events based on public key
                    // consumer subscribes to did and public key events
                    console.log(logs.eventFragment)
                    const eventName = logs.eventFragment.name

                    let type: string = 'unrecognizedEvent'
                    let message: Object = {}
                    let status: string = 'unrecognizedEvent'
                    const agreementId = parseInt(logs.args.id)
                    switch (eventName) {
                        case 'AgreementCreated':
                            console.log('created')
                            type = 'agreement.pending'
                            message = {
                                msg: `Agreement with the id: ${agreementId} was created`,
                                agreementId: agreementId
                            }
                            status = 'pending'
                            break
                        case 'AgreementSigned':
                            console.log('signed')
                            type = 'agreement.accepted' 
                            message = { 
                                msg: `Agreement with id: ${agreementId} was signed`,
                                agreementId: agreementId 
                            }
                            status = 'accepted'
                            break
                        case 'AgreementUpdated':
                            console.log('updated')
                            type = 'agreement.update'
                            message = {
                                msg: `Agreement with the id: ${agreementId} was updated`,
                                agreementId: agreementId
                            }
                            status = 'update'
                            break
                        case 'AgreementTerminated':
                            console.log('terminated')
                            type = 'agreement.termination'
                            message = {
                                msg: `Agreement with id: ${agreementId} was terminated`,
                                agreementId: agreementId
                            }
                            status = 'termination'
                            break
                    }

                const origin = 'scm'
                const predefined = true
                await notify(
                    origin,
                    predefined,
                    type,
                    `${logs.args.providerPublicKey}`,
                    message,
                    status,
                )
                await notify(
                    origin,
                    predefined,
                    type,
                    `${logs.args.consumerPublicKey}`,
                    message,
                    status,
                )
                res.status(200).send(formatedTransactionReceipt)
                } else throw new Error('The transaction has no logs.')
            } else throw new Error('Transaction unsuccessful. Status:'+receipt.status)
        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

     router.post('/deploy_signed_transaction', async (req, res, next) => {
        try {
            const signedTx = req.body.signed_transaction

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
                        case 'AgreementCreated':
                            console.log('created')
                            type = 'agreement.pending'
                            message = {
                                msg: `Agreement with the id: ${agreementId} was created`,
                                agreementId: agreementId
                            }
                            status = 'pending'
                            break
                        case 'AgreementSigned':
                            console.log('signed')
                            type = 'agreement.accepted' 
                            message = { 
                                msg: `Agreement with id: ${agreementId} was signed`,
                                agreementId: agreementId 
                            }
                            status = 'accepted'
                            break
                        case 'AgreementUpdated':
                            console.log('updated')
                            type = 'agreement.update'
                            message = {
                                msg: `Agreement with the id: ${agreementId} was updated`,
                                agreementId: agreementId
                            }
                            status = 'update'
                            break
                        case 'AgreementTerminated':
                            console.log('terminated')
                            type = 'agreement.termination'
                            message = {
                                msg: `Agreement with id: ${agreementId} was terminated`,
                                agreementId: agreementId
                            }
                            status = 'termination'
                            break
                    }

                const origin = 'scm'
                const predefined = true
                await notify(
                    origin,
                    predefined,
                    type,
                    `${logs.args.providerPublicKey}`,
                    message,
                    status,
                )
                await notify(
                    origin,
                    predefined,
                    type,
                    `${logs.args.consumerPublicKey}`,
                    message,
                    status,
                )
                res.status(200).send(formatedTransactionReceipt)
                } else throw new Error('The transaction has no logs.')
            } else throw new Error('Transaction unsuccessful. Status:'+receipt.status)
        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

    // router.put(
    //     '/update_agreement_raw_transaction/:agreement_id/:sender_address',
    //     async (req, res) => {
    //         try {
    //             const agreementId = req.params.agreement_id
    //             const senderAddress = req.params.sender_address
    //             const template = ConvertToTemplate.toTemplate(JSON.stringify(req.body))
    //             const processedTemplate = processTemplate(template)

    //             // process input data
    //             const providerPublicKey = processedTemplate.providerPublicKey
    //             const consumerPublicKey = processedTemplate.consumerPublicKey
    //             const dataOfferingId = processedTemplate.dataOfferingId
    //             const purpose = processedTemplate.purpose
    //             const dates = processedTemplate.dates
    //             const dates2 = [dates[1],dates[2]]
    //             //const descriptionOfData = processedTemplate.descriptionOfData
    //             const intendedUse = processedTemplate.intendedUse
    //             const licenseGrant = processedTemplate.licenseGrant
    //             const dataStream = processedTemplate.typeOfData

    //             const unsignedUpdateAgreementTx = (await contract.populateTransaction.updateAgreement(
    //                 agreementId,
    //                 providerPublicKey,
    //                 consumerPublicKey,
    //                 dataOfferingId,
    //                 purpose,
    //                 dates2,
    //                 intendedUse,
    //                 licenseGrant,
    //                 dataStream,
    //                 { gasLimit: gasLimit },
    //             )) as any

    //             const formatedRawTransaction = formatTransaction(
    //                 await createRawTransaction(
    //                     provider,
    //                     unsignedUpdateAgreementTx,
    //                     senderAddress,
    //                 ),
    //             )
    //             res.status(200).send(formatedRawTransaction)
    //         } catch (error) {
    //             if (error instanceof Error) {
    //                 console.log(`${error.message}`)
    //                 res
    //                     .status(500)
    //                     .send({ name: `${error.name}`, message: `${error.message}` })
    //             }
    //         }
    //     },
    // )

    router.put('/sign_agreement_raw_transaction', async (req, res) => {
        try {
            const agreementId = req.body.agreement_id
            const consumerPublicKey = req.body.consumer_public_key
            const senderAddress = req.body.consumer_ethereum_address

            const unsignedSignAgreementTx = (await contract.populateTransaction.signAgreement(
                agreementId,
                consumerPublicKey,
                { gasLimit: gasLimit },
            )) as any
            const formatedRawTransaction = formatTransaction(
                await createRawTransaction(
                    provider,
                    unsignedSignAgreementTx,
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


    router.get('/retrieve_agreements/:consumer_public_key', async (req, res) => {
        try {
            const consumer_public_key = req.params.consumer_public_key
            const formatedAgreements: ReturnType<typeof formatAgreement>[] = []
            const agreementsTx = await contract.retrieveAgreements(
                consumer_public_key,
            )
            const activeAgreements = agreementsTx[0]
            const length = agreementsTx[1]
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
            ]
            const proofType = decodedResolution.payload.proofType
            const type = decodedResolution.payload.type
            const resolution = decodedResolution.payload.resolution //'accepted' - penalties
            const dataExchangeId = decodedResolution.payload.dataExchangeId
            const iat = decodedResolution.payload.iat
            const iss = decodedResolution.payload.iss
            if (!trustedIssuers.includes(iss)) {
                throw new Error('untrusted issuer')
            }
            const sub = decodedResolution.payload.sub

        
            const exchangeIdTest = "OdAeDSkyqK0s6zS059YGnpOkg7s-Dl6SeJj9B9yfhbk"
            const agreementIdTest = await getAgreementId(exchangeIdTest)
            console.log(agreementIdTest)

            console.log(dataExchangeId)
            //get agreement id from data access
            const agreementId = await getAgreementId(dataExchangeId)

            console.log(agreementId)
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

    // router.get('/present_penalty_choices/:agreement_id', async (req, res) => {
    //     try {
    //         const agreement_id = req.params.agreement_id
    //         const penalties = await contract.presentPenaltyChoices(agreement_id)
    //         res.status(200).send(penalties)
    //     } catch (error) {
    //         if (error instanceof Error) {
    //             console.log(`${error.message}`)
    //             res
    //                 .status(500)
    //                 .send({ name: `${error.name}`, message: `${error.message}` })
    //         }
    //     }
    // })


    // router.put('/enforce_penalty', async (req, res) => {
    //     try {
           
    //         const agreementId = req.body.agreementId
    //         const chosenPenalty = req.body.chosenPenalty
    //         //check chosenPenalty -> just if NewEndDateForProviderAndReductionOfPayment calculate price
    //         const paymentPercentage = req.body.paymentPercentage
    //         //check new end date
    //         const newEndDate = req.body.newEndDate
    //         const senderAddress = req.body.senderAddress
    //         const oldPrice = 100 // get price
    //         const price = oldPrice - (oldPrice * paymentPercentage/100)
    //         const fee = parseInt(await getFee(price))
    //         console.log(price)
    //         console.log(fee)

    //         const unsignedEnforcePenaltyTx = (await contract.populateTransaction.enforcePenalty(
    //             agreementId,
    //             chosenPenalty,
    //             price,
    //             fee,
    //             newEndDate,
    //             { gasLimit: gasLimit },
    //         )) as any
        
    //         const formatedRawTransaction = formatTransaction(
    //             await createRawTransaction(
    //                 provider,
    //                 unsignedEnforcePenaltyTx,
    //                 senderAddress,
    //             ),
    //         )
    //         res.status(200).send(formatedRawTransaction)

    //     } catch (error) {
    //         if (error instanceof Error) {
    //             console.log(`${error.message}`)
    //             res
    //                 .status(500)
    //                 .send({ name: `${error.name}`, message: `${error.message}` })
    //         }
    //     }
    // })

    router.put('/terminate', async (req, res, next) => {
        try {
            const agreementId = req.body.agreement_id
            const senderAddress = req.body.sender_address
            const agreement = await contract.getAgreement(agreementId)
            
            const unsignedTerminateAgreementTx = (await contract.populateTransaction.terminateAgreement(
                    agreementId,
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
          
                // const signedResolution = req.body.proof
                // console.log(signedResolution)
                // const decodedResolution = await nonRepudiationLibrary.ConflictResolution.verifyResolution(
                //     signedResolution,
                // )

                // const trustedIssuers = [
                //     '{"alg":"ES256","crv":"P-256","d":"ugSiI9ILGgMc5Nc0nAa3qFN3AN0oGba33IAakHqdvmg","kty":"EC","x":"L6WfVXGbH0io6Jpm94S1lpdi6yGtT1OmZ65A_kS_hk8","y":"6YE0oPOpWBqC75D_jtJUfy5lsXlGjO5g6QXivDwMDKc"}',
                // ]
                // const proofType = decodedResolution.payload.proofType
                // const type = decodedResolution.payload.type
                // const resolution = decodedResolution.payload.resolution
                // const dataExchangeId = decodedResolution.payload.dataExchangeId
                // const iat = decodedResolution.payload.iat
                // const iss = decodedResolution.payload.iss
                // if (!trustedIssuers.includes(iss)) {
                //     throw new Error('untrusted issuer')
                // }
                // const sub = decodedResolution.payload.sub

                // if (resolution === 'completed' || resolution === 'denied') {
                // //const exchangeId = "OdAeDSkyqK0s6zS059YGnpOkg7s-Dl6SeJj9B9yfhbk"
                //     const agreementId = await getAgreementId(dataExchangeId)
                
                //     const unsignedTerminateAgreementTx = (await contract.populateTransaction.terminateAgreement(
                //     agreementId,
                //     { gasLimit: gasLimit },
                //     )) as any
                //     const formatedRawTransaction = formatTransaction(
                //             await createRawTransaction(
                //                 provider,
                //                 unsignedTerminateAgreementTx,
                //                 senderAddress,
                //             ),
                //     )
                //     res.status(200).send(formatedRawTransaction)
                // } else res.status(400).send('Agreement cannot be terminated.')
            
        } catch (error) {
            if (error instanceof Error) {
                console.log(`${error.message}`)
                res
                    .status(500)
                    .send({ name: `${error.name}`, message: `${error.message}` })
            }
        }
    })

    // router.post('/give_consent', async (req, res, next) => {
    //     try {
    //         const dataOfferingId = req.body.dataOfferingId
    //         const consentFormHash = req.body.consentFormHash
    //         const startDate = req.body.startDate
    //         const endDate = req.body.endDate
    //         const senderAddress = req.body.sender_address
    //         //receive consent subject 

    //         //not needed anymore
    //         // const keyPair = await nonRepudiationLibrary.generateKeys("ES256")
    //         // const publicKey = JSON.stringify(keyPair.publicJwk) //store consent subject
    //         // const privateKey = JSON.stringify(keyPair.privateJwk)
    //         // const pubKey = nonRepudiationLibrary.importJwk(JSON.parse(publicKey))
           
          
            
    //         // const unsignedGiveConsentTx = (await contract.populateTransaction.giveConsent(
    //         //     dataOfferingId,
    //         //     { gasLimit: gasLimit },
    //         //     )) as any
    //         //     const formatedRawTransaction = formatTransaction(
    //         //             await createRawTransaction(
    //         //                 provider,
    //         //                 unsignedGiveConsentTx,
    //         //                 senderAddress,
    //         //             ),
    //         //     )
    //         // res.status(200).send(formatedRawTransaction)
    //         res.status(200).send(req.body)
    //     } catch (error) {
    //         if (error instanceof Error) {
    //             console.log(`${error.message}`)
    //             res
    //                 .status(500)
    //                 .send({ name: `${error.name}`, message: `${error.message}` })
    //         }
    //     }
    // })

    return router
}
