# Playwright Integration Documentation

## Overview
The PostJob application now includes Playwright for automated job posting to university job boards. This allows users to automatically post their job listings to multiple university career sites with a single submission.

## Supported Job Boards

Currently, the following university job boards are supported:

1. **Harvard University** - Harvard's career services portal
2. **Stanford University** - Stanford career search platform
3. **MIT** - MIT career development center
4. **Yale University** - Yale Office of Career Strategy
5. **Princeton University** - Princeton career development (via Handshake)

## Architecture

### Components

1. **Browser Service** (`src/services/browser.service.ts`)
   - Manages Playwright browser instances
   - Provides utilities for page manipulation
   - Handles screenshots and error recovery

2. **Posting Strategies** (`src/services/posting-strategies/`)
   - Base strategy class for common functionality
   - Individual strategy implementations for each university
   - Handles login, form filling, and submission

3. **Posting Service** (`src/services/posting.service.ts`)
   - Orchestrates the posting process
   - Manages credentials and job data
   - Updates database with results

4. **Job Queue Integration** (`src/queue/job.queue.ts`)
   - Processes jobs asynchronously
   - Sends real-time updates via WebSocket
   - Handles retries and error recovery

## Usage

### Testing the Integration

```bash
# Install Playwright browsers (first time only)
npm run playwright:install

# Run posting integration tests
npm run test:posting
```

### Adding Jobs to Queue

Jobs are automatically added to the posting queue when:
1. Payment is confirmed
2. User selects job boards for posting
3. Job status is set to "pending"

### Monitoring Progress

The application provides real-time updates via WebSocket:
- `job-start` - Posting process begins
- `job-update` - Individual board posting status
- `job-complete` - All postings completed
- `job-error` - Error occurred during posting

## Configuration

### Environment Variables

```env
# Playwright configuration
NODE_ENV=development  # Set to 'production' for headless mode
DEFAULT_POSTING_PASSWORD=secure-password  # Default password for job board accounts
```

### Board Credentials

Each university may require different credentials:
- Email/Username
- Password
- Company name
- Some may require manual account creation

## Adding New Job Boards

To add a new job board:

1. Create a new strategy file in `src/services/posting-strategies/`
2. Extend the `BasePostingStrategy` class
3. Implement required methods:
   - `login()` - Handle authentication
   - `fillJobForm()` - Fill the job posting form
   - `submitJob()` - Submit and verify posting
4. Add the strategy to the index file
5. Update the database with board information

## Error Handling

The system includes multiple levels of error handling:

1. **Page-level errors** - Screenshots captured on failure
2. **Network errors** - Automatic retries with exponential backoff
3. **Form validation** - Detailed error messages returned
4. **Authentication failures** - Clear error reporting

## Best Practices

1. **Rate Limiting** - Delays between postings to avoid being blocked
2. **Cookie Handling** - Automatic acceptance of cookie consent
3. **Resource Optimization** - Blocks unnecessary images/styles
4. **Debugging** - Screenshots and detailed logs in development

## Troubleshooting

### Common Issues

1. **Login Failures**
   - Verify credentials are correct
   - Check if manual account creation is needed
   - Some boards may require university affiliation

2. **Form Submission Errors**
   - Check required fields are filled
   - Verify field selectors are up-to-date
   - Review validation error messages

3. **Timeout Errors**
   - Increase timeout values in configuration
   - Check network connectivity
   - Verify board websites are accessible

### Debug Mode

Run in development mode for visual debugging:
```bash
NODE_ENV=development npm run dev
```

This will run Playwright in headed mode, allowing you to see the automation in action.

## Security Considerations

1. **Credentials** - Store securely, never commit to repository
2. **Rate Limiting** - Respect website terms of service
3. **User Agents** - Use appropriate user agent strings
4. **Session Management** - Clean up browser sessions

## Future Enhancements

- Support for more university job boards
- Advanced scheduling options
- Bulk posting capabilities
- Analytics and reporting
- Credential management UI