# JSON Beauty

A powerful Angular application for JSON manipulation, validation, and conversion.

## Overview

JSON Beauty is a comprehensive tool for working with JSON data. It provides a user-friendly interface for:

- Formatting and beautifying JSON
- Converting between JSON and other formats (YAML, XML, CSV)
- Validating JSON against schemas
- Searching and navigating through JSON structures
- Comparing JSON documents

## Features

- **JSON Editing**: Advanced editor with syntax highlighting, code folding, and search capabilities
- **Format Conversion**: Convert between JSON and YAML, XML, CSV, and JSON5
- **JSON Path**: Query JSON using JSONPath expressions
- **Search & Replace**: Find and replace values in JSON documents
- **Dark/Light Themes**: Support for different visual preferences

## Code Organization

The project follows a modular architecture with clear separation of concerns:

- **Components**: UI elements for user interaction
- **Services**: Business logic for JSON operations
- **Interfaces**: Contracts defining service capabilities
- **Utils**: Shared utility functions
- **Types**: TypeScript type definitions

## Best Practices

### TypeScript

- Use proper type definitions instead of `any`
- Create interfaces for data structures
- Use type guards for runtime type checking
- Add return types to all functions

### Error Handling

- Use consistent error handling patterns
- Provide meaningful error messages
- Use try-catch blocks for error-prone operations
- Return standardized error responses

### Code Organization

- Follow the Single Responsibility Principle
- Extract common functionality into shared utilities
- Avoid code duplication
- Use meaningful variable and function names

### Documentation

- Add JSDoc comments to all public methods
- Document complex logic with inline comments
- Keep documentation up-to-date with code changes

## Development

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm start`

### Building

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

### Testing

Run `npm test` to execute the unit tests via Karma.

## Contributing

When contributing to this project, please follow these guidelines:

1. Follow the established code style and best practices
2. Write unit tests for new functionality
3. Update documentation for any changes
4. Use meaningful commit messages

## License

This project is licensed under the MIT License - see the LICENSE file for details.