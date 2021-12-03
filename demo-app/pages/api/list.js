// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import axios from 'axios';

export default function handler(req, res) {
  const path = `consumers/${process.env.BRIDGE_CONSUMER_GROUP_NAME}/instances/${process.env.BRIDGE_CONSUMER_NAME}/records`;
  axios.get(path, {
    baseURL: process.env.BRIDGE_HOST,
    timeout: 3000,
    headers: {'accept': 'application/vnd.kafka.json.v2+json'}
  })
  .then(function (response) {
    res.status(200).json({ data: response.data });
  })
  .catch(function (error) {
    console.log(error);
    res.status(400);
  });
}
