FROM node:16

COPY ./scripts/dependencies.sh ./dependencies.sh
COPY ./template.json ./template.json
COPY ./staticParametersTemplate.json ./staticParametersTemplate.json
COPY ./DataSharingAgreement.json ./DataSharingAgreement.json
COPY ./ExplicitUserConsent.json ./ExplicitUserConsent.json

ADD ./src /src

ENV BACKPLANE_URL=http://95.211.3.244:3000
ENV ADDRESS=0.0.0.0
ENV PORT=3333

WORKDIR /src

RUN chmod +x /dependencies.sh && bash /dependencies.sh

CMD ["npm", "start"]