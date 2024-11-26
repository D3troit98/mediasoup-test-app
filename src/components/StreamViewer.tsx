/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThumbsUp } from 'lucide-react';
import socketService from '@/services/socketService';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
interface StreamViewerProps {
  roomId: string;
}

const StreamViewer: React.FC<StreamViewerProps> = ({ roomId }) => {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<
    Array<{
      userId: string;
      userName: string;
      text: string;
      timestamp: number;
    }>
  >([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [seats, setSeats] = useState<
    Array<{ userId: string; username: string } | null>
  >(new Array(5).fill(null));
  const [hasSeatRequest, setHasSeatRequest] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transportRef = useRef<any>(null);
  const consumersRef = useRef<any[]>([]);
  const { toast } = useToast();
  useEffect(() => {
    const setupMediasoup = async () => {
      try {
        console.log('1. Starting MediaSoup setup');

        await socketService.loadDevice();
        console.log('2. Device loaded successfully');

        if (!transportRef.current) {
          transportRef.current = await socketService.createRecvTransport(
            roomId
          );
          console.log('3. Receive transport created:', transportRef.current.id);

          transportRef.current.on(
            'connect',
            async ({ dtlsParameters }, callback, errback) => {
              try {
                console.log('4. Connecting transport');
                await socketService.sendRequest('connectTransport', {
                  roomId,
                  transportId: transportRef.current.id,
                  dtlsParameters,
                });
                console.log('5. Transport connected successfully');
                callback();
              } catch (error) {
                console.error('6. Error connecting transport:', error);
                errback(error);
              }
            }
          );

          transportRef.current.on('connectionstatechange', (state: string) => {
            console.log('7. Transport connection state changed:', state);
            switch (state) {
              case 'connected':
                console.log('8. Receive transport connected');
                setIsConnected(true);
                break;
              case 'failed':
                console.error('9. Transport connection failed');
                transportRef.current?.close();
                setError('Transport connection failed');
                break;
            }
          });
        }

        const response = await socketService.sendRequest('join-stream', {
          roomId,
        });

        if (!response.success) {
          throw new Error(response.error);
        }

        const { rtpCapabilities, producerIds, streamData } = response;

        setComments(streamData.comments);
        setLikes(streamData.likes);
        setViewerCount(streamData.viewerCount);

        console.log('11. Joined stream, rtpCapabilities:', rtpCapabilities);

        for (const producerId of producerIds) {
          console.log(`12. Requesting to consume producer: ${producerId}`);
          const { id, kind, rtpParameters } = await socketService.sendRequest(
            'consume',
            {
              transportId: transportRef.current.id,
              producerId,
              rtpCapabilities,
              roomId,
            }
          );
          console.log('13. Consume request successful:', {
            producerId,
            id,
            kind,
          });

          const consumer = await transportRef.current.consume({
            id,
            producerId,
            kind,
            rtpParameters,
          });
          console.log('14. Consumer created:', consumer.id);

          consumersRef.current.push(consumer);

          if (kind === 'video' && videoRef.current) {
            const stream = new MediaStream([consumer.track]);
            videoRef.current.srcObject = stream;
            console.log('15. Video element source set');
          } else if (kind === 'audio') {
            const audioElement = new Audio();
            audioElement.srcObject = new MediaStream([consumer.track]);
            audioElement.play();
            console.log('16. Audio playback started');
          }
        }
      } catch (error) {
        console.error('17. Error setting up MediaSoup:', error);
        setError(`Failed to set up stream viewer: ${error.message}`);
      }
    };

    setupMediasoup();

    socketService.on('new-comment', (newComment) => {
      setComments((prev) => [...prev, newComment]);
    });

    socketService.on('viewer-count-updated', (count) => {
      setViewerCount(count);
    });

    socketService.on('like-updated', ({ count }) => {
      setLikes(count);
    });

    return () => {
      consumersRef.current.forEach((consumer) => {
        consumer.close();
        console.log('18. Consumer closed on cleanup');
      });
      if (transportRef.current) {
        transportRef.current.close();
        console.log('19. Transport closed on cleanup');
      }
      socketService.sendRequest('leave-stream', { roomId });
      console.log('20. Left stream on cleanup');
      socketService.removeAllListeners();
    };
  }, [roomId]);

  const handleSendComment = () => {
    if (comment.trim()) {
      socketService.emit('comment-stream', { roomId, comment });
      setComment('');
    }
  };

  const handleLikeStream = () => {
    socketService.emit('like-stream', { roomId });
    setHasLiked(true);
    setTimeout(() => setHasLiked(false), 2000);
  };

  const handleRequestSeat = () => {
    socketService.emit('request-seat', { roomId }, (response) => {
      if (response.success) {
        setHasSeatRequest(true);
        toast({
          title: 'Seat Request Sent',
          description: 'Your request to join the stream has been sent',
        });
      } else {
        toast({
          title: 'Seat Request Failed',
          description: response.error,
          variant: 'destructive',
        });
      }
    });
  };

  useEffect(() => {
    socketService.on('like-updated', ({ count, liked }) => {
      setLikes(count);
      setHasLiked(liked);
    });

    socketService.on('user-joined-seat', ({ seatNumber, userId, username }) => {
      setSeats((prevSeats) => {
        const newSeats = [...prevSeats];
        newSeats[seatNumber] = { userId, username };
        return newSeats;
      });
    });

    socketService.on('user-kicked-from-seat', ({ seatNumber, userId }) => {
        toast({
          title: 'user removed',
          description: `${userId} removed from seat`,
        });
      setSeats((prevSeats) => {
        const newSeats = [...prevSeats];
        newSeats[seatNumber] = null;
        return newSeats;
      });
    });

    return () => {
      socketService.getCustomSocket().removeListener('like-updated');
      socketService.getCustomSocket().removeListener('user-joined-seat');
      socketService.getCustomSocket().removeListener('user-kicked-from-seat');
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
        <video ref={videoRef} className="w-full h-full" autoPlay playsInline />
        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
            Connecting to stream...
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-red-500">
            {error}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <span>{viewerCount} viewers</span>
        <span>{likes} likes</span>
        <AnimatePresence>
          {hasLiked && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="ml-2 text-blue-500"
            >
              <ThumbsUp className="inline-block h-4 w-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="flex space-x-2">
        <Input
          placeholder="Add a comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyUp={(e) => e.key === 'Enter' && handleSendComment()}
        />
        <Button onClick={handleSendComment}>Send</Button>
        <Button onClick={handleLikeStream} variant="outline" size="icon">
          <ThumbsUp className="h-4 w-4" />
        </Button>
        <Button onClick={handleRequestSeat} disabled={hasSeatRequest}>
          {hasSeatRequest ? 'Seat Request Pending' : 'Request Seat'}
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {seats.map((seat, index) => (
          <Card key={index} className={seat ? 'bg-blue-500 text-white' : ''}>
            <CardContent className="flex justify-between items-center">
              {seat ? (
                <div className="font-semibold">{seat.username}</div>
              ) : (
                <div>Seat {index + 1}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent>
          <h3 className="text-lg font-semibold mb-2">Comments</h3>
          <ScrollArea className="h-[200px]">
            {comments.map((comment, index) => (
              <p key={index} className="py-2 border-b last:border-b-0">
                <span className="font-semibold">{comment.userName}: </span>
                {comment.text}
              </p>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default StreamViewer;
