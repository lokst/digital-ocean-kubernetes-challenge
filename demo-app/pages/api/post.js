// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import axios from 'axios';

export default function handler(req, res) {
  const message = req.body.message;
  const path = `topics/${process.env.TOPIC_NAME}`;

  axios.post(path, {
    records: [{key: "Message", value: message}]
  }, {
    baseURL: process.env.BRIDGE_HOST,
    timeout: 3000,
    headers: {'content-type': 'application/vnd.kafka.json.v2+json'}
  })
  .then(function (response) {
    res.status(200).json({ data: response.data });
  })
  .catch(function (error) {
    res.status(400);
  });
}
