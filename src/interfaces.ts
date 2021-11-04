import fs from 'fs'

export interface Template {
    DataOfferingDescription: {
		dataOfferingId: string,
		provider: string,
		decription: string,
		title: string,
		category: string,
		isActive: boolean
	},
	Purpose: string,
	hasParties: {
		Parties: {
			dataProvider: string,
			dataConsumer: string
		}
	},
	hasDuration: {
		Duration: {
		creationDate: string,
		startDate: string,
		endDate: string
		}
	},
	hasObligations: {
		Obligations: {
			qualityOfData: number,
			characteristics: Array<string>,
			dataAvailability: boolean
		}
	},
	hasDescriptionOfData: {
		DescriptionOfData: {
			dataType: string,
			dataFormat: string,
			dataSource: string
		}
	},
	hasIntendedUse: {
		IntendedUse: {
			processData: boolean,
			shareDataWithThirdParty: boolean,
			editData: boolean
		}
	},
	hasLicenseGrant: {
		LicenseGrant:{
			copyData: boolean,
			transferable: boolean,
			exclusiveness: boolean,
			revocable: boolean
		}
	},
	DataStream: boolean
}

// const defaultTemplate: Template = {
//     DataOfferingDescription: {
// 		dataOfferingId: 'string',
// 		provider: 'string',
// 		decription: 'string',
// 		title: 'string',
// 		category: 'string',
// 		isActive: false
// 	},
// 	Purpose: 'string',
// 	hasParties: {
// 		Parties: {
// 			dataProvider: 'string',
// 			dataConsumer: 'string'
// 		}
// 	},
// 	hasDuration: {
// 		Duration: {
// 		creationDate: 'string',
// 		startDate: 'string',
// 		endDate: 'string'
// 		}
// 	},
// 	hasObligations: {
// 		Obligations: {
// 			qualityOfData: 0,
// 			characteristics: ['enum'],
// 			dataAvailability: false
// 		}
// 	},
// 	hasDescriptionOfData: {
// 		DescriptionOfData: {
// 			dataType: 'string',
// 			dataFormat: 'string',
// 			dataSource: 'string'
// 		}
// 	},
// 	hasIntendedUse: {
// 		IntendedUse: {
// 			processData: false,
// 			shareDataWithThirdParty: false,
// 			editData: false
// 		}
// 	},
// 	hasLicenseGrant: {
// 		LicenseGrant:{
// 			copyData: false,
// 			transferable: false,
// 			exclusiveness: false,
// 			revocable: false
// 		}
// 	},
// 	DataStream: false
// }

export interface StaticParameters{
    dataOfferingId: string,
    provider: string,
    category: string,
    contractParameters: [
      {
        contractParametersId: string,
        interestOfProvider: string,
        interestDescription: string,
        hasGoverningJurisdiction: string,
        purpose: string,
        purposeDescription: string,
        hasIntendedUse: [
          {
            intendedUseId: string,
            processData: boolean,
            shareDataWithThirdParty: boolean,
            editData: boolean
          }
        ],
        hasLicenseGrant: [
          {
            licenseGrantId: string,
            copyData: boolean,
            transferable: boolean,
            exclusiveness: boolean,
            revocable: boolean
          }
        ]
      }
    ]
}

let jsonTemplate = JSON.parse(fs.readFileSync('../template.json', { encoding: 'utf-8', flag: 'r' }))
let jsonstaticParametersTemplate = JSON.parse(fs.readFileSync('../staticParametersTemplate.json', { encoding: 'utf-8', flag: 'r' }))

let defaultTemplate: Template = jsonTemplate
let staticParametersTemplate: StaticParameters = jsonstaticParametersTemplate

export default { template: defaultTemplate, staticTemplate: staticParametersTemplate}