/* eslint-disable @typescript-eslint/no-explicit-any */
import socketService from '@/services/socketService';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import StreamCreator from './StreamCreator';
import { ScrollArea } from './ui/scroll-area';
import StreamsFilter from './StreamsFilter';
import { Button } from './ui/button';
import StreamViewer from './StreamViewer';
import { useAuth } from '@/contexts/AuthContext';

const StreamsPage = () => {
  const [streams, setStreams] = useState<any[]>([]);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, accessToken } = useAuth();

  const [pagination, setPagination] = useState({
    limit: 10,
    page: 1,
    total: 0,
    totalPages: 0,
  });

  const fetchStreams = (filters = {}, paginationOptions = {}) => {
    socketService
      .getCustomSocket()
      .emit('get-streams', filters, paginationOptions);
  };

  useEffect(() => {
    const initializeSocket = async () => {
      try {
        if (!user?._id || !accessToken) {
          throw new Error('Authentication required');
        }
        console.log('initializing socket');
        // Initialize socket with auth credentials
        socketService.initializeSocket(user._id, accessToken);
        await socketService.connect();
        console.log('Connected to socket server');
        setIsConnected(true);

        await socketService.loadDevice();
        console.log('MediaSoup device loaded');

        fetchStreams();
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    };

    initializeSocket();

    socketService.on('streams-updated', (updatedStreams) => {
      console.log('updatedStreams', updatedStreams);
      setStreams(updatedStreams?.streams || []);
      setPagination(updatedStreams?.pagination);
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
            <StreamsFilter
              onFiltersChange={fetchStreams}
              pagination={pagination}
            />
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

export default StreamsPage;
