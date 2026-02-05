# Coding Style Guide

## General Principles
- Prefer simple, readable solutions
- Keep files under 200-300 lines; refactor when exceeded
- Use meaningful variable and function names
- Write self-documenting code; add comments only for complex logic

## Python Style
- Follow PEP 8
- Use type hints for all function signatures
- Prefer f-strings over .format() or %
- Use pathlib for file paths

## Async Patterns
- Use async/await for all I/O operations
- Prefer asyncio.gather for parallel operations
- Handle timeouts explicitly

## Error Handling
- Use specific exception types
- Log errors with context
- Return meaningful error responses from API

## Testing
- Write tests alongside implementation
- Mock external APIs
- Test edge cases and error paths
