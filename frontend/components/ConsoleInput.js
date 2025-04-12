import React from 'react';

class ConsoleInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentInput: '',
      history: [],
      historyIndex: -1,
      suggestions: [],
      showSuggestions: false,
      selectedSuggestion: -1
    };
    this.inputRef = React.createRef();
  }

  componentDidMount() {
    this.focusInput();
  }

  focusInput = () => {
    if (this.inputRef.current) {
      this.inputRef.current.focus();
    }
  }

  handleChange = (e) => {
    const value = e.target.value;
    this.setState({ currentInput: value });
    
    // Get suggestions if available
    if (this.props.getSuggestions) {
      const suggestions = this.props.getSuggestions(value);
      this.setState({ 
        suggestions, 
        showSuggestions: suggestions.length > 0,
        selectedSuggestion: -1
      });
    }
  }

  handleKeyDown = (e) => {
    const { history, historyIndex, suggestions, showSuggestions, selectedSuggestion } = this.state;
    
    // Handle suggestions
    if (showSuggestions && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Tab')) {
      e.preventDefault();
      
      if (e.key === 'Tab') {
        if (selectedSuggestion >= 0) {
          this.applySuggestion(suggestions[selectedSuggestion]);
        } else if (suggestions.length === 1) {
          this.applySuggestion(suggestions[0]);
        }
        return;
      }
      
      let newIndex = selectedSuggestion;
      
      if (e.key === 'ArrowDown') {
        newIndex = (selectedSuggestion + 1) % suggestions.length;
      } else if (e.key === 'ArrowUp') {
        newIndex = selectedSuggestion <= 0 ? suggestions.length - 1 : selectedSuggestion - 1;
      }
      
      this.setState({ selectedSuggestion: newIndex });
      return;
    }
    
    // Hide suggestions on escape
    if (e.key === 'Escape' && showSuggestions) {
      this.setState({ showSuggestions: false });
      return;
    }
    
    // Submit on enter
    if (e.key === 'Enter') {
      e.preventDefault();
      this.handleSubmit();
      return;
    }
    
    // Navigate command history
    if (!showSuggestions && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      
      if (history.length === 0) return;
      
      let newIndex = historyIndex;
      
      if (e.key === 'ArrowUp') {
        // If not in history yet or at the start, go to end
        newIndex = historyIndex <= 0 ? history.length - 1 : historyIndex - 1;
      } else if (e.key === 'ArrowDown') {
        // If at the end of history or not in history, clear input
        if (historyIndex >= history.length - 1 || historyIndex === -1) {
          this.setState({ currentInput: '', historyIndex: -1 });
          return;
        }
        newIndex = historyIndex + 1;
      }
      
      this.setState({
        historyIndex: newIndex,
        currentInput: history[newIndex]
      });
    }
  }

  applySuggestion = (suggestion) => {
    this.setState({
      currentInput: suggestion,
      showSuggestions: false,
      selectedSuggestion: -1
    });
  }

  handleSubmit = () => {
    const { currentInput, history } = this.state;
    const trimmedInput = currentInput.trim();
    
    if (trimmedInput === '') return;
    
    // Add to history only if different from last command
    const updatedHistory = [...history];
    if (history.length === 0 || history[history.length - 1] !== trimmedInput) {
      updatedHistory.push(trimmedInput);
      
      // Limit history size
      if (updatedHistory.length > 50) {
        updatedHistory.shift();
      }
    }
    
    // Send command to parent
    if (this.props.onSubmit) {
      this.props.onSubmit(trimmedInput);
    }
    
    // Reset input and update history
    this.setState({
      currentInput: '',
      history: updatedHistory,
      historyIndex: -1,
      showSuggestions: false,
      selectedSuggestion: -1
    });
  }

  renderSuggestions() {
    const { suggestions, selectedSuggestion, showSuggestions } = this.state;
    
    if (!showSuggestions || suggestions.length === 0) {
      return null;
    }
    
    return (
      <div className="console-suggestions">
        {suggestions.map((suggestion, index) => (
          <div 
            key={index}
            className={`suggestion-item ${index === selectedSuggestion ? 'selected' : ''}`}
            onClick={() => this.applySuggestion(suggestion)}
          >
            {suggestion}
          </div>
        ))}
      </div>
    );
  }

  render() {
    const { currentInput } = this.state;
    
    return (
      <div className="console-input-container" onClick={this.focusInput}>
        <div className="input-wrapper">
          <span className="prompt">{'>'}</span>
          <input
            ref={this.inputRef}
            type="text"
            className="console-input"
            value={currentInput}
            onChange={this.handleChange}
            onKeyDown={this.handleKeyDown}
            placeholder="Type a command or /help"
            spellCheck="false"
            autoComplete="off"
          />
        </div>
        {this.renderSuggestions()}
      </div>
    );
  }
}

// Add CSS for the console input
const consoleInputStyles = document.createElement('style');
consoleInputStyles.textContent = `
  .console-input-container {
    position: relative;
    margin-top: auto;
    padding: 10px;
    border-top: 1px solid var(--border-color);
  }

  .input-wrapper {
    display: flex;
    align-items: center;
  }

  .prompt {
    color: var(--primary-color);
    font-weight: bold;
    margin-right: 8px;
    font-family: monospace;
  }

  .console-input {
    flex: 1;
    background-color: var(--input-bg-color);
    color: var(--text-color);
    border: none;
    outline: none;
    padding: 8px;
    font-family: monospace;
    font-size: 14px;
    width: 100%;
    border-radius: var(--border-radius);
  }

  .console-input::placeholder {
    color: var(--text-secondary);
    opacity: 0.6;
  }

  .console-suggestions {
    position: absolute;
    bottom: 100%;
    left: 10px;
    right: 10px;
    background-color: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    max-height: 150px;
    overflow-y: auto;
    z-index: 100;
    box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.2);
  }

  .suggestion-item {
    padding: 6px 12px;
    cursor: pointer;
    font-family: monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .suggestion-item:hover, .suggestion-item.selected {
    background-color: rgba(97, 175, 239, 0.1);
    color: var(--primary-color);
  }
`;
document.head.appendChild(consoleInputStyles);

export default ConsoleInput; 