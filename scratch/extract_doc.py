import re

doc_path = "/home/marcos/CBM App/CBM Specification/OOSDOMPF000019C1_DRAFT UNDER REVIEW.doc"

with open(doc_path, "rb") as f:
    content = f.read()

# Extract printable strings of length >= 6
# Look for UTF-16LE and ASCII
ascii_strings = re.findall(rb'[A-Za-z0-9\s\.,;:_/\-\(\)]{6,}', content)
# Also utf-16le strings
utf16_strings = []
try:
    # decode utf-16le ignoring errors
    decoded_utf16 = content.decode('utf-16le', errors='ignore')
    # find lines that look like headings or text
    lines = [line.strip() for line in decoded_utf16.split('\n') if len(line.strip()) > 5]
    print(f"Total UTF-16 lines extracted: {len(lines)}")
    # Print sample of lines that mention section, table of contents, 6., 4., etc.
    with open("/home/marcos/CBM App/scratch/extracted_doc_lines.txt", "w", encoding="utf-8") as out:
        for l in lines:
            out.write(l + "\n")
    print("Wrote extracted_doc_lines.txt")
except Exception as e:
    print("Error:", e)
