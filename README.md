# MediaSoup Test App

A React-based testing application for MediaSoup WebRTC implementations. This application provides a user interface for testing both broadcasting and viewing capabilities, making it ideal for developers working on MediaSoup backend services.

![Screenshot placeholder](/api/placeholder/800/400)

## Features

- 🎥 Stream Creation & Broadcasting
- 👥 Stream Viewing
- 💬 Real-time Chat
- 👍 Interactive Features (Likes, Viewer Count)
- 🔄 Multiple Stream Support
- 🎮 Media Controls (Mute/Unmute, Camera Toggle)

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A running MediaSoup backend server

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mediasoup-test-app.git
cd mediasoup-test-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Configure the socket connection:
Update the socket server URL in `src/services/socketService.ts`:
```typescript
this.socket = io('http://localhost:7071', {
  autoConnect: false,
  auth: {
    userId: 'your-user-id',
  },
});
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Usage

### Creating a Stream

1. Enter a stream title in the "Create a New Stream" section
2. Click "Start Stream" to begin broadcasting
3. Grant camera and microphone permissions when prompted
4. Use the media controls to toggle audio/video as needed

### Viewing a Stream

1. Browse available streams in the "Available Streams" section
2. Click on a stream to view it
3. Interact with the stream using:
   - Chat functionality
   - Like button
   - View count tracking

## Technical Details

### Component Structure

- `App.tsx`: Main application component
- `StreamCreator.tsx`: Broadcasting component
- `StreamViewer.tsx`: Viewing component
- `socketService.ts`: WebSocket and MediaSoup connection handling

### MediaSoup Integration

The application handles WebRTC connections using MediaSoup-client with the following features:

- Automatic device loading and capability detection
- Transport creation and management
- Producer/Consumer handling
- Stream encoding with multiple layers:
```typescript
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
```

### Socket Events

The application listens for and emits the following socket events:

#### Incoming Events
- `streams-updated`: Updates the list of available streams
- `new-comment`: Receives new chat messages
- `viewer-count-updated`: Updates viewer count
- `like-updated`: Updates like count

#### Outgoing Events
- `create-stream`: Creates a new broadcast
- `join-stream`: Joins an existing stream
- `comment-stream`: Sends a chat message
- `like-stream`: Likes a stream

## Backend Requirements

Your MediaSoup backend should implement the following endpoints:

- `getRtpCapabilities`: Returns router RTP capabilities
- `createWebRtcTransport`: Creates WebRTC transport
- `connectTransport`: Connects WebRTC transport
- `produce`: Handles producer creation
- `consume`: Handles consumer creation

## UI Components

The application uses the following UI libraries:
- shadcn/ui for component styling
- Lucide React for icons
- Tailwind CSS for styling

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [MediaSoup](https://mediasoup.org/) for the WebRTC SFU
- [shadcn/ui](https://ui.shadcn.com/) for the UI components
- [socket.io](https://socket.io/) for real-time communication

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify the MediaSoup backend is running
   - Check the socket connection URL
   - Ensure proper CORS configuration

2. **Media Permission Denied**
   - Grant camera/microphone permissions
   - Check browser settings

3. **Stream Not Displaying**
   - Verify WebRTC transport connection
   - Check browser console for errors
   - Ensure proper ICE candidate exchange

## Support

For issues and feature requests, please use the GitHub issues page.
