# PDF OCR API

## 1. Overview

The PDF OCR (Optical Character Recognition) API extracts text from PDF documents. It supports multiple languages and can output the results in various formats, including plain text, a new searchable PDF, or a DOCX file.

## 2. Endpoint

`POST /api/ocr`

## 3. Request

### 3.1. Format

The request must be a `multipart/form-data` POST request.

### 3.2. Parameters

| Parameter        | Type    | Required | Default | Description                                                                                                                               |
| ---------------- | ------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `file`           | File    | Yes      | -       | The PDF file to process.                                                                                                                  |
| `language`       | String  | Yes      | -       | The language of the text in the document. Valid options: `en`, `es`, `fr`, `de`, `it`, `pt`, `ru`, `zh`, `ja`, `ko`.                        |
| `outputFormat`   | String  | Yes      | -       | The desired output format. Valid options: `txt`, `pdf`, `docx`, `searchable-pdf`.                                                         |
| `preserveLayout` | Boolean | No       | `false` | Whether to preserve the original document's visual layout in the output (applicable to `docx` and `pdf` formats).                         |
| `confidence`     | Number  | No       | `95`    | The minimum confidence level for recognized text, from 50 to 100. Text with lower confidence will be discarded.                            |

## 4. Success Response

-   **Status Code:** `200 OK`
-   **Content-Type:** Varies based on the requested `outputFormat`.
    -   `txt`: `text/plain`
    -   `pdf`, `searchable-pdf`: `application/pdf`
    -   `docx`: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
-   **Body:** The binary content of the processed file.

-   **Headers:**
    | Header               | Description                               | Example      |
    | -------------------- | ----------------------------------------- | ------------ |
    | `Content-Disposition`| The suggested filename for the download.  | `attachment; filename="example_ocr.txt"` |
    | `X-Original-Size`    | The original size of the PDF in bytes.    | `1048576`    |
    | `X-Processed-Size`   | The final size of the output file.        | `524288`     |
    | `X-OCR-Confidence`   | The average confidence of the OCR process.| `98.5`       |
    | `X-Processing-Time`  | The time taken for OCR in ms.             | `4567`       |
    | `X-Output-Format`    | The output format used for the process.   | `txt`        |

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
    - "No file provided for OCR processing"
    - "File is not a valid PDF. Header signature is missing."
    - "Invalid language. Valid options: en, es, fr, ..."

## 6. Example

### `curl` Example (Get Plain Text)

```bash
curl -X POST "https://pdfsmaller.site/api/ocr" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@/path/to/your/scanned_document.pdf" \
     -F "language=en" \
     -F "outputFormat=txt" \
     --output extracted_text.txt
```

### `curl` Example (Create Searchable PDF)

```bash
curl -X POST "https://pdfsmaller.site/api/ocr" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@/path/to/your/image_based_document.pdf" \
     -F "language=de" \
     -F "outputFormat=searchable-pdf" \
     -F "preserveLayout=true" \
     --output searchable_document.pdf
```