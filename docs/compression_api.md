# PDF Compression API

## 1. Overview

The PDF Compression API allows you to reduce the file size of one or more PDF documents. It provides several compression levels and image quality settings to balance file size and visual quality.

## 2. Endpoint

`POST /api/compress`

## 3. Request

### 3.1. Format

The request must be a `multipart/form-data` POST request.

### 3.2. Parameters

| Parameter          | Type                               | Required | Default  | Description                                                                                             |
| ------------------ | ---------------------------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `file`             | File                               | Yes      | -        | A single PDF file to be compressed. Use this field for single-file compression.                         |
| `files`            | Array<File>                        | Yes      | -        | An array of PDF files to be compressed. Use this field for bulk compression.                            |
| `compressionLevel` | String                             | No       | `medium` | The desired compression level. Valid options: `low`, `medium`, `high`, `maximum`.                       |
| `imageQuality`     | Number                             | No       | `75`     | The quality of images within the PDF, from 10 to 100. Lower values result in smaller file sizes.         |

**Note:** You must provide either the `file` parameter for a single file or the `files` parameter for multiple files.

## 4. Success Response

### 4.1. Single File Compression

-   **Status Code:** `200 OK`
-   **Content-Type:** `application/pdf`
-   **Body:** The binary content of the compressed PDF file.

-   **Headers:
    | Header                | Description                               | Example      |
    | --------------------- | ----------------------------------------- | ------------ |
    | `Content-Disposition` | The suggested filename for the download.  | `attachment; filename="example_compressed.pdf"` |
    | `X-Original-Size`     | The original size of the file in bytes.   | `1048576`    |
    | `X-Compressed-Size`   | The final size of the compressed file.    | `524288`     |
    | `X-Reduction-Percent` | The percentage of size reduction achieved. | `50.0`       |

### 4.2. Bulk File Compression

*(Note: The current implementation returns the first compressed file as a placeholder. A future update will return a ZIP archive.)*

-   **Status Code:** `200 OK`
-   **Content-Type:** `application/pdf` (or `application/zip` in the future)
-   **Body:** The binary content of the first compressed PDF file.

-   **Headers:
    | Header                | Description                               | Example      |
    | --------------------- | ----------------------------------------- | ------------ |
    | `Content-Disposition` | The suggested filename for the download.  | `attachment; filename="example_compressed.pdf"` |
    | `X-Total-Files`       | The number of files processed.            | `5`          |

## 5. Error Response

-   **Status Code:** `400 Bad Request` for invalid parameters, missing files, or invalid file types.
-   **Status Code:** `500 Internal Server Error` for unexpected server-side errors.
-   **Content-Type:** `application/json`

-   **Body:
    ```json
    {
      "success": false,
      "error": "A descriptive error message.",
      "timestamp": "2025-09-02T10:00:00.000Z"
    }
    ```
    **Example Error Messages:**
    - "No file or files provided. Use 'file' for single or 'files' for multiple."
    - "File is not a valid PDF. Header signature is missing."
    - "Invalid compressionLevel. Valid options: low, medium, high, maximum"

## 6. Example

### 6.1. Single File using `curl`

```bash
curl -X POST "https://pdfsmaller.site/api/compress" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@/path/to/your/document.pdf" \
     -F "compressionLevel=high" \
     -F "imageQuality=80" \
     --output compressed_document.pdf
```

### 6.2. Multiple Files using `curl`

```bash
curl -X POST "https://pdfsmaller.site/api/compress" \
     -H "Content-Type: multipart/form-data" \
     -F "files=@/path/to/your/document1.pdf" \
     -F "files=@/path/to/your/document2.pdf" \
     -F "compressionLevel=medium" \
     --output first_compressed_file.pdf
```