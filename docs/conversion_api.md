# PDF Conversion API

## 1. Overview

The PDF Conversion API transforms PDF documents into various other formats, including DOCX, TXT, HTML, and a ZIP archive of images.

## 2. Endpoint

`POST /api/convert`

## 3. Request

### 3.1. Format

The request must be a `multipart/form-data` POST request.

### 3.2. Parameters

| Parameter            | Type    | Required | Default  | Description                                                                                             |
| -------------------- | ------- | -------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `file`               | File    | Yes      | -        | The PDF file to be converted.                                                                           |
| `format`             | String  | Yes      | -        | The desired output format. Valid options: `docx`, `txt`, `html`, `images`.                              |
| `quality`            | String  | No       | `medium` | The quality of the conversion. Valid options: `low`, `medium`, `high`.                                  |
| `preserveFormatting` | Boolean | No       | `true`   | Whether to preserve the original document's layout and formatting (if applicable).                      |
| `extractImages`      | Boolean | No       | `false`  | If `true`, extracts all images from the PDF into a ZIP archive. This option forces the `format` to be `images`. |

## 4. Success Response

-   **Status Code:** `200 OK`
-   **Content-Type:** Varies based on the requested `format`.
    -   `docx`: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
    -   `txt`: `text/plain`
    -   `html`: `text/html`
    -   `images`: `application/zip`
-   **Body:** The binary content of the converted file.

-   **Headers:**
    | Header                  | Description                               | Example      |
    | ----------------------- | ----------------------------------------- | ------------ |
    | `Content-Disposition`   | The suggested filename for the download.  | `attachment; filename="example.docx"` |
    | `X-Original-Size`       | The original size of the PDF in bytes.    | `1048576`    |
    | `X-Converted-Size`      | The final size of the converted file.     | `524288`     |
    | `X-Conversion-Format`   | The output format used for the conversion.| `docx`       |
    | `X-Processing-Time`     | The time taken for the conversion in ms.  | `1234`       |

## 5. Error Response

-   **Status Code:** `400 Bad Request` for invalid parameters, missing files, or invalid file types.
-   **Status Code:** `500 Internal Server Error` for unexpected server-side errors.
-   **Content-Type:** `application/json`

-   **Body:**
    ```json
    {
      "success": false,
      "error": "A descriptive error message.",
      "timestamp": "2025-09-02T10:00:00.000Z"
    }
    ```
    **Example Error Messages:**
    - "No file provided for conversion"
    - "File is not a valid PDF. Header signature is missing."
    - "Invalid format. Valid options: docx, txt, html, images"

## 6. Example

### `curl` Example (Convert to DOCX)

```bash
curl -X POST "http://your-server.com/api/convert" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@/path/to/your/document.pdf" \
     -F "format=docx" \
     -F "quality=high" \
     --output converted_document.docx
```

### `curl` Example (Extract Images)

```bash
curl -X POST "http://your-server.com/api/convert" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@/path/to/your/document.pdf" \
     -F "format=images" \
     --output extracted_images.zip
```
```