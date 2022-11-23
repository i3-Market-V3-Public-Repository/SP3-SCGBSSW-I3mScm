import { StaticParametersTemplate } from "./staticParametersTemplate";
import { Template } from "./template";
import { ethers } from 'ethers';
import _fetch = require('isomorphic-fetch')
import * as objectSha from 'object-sha'
import { json } from "express";
import { resolveProperties } from "ethers/lib/utils";

/* ============= Common Functions ==========*/

export function getTemplate(jsonTemplate: Template, staticTemplate: StaticParametersTemplate) {

    jsonTemplate.dataOfferingDescription.dataOfferingId = staticTemplate.offeringId
    jsonTemplate.dataOfferingDescription.version = staticTemplate.version
    jsonTemplate.dataOfferingDescription.category = staticTemplate.category
    jsonTemplate.dataOfferingDescription.title = staticTemplate.dataOfferingTitle
    jsonTemplate.dataOfferingDescription.active = staticTemplate.active

    jsonTemplate.parties.providerDid = staticTemplate.providerDid

    jsonTemplate.purpose = staticTemplate.contractParameters.purpose
    
    jsonTemplate.intendedUse.processData = staticTemplate.contractParameters.hasIntendedUse.processData
    jsonTemplate.intendedUse.shareDataWithThirdParty = staticTemplate.contractParameters.hasIntendedUse.shareDataWithThirdParty
    jsonTemplate.intendedUse.editData = staticTemplate.contractParameters.hasIntendedUse.editData

    jsonTemplate.licenseGrant.transferable = staticTemplate.contractParameters.hasLicenseGrant.transferable
    jsonTemplate.licenseGrant.exclusiveness = staticTemplate.contractParameters.hasLicenseGrant.exclusiveness
    jsonTemplate.licenseGrant.paidUp = staticTemplate.contractParameters.hasLicenseGrant.paidUp
    jsonTemplate.licenseGrant.revocable = staticTemplate.contractParameters.hasLicenseGrant.revocable
    jsonTemplate.licenseGrant.processing = staticTemplate.contractParameters.hasLicenseGrant.processing
    jsonTemplate.licenseGrant.modifying = staticTemplate.contractParameters.hasLicenseGrant.modifying
    jsonTemplate.licenseGrant.analyzing = staticTemplate.contractParameters.hasLicenseGrant.analyzing
    jsonTemplate.licenseGrant.storingData = staticTemplate.contractParameters.hasLicenseGrant.storingData
    jsonTemplate.licenseGrant.storingCopy = staticTemplate.contractParameters.hasLicenseGrant.storingCopy
    jsonTemplate.licenseGrant.reproducing = staticTemplate.contractParameters.hasLicenseGrant.reproducing
    jsonTemplate.licenseGrant.distributing = staticTemplate.contractParameters.hasLicenseGrant.distributing
    jsonTemplate.licenseGrant.loaning = staticTemplate.contractParameters.hasLicenseGrant.loaning
    jsonTemplate.licenseGrant.selling = staticTemplate.contractParameters.hasLicenseGrant.selling
    jsonTemplate.licenseGrant.renting = staticTemplate.contractParameters.hasLicenseGrant.renting
    jsonTemplate.licenseGrant.furtherLicensing = staticTemplate.contractParameters.hasLicenseGrant.furtherLicensing
    jsonTemplate.licenseGrant.leasing = staticTemplate.contractParameters.hasLicenseGrant.leasing

    jsonTemplate.dataStream = staticTemplate.dataStream
    jsonTemplate.personalData = staticTemplate.personalData

    jsonTemplate.pricingModel.pricingModelName = staticTemplate.hasPricingModel.pricingModelName
    if(staticTemplate.dataStream)
        jsonTemplate.pricingModel.paymentType = "payment on subscription"
    else jsonTemplate.pricingModel.paymentType = "one-time purchase"
    jsonTemplate.pricingModel.basicPrice = staticTemplate.hasPricingModel.basicPrice
    jsonTemplate.pricingModel.currency = staticTemplate.hasPricingModel.currency
    
    jsonTemplate.pricingModel.hasPaymentOnSubscription.paymentOnSubscriptionName = staticTemplate.hasPricingModel.hasPaymentOnSubscription.paymentOnSubscriptionName
    jsonTemplate.pricingModel.hasPaymentOnSubscription.paymentType = staticTemplate.hasPricingModel.hasPaymentOnSubscription.paymentType
    jsonTemplate.pricingModel.hasPaymentOnSubscription.timeDuration = staticTemplate.hasPricingModel.hasPaymentOnSubscription.timeDuration
    jsonTemplate.pricingModel.hasPaymentOnSubscription.description = staticTemplate.hasPricingModel.hasPaymentOnSubscription.description
    jsonTemplate.pricingModel.hasPaymentOnSubscription.repeat = staticTemplate.hasPricingModel.hasPaymentOnSubscription.repeat
    jsonTemplate.pricingModel.hasPaymentOnSubscription.hasSubscriptionPrice = staticTemplate.hasPricingModel.hasPaymentOnSubscription.hasSubscriptionPrice
    
    jsonTemplate.pricingModel.hasFreePrice.hasPriceFree = staticTemplate.hasPricingModel.hasFreePrice.hasPriceFree

    jsonTemplate.dataExchangeAgreement.encAlg = staticTemplate.dataExchangeSpec.encAlg
    jsonTemplate.dataExchangeAgreement.signingAlg = staticTemplate.dataExchangeSpec.signingAlg
    jsonTemplate.dataExchangeAgreement.hashAlg = staticTemplate.dataExchangeSpec.hashAlg
    jsonTemplate.dataExchangeAgreement.ledgerContractAddress = staticTemplate.dataExchangeSpec.ledgerContractAddress
    jsonTemplate.dataExchangeAgreement.ledgerSignerAddress = staticTemplate.dataExchangeSpec.ledgerSignerAddress
    jsonTemplate.dataExchangeAgreement.pooToPorDelay = staticTemplate.dataExchangeSpec.pooToPorDelay
    jsonTemplate.dataExchangeAgreement.pooToPopDelay = staticTemplate.dataExchangeSpec.pooToPopDelay
    jsonTemplate.dataExchangeAgreement.pooToSecretDelay = staticTemplate.dataExchangeSpec.pooToSecretDelay
    

    return jsonTemplate
}


