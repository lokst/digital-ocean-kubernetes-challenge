import Head from 'next/head'
import Image from 'next/image'
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import styles from '../styles/Home.module.css'

function MessageList() {
  const [messages, setMessages] = useState([])
  const countRef = useRef(0);
  const queryMessages = () => {
    axios.get('/api/list')
    .then(function (response) {
      const receivedMessages = response.data.data.map(element => element.value);
      messages = messages.concat(receivedMessages);
      setMessages(messages);
    })
    .catch(function (error) {
      console.log(error);
    });
  };

  return (
    <div>
      <div className={styles.messages}>
        <ul>
          {messages.map((message, i) => 
            <li key={i}>{message}</li>
          )}
        </ul>
      </div>
      <button onClick={queryMessages}>Consume Messages</button>
    </div>
  );
}

function MessageSender() {
  const [message, setMessage] = useState('');

  const onChange = event => setMessage(event.target.value);

  const onClick = event => {
    axios.post('/api/post', {
      message,
    }).then(function (response) {
      setMessage('')
    }).catch(function (error) {
      console.log(error);
    });
  }

  return (
    <div>
      <input className={styles.sender} type="text" value={message} onChange={onChange}></input>
      <button onClick={onClick}>Send</button>
    </div>
  );
}

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Demo App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1>
          Demo App
        </h1>
        <p>Try posting a few messages if no messages are retrieved</p>

        <MessageList />
        <MessageSender />
      </main>
    </div>
  )
}
