import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import StreamCreator from './components/StreamCreator';
import StreamViewer from './components/StreamViewer';
import socketService from './services/socketService';

const App: React.FC = () => {
  const [streams, setStreams] = useState<any[]>([]);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initializeSocket = async () => {
      try {
        await socketService.connect();
        console.log('Connected to socket server');
        setIsConnected(true);

        await socketService.loadDevice();
        console.log('MediaSoup device loaded');

        socketService.emit('get-streams');
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    };

    initializeSocket();

    socketService.on('streams-updated', (updatedStreams) => {
      setStreams(updatedStreams);
    });

    return () => {
      socketService.removeListener('streams-updated', setStreams);
      socketService.disconnect();
    };
  }, []);

  if (!isConnected) {
    return <div>Connecting to server...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-4xl font-bold">MediaSoup Test App</h1>
      <Card>
        <CardHeader>
          <CardTitle>Create a New Stream</CardTitle>
        </CardHeader>
        <CardContent>
          <StreamCreator />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Available Streams</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {streams.map((stream) => (
                <Button
                  key={stream.id}
                  onClick={() => setSelectedStream(stream.id)}
                  variant="outline"
                  className="w-full justify-between"
                >
                  <span>{stream.title}</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    Viewers: {stream.viewers}
                  </span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      {selectedStream && (
        <Card>
          <CardHeader>
            <CardTitle>Stream Viewer</CardTitle>
          </CardHeader>
          <CardContent>
            <StreamViewer roomId={selectedStream} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default App;
