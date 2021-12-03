## Demo App

A [Next.js](https://nextjs.org/) project, bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app). It demonstrates producing and consuming messages to/from a Kafka cluster via Kafka Bridge.

## Getting Started

### Create .env.local file

Create the following file in the root of the `demo-app` directory. (Replace `EXTERNAL_IP` with the IP address corresponding to the ingress controller)

```
BRIDGE_HOST=http://bridge.<EXTERNAL_IP>.nip.io
BRIDGE_CONSUMER_GROUP_NAME=bridge-test-consumer-group
BRIDGE_CONSUMER_NAME=bridge-test-consumer
TOPIC_NAME=my-bridge-topic
```

### Running the development server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
