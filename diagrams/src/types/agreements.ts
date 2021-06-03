
type DID = string
type AgreementType = 'A' | 'B' | 'C'
type AgreementState = 'active' | 'pause' | 'cancelled'

interface BaseFilter {
    type?: AgreementType
}

interface ProviderFilter extends BaseFilter {
    providerId: DID
    dataSetId?: string
}

interface ConsumerFilter extends BaseFilter {
    consumerId: DID
}

interface DataSetFilter extends BaseFilter {
    dataSetId: string
}

interface ActiveAgreementsBody {
    query: 'activeAgreements'
    filter: ProviderFilter | ConsumerFilter | DataSetFilter
}

interface Agreement {
    type: AgreementState
    cosumer: DID
    provider: DID
    recipe: string // hash
    state: AgreementState
}
