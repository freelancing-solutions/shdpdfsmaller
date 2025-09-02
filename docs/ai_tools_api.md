# PDF AI Tools API

## 1. Overview

The PDF AI Tools API leverages artificial intelligence to perform advanced analysis and transformation of PDF content. The available tools include summarization, translation, keyword extraction, and more. The output is always a plain text (`.txt`) file.

## 2. Endpoint

`POST /api/ai-tools`

## 3. Request

### 3.1. Format

The request must be a `multipart/form-data` POST request.

### 3.2. Parameters

| Parameter        | Type   | Required | Default | Description                                                                                                                                                           |
| ---------------- | ------ | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `file`           | File   | Yes      | -       | The PDF file to process.                                                                                                                                              |
| `tool`           | String | Yes      | -       | The AI tool to use. Valid options: `summarize`, `translate`, `extract-keywords`, `analyze-sentiment`, `generate-questions`, `categorize`.                               | 
| `detailLevel`    | String | No       | `basic` | The level of detail for the output. Valid options: `basic`, `detailed`, `comprehensive`. (Mainly for `summarize`).                                                      |
| `maxLength`      | Number | No       | `1000`  | The maximum length (in characters or tokens) of the output. Range: 100-10000. (Mainly for `summarize`).                                                                |
| `targetLanguage` | String | **Yes** (if `tool` is `translate`) | -       | The target language for translation. Valid options: `en`, `es`, `fr`, `de`, `it`, `pt`, `ru`, `zh`, `ja`, `ko`. |

## 4. Success Response

-   **Status Code:** `200 OK`
-   **Content-Type:** `text/plain`
-   **Body:** The binary content of the resulting `.txt` file.

-   **Headers:**
    | Header                | Description                               | Example      |
    | --------------------- | ----------------------------------------- | ------------ |
    | `Content-Disposition` | The suggested filename for the download.  | `attachment; filename="example_summarize.txt"` |
    | `X-AI-Tool`           | The AI tool that was used for processing. | `summarize`  |
    | `X-Processing-Time`   | The time taken for the AI task in ms.     | `7890`       |
    | `X-Detail-Level`      | The detail level setting used.            | `basic`      |

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
    - "No file provided for AI processing"
    - "File is not a valid PDF. Header signature is missing."
    - "Invalid tool. Valid options: summarize, translate, ..."
    - "Invalid or missing target language for translation"

## 6. Example

### `curl` Example (Summarize)

```bash
curl -X POST "https://pdfsmaller.site/api/ai-tools" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@/path/to/your/long_document.pdf" \
     -F "tool=summarize" \
     -F "detailLevel=comprehensive" \
     --output summary.txt
```

### `curl` Example (Translate)

```bash
curl -X POST "https://pdfsmaller.site/api/ai-tools" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@/path/to/your/document.pdf" \
     -F "tool=translate" \
     -F "targetLanguage=fr" \
     --output translated_document.txt
```