export async function getFee(price: number) {
    let feeRequest: any = await _fetch(
        `${process.env.BACKPLANE_URL}/pricingManager/fee/getfee?price=${price}`,
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

    const feeJson = await feeRequest.json()

    const fee : string = feeJson

    return fee

}


export function processTemplate(template: Template) {

    // process template data

    const providerPublicKey = template.dataExchangeAgreement.orig
    const consumerPublicKey = template.dataExchangeAgreement.dest
    const dataExchangeAgreement = template.dataExchangeAgreement
    const obj = { src: 'A', dst: 'B', msg: { dataExchangeAgreement } }

    const dataExchangeAgreementHash = objectSha.digest(obj, template.dataExchangeAgreement.hashAlg) 

    const dataOfferingId = template.dataOfferingDescription.dataOfferingId
    const dataOfferingVersion = template.dataOfferingDescription.version
    const dataOfferingTitle = template.dataOfferingDescription.title

    const purpose = template.purpose
 
    const date = new Date()
    const creationDate = Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate(),).getTime() / 1000)
    const startDate = template.duration.startDate
    const endDate = template.duration.endDate
    if(startDate < creationDate){
        throw new Error('Start date should be after creation date')
    }
    else if(startDate > endDate){
        throw new Error('Start date should be before end date')
    }

    const dates = [creationDate, startDate, endDate]

    const processData = template.intendedUse.processData
    const shareDataWithThirdParty = template.intendedUse.shareDataWithThirdParty
    const editData = template.intendedUse.editData
    const intendedUse = [processData, shareDataWithThirdParty, editData]

    const transferable = template.licenseGrant.transferable
    const exclusiveness = template.licenseGrant.revocable
    const paidUp = template.licenseGrant.paidUp
    const revocable = template.licenseGrant.revocable
    const processing = template.licenseGrant.processing
    const modifying = template.licenseGrant.modifying
    const analyzing = template.licenseGrant.analyzing
    const storingData = template.licenseGrant.storingData
    const storingCopy = template.licenseGrant.storingCopy
    const reproducing = template.licenseGrant.reproducing
    const distributing = template.licenseGrant.distributing
    const loaning = template.licenseGrant.loaning
    const selling = template.licenseGrant.selling
    const renting = template.licenseGrant.renting
    const furtherLicensing = template.licenseGrant.furtherLicensing
    const leasing = template.licenseGrant.leasing

    const licenseGrant = [transferable, exclusiveness, paidUp, revocable, processing, modifying, analyzing, storingData, storingCopy,
        reproducing, distributing, loaning, selling, renting, furtherLicensing, leasing]

    const dataStream = template.dataStream
    const personalData = template.personalData
    const typeOfData = [dataStream, personalData]

    const paymentType = template.pricingModel.paymentType
    const basicPrice = template.pricingModel.basicPrice
    const currency = template.pricingModel.currency
    const fee =template.pricingModel.fee

    const timeDuration = template.pricingModel.hasPaymentOnSubscription.timeDuration

    const repeat = template.pricingModel.hasPaymentOnSubscription.repeat
  
    const freePrice = template.pricingModel.hasFreePrice.hasPriceFree

    const pricingModel = [paymentType, basicPrice*100, currency, fee*100, [timeDuration,repeat], freePrice]

    const signatures = [template.signatures.providerSignature, template.signatures.consumerSignature]

    return {
        providerPublicKey: providerPublicKey,
        consumerPublicKey: consumerPublicKey,
        dataExchangeAgreementHash: dataExchangeAgreementHash,
        signatures: signatures,
        dataOfferingId: dataOfferingId,
        dataOfferingVersion: dataOfferingVersion,
        dataOfferingTitle,
        purpose: purpose,
        dates: dates,
        intendedUse: intendedUse,
        licenseGrant: licenseGrant,
        typeOfData: typeOfData,
        pricingModel: pricingModel,
    }
}




