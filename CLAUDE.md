# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a podcast content generation platform with two main components:

### Core Components
- **podly-lambda/**: TypeScript Lambda functions for audio and script generation
- **podly-tr/**: Terraform infrastructure for AWS deployment

### Architecture Pattern
Clean Architecture implementation with:
- **Handler Layer**: Lambda function entry points (handler.ts files)
- **Application Layer**: Use cases and business logic (usecases/ directory)
- **Domain Layer**: Domain entities and business rules (entities/ directory)
- **Infrastructure Layer**: External service integrations (agents/ directory)

### Shared Library
The `podly-lambda/shared/` directory contains:
- Domain entities (AudioEntity, ScriptEntity)
- Use cases (AudioUsecases, ScriptUsecases)
- Infrastructure agents (OpenAI, TTS, FFmpeg processing)
- Type definitions and utilities

## Lambda Functions

### createScript
- Generates podcast scripts using OpenAI API and Tavily search
- Located in `functions/createScript/`
- Handler: `src/handler.ts`

### createPreviewAudio (previewAudio)
- Generates audio previews using GraphAI pipeline
- Located in `functions/createPreviewAudio/`
- Uses FFmpeg for audio processing and multiple TTS providers

## Development Commands

### Building
```bash
# Build all Lambda functions
npm run build

# Build specific function
npm run build:createScript
npm run build:previewAudio

# Build shared library only
cd shared && npm run build
```

### Development Tools
```bash
# Lint TypeScript code
npm run lint

# Type checking (shared library)
cd shared && npm run lint

# Clean build artifacts
npm run clean
```

### Testing
```bash
# Run tests (Jest framework)
npm test
```

## Infrastructure Deployment

### Lambda Building and Deployment
```bash
# From podly-tr directory
./scripts/build-lambda.sh  # Builds Lambda functions and updates Terraform vars

# Manual Terraform deployment
terraform init
terraform plan
terraform apply
```

### Key Environment Variables
- `OPENAI_API_KEY`: OpenAI API access
- `TAVILY_API_KEY`: Tavily search API access
- `FFMPEG_PATH`: Path to FFmpeg binary in Lambda layer
- `FFPROBE_PATH`: Path to FFprobe binary in Lambda layer

## Key Technologies
- **GraphAI**: Workflow orchestration for audio processing
- **OpenAI API**: Script generation and TTS
- **FFmpeg**: Audio file processing and manipulation
- **AWS Lambda**: Serverless function execution
- **Terraform**: Infrastructure as Code
- **TypeScript**: Primary development language

## File Structure Notes
- Lambda functions use webpack for bundling
- Shared library provides common functionality across functions
- Build scripts generate zip files for Terraform deployment
- Test files use `.js` extension for Lambda testing