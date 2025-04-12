import React from 'react';

class ConsoleOutput extends React.Component {
  constructor(props) {
    super(props);
    this.outputRef = React.createRef();
  }

  componentDidMount() {
    this.scrollToBottom();
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  scrollToBottom = () => {
    if (this.outputRef.current) {
      this.outputRef.current.scrollTop = this.outputRef.current.scrollHeight;
    }
  }

  renderMessage = (message, index) => {
    const { timestamp, type, content } = message;
    
    // Format the timestamp
    const date = new Date(timestamp);
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Determine the CSS class based on the message type
    let messageClass = 'console-message';
    let typeClass = '';
    
    switch (type) {
      case 'command':
        typeClass = 'console-command';
        break;
      case 'error':
        typeClass = 'console-error';
        break;
      case 'warning':
        typeClass = 'console-warning';
        break;
      case 'success':
        typeClass = 'console-success';
        break;
      case 'info':
        typeClass = 'console-info';
        break;
      case 'code':
        typeClass = 'console-code';
        break;
      case 'result':
        typeClass = 'console-result';
        break;
      case 'system':
        typeClass = 'console-system';
        break;
      default:
        typeClass = 'console-output';
    }
    
    return (
      <div key={index} className={`${messageClass} ${typeClass}`}>
        <span className="console-timestamp">[{formattedTime}]</span>
        {type === 'command' && <span className="console-prompt">&gt; </span>}
        {this.renderContent(content, type)}
      </div>
    );
  }

  renderContent = (content, type) => {
    // For code blocks, add highlighting and proper display
    if (type === 'code') {
      return <pre className="code-block"><code>{content}</code></pre>;
    }
    
    // Check if content is a string or an object
    if (typeof content === 'string') {
      // Check for URLs in the content and make them clickable
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const parts = content.split(urlRegex);
      
      return (
        <span>
          {parts.map((part, i) => {
            if (part.match(urlRegex)) {
              return (
                <a 
                  key={i}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="console-link"
                >
                  {part}
                </a>
              );
            }
            return part;
          })}
        </span>
      );
    } else if (content !== null && typeof content === 'object') {
      // For objects, display them as formatted JSON
      return (
        <pre className="object-preview">
          {JSON.stringify(content, null, 2)}
        </pre>
      );
    } else {
      // For other types, convert to string
      return String(content);
    }
  }

  render() {
    const { logs } = this.props;
    
    return (
      <div className="console-output" ref={this.outputRef}>
        {logs.length === 0 ? (
          <div className="console-welcome">
            <div className="welcome-title">Blender AI Agent Console</div>
            <div className="welcome-message">
              Type commands to interact with Blender. Type <span className="command-hint">/help</span> to see available commands.
            </div>
          </div>
        ) : (
          logs.map(this.renderMessage)
        )}
      </div>
    );
  }
}

// Add CSS for the console output component
const outputStyles = document.createElement('style');
outputStyles.textContent = `
  .console-output {
    flex: 1;
    padding: 10px;
    overflow-y: auto;
    color: var(--text-color);
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.4;
  }
  
  .console-message {
    margin-bottom: 8px;
    word-wrap: break-word;
    white-space: pre-wrap;
  }
  
  .console-timestamp {
    color: var(--text-secondary);
    margin-right: 8px;
    font-size: 12px;
    user-select: none;
  }
  
  .console-prompt {
    color: var(--command-color);
    font-weight: bold;
    margin-right: 4px;
  }
  
  .console-command {
    color: var(--command-color);
    font-weight: bold;
  }
  
  .console-error {
    color: var(--error-color);
  }
  
  .console-warning {
    color: var(--warning-color);
  }
  
  .console-success {
    color: var(--success-color);
  }
  
  .console-info {
    color: var(--info-color);
  }
  
  .console-code {
    color: var(--code-color);
  }
  
  .console-result {
    color: var(--result-color);
  }
  
  .console-system {
    color: var(--system-color);
    font-style: italic;
  }
  
  .code-block {
    background-color: var(--code-bg-color);
    padding: 8px 12px;
    border-radius: var(--border-radius);
    margin: 4px 0;
    overflow-x: auto;
  }
  
  .object-preview {
    background-color: var(--code-bg-color);
    padding: 8px 12px;
    border-radius: var(--border-radius);
    margin: 4px 0;
    overflow-x: auto;
  }
  
  .console-link {
    color: var(--link-color);
    text-decoration: underline;
  }
  
  .console-link:hover {
    text-decoration: none;
  }
  
  .console-welcome {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    opacity: 0.8;
    text-align: center;
    padding: 20px;
  }
  
  .welcome-title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 16px;
    color: var(--primary-color);
  }
  
  .welcome-message {
    font-size: 16px;
    line-height: 1.6;
  }
  
  .command-hint {
    background-color: var(--code-bg-color);
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--command-color);
    font-weight: bold;
  }
`;
document.head.appendChild(outputStyles);

export default ConsoleOutput; 