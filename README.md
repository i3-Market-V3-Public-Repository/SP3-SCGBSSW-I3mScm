# 1. Introduction
___

The smart contract manager is the component which facilitates the interaction between the data consumer and the smart contract deployed in Hyperledger Besu. The smart contract manager also interacts with other components such as the semantic engine, which allows extraction of the static parameters from the data offering used in the creation of the agreement by the data consumer and the notification manager which notifies the consumer and the provider about the different states the agreement takes.

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

# 3. Smart Contract Manager endpoints

* Retrieve the json template that is filled with static parameters:
  
    <mark>GET /template/{offering_id}</mark>

* Copy the json template with the dynamic parameters and create an agreement:
  
    <mark>POST /create_agreement</mark>

* Using the json template that was used to create the agreement update the agreement.
  
    <mark>POST /update_agreement/{agreement_id}<mark>

* Retrieve the agreement with the id received from creating the agreement:

    <mark>GET /get_agreement/{agreement_id}<mark>

* Sign the agreement:

    <mark>GET /sign_agreement/{agreement_id}/{consumer_id}/{provider_id}<mark>

* Check active agreements. The agreements become active after they were signed:

    <mark>GET /check_active_agreements<mark>

* Check active agreements using the consumer id:

    <mark>GET /check_agreements_by_consumer/{consumer_id}<mark>

* Check active agreements using the provider id:

    <mark>GET /check_agreements_by_provider/{provider_id}<mark>

* Check the agreement state if: created, active, violated, terminated:

    <mark>GET /state/{agreement_id}<mark>