import { StaticParametersTemplate } from "./staticParametersTemplate";
import { Template } from "./template";
import { ethers } from 'ethers';
import _fetch = require('isomorphic-fetch')

/* ============= Common Functions ==========*/

export function getTemplate(jsonTemplate:Template, staticTemplate:StaticParametersTemplate){
    
    jsonTemplate.DataOfferingDescription.dataOfferingId = staticTemplate.offeringId
    jsonTemplate.DataOfferingDescription.provider = staticTemplate.provider
    jsonTemplate.DataOfferingDescription.category = staticTemplate.category
    jsonTemplate.Purpose = staticTemplate.contractParameters.purpose
    jsonTemplate.hasParties.Parties.dataProvider = staticTemplate.provider
    jsonTemplate.hasIntendedUse.IntendedUse.processData = staticTemplate.contractParameters.hasIntendedUse.processData
    jsonTemplate.hasIntendedUse.IntendedUse.shareDataWithThirdParty = staticTemplate.contractParameters.hasIntendedUse.shareDataWithThirdParty
    jsonTemplate.hasIntendedUse.IntendedUse.editData = staticTemplate.contractParameters.hasIntendedUse.editData
    jsonTemplate.hasLicenseGrant.LicenseGrant.copyData = staticTemplate.contractParameters.hasLicenseGrant.copyData
    jsonTemplate.hasLicenseGrant.LicenseGrant.transferable = staticTemplate.contractParameters.hasLicenseGrant.transferable
    jsonTemplate.hasLicenseGrant.LicenseGrant.exclusiveness = staticTemplate.contractParameters.hasLicenseGrant.exclusiveness
    jsonTemplate.hasLicenseGrant.LicenseGrant.revocable = staticTemplate.contractParameters.hasLicenseGrant.revocable

    return jsonTemplate
}

// export async function createAgreements(contract:ethers.Contract, dataOfferingId:string, purpose:string, consumerId:string, providerId:string, dates:Array<Number>, descriptionOfData:Array<string>, intendedUse:Array<Boolean>, licenseGrant:Array<Boolean>, stream:Boolean) {

//     const gasLimit = 12500000;
//     const createAgreementTx = await contract.createAgreement(dataOfferingId, purpose, consumerId, providerId, dates, descriptionOfData,intendedUse, licenseGrant, stream, {gasLimit: gasLimit})
//     await createAgreementTx.wait();

//     const agreementLength = await contract.getAgreementsLength();
//     const agreementId = parseInt(agreementLength) - 1

//     console.log("Agreement ID is " + agreementId)

//     return agreementId
//   } 

function stringToBoolean(input:string) {

    if(input === "true"){
        return true
    } else if (input === "false"){
        return false
    } else {
        throw new Error('The inserted parameter is not true OR false')
    }
  }