export function formatAgreement(agreement: any) {

    return {
        agreementId: parseInt(agreement.agreementId),
        providerPublicKey: agreement.providerPublicKey,
        consumerPublicKey: agreement.consumerPublicKey,
        dataExchangeAgreementHash: agreement.dataExchangeAgreementHash,
        dataOffering: {
            dataOfferingId: agreement.dataOffering.dataOfferingId,
            dataOfferingVersion: parseInt(agreement.dataOffering.dataOfferingVersion),
            dataOfferingTitle: agreement.dataOffering.title
        },
        purpose: agreement.purpose,
        state: agreement.state, 
        agreementDates: [parseInt(agreement.agreementDates[0]), parseInt(agreement.agreementDates[1]), parseInt(agreement.agreementDates[2])],
        intendedUse: {
            processData: agreement.intendedUse.processData,
            shareDataWithThirdParty: agreement.intendedUse.shareDataWithThirdParty,
            editData: agreement.intendedUse.editData
        },
        licenseGrant: {
            transferable: agreement.licenseGrant.transferable,
            exclusiveness: agreement.licenseGrant.exclusiveness,
            paidUp: agreement.licenseGrant.paidUp,
            revocable: agreement.licenseGrant.revocable,
            processing: agreement.licenseGrant.processing,
            modifying: agreement.licenseGrant.modifying,
            analyzing: agreement.licenseGrant.analyzing,
            storingData: agreement.licenseGrant.storingData,
            storingCopy: agreement.licenseGrant.storingCopy,
            reproducing: agreement.licenseGrant.reproducing,
            distributing: agreement.licenseGrant.distributing,
            loaning: agreement.licenseGrant.loaning,
            selling: agreement.licenseGrant.selling,
            renting: agreement.licenseGrant.renting,
            furtherLicensing: agreement.licenseGrant.furtherLicensing,
            leasing: agreement.licenseGrant.leasing,
            
        },
        dataStream: agreement.typeOfData.dataStream,
        personalData: agreement.typeOfData.personalData,
        pricingModel: {
            paymentType: agreement.pricingModel.paymentType,
            price: parseInt(agreement.pricingModel.price)/100,
            currency: agreement.pricingModel.currency,
            fee: parseInt(agreement.pricingModel.fee)/100,
            paymentOnSubscription:
                {
                    timeDuration: agreement.pricingModel.paymentOnSubscription.timeDuration,
                    repeat: agreement.pricingModel.paymentOnSubscription.repeat
                },
            isFree: agreement.pricingModel.isFree
        },
        violation: {
                violationType: parseInt(agreement.violation.violationType),
        },
        signatures: {
            providerSignature: agreement.signatures[0],
            consumerSignature: agreement.signatures[1]
        },
    }

}


