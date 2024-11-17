/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Camera, CameraOff, Mic, MicOff } from 'lucide-react';
import socketService from '@/services/socketService';
import { Card, CardContent } from './ui/card';

const StreamCreator: React.FC = () => {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [localRoomId, setLocalRoomId] = useState(null);
  const [seats, setSeats] = useState<
    Array<{ userId: string; username: string } | null>
  >(new Array(5).fill(null));
  const [seatRequests, setSeatRequests] = useState<
    Array<{ userId: string; username: string }>
  >([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const producerRef = useRef<any>(null);
  const transportRef = useRef<any>(null);

  const encodingParams = {
    encodings: [
      {
        rid: 'r0',
        maxBitrate: 100000,
        scalabilityMode: 'S1T3',
      },
      {
        rid: 'r1',
        maxBitrate: 300000,
        scalabilityMode: 'S1T3',
      },
      {
        rid: 'r2',
        maxBitrate: 900000,
        scalabilityMode: 'S1T3',
      },
    ],
    codecOptions: {
      videoGoogleStartBitrate: 1000,
    },
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, []);

  // Video reference effect
  useEffect(() => {
    if (localStream && videoRef.current) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Add socket event listeners
  useEffect(() => {
    if (localRoomId) {
      // Listen for new seat requests
      socketService.on(
        'seat-request',
        (data: { userId: string; username: string }) => {
          setSeatRequests((prev) => [...prev, data]);
          toast({
            title: 'New Seat Request',
            description: `${data.username} has requested to join`,
          });
        }
      );

      // Listen for when a user joins a seat
      socketService.on(
        'user-joined-seat',
        (data: { seatNumber: number; userId: string; username: string }) => {
          setSeats((prev) => {
            const newSeats = [...prev];
            newSeats[data.seatNumber] = {
              userId: data.userId,
              username: data.username,
            };
            return newSeats;
          });
          // Remove from requests if they were accepted
          setSeatRequests((prev) =>
            prev.filter((request) => request.userId !== data.userId)
          );
        }
      );

      // Listen for when a user is kicked
      socketService.on(
        'user-kicked-from-seat',
        (data: { seatNumber: number; userId: string }) => {
          setSeats((prev) => {
            const newSeats = [...prev];
            newSeats[data.seatNumber] = null;
            return newSeats;
          });
        }
      );

      // Cleanup socket listeners
      return () => {
        socketService.getCustomSocket().removeListener('seat-request');
        socketService.getCustomSocket().removeListener('user-joined-seat');
        socketService.getCustomSocket().removeListener('user-kicked-from-seat');
      };
    }
  }, [localRoomId, toast]);

  const cleanupStream = () => {
    console.log('Cleaning up stream...');

    if (streamRef.current) {
      console.log('Stopping stream tracks...');
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (producerRef.current) {
      console.log('Closing producer...');
      producerRef.current.close();
    }

    if (transportRef.current) {
      console.log('Closing transport...');
      transportRef.current.close();
    }

    setLocalStream(null);
    setIsStreaming(false);
    console.log('Stream cleaned up.');
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);

        console.log(`Audio ${audioTrack.enabled ? 'unmuted' : 'muted'}.`);

        toast({
          title: audioTrack.enabled ? 'Audio Unmuted' : 'Audio Muted',
          description: audioTrack.enabled
            ? 'Your audio is now on'
            : 'Your audio is now off',
        });
      }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);

        console.log(`Video ${videoTrack.enabled ? 'enabled' : 'disabled'}.`);

        toast({
          title: videoTrack.enabled ? 'Camera On' : 'Camera Off',
          description: videoTrack.enabled
            ? 'Your camera is now on'
            : 'Your camera is now off',
        });
      }
    }
  };

  const handleProducerEvents = (producer) => {
    producer.on('trackended', () => {
      console.log('Track ended event detected.');
      toast({
        title: 'Stream Interrupted',
        description: 'Your media track has ended unexpectedly',
        variant: 'destructive',
      });
      cleanupStream();
    });

    producer.on('transportclose', () => {
      console.log('Transport closed event detected.');
      toast({
        title: 'Connection Lost',
        description: 'Stream transport connection has been closed',
        variant: 'destructive',
      });
      cleanupStream();
    });
  };

  const startStream = async () => {
    if (!title.trim()) {
      console.log('No stream title provided.');
      toast({
        title: 'Error',
        description: 'Please enter a stream title',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('Requesting media stream...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 400, ideal: 720, max: 1080 },
          aspectRatio: { ideal: 16 / 9 },
        },
        audio: true,
      });

      streamRef.current = stream;
      setLocalStream(stream);

      const roomId = `room-${Date.now()}`;
      setLocalRoomId(roomId);
      console.log(`Room ID generated: ${roomId}`);

      const createStreamResponse = await socketService.sendRequest(
        'create-stream',
        { roomId, title }
      );
      if (!createStreamResponse.success) {
        throw new Error(
          createStreamResponse.error || 'Failed to create stream'
        );
      }

      console.log('Creating transport...');
      const sendTransport = await socketService.createSendTransport(roomId);
      transportRef.current = sendTransport;

      sendTransport.on(
        'connect',
        async ({ dtlsParameters }, callback, errback) => {
          try {
            const connectResponse = await socketService.sendRequest(
              'connectTransport',
              { roomId, transportId: sendTransport.id, dtlsParameters }
            );

            if (!connectResponse.success) {
              throw new Error(
                connectResponse.error || 'Failed to connect transport'
              );
            }
            console.log('Transport connected successfully.');
            callback();
          } catch (error) {
            console.error('Transport connect error:', error);
            errback(error);
          }
        }
      );

      sendTransport.on(
        'produce',
        async ({ kind, rtpParameters, appData }, callback, errback) => {
          try {
            const produceResponse = await socketService.sendRequest('produce', {
              roomId,
              transportId: sendTransport.id,
              kind,
              rtpParameters,
              appData,
            });

            if (!produceResponse.success) {
              throw new Error(produceResponse.error || 'Failed to produce');
            }
            console.log(`Producing ${kind} track...`);
            callback({ id: produceResponse.producerId });
          } catch (error) {
            console.error(`Produce error for ${kind}:`, error);
            errback(error);
          }
        }
      );

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const videoProducer = await sendTransport.produce({
          track: videoTrack,
          ...encodingParams,
        });
        producerRef.current = videoProducer;
        handleProducerEvents(videoProducer);
        console.log('Video track produced successfully.');
      }

      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        const audioProducer = await sendTransport.produce({
          track: audioTrack,
        });
        handleProducerEvents(audioProducer);
        console.log('Audio track produced successfully.');
      }

      setIsStreaming(true);
      console.log('Stream started successfully.');
      toast({
        title: 'Stream Started',
        description: 'Your stream is now live!',
      });
    } catch (error) {
      console.error('Stream start error:', error);
      cleanupStream();
      toast({
        title: 'Error',
        description: 'Failed to start stream. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const stopStream = () => {
    console.log('Stopping stream...');
    cleanupStream();
    toast({
      title: 'Stream Ended',
      description: 'Your stream has been stopped',
    });
  };

  const handleAcceptSeatRequest = (userId: string) => {
    // Find first available seat
    const availableSeatIndex = seats.findIndex((seat) => seat === null);

    if (availableSeatIndex === -1) {
      toast({
        title: 'Error',
        description: 'No available seats',
        variant: 'destructive',
      });
      return;
    }

    socketService.emit(
      'accept-seat-request',
      { roomId: localRoomId, userId, seatNumber: availableSeatIndex },
      (response) => {
        if (response.success) {
          setSeats((prevSeats) => {
            const newSeats = [...prevSeats];
            newSeats[availableSeatIndex] = {
              userId,
              username: response.username,
            };
            return newSeats;
          });
          setSeatRequests((prevRequests) =>
            prevRequests.filter((request) => request.userId !== userId)
          );
          toast({
            title: 'Seat Request Accepted',
            description: `User has been assigned to seat ${
              availableSeatIndex + 1
            }`,
          });
        } else {
          toast({
            title: 'Error',
            description: response.error || 'Failed to accept seat request',
            variant: 'destructive',
          });
        }
      }
    );
  };

  const handleDenySeatRequest = (userId: string) => {
    setSeatRequests((prevRequests) =>
      prevRequests.filter((request) => request.userId !== userId)
    );
    toast({
      title: 'Request Denied',
      description: 'Seat request has been denied',
    });
  };

  const handleKickFromSeat = (userId: string, seatNumber: number) => {
    socketService.emit(
      'kick-from-seat',
      { roomId: localRoomId, userId, seatNumber },
      (response) => {
        if (response.success) {
          setSeats((prevSeats) => {
            const newSeats = [...prevSeats];
            newSeats[seatNumber] = null;
            return newSeats;
          });
          toast({
            title: 'User Kicked',
            description: `User has been kicked from seat ${seatNumber + 1}`,
          });
        } else {
          toast({
            title: 'Kick Failed',
            description: response.error,
            variant: 'destructive',
          });
        }
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="stream-title">Stream Title</Label>
        <Input
          id="stream-title"
          placeholder="Enter stream title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isStreaming}
        />
      </div>

      <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
        <video
          ref={videoRef}
          className="w-full h-full"
          autoPlay
          playsInline
          muted
        />
        {localStream && (
          <div className="absolute bottom-4 right-4 space-x-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={toggleAudio}
              className={isAudioMuted ? 'bg-red-500 hover:bg-red-600' : ''}
            >
              {isAudioMuted ? <MicOff /> : <Mic />}
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={toggleVideo}
              className={isVideoMuted ? 'bg-red-500 hover:bg-red-600' : ''}
            >
              {isVideoMuted ? <CameraOff /> : <Camera />}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-5 gap-4">
        {seats.map((seat, index) => (
          <Card key={index} className={seat ? 'bg-blue-500 text-white' : ''}>
            <CardContent className="flex justify-between items-center">
              {seat ? (
                <div>
                  <div className="font-semibold">{seat.username}</div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleKickFromSeat(seat.userId, index)}
                  >
                    Kick
                  </Button>
                </div>
              ) : (
                <div>Seat {index + 1}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-x-2">
        {seatRequests.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Seat Requests</h3>
            <div className="space-y-2">
              {seatRequests.map((request) => (
                <Card
                  key={request.userId}
                  className="bg-gray-100 dark:bg-gray-800"
                >
                  <CardContent className="flex justify-between items-center p-4">
                    <span className="font-medium">{request.username}</span>
                    <div className="space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptSeatRequest(request.userId)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDenySeatRequest(request.userId)}
                      >
                        Deny
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <Button
        onClick={isStreaming ? stopStream : startStream}
        className="w-full"
        variant={isStreaming ? 'destructive' : 'default'}
      >
        {isStreaming ? 'Stop Stream' : 'Start Stream'}
      </Button>
    </div>
  );
};

export default StreamCreator;
