<!---
#  Copyright 2020-2022 i3-MARKET Consortium:
#
#  ATHENS UNIVERSITY OF ECONOMICS AND BUSINESS - RESEARCH CENTER
#  ATOS SPAIN SA
#  EUROPEAN DIGITAL SME ALLIANCE
#  GFT ITALIA SRL
#  GUARDTIME OU
#  HOP UBIQUITOUS SL
#  IBM RESEARCH GMBH
#  IDEMIA FRANCE
#  SIEMENS AKTIENGESELLSCHAFT
#  SIEMENS SRL
#  TELESTO TECHNOLOGIES PLIROFORIKIS KAI EPIKOINONION EPE
#  UNIVERSITAT POLITECNICA DE CATALUNYA
#  UNPARALLEL INNOVATION LDA
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#  http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#
-->

# Smart Contract Manager

# 1. Introduction

The Smart Contract Manager (SCM) enforces the contractual agreements between the data provider and the data consumer.

The SCM provides a gateway to access the Smart Contracts on HyperLedger Besu and is used by other subsystems to integrate their functionalities.

The Smart Contract Manager extracts the static contractual parameters from the data offering description using the semantic data model. The dynamic parameters, such as start date and end date of the agreement, the consumer id, are filled when a data purchase request is created. As soon as, the negotiation between the provider and consumer is over and they agreed on specific contractual parameters, the provider can create an agreement with those parameters.

SCM uses the Notification Manager to notify the provider or consumer about the changes that occurred to the agreement. For example, whether the agreement has been created, signed, updated or terminated.

<br/>

# 2. Run the Smart Contract Manager using the docker image

[Here](https://gitlab.com/i3-market/code/wp3/t3.2/i3m-scm) is the smart contract manager project repository.

+ Clone the repository
+ Install docker engine
+ CD into the directory and run the following command:

```
docker build -t registry.gitlab.com/i3-market/code/wp3/t3.2/i3m-scm:latest .
```

+ To run the image use this command:

```
docker run -p 3333:3333 -e PRIVATE_KEY=smartContractUserPrivateKey -e PRIVATE_ADDRESS=ledgerNodeAddress registry.gitlab.com/i3-market/code/wp3/t3.2/i3m-scm:latest
```

<br/>

# 3. Smart Contract Manager endpoints

+ Retrieve the template with the static contractual parameters:
  
    <mark>GET /template/{offering_id}</mark>

+ Create agreement (raw transaction):
  
    <mark>POST /create_agreement _raw_transaction/{sender_address}</mark>

+ Deploy signed transaction:

    <mark>POST /deploy_signed_transaction<mark>

+ Retrieve the agreement with the id received from the notification manager when creating the agreement:

    <mark>GET /get_agreement/{agreement_id}<mark>

+ Check active agreements. The agreements are active after they are stored on the blockchain

    <mark>GET /check_active_agreements<mark>

+ Check active agreements by the consumer id:

    <mark>GET /check_agreements_by_consumer/{consumer_id}<mark>

+ Check active agreements by the provider id:

    <mark>GET /check_agreements_by_provider/{provider_id}<mark>

+ Check the agreement state (created, active, violated, terminated):

    <mark>GET /state/{agreement_id}<mark>



<br/>

# 4. Use cases

## Create agreement

An agreement can be created by a data provider.

In the */create_agreement _raw_transaction/{sender_address}* API the sender address and the JSON template with the contractual parameters (including the dynamic ones) have to be specified.

The sender address is the Ethereum address of the provider which can be found in the wallet.

### Transaction signing and deployment

The successful response of creating an agreement request is a raw transaction object. This raw transaction has to be signed with the wallet. After the signed transaction is obtained from the wallet, it has to be deployed. The deployment endpoint is */deploy_signed_transaction*. The response of the request should be a transaction object with information about the transaction.

### Notification

A notification will be sent from the Smart Contract Manager to the Notification Manager. The provider and consumer will be notified about the changes that occurred to their agreement. If the agreement was successfully created, they will each receive a notification: “Agreement with id: *agreementId* was created.”
<br/><br/>

## Sign agreement

An agreement has to be signed by a data consumer.

In the */sign_agreement _raw_transaction/{agreement_id}/}/{consumer_id}/{sender_address}* API the agreement id, the consumer id and sender address must be given.

The sender address is the Ethereum address of the consumer which can be found in their wallet.

The successful response of this request is a raw transaction object, which has to be signed with the wallet and then deployed using the SCM, as described in the “Transaction signing and deployment” section.

If the agreement was successfully signed, the provider and consumer will receive a notification: “Agreement with id: *agreementId* was signed.”
<br/><br/>

## Update agreement

An agreement can be updated by a data provider just when it is in state Active. The agreement is Active when the consumer signed it and the start date is reached.

In the */update_agreement _raw_transaction/{agreement_id}/{provider_id}/{sender_address}* API the agreement id, the provider id, the sender address and the JSON template with the contractual parameters have to be specified.

The sender address is the Ethereum address of the provider which can be found in their wallet.

The successful response of this request is a raw transaction object, which has to be signed with the wallet and then deployed using the SCM, as described in the “Transaction signing and deployment” section.

If the agreement was successfully updated, the provider and consumer will receive a notification: “Agreement with id: *agreementId* was updated.”

After the agreement is updated, its state will change to Updated and the consumer has to sign it so the agreement can be Active again.