export function formatPricingModel(pricingModel: any) {

    return {
        pricingModel: {
            paymentType: pricingModel.paymentType,
            price: parseInt(pricingModel.price)/100,
            currency: pricingModel.currency,
            fee: parseInt(pricingModel.fee)/100,
            paymentOnSubscription:
                {
                    timeDuration: pricingModel.paymentOnSubscription.timeDuration,
                    repeat: pricingModel.paymentOnSubscription.repeat
                },
            isFree: pricingModel.isFree
        }
    }

}

export function formatTransaction(transaction: any) {
    return {
        nonce: transaction.nonce,
        to: transaction.to,
        from: transaction.from,
        gasLimit: parseInt(transaction.gasLimit),
        gasPrice: parseInt(transaction.gasPrice),
        chainId: parseInt(transaction.chainId),
        data: transaction.data
    }
}

export function formatTransactionReceipt(transaction: any) {
    return {
        transactionHash: transaction.transactionHash,
        transactionIndex: transaction.transactionIndex,
        blockHash: transaction.blockHash,
        blockNumber: transaction.blockNumber,
        contractAddress: transaction.contractAddress,
        cumulativeGasUsed: parseInt(transaction.cumulativeGasUsed),
        to: transaction.to,
        from: transaction.from,
        gasUsed: parseInt(transaction.gasUsed),
        logsBloom: transaction.logsBloom,
        logs: transaction.logs,
        confirmations: transaction.confirmations,
        status: transaction.status,
    }
}

export async function notify(origin: string, predefined: boolean, type: string, receiver_id: string, message: Object, status: string) {

    try{
        const notification = {
            origin: origin,
            predefined: predefined,
            type: type,
            receiver_id: receiver_id,
            message: message,
            status: status
        }
        let notification_send = await _fetch(`${process.env.BACKPLANE_URL}/notification-manager-oas/api/v1/notification`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(notification),
        })
    } catch (error) {
        if (error instanceof Error) {
            console.log(`${error.message}`)
        }
    }

}

export function getState(state: number) {

    let response

    switch (state) {
        case 0: {
            response = { state: "active" }
            break
        }
        case 1: {
            response = { state: "violated" }
            break
        }
        case 2: {
            response = { state: "terminated" }
            break
        }
        default: {
            response = { state: "undefined" }
            break
        }
    }

    return response
}

export function parseHex(a: string, prefix0x: boolean = false): string {
    const hexMatch = a.match(/^(0x)?([\da-fA-F]+)$/)
    if (hexMatch == null) {
        throw new Error('input must be a hexadecimal string, e.g. \'0x124fe3a\' or \'0214f1b2\'')
    }
    const hex = hexMatch[2].toLocaleLowerCase()
    return (prefix0x) ? '0x' + hex : hex
}

export async function getAgreementId(exchangeId: string) {
    try {
        let agreementIdRequest: any = await _fetch(`${process.env.DATA_ACCESS_URL}/agreement/getAgreementId/${exchangeId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        }).catch((error: any) => {
            console.error('Error:', error)
        })

        const agreementIdJson = await agreementIdRequest.json();

       return agreementIdJson;

    } catch (error) {
        if (error instanceof Error) {
            console.log(`${error.message}`)

        }

    }
}

export async function createRawTransaction(provider: any, unsignedTx: any, sender_address: string) {

    unsignedTx.nonce = await provider.getTransactionCount(sender_address)
    unsignedTx.gasLimit = unsignedTx.gasLimit?._hex
    unsignedTx.gasPrice = (await provider.getGasPrice())._hex
    unsignedTx.chainId = (await provider.getNetwork()).chainId
    unsignedTx.from = parseHex(sender_address, true)

    return unsignedTx;
}



