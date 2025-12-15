#!/usr/bin/env python3
"""
MCP Tool: read_file
Retrieves and processes uploaded file contents for LLM consumption
"""

import json
import sys
import os
from pathlib import Path

def process_text_file(file_path: str) -> dict:
    """Read plain text files"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return {
            "type": "text",
            "content": content,
            "char_count": len(content)
        }
    except Exception as e:
        return {"error": f"Failed to read text file: {str(e)}"}

def process_pdf_file(file_path: str) -> dict:
    """Extract text from PDF"""
    try:
        try:
            import pdfplumber
            text_content = []
            with pdfplumber.open(file_path) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    text = page.extract_text()
                    if text:
                        text_content.append(f"--- Page {page_num} ---\n{text}")
            full_text = "\n\n".join(text_content)
            return {
                "type": "document",
                "content": full_text,
                "pages": len(text_content),
                "char_count": len(full_text)
            }
        except ImportError:
            import PyPDF2
            text_content = []
            with open(file_path, 'rb') as f:
                pdf_reader = PyPDF2.PdfReader(f)
                for page_num, page in enumerate(pdf_reader.pages, 1):
                    text = page.extract_text()
                    if text:
                        text_content.append(f"--- Page {page_num} ---\n{text}")
            full_text = "\n\n".join(text_content)
            return {
                "type": "document",
                "content": full_text,
                "pages": len(text_content),
                "char_count": len(full_text)
            }
    except Exception as e:
        return {"error": f"Failed to process PDF: {str(e)}"}

def process_docx_file(file_path: str) -> dict:
    """Extract text from DOCX"""
    try:
        from docx import Document
        doc = Document(file_path)
        paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
        full_text = "\n\n".join(paragraphs)
        return {
            "type": "document",
            "content": full_text,
            "paragraphs": len(paragraphs),
            "char_count": len(full_text)
        }
    except Exception as e:
        return {"error": f"Failed to process DOCX: {str(e)}"}

def process_csv_file(file_path: str) -> dict:
    """Parse CSV to markdown table"""
    try:
        import pandas as pd
        df = pd.read_csv(file_path)
        markdown_table = df.to_markdown(index=False)
        return {
            "type": "data",
            "content": markdown_table,
            "rows": len(df),
            "columns": list(df.columns)
        }
    except Exception as e:
        return {"error": f"Failed to process CSV: {str(e)}"}

def process_xlsx_file(file_path: str) -> dict:
    """Parse Excel to markdown tables"""
    try:
        import pandas as pd
        excel_file = pd.ExcelFile(file_path)
        sheets_data = {}
        
        for sheet_name in excel_file.sheet_names:
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            sheets_data[sheet_name] = df.to_markdown(index=False)
        
        content = "\n\n".join([
            f"## Sheet: {name}\n{data}" 
            for name, data in sheets_data.items()
        ])
        
        return {
            "type": "data",
            "content": content,
            "sheets": list(sheets_data.keys())
        }
    except Exception as e:
        return {"error": f"Failed to process Excel: {str(e)}"}

# COMMENTED OUT: Vision API support (for future multimodal models)
# NOTE: Enable when upgrading to GPT-4V, Claude 3, or equivalent
# def process_image_file(file_path: str) -> dict:
#     """Convert image to base64 for vision models"""
#     import base64
#     try:
#         with open(file_path, 'rb') as f:
#             image_data = f.read()
#             base64_image = base64.b64encode(image_data).decode('utf-8')
#         return {
#             "type": "image",
#             "content": base64_image,
#             "size": len(image_data),
#             "format": "base64",
#             "note": "Requires vision-capable model"
#         }
#     except Exception as e:
#         return {"error": f"Failed to process image: {str(e)}"}

def main():
    """Main entry point for MCP tool"""
    data = sys.stdin.read()
    
    try:
        payload = json.loads(data) if data else {}
    except Exception:
        print(json.dumps({
            "success": False,
            "status": 400,
            "data": {"error": "Invalid JSON input"}
        }))
        return
    
    args = payload.get('args', {})
    file_id = args.get('file_id')
    
    if not file_id:
        print(json.dumps({
            "success": False,
            "status": 400,
            "data": {"error": "file_id is required"}
        }))
        return
    
    # Load temp_files from shared JSON file
    temp_files_path = Path(__file__).parent.parent.parent.parent.parent / "backend" / "uploads" / ".temp_files.json"
    
    try:
        if temp_files_path.exists():
            with open(temp_files_path, 'r') as f:
                temp_files = json.load(f)
        else:
            temp_files = {}
    except Exception as e:
        print(json.dumps({
            "success": False,
            "status": 500,
            "data": {"error": f"Failed to load temp files registry: {str(e)}"}
        }))
        return
    
    if file_id not in temp_files:
        print(json.dumps({
            "success": False,
            "status": 404,
            "data": {"error": f"File not found: {file_id}"}
        }))
        return
    
    file_info = temp_files[file_id]
    file_path = file_info.get("path")
    mime_type = file_info.get("mime_type")
    filename = file_info.get("original_filename")
    
    if not os.path.exists(file_path):
        print(json.dumps({
            "success": False,
            "status": 404,
            "data": {"error": f"File not found on disk: {filename}"}
        }))
        return
    
    # Process based on MIME type
    result = None
    
    if mime_type in ('text/plain', 'text/markdown'):
        result = process_text_file(file_path)
    elif mime_type == 'application/pdf':
        result = process_pdf_file(file_path)
    elif mime_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        result = process_docx_file(file_path)
    elif mime_type == 'text/csv':
        result = process_csv_file(file_path)
    elif mime_type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        result = process_xlsx_file(file_path)
    # COMMENTED OUT: Image processing
    # elif mime_type.startswith('image/'):
    #     result = process_image_file(file_path)
    else:
        result = {"error": f"Unsupported file type: {mime_type}"}
    
    if "error" not in result:
        result["filename"] = filename
        result["file_id"] = file_id
    
    if "error" in result:
        print(json.dumps({
            "success": False,
            "status": 400,
            "data": result
        }))
    else:
        print(json.dumps({
            "success": True,
            "status": 200,
            "data": result
        }))

if __name__ == '__main__':
    main()