export function processTemplate (template:Template) {

    // process template data
    const dataOfferingId = template.DataOfferingDescription.dataOfferingId
    const purpose = template.Purpose
    const providerId = template.hasParties.Parties.dataProvider
    const consumerId = template.hasParties.Parties.dataConsumer

    const startDate = Number(template.hasDuration.Duration.startDate)
    const endDate = Number(template.hasDuration.Duration.endDate)
    const dates = [startDate, endDate]

    const dataType = template.hasDescriptionOfData.DescriptionOfData.dataType
    const dataFormat = template.hasDescriptionOfData.DescriptionOfData.dataFormat
    const dataSource = template.hasDescriptionOfData.DescriptionOfData.dataSource
    const descriptionOfData = [dataType, dataFormat, dataSource]

    const processData = template.hasIntendedUse.IntendedUse.processData
    const shareDataWithThirdParty = template.hasIntendedUse.IntendedUse.shareDataWithThirdParty
    const editData = template.hasIntendedUse.IntendedUse.editData
    const intendedUse = [processData, shareDataWithThirdParty, editData]

    const copyData = template.hasLicenseGrant.LicenseGrant.copyData
    const transferable = template.hasLicenseGrant.LicenseGrant.transferable
    const exclusiveness = template.hasLicenseGrant.LicenseGrant.revocable
    const revocable = template.hasLicenseGrant.LicenseGrant.revocable
    const licenseGrant = [copyData, transferable, exclusiveness, revocable]

    const dataStream = template.DataStream

    console.log("dataofferingId => "+dataOfferingId+" purpose => "+purpose+" consumerId => "+consumerId+" providerId => "+providerId+
    " dates => ["+startDate+","+endDate+"] descriptionOfDate => ["+dataType+","+dataFormat+","+dataSource+"] intendedUse => ["
    +processData+","+shareDataWithThirdParty+","+editData+"] licenseGrant => ["+copyData+","+transferable+","+exclusiveness+","+revocable+"] dataStream => "+dataStream)

    return {
        dataOfferingId: dataOfferingId,
        purpose: purpose,
        providerId: providerId,
        consumerId: consumerId,
        dates: dates,
        descriptionOfData: descriptionOfData,
        intendedUse: intendedUse,
        licenseGrant: licenseGrant,
        dataStream: dataStream
    }
  }

export function formatAgreement(agreement:any) {
    
    return {
        dataOfferingId: agreement.dataOfferingId,
        purpose: agreement.purpose,
        state: agreement.state,
        providerId: agreement.providerId,
        consumerId: agreement.consumerId,
        agreementDates: [parseInt(agreement.agreementDates[0]), parseInt(agreement.agreementDates[1]), parseInt(agreement.agreementDates[2])],
        descriptionOfData: { 
            dataType: agreement.descriptionOfData.dataType,
            dataFormat: agreement.descriptionOfData.dataFormat,
            dataSource: agreement.descriptionOfData.dataSource
        },
        intendedUse: {
            processData: agreement.intendedUse.processData,
            sharedDataWithThirdParty: agreement.intendedUse.sharedDataWithThirdParty,
            editData: agreement.intendedUse.editData
        },
        licenseGrant: {
            copyData: agreement.licenseGrant.copyData,
            transferable: agreement.licenseGrant.transferable,
            exclusiveness: agreement.licenseGrant.exclusiveness,
            revocable: agreement.licenseGrant.revocable
        },
        dataStream: agreement.dataStream,
        signed: agreement.signed,
        violation: [
            agreement.violation[0],
            agreement.violation[1],
            {
                violationType: agreement.violation.violationType,
                issuerId: agreement.violation.issuerId
            }
        ]
    }

}

export function formatTransaction(transaction:any) {
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

export function formatTransactionReceipt(transaction:any) {
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

export async function notify (origin: string, predefined: boolean, type: string, receiver_id: string, message: Object, status: string) {

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
    // let notification_send = await _fetch(`${process.env.NOTIFICATION_MANAGER_URL}/api/v1/notification`, {
    //     method: 'POST',
    //     headers: {
    //         'Accept': 'application/json',
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify(notification),
    // })
}

export function getState(state:number) {

    let response

    switch(state){
        case 0 : {
            response = {state: "created"}
            break
        }
        case 1 : {
            response = {state: "active"}
            break
        }
        case 2: {
            response = {state: "updated"}
            break
        }
        case 3: {
            response = {state: "violated"}
            break
        }
        case 4: {
            response = {state: "terminated"}
            break
        }
        default: {
            response = {state: "undefined"}
            break
        }
    }

    return response
}

export function parseHex (a: string, prefix0x: boolean = false): string {
    const hexMatch = a.match(/^(0x)?([\da-fA-F]+)$/)
    if (hexMatch == null) {
      throw new Error('input must be a hexadecimal string, e.g. \'0x124fe3a\' or \'0214f1b2\'')
    }
    const hex = hexMatch[2].toLocaleLowerCase()
    return (prefix0x) ? '0x' + hex : hex
  }
  