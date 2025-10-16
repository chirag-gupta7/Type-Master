# Contributing to TypeMaster

Thank you for your interest in contributing to TypeMaster! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive criticism
- Respect differing viewpoints and experiences

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/typemaster.git
cd typemaster
```

### 2. Set Up Development Environment

```bash
# Install dependencies
npm install

# Set up environment variables
cp apps/frontend/.env.example apps/frontend/.env
cp apps/backend/.env.example apps/backend/.env

# Set up database
cd apps/backend
npm run prisma:generate
npm run prisma:migrate
cd ../..

# Start development
npm run dev
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

## 💻 Development Workflow

### Before You Start

1. Check existing issues and PRs to avoid duplication
2. Open an issue to discuss major changes before starting
3. Keep changes focused - one feature/fix per PR

### While Developing

```bash
# Run tests frequently
npm run test

# Check types
npm run typecheck

# Lint your code
npm run lint

# Format code
npm run format
```

### Before Committing

```bash
# Run all checks
npm run lint
npm run typecheck
npm run test
npm run format
```

## 📝 Coding Standards

### TypeScript

```typescript
// ✅ DO: Use proper types
interface User {
  id: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ DON'T: Use any
function getUser(id: any): any {
  // ...
}
```

### React Components

```typescript
// ✅ DO: Proper component structure
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={cn('btn', `btn-${variant}`)}>
      {label}
    </button>
  );
}

// ❌ DON'T: Untyped components
export function Button(props) {
  return <button>{props.label}</button>;
}
```

### File Naming

- **Components**: PascalCase (`UserProfile.tsx`)
- **Utilities**: camelCase (`calculateWpm.ts`)
- **Types**: PascalCase (`types/User.ts`)
- **Tests**: Same as source file + `.test.ts` (`UserProfile.test.tsx`)

### Component Structure

```typescript
// 1. Imports (external, then internal)
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. Types/Interfaces
interface Props {
  // ...
}

// 3. Component
export function Component({ prop }: Props) {
  // 4. Hooks
  const [state, setState] = useState();

  // 5. Handlers
  const handleClick = () => {
    // ...
  };

  // 6. Effects
  useEffect(() => {
    // ...
  }, []);

  // 7. Render
  return <div>...</div>;
}
```

### API Controller Structure

```typescript
// 1. Imports
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// 2. Validation schemas
const schema = z.object({
  // ...
});

// 3. Controller function
export const controllerName = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 4. Validate
    const data = schema.parse(req.body);

    // 5. Business logic
    const result = await service.method(data);

    // 6. Response
    res.status(200).json({ result });
  } catch (error) {
    // 7. Error handling
    next(error);
  }
};
```

### Keep Functions Small

```typescript
// ✅ DO: Single responsibility
function calculateWpm(characters: number, minutes: number): number {
  return characters / 5 / minutes;
}

function calculateAccuracy(correct: number, total: number): number {
  return (correct / total) * 100;
}

// ❌ DON'T: Multiple responsibilities
function calculateStats(characters: number, minutes: number, errors: number) {
  const wpm = characters / 5 / minutes;
  const accuracy = ((characters - errors) / characters) * 100;
  const grossWpm = (characters + errors) / 5 / minutes;
  // ... more calculations
  return { wpm, accuracy, grossWpm /* ... */ };
}
```

## 📝 Commit Guidelines

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```bash
# Good commits
git commit -m "feat(auth): add password reset functionality"
git commit -m "fix(test): correct WPM calculation formula"
git commit -m "docs(api): update authentication endpoints"
git commit -m "test(user): add user profile update tests"

# Bad commits
git commit -m "fixed stuff"
git commit -m "updates"
git commit -m "WIP"
```

## 🔄 Pull Request Process

### 1. Update Your Branch

```bash
git checkout main
git pull upstream main
git checkout your-branch
git rebase main
```

### 2. Run All Checks

```bash
npm run lint
npm run typecheck
npm run test:ci
npm run build
```

### 3. Push Your Changes

```bash
git push origin your-branch
```

### 4. Create Pull Request

**Title Format:**
```
type(scope): Brief description
```

**PR Description Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Added tests
- [ ] All tests pass
```

### 5. Code Review

- Respond to feedback promptly
- Make requested changes
- Re-request review after updates
- Be open to suggestions

## 🧪 Testing Requirements

### Required Tests

**For New Features:**
- Unit tests for business logic
- Integration tests for API endpoints
- Component tests for UI (if applicable)

**For Bug Fixes:**
- Test that reproduces the bug
- Test that verifies the fix

### Test Structure

```typescript
describe('ComponentName', () => {
  // Arrange
  const setup = () => {
    // Setup code
  };

  describe('featureName', () => {
    it('should do something when condition', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Coverage Requirements

- Minimum 70% coverage for new code
- All critical paths must be tested
- Edge cases should be covered

## 🎯 Priority Areas for Contribution

### High Priority
- 🎨 Typing test UI components
- 📊 Dashboard and analytics
- 🧪 Increased test coverage
- 📱 Mobile responsiveness improvements

### Medium Priority
- 🎨 UI/UX enhancements
- 📖 Documentation improvements
- ⚡ Performance optimizations
- 🌐 Internationalization (i18n)

### Good First Issues
Look for issues tagged with `good-first-issue` on GitHub

## ❓ Questions?

- Open a discussion on GitHub
- Ask in issues or PRs
- Email: support@typemaster.com

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Testing Library](https://testing-library.com/react)

---

**Thank you for contributing to TypeMaster! 🚀**
