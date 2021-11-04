import express, { json, RequestHandler } from 'express'
import bodyParser from 'body-parser'
import fs from 'fs'
import _fetch from 'isomorphic-fetch';
import interfaces, { Template, StaticParameters } from '../interfaces'

const router = express.Router()
router.use(bodyParser.json());


export default async (): Promise<typeof router> => {

    router.get('/openapi', (req,res) => {
        let oas = fs.readFileSync('./openapi/openapi.json', { encoding: 'utf-8', flag: 'r' })
        res.send(oas)
      })
    
    router.get('/:idTemplate', async (req, res) => {
        let staticParameters: any = await _fetch(`${process.env.BACKPLANE_URL}/semantic-engine/api/registration/contract-parameter/${req.params.idTemplate}/offeringId`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        }).catch((error: any) => {
                console.error('Error:', error);
        })

        const staticParametersJson = await staticParameters.json();


        let parsedJson = JSON.parse(JSON.stringify(staticParametersJson))

        interfaces.staticTemplate = parsedJson[0]
        let template:Template = getTemplate()
        console.log(template)

        res.json(JSON.parse(JSON.stringify(template)))
    })
    return router;
}

function getTemplate(){

    interfaces.template.DataOfferingDescription.dataOfferingId = interfaces.staticTemplate.dataOfferingId
    interfaces.template.DataOfferingDescription.provider = interfaces.staticTemplate.provider
    interfaces.template.DataOfferingDescription.category = interfaces.staticTemplate.category
    interfaces.template.Purpose = interfaces.staticTemplate.contractParameters[0].purpose
    interfaces.template.hasParties.Parties.dataProvider = interfaces.staticTemplate.provider
    interfaces.template.hasIntendedUse.IntendedUse.processData = interfaces.staticTemplate.contractParameters[0].hasIntendedUse[0].processData
    interfaces.template.hasIntendedUse.IntendedUse.shareDataWithThirdParty = interfaces.staticTemplate.contractParameters[0].hasIntendedUse[0].shareDataWithThirdParty
    interfaces.template.hasIntendedUse.IntendedUse.editData = interfaces.staticTemplate.contractParameters[0].hasIntendedUse[0].editData
    interfaces.template.hasLicenseGrant.LicenseGrant.copyData = interfaces.staticTemplate.contractParameters[0].hasLicenseGrant[0].copyData
    interfaces.template.hasLicenseGrant.LicenseGrant.transferable = interfaces.staticTemplate.contractParameters[0].hasLicenseGrant[0].transferable
    interfaces.template.hasLicenseGrant.LicenseGrant.exclusiveness = interfaces.staticTemplate.contractParameters[0].hasLicenseGrant[0].exclusiveness
    interfaces.template.hasLicenseGrant.LicenseGrant.revocable = interfaces.staticTemplate.contractParameters[0].hasLicenseGrant[0].revocable

    return interfaces.template
}
