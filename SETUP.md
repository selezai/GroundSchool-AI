# GroundSchool-AI Project Setup Guide

## Node.js Version Requirements

This project requires **Node.js v18** or higher for compatibility with Expo SDK 52.

## Setup Instructions

### Using nvm (Node Version Manager) - Recommended

If you're using nvm, the project is configured to automatically use the correct Node.js version:

1. Ensure nvm is installed and properly set up. If not, install it from [here](https://github.com/nvm-sh/nvm).

2. In the project directory, run:
   ```bash
   nvm use
   ```
   This will automatically switch to Node.js v18 as specified in the `.nvmrc` file.

3. Start the project:
   ```bash
   npm start
   ```
   The prestart script will verify the correct Node.js version before starting the application.

### Without nvm

If you're not using nvm, ensure you have Node.js v18.x installed globally:

1. Check your Node.js version:
   ```bash
   node --version
   ```

2. If you're not on v18.x, download and install it from [Node.js official website](https://nodejs.org/).

3. Start the project:
   ```bash
   npm start
   ```

## Automatic Node.js Version Switching

This project includes the following features for automatic Node.js version management:

1. **`.nvmrc` file**: Contains the required Node.js version (18).

2. **`prestart` script**: Automatically checks and attempts to switch to the correct Node.js version before starting the application.

3. **Bash profile configuration**: If you've followed the setup instructions, your bash profile now includes automatic nvm switching when entering directories with an `.nvmrc` file.

## Troubleshooting

If you encounter the error `ReferenceError: ReadableStream is not defined`, it means you're using an older Node.js version. Run:

```bash
source ~/.nvm/nvm.sh && nvm use 18
npm start
```

If issues persist, contact the development team for assistance.
