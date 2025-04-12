import React from 'react';
import ConsoleInput from './ConsoleInput';
import ConsoleOutput from './ConsoleOutput';

class Console extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      logs: [],
      isConnected: false,
      websocket: null,
      commands: {
        help: { desc: 'Show available commands' },
        clear: { desc: 'Clear the console' },
        connect: { desc: 'Connect to Blender' },
        disconnect: { desc: 'Disconnect from Blender' },
        status: { desc: 'Show connection status' },
      }
    };
  }

  componentDidMount() {
    this.addSystemMessage('Console initialized. Type /help to see available commands.');
  }

  componentWillUnmount() {
    this.disconnectFromBlender();
  }

  addMessage = (content, type = 'output') => {
    const message = {
      timestamp: Date.now(),
      type,
      content
    };

    this.setState(prevState => ({
      logs: [...prevState.logs, message]
    }));
  }

  addSystemMessage = (content) => {
    this.addMessage(content, 'system');
  }

  addErrorMessage = (content) => {
    this.addMessage(content, 'error');
  }

  addResultMessage = (content) => {
    this.addMessage(content, 'result');
  }

  addCodeMessage = (content) => {
    this.addMessage(content, 'code');
  }

  clearConsole = () => {
    this.setState({ logs: [] });
  }

  connectToBlender = () => {
    if (this.state.isConnected) {
      this.addSystemMessage('Already connected to Blender.');
      return;
    }

    try {
      const websocket = new WebSocket('ws://localhost:9876');
      
      websocket.onopen = () => {
        this.setState({ 
          websocket,
          isConnected: true
        });
        this.addSystemMessage('Connected to Blender successfully.', 'success');
      };
      
      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.error) {
            this.addErrorMessage(data.error);
          } else if (data.result) {
            this.addResultMessage(data.result);
          } else if (data.code) {
            this.addCodeMessage(data.code);
          } else {
            this.addMessage(data, 'info');
          }
        } catch (e) {
          // If not JSON, treat as plain text
          this.addMessage(event.data, 'info');
        }
      };
      
      websocket.onerror = (error) => {
        this.addErrorMessage(`WebSocket error: ${error.message}`);
        this.setState({ isConnected: false, websocket: null });
      };
      
      websocket.onclose = () => {
        this.addSystemMessage('Disconnected from Blender.');
        this.setState({ isConnected: false, websocket: null });
      };
    } catch (error) {
      this.addErrorMessage(`Failed to connect: ${error.message}`);
    }
  }

  disconnectFromBlender = () => {
    const { websocket } = this.state;
    
    if (websocket) {
      websocket.close();
      this.setState({ 
        websocket: null,
        isConnected: false
      });
      this.addSystemMessage('Disconnected from Blender.');
    } else {
      this.addSystemMessage('Not connected to Blender.');
    }
  }

  showConnectionStatus = () => {
    const { isConnected } = this.state;
    
    if (isConnected) {
      this.addSystemMessage('Status: Connected to Blender.');
    } else {
      this.addSystemMessage('Status: Not connected to Blender.');
    }
  }

  showHelp = () => {
    const { commands } = this.state;
    let helpText = 'Available commands:\n';
    
    Object.keys(commands).forEach(cmd => {
      helpText += `/${cmd} - ${commands[cmd].desc}\n`;
    });
    
    helpText += '\nTo send a command to Blender, simply type your instruction.';
    this.addSystemMessage(helpText);
  }

  handleCommand = (command) => {
    this.addMessage(command, 'command');
    
    if (command.startsWith('/')) {
      const cmd = command.substring(1).toLowerCase().trim();
      
      switch (cmd) {
        case 'help':
          this.showHelp();
          break;
        case 'clear':
          this.clearConsole();
          break;
        case 'connect':
          this.connectToBlender();
          break;
        case 'disconnect':
          this.disconnectFromBlender();
          break;
        case 'status':
          this.showConnectionStatus();
          break;
        default:
          this.addErrorMessage(`Unknown command: ${command}`);
      }
    } else {
      this.sendToBlender(command);
    }
  }
  
  sendToBlender = (message) => {
    const { websocket, isConnected } = this.state;
    
    if (!isConnected || !websocket) {
      this.addErrorMessage('Not connected to Blender. Use /connect to establish a connection.');
      return;
    }
    
    try {
      websocket.send(JSON.stringify({ 
        command: message
      }));
    } catch (error) {
      this.addErrorMessage(`Failed to send command: ${error.message}`);
    }
  }

  getSuggestions = (input) => {
    const { commands } = this.state;
    
    if (input.startsWith('/')) {
      const partial = input.substring(1).toLowerCase();
      return Object.keys(commands)
        .filter(cmd => cmd.startsWith(partial))
        .map(cmd => `/${cmd}`);
    }
    
    return [];
  }

  render() {
    const { logs } = this.state;
    
    return (
      <div className="console-container">
        <ConsoleOutput logs={logs} />
        <ConsoleInput 
          onSubmit={this.handleCommand}
          getSuggestions={this.getSuggestions}
        />
      </div>
    );
  }
}

// Add CSS for the console container
const consoleStyles = document.createElement('style');
consoleStyles.textContent = `
  :root {
    --bg-color: #282c34;
    --text-color: #abb2bf;
    --text-secondary: #5c6370;
    --primary-color: #61afef;
    --command-color: #c678dd;
    --error-color: #e06c75;
    --warning-color: #e5c07b;
    --success-color: #98c379;
    --info-color: #56b6c2;
    --code-color: #d19a66;
    --result-color: #61afef;
    --system-color: #abb2bf;
    --link-color: #61afef;
    --border-color: #444;
    --code-bg-color: rgba(0, 0, 0, 0.2);
    --input-bg-color: rgba(0, 0, 0, 0.2);
    --border-radius: 4px;
  }
  
  .console-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 400px;
    background-color: var(--bg-color);
    color: var(--text-color);
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: 1px solid var(--border-color);
  }
`;
document.head.appendChild(consoleStyles);

export default Console; 