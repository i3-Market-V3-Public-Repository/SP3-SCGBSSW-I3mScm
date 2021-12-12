import { StaticParametersTemplate } from "./staticParametersTemplate";
import { Template } from "./template";
import { ethers } from 'ethers';

/* ============= Common Functions ==========*/

export function getTemplate(jsonTemplate:Template, staticTemplate:StaticParametersTemplate){
    
    jsonTemplate.DataOfferingDescription.dataOfferingId = staticTemplate.dataOfferingId
    jsonTemplate.DataOfferingDescription.provider = staticTemplate.provider
    jsonTemplate.DataOfferingDescription.category = staticTemplate.category
    jsonTemplate.Purpose = staticTemplate.contractParameters[0].purpose
    jsonTemplate.hasParties.Parties.dataProvider = staticTemplate.provider
    jsonTemplate.hasIntendedUse.IntendedUse.processData = staticTemplate.contractParameters[0].hasIntendedUse[0].processData
    jsonTemplate.hasIntendedUse.IntendedUse.shareDataWithThirdParty = staticTemplate.contractParameters[0].hasIntendedUse[0].shareDataWithThirdParty
    jsonTemplate.hasIntendedUse.IntendedUse.editData = staticTemplate.contractParameters[0].hasIntendedUse[0].editData
    jsonTemplate.hasLicenseGrant.LicenseGrant.copyData = staticTemplate.contractParameters[0].hasLicenseGrant[0].copyData
    jsonTemplate.hasLicenseGrant.LicenseGrant.transferable = staticTemplate.contractParameters[0].hasLicenseGrant[0].transferable
    jsonTemplate.hasLicenseGrant.LicenseGrant.exclusiveness = staticTemplate.contractParameters[0].hasLicenseGrant[0].exclusiveness
    jsonTemplate.hasLicenseGrant.LicenseGrant.revocable = staticTemplate.contractParameters[0].hasLicenseGrant[0].revocable

    return jsonTemplate
}

export async function createAgreements(contract:ethers.Contract, dataOfferingId:Number, purpose:string, consumerId:string, providerId:string, dates:Array<Number>, descriptionOfData:Array<string>, intendedUse:Array<Boolean>, licenseGrant:Array<Boolean>, stream:Boolean) {

    const createAgreementTx = await contract.createAgreement(dataOfferingId, purpose, consumerId, providerId, dates, descriptionOfData,intendedUse, licenseGrant, stream)
    await createAgreementTx.wait();

    const agreementLength = await contract.getAgreementsLength();
    const agreementId = parseInt(agreementLength) - 1

    console.log("Agreement ID is " + agreementId)

    return agreementId
  } 

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
    const dataOfferingId = Number(template.DataOfferingDescription.dataOfferingId)
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

    const processData = stringToBoolean(template.hasIntendedUse.IntendedUse.processData)
    const shareDataWithThirdParty = stringToBoolean(template.hasIntendedUse.IntendedUse.shareDataWithThirdParty)
    const editData = stringToBoolean(template.hasIntendedUse.IntendedUse.editData)
    const intendedUse = [processData, shareDataWithThirdParty, editData]

    const copyData = stringToBoolean(template.hasLicenseGrant.LicenseGrant.copyData)
    const transferable = stringToBoolean(template.hasLicenseGrant.LicenseGrant.transferable)
    const exclusiveness = stringToBoolean(template.hasLicenseGrant.LicenseGrant.revocable)
    const revocable = stringToBoolean(template.hasLicenseGrant.LicenseGrant.revocable)
    const licenseGrant = [copyData, transferable, exclusiveness, revocable]

    const dataStream = stringToBoolean(template.DataStream)

    console.log("dataofferingId => "+dataOfferingId+" purpose => "+purpose+" consumerId => "+consumerId+" providerId => "+providerId+
    " dates => ["+startDate+","+endDate+"] descriptionOfDate => ["+dataType+","+dataFormat+","+dataSource+"] intendedUse => ["
    +processData+","+shareDataWithThirdParty+","+editData+"] licenseGrant => ["+copyData+","+transferable+","+exclusiveness+","+revocable+"] dataStream => "+dataStream)

    return {
        dataOfferingId: dataOfferingId,
        purpose: purpose,
        consumerId: consumerId,
        providerId: providerId,
        dates: dates,
        descriptionOfData: descriptionOfData,
        intendedUse: intendedUse,
        licenseGrant: licenseGrant,
        dataStream: dataStream
    }
  }

export function formatAgreement(agreement:any) {
    
    return {
        dataOfferingId: parseInt(agreement.dataOfferingId),
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