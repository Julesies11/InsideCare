export interface TemplateTag {
  name: string;
  description: string;
  category: string;
  example: string;
  isLoopStart?: boolean;
  isLoopEnd?: boolean;
  loopParent?: string;
}
