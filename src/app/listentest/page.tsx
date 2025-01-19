"use client";
import { useEffect, useRef, useState } from "react";
import { Client, RemoteStream } from "ion-sdk-js";
import { IonSFUJSONRPCSignal } from "ion-sdk-js/lib/signal/json-rpc-impl";
import { v4 as uuidv4 } from "uuid";
import { Configuration } from "ion-sdk-js/lib/client";
import ChatWindow from "../ChatWindow";
import StreamCard from "../StreamCard";


type Message = {
  text: string;
  sender: string;
  color: string;
};
export default function View({ name = "viewer" }: { name: string }) {
  const NEXT_PUBLIC_SFU_WS_URL = "wss://adityaadiraju.com:7000/ws";
  const audioRef = useRef<HTMLAudioElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  useEffect(() => {
    const startViewing = async () => {
      const config = {
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302",
          },
        ],
      };
      const signal = new IonSFUJSONRPCSignal(NEXT_PUBLIC_SFU_WS_URL);
      const client = new Client(signal, config as Configuration);
      signal.onopen = () => client.join("ion", uuidv4());

      client.ondatachannel = (channelEvent) => {
        channelEvent.channel.onmessage = (event) => {
          setMessages((prev) => [...prev, JSON.parse(event.data)]);
        };
        dataChannelRef.current = channelEvent.channel;

        channelEvent.channel.onopen = () => console.log("Data channel open");
        channelEvent.channel.onclose = () => console.log("Data channel closed");
      };

      client.ontrack = (track: MediaStreamTrack, stream: RemoteStream) => {
        if (audioRef.current) {
          audioRef.current.srcObject = stream;
          audioRef.current.autoplay = true;
          audioRef.current.muted = false;
        }
      };
    };

    startViewing();
  }, []);

  return (
    <div className="flex flex-row space-x-20 items-center">
      <div className="flex flex-col items-center justify-center p-4 rounded-lg shadow-md w-80">
        <StreamCard
          streamCover="user-assets/hand-reach.jpg"
          streamName="Mind Matters (ep. 21)"
          streamCreator="MindMattersPod"
          streamPfp="user-assets/colourful.jpg"
          streamTags={["mental-health", "education"]}
        />
        <audio ref={audioRef} muted={false} />
      </div>
      <ChatWindow
        messages={messages}
        userMessage={message}
        setMessages={setMessages}
        setUserMessage={setMessage}
        username={name}
        dataChannelRef={dataChannelRef}
      />
    </div>
  );
}