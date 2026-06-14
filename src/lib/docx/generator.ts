import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  VerticalAlign,
  BorderStyle,
} from 'docx';
import { TemplateTag } from './participant-tags';

/**
 * Utility for generating MS Word (.docx) documents from templates.
 */
export const docxGenerator = {
  /**
   * Generates a merged .docx file and triggers a browser download.
   */
  async generate(templateBlob: Blob, data: any, filename: string): Promise<void> {
    try {
      const content = await templateBlob.arrayBuffer();
      const zip = new PizZip(content);

      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: {
          start: '{{',
          end: '}}',
        },
        nullGetter(part: any) {
          if (!part.module) {
            return '';
          }
          if (part.module === 'rawxml') {
            return '';
          }
          return '';
        },
      });

      // Render the document (replace tags with data)
      doc.render(data);

      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      // Trigger standard browser download
      saveAs(out, `${filename}.docx`);
      } catch (error: any) {
      // docxtemplater errors have a properties object with detailed error info
      if (error.properties && error.properties.errors instanceof Array) {
        const errorMessages = error.properties.errors
          .map((e: any) => {
            return `${e.message}${e.properties?.explanation ? `: ${e.properties.explanation}` : ''}`;
          })
          .join('\n');
        console.error('docxtemplater Detailed Errors:\n', errorMessages);
      }
      console.error('Error generating document:', error);
      throw error;
      }
      },
  /**
   * Validates the template syntax by compiling it in-memory.
   * Returns validation result and potential detailed error message.
   */
  async validateTemplate(file: File): Promise<{ valid: boolean; error?: string }> {
    try {
      const content = await file.arrayBuffer();
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: {
          start: '{{',
          end: '}}',
        },
      });
      doc.compile();
      return { valid: true };
    } catch (err: any) {
      let message = err.message || 'Unknown parsing error';
      if (err.properties && err.properties.errors instanceof Array) {
        message = err.properties.errors
          .map((e: any) => `${e.message}${e.properties?.explanation ? `: ${e.properties.explanation}` : ''}`)
          .join('\n');
      }
      return { valid: false, error: message };
    }
  },

  /**
   * Generates a professional Cheat Sheet document containing all available tags.
   */
  async downloadCheatSheet(tags: TemplateTag[], filename = 'InsideCare_Tag_Cheat_Sheet', primaryColor = '2563EB'): Promise<void> {
    // Group tags by category
    const categories = Array.from(new Set(tags.map((t) => t.category)));

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: 'InsideCare - Template Tag Dictionary',
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Instructions:',
                  bold: true,
                }),
                new TextRun({
                  text: ' Copy the tags from the "Tag Syntax" column and paste them exactly as they appear into your Word or Google Docs templates. Loop tags starting with {{#name}} and ending with {{/name}} must be used to enclose lists or tables.',
                }),
              ],
              spacing: { after: 400 },
            }),
            ...categories.flatMap((category) => {
              const categoryTags = tags.filter((t) => t.category === category);
              return [
                new Paragraph({
                  text: category,
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 400, after: 200 },
                }),
                new Table({
                  width: {
                    size: 100,
                    type: WidthType.PERCENTAGE,
                  },
                  rows: [
                    // Header Row
                    new TableRow({
                      children: [
                        this.createHeaderCell('Tag Syntax'),
                        this.createHeaderCell('Description'),
                        this.createHeaderCell('Example Output'),
                      ],
                    }),
                    // Data Rows
                    ...categoryTags.map(
                      (tag) =>
                        new TableRow({
                          children: [
                            this.createCell(tag.name, true, false, primaryColor),
                            this.createCell(tag.description),
                            this.createCell(tag.example, false, true, primaryColor),
                          ],
                        })
                    ),
                  ],
                }),
              ];
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${filename}.docx`);
  },

  createHeaderCell(text: string) {
    return new TableCell({
      children: [new Paragraph({ text, bold: true })],
      shading: { fill: 'F1F5F9' },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 100, bottom: 100, left: 100, right: 100 },
    });
  },

  createCell(text: string, isCode = false, isItalic = false, primaryColor = '2563EB') {
    return new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text,
              font: isCode ? 'Courier New' : 'Calibri',
              bold: isCode,
              italics: isItalic,
              color: isCode ? primaryColor : '000000',
            }),
          ],
        }),
      ],
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
        left: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
        right: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
      },
    });
  },
};

