# Bulk Resume Upload API

This API allows HR users to upload a ZIP file containing multiple resumes. The system will automatically extract skills from each resume using Google Gemini AI.

## Endpoint

**POST** `/admin/resumes/bulk-upload`

## Authentication

Requires HR or Admin authentication with JWT token in cookies.

## Request

- **Content-Type**: `multipart/form-data`
- **Body**: Form data with `zipFile` field containing a ZIP file

## Supported File Types in ZIP

- PDF (.pdf)
- Microsoft Word (.docx)
- Legacy Word (.doc) - text extraction may be limited

## Response

### Success (200)
```json
{
  "success": true,
  "message": "Successfully processed X resume files",
  "processedCount": 5
}
```

### Error (400/500)
```json
{
  "success": false,
  "message": "Error message"
}
```

## Database Schema

The resumes are stored in the `resumes` table with the following fields:

- `id`: Primary key
- `resumeUniqueId`: UUID for unique identification
- `resumeUrl`: Path to the stored resume file
- `extractedSkills`: Array of skills extracted by AI
- `uploadedBy`: ID of the HR user who uploaded
- `uploadDate`: Timestamp of upload
- `fileName`: Original filename
- `fileSize`: File size in bytes
- `status`: Processing status ('uploaded', 'processing', 'processed', 'failed')
- `processingError`: Error message if processing failed

## Environment Variables

Add your Google Gemini API key to `.env`:

```
GEMINI_API_KEY=your_api_key_here
```

Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

## Other Endpoints

- **GET** `/admin/resumes` - Get all resumes (HR/Admin only)
- **GET** `/admin/resumes/:id` - Get resume by ID (HR/Admin only)