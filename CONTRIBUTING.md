# Contributing to Prisma Slug Extension

Thank you for your interest in contributing to Prisma Slug Extension! We welcome contributions from the community.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/prisma-slug.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Install dependencies: `npm install`
5. Make your changes
6. Build the project: `npm run build`
7. Test your changes in the example directory

## Development Workflow

### Building

```bash
npm run build
```

### Testing Your Changes

```bash
cd example
npm install
npx prisma migrate dev
npm run dev
```

### Code Style

- Follow the existing code style
- Use TypeScript for all new code
- Add appropriate type annotations
- Keep functions small and focused

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the example code if you're adding new features
3. Ensure your code builds without errors
4. Write a clear commit message describing your changes
5. Submit a pull request with a detailed description

### Commit Message Guidelines

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

## Reporting Bugs

When reporting bugs, please include:

- Your Prisma version
- Your TypeScript version
- A minimal reproduction example
- Expected behavior
- Actual behavior
- Error messages (if any)

## Feature Requests

We love feature requests! Please provide:

- Clear use case description
- Why this feature would be useful
- Example code showing how it would work

## Questions?

Feel free to open an issue for any questions or discussions.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
