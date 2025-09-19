# 🤝 Contributing to Loom Video Downloader

Thank you for your interest in contributing to Loom Video Downloader! We welcome contributions from the community and are grateful for any help you can provide.

## 🌟 How to Contribute

We welcome contributions! Here's how you can help:

1. 🍴 **Fork** the repository
2. 🌟 **Create** your feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. 📤 **Push** to the branch (`git push origin feature/amazing-feature`)
5. 🔀 **Open** a Pull Request

## 💡 Ideas for Contributions

We're always looking for improvements! Here are some areas where you can help:

- 🐛 **Bug fixes and improvements**
- 📚 **Documentation enhancements**
- ✨ **New features and options**
- 🧪 **Tests and quality improvements**
- 🎨 **UI/UX improvements for CLI**
- 🚀 **Performance optimizations**
- 🔧 **Code refactoring**

## 🐛 Reporting Issues

Found a bug or have a suggestion? We'd love to hear from you!

### Before Reporting
- 🔍 Check if the issue already exists in our [Issues](https://github.com/EcomGraduates/loom-downloader/issues)
- 🧪 Try to reproduce the issue with the latest version
- 📋 Gather relevant information (OS, Node.js version, command used, etc.)

### How to Report
- 🐛 [Report a Bug](https://github.com/EcomGraduates/loom-downloader/issues/new?labels=bug)
- 💡 [Request a Feature](https://github.com/EcomGraduates/loom-downloader/issues/new?labels=enhancement)
- 💬 [Ask a Question](https://github.com/EcomGraduates/loom-downloader/discussions)

### Bug Report Template
```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Run command '...'
2. With arguments '...'
3. See error

**Expected behavior**
A clear description of what you expected to happen.

**Environment:**
- OS: [e.g. Windows 10, macOS 12.0, Ubuntu 20.04]
- Node.js version: [e.g. 16.14.0]
- loom-dl version: [e.g. 1.0.0]

**Additional context**
Add any other context about the problem here.
```

## 🔧 Development Setup

### Prerequisites
- Node.js 12.0.0 or higher
- npm or yarn
- Git

### Setup Steps
```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/loom-downloader.git
cd loom-downloader

# 2. Install dependencies
npm install

# 3. Create a feature branch
git checkout -b feature/your-feature-name

# 4. Make your changes
# ... code changes ...

# 5. Test your changes
npm test  # If tests exist
node loom-dl.js --help  # Manual testing

# 6. Commit your changes
git add .
git commit -m "feat: add amazing new feature"

# 7. Push to your fork
git push origin feature/your-feature-name

# 8. Open a Pull Request
```

## 📝 Coding Standards

To maintain code quality and consistency, please follow these guidelines:

### Code Style
- Use **2 spaces** for indentation
- Use **semicolons** at the end of statements
- Use **camelCase** for variable and function names
- Use **kebab-case** for file names
- Add **JSDoc comments** for functions and modules

### Commit Messages
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat: add resume functionality for interrupted downloads
fix: handle invalid URL formats gracefully
docs: update installation instructions
style: format code according to eslint rules
```

## 🧪 Testing

### Manual Testing
Before submitting a PR, please test your changes:

```bash
# Test single video download
node loom-dl.js --url https://www.loom.com/share/test-video-id

# Test batch download
node loom-dl.js --list example-list.txt

# Test with different options
node loom-dl.js --url https://www.loom.com/share/test-video-id --out custom-name.mp4
```

### Adding Tests
If you're adding new functionality, consider adding tests:

- Unit tests for utility functions
- Integration tests for main functionality
- Error handling tests

## 📋 Pull Request Guidelines

### Before Submitting
- ✅ Ensure your code follows the coding standards
- ✅ Test your changes thoroughly
- ✅ Update documentation if needed
- ✅ Add yourself to the contributors list (optional)

### PR Description Template
```markdown
## 📝 Description
Brief description of the changes made.

## 🎯 Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## 🧪 Testing
- [ ] I have tested this change locally
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## 📋 Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
```

## 🎉 Recognition

Contributors will be recognized in:
- 👥 **README.md Contributors section**
- 📝 **Release notes** for significant contributions
- 🏆 **GitHub Contributors graph**

## 📞 Getting Help

Need help with your contribution? Don't hesitate to reach out:

- 💬 [Start a Discussion](https://github.com/EcomGraduates/loom-downloader/discussions)
- 📧 Create an issue with the `question` label
- 🔍 Check existing issues and discussions

## 📄 Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code.

### Our Pledge
- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Show empathy towards other community members

---

<div align="center">

**Thank you for contributing to Loom Video Downloader! 🎉**

Every contribution, no matter how small, makes a difference!

</div>