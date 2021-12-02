# digital-ocean-kubernetes-challenge

This is my entry for the 2021 [DigitalOcean Kubernetes Challenge](https://www.digitalocean.com/community/pages/kubernetes-challenge).

For my entry, I perform the following and document the steps taken:
- Set up a Kubernetes cluster on DigitalOcean
- Install an Apache Kafka cluster on the Kubernetes cluster, using [Strimzi](https://strimzi.io/)
- Install Kafka Bridge on the Kubernetes cluster using Strimzi, to provide a HTTP interface to the Kafka cluster
- Demonstrate producing and consuming messages through the HTTP interface provided by Kafka Bridge

## Steps

### Set up DigitalOcean CLI

Obtain an API token from DigitalOcean, and install and initialize the [DigitalOcean CLI](https://docs.digitalocean.com/reference/doctl/)

```
doctl auth init --context dochallenge
```

### Create a Kubernetes cluster on DigitalOcean

```
doctl kubernetes cluster create democluster --context dochallenge
```

### Install Kafka cluster

This is adapted from the steps in https://strimzi.io/quickstarts/

First, I create a namespace for the Kafka resources, named `kafka`.

```
kubectl create namespace kafka
```

Next, I apply the Strimzi install files.

```
kubectl create -f 'https://strimzi.io/install/latest?namespace=kafka' -n kafka

kubectl get pod -n kafka --watch
```

Then, I provision the Apache Kafka cluster, using an installation file adapted from https://strimzi.io/examples/latest/kafka/kafka-persistent-single.yaml

```
kubectl apply -f k8s-setup/kafka-persistent-single.yaml -n kafka
```


### Install Kafka Bridge

I install Kafka Bridge to provide a HTTP interface to the Kafka cluster, referencing the steps in https://strimzi.io/docs/operators/latest/using.html#proc-deploying-kafka-bridge-quickstart-kafka-bridge-quickstart

```
# Adapted from https://github.com/strimzi/strimzi-kafka-operator/blob/main/examples/bridge/kafka-bridge.yaml

kubectl apply -f k8s-setup/kafka-bridge.yaml -n kafka
```

### Setting up a topic in the Kafka cluster

```
kubectl apply -f k8s-setup/my-bridge-topic.yaml -n kafka
```

### Exposing Kafka Bridge to external clients

First, I install an ingress controller following the instructions in https://kubernetes.github.io/ingress-nginx/deploy/#digital-ocean

```
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.1.0/deploy/static/provider/do/deploy.yaml
```

Then I extract the external ip corresponding to the ingress controller from the output of the following command:

```
kubectl get services --namespace=ingress-nginx
```

I create the installation file for an ingress resource to the Kafka Bridge, from a template file, substituting the placeholder for the ip address with the one obtained from the above command. Note that the host address makes use of the [nip.io](https://nip.io/) wildcard DNS service.

```
EXTERNAL_IP=<IP ADDRESS>
sed  "s/REPLACE_WITH_EXTERNAL_IP/$EXTERNAL_IP/" k8s-setup/kafka-bridge-ingress.yaml.template > k8s-setup/kafka-bridge-ingress.yaml
```

I create the ingress resource:

```
kubectl apply -f k8s-setup/kafka-bridge-ingress.yaml -n kafka
```


### Produce messages to the topic using HTTP interface

Producing some messages for testing:

```
BRIDGE_HOST="bridge.$EXTERNAL_IP.nip.io"
TOPIC_NAME=my-bridge-topic
curl -X POST \
  http://$BRIDGE_HOST/topics/$TOPIC_NAME \
  -H 'content-type: application/vnd.kafka.json.v2+json' \
  -d '{
    "records": [
        {
            "key": "my-key",
            "value": "test message"
        },
        {
            "value": "another test message",
            "partition": 2
        },
        {
            "value": "hello kafka"
        }
    ]
}'
```

Received response

```
{"offsets":[{"partition":0,"offset":0},{"partition":2,"offset":0},{"partition":1,"offset":0}]}
```

### Create a Kafka Bridge consumer using HTTP interface

```
BRIDGE_CONSUMER_GROUP_NAME=bridge-test-consumer-group
BRIDGE_CONSUMER_NAME=bridge-test-consumer

curl -X POST http://$BRIDGE_HOST/consumers/$BRIDGE_CONSUMER_GROUP_NAME \
  -H 'content-type: application/vnd.kafka.v2+json' \
  -d "{
    \"name\": \"$BRIDGE_CONSUMER_NAME\",
    \"auto.offset.reset\": \"earliest\",
    \"format\": \"json\",
    \"enable.auto.commit\": false,
    \"fetch.min.bytes\": 512,
    \"consumer.request.timeout.ms\": 30000
  }"
```

Received response:

```
{"instance_id":"bridge-test-consumer","base_uri":"http://bridge.<redacted-ip>.nip.io:80/consumers/bridge-test-consumer-group/instances/bridge-test-consumer"}
```

### Consuming messages using HTTP interface

Subscribing to the topic

```
curl -X POST http://$BRIDGE_HOST/consumers/$BRIDGE_CONSUMER_GROUP_NAME/instances/$BRIDGE_CONSUMER_NAME/subscription \
  -H 'content-type: application/vnd.kafka.v2+json' \
  -d "{\"topics\": [\"$TOPIC_NAME\"]}"
```

Consuming messages

```
curl -X GET http://$BRIDGE_HOST/consumers/$BRIDGE_CONSUMER_GROUP_NAME/instances/$BRIDGE_CONSUMER_NAME/records \
  -H 'accept: application/vnd.kafka.json.v2+json'
```

Received response:

```
[{"topic":"my-bridge-topic","key":null,"value":"another test message","partition":2,"offset":3},{"topic":"my-bridge-topic","key":"my-key","value":"test message","partition":0,"offset":2},{"topic":"my-bridge-topic","key":null,"value":"hello kafka","partition":1,"offset":1}]
```
