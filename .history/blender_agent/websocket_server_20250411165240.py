class BlenderWebSocketServer:
    def __init__(self, host: str = "localhost", port: int = 9876):
        """
        Initialize the Blender WebSocket server
        
        Args:
            host (str): Hostname to bind to
            port (int): Port to listen on
        """