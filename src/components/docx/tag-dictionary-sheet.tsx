import { useState } from 'react';
import {
  Copy,
  Info,
  Search,
  Check,
  HelpCircle,
  Repeat,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { TemplateTag } from '@/lib/docx/types';
import { cn } from '@/lib/utils';

interface TagDictionarySheetProps {
  tags: TemplateTag[];
  entityType: 'participant' | 'staff' | 'house';
}

export function TagDictionarySheet({ tags, entityType }: TagDictionarySheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { copyToClipboard } = useCopyToClipboard();
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  // Define visual themes based on entity
  const theme = {
    participant: {
      text: 'text-blue-600',
      border: 'border-blue-200',
      bg: 'bg-blue-50/50',
      hoverBg: 'hover:bg-blue-50/30',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      accent: 'blue',
    },
    staff: {
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      bg: 'bg-emerald-50/50',
      hoverBg: 'hover:bg-emerald-50/30',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      accent: 'emerald',
    },
    house: {
      text: 'text-indigo-600',
      border: 'border-indigo-200',
      bg: 'bg-indigo-50/50',
      hoverBg: 'hover:bg-indigo-50/30',
      badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      accent: 'indigo',
    },
  }[entityType];

  const handleCopy = (tagText: string) => {
    copyToClipboard(tagText);
    setCopiedTag(tagText);
    toast.success(`Copied ${tagText} to clipboard`);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  // Helper to generate the copyable list/table layout pattern for a loop
  const handleCopyLoopPattern = (loopStartName: string, category: string) => {
    const loopVar = loopStartName.replace('{{#', '').replace('}}', '');
    const loopEndName = `{{/${loopVar}}}`;
    
    // Find all variables belonging to this loop parent
    const childTags = tags.filter(t => t.loopParent === loopStartName);
    
    // Construct a tab-separated inline pattern so it pastes directly across table cells in Word
    const formattedChildren = childTags.map(t => t.name).join('\t');
    
    const pattern = `${loopStartName}\t${formattedChildren}\t${loopEndName}`;
    copyToClipboard(pattern);
    toast.success(`Copied repeating loop pattern for ${category}`);
  };

  // Filter tags based on search
  const filteredTags = tags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(search.toLowerCase()) ||
      tag.description.toLowerCase().includes(search.toLowerCase()) ||
      tag.category.toLowerCase().includes(search.toLowerCase())
  );

  // Group tags by Category
  const categories = Array.from(new Set(tags.map(t => t.category)));

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-11 shadow-xs border transition-colors',
            entityType === 'participant' && 'border-blue-200 hover:bg-blue-50/50 hover:text-blue-700',
            entityType === 'staff' && 'border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700',
            entityType === 'house' && 'border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700'
          )}
        >
          <Info className={cn('size-4 me-2', theme.text)} />
          Tag Dictionary
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[450px] sm:w-[560px] overflow-y-auto bg-white/95 backdrop-blur-md">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold">
            <Info className={cn('size-5', theme.text)} />
            {entityType.charAt(0).toUpperCase() + entityType.slice(1)} Tag Dictionary
          </SheetTitle>
          <SheetDescription>
            Search and copy placeholders to use in your MS Word templates. Repeating lists are highlighted below.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-5">
          {/* Search Field */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              placeholder="Search tags..."
              className="pl-9 h-11 border-slate-200 focus-visible:ring-primary/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Guidelines info box */}
          <div className={cn('p-4 rounded-xl border flex gap-3 text-xs leading-relaxed text-slate-600', theme.bg, theme.border)}>
            <HelpCircle className={cn('size-5 shrink-0 mt-0.5', theme.text)} />
            <div>
              <span className="font-bold text-slate-900 block mb-0.5">Repeating Sections (Loops)</span>
              Fields grouped inside <span className="font-semibold">Repeating Lists</span> must be wrapped between opening <code className="font-mono bg-white px-1 border rounded font-semibold text-slate-700">{"{{#name}}"}</code> and closing <code className="font-mono bg-white px-1 border rounded font-semibold text-slate-700">{"{{/name}}"}</code> tags. 
              In tables, place the start/end tags inside cells of the same row to repeat that row.
            </div>
          </div>

          {/* Categories Grid */}
          <div className="flex flex-col gap-6">
            {categories.map((category) => {
              const categoryTags = filteredTags.filter(t => t.category === category);
              if (categoryTags.length === 0) return null;

              // Split tags
              const scalarTags = categoryTags.filter(t => !t.isLoopStart && !t.isLoopEnd && !t.loopParent);
              const loopStartTags = categoryTags.filter(t => t.isLoopStart);
              const hasLoops = loopStartTags.length > 0;

              return (
                <div
                  key={category}
                  className={cn(
                    "flex flex-col gap-3 transition-all duration-200",
                    hasLoops && cn("p-4 rounded-2xl border border-dashed", theme.border, theme.bg)
                  )}
                >
                  <div className="flex items-center justify-between border-b pb-1">
                    <h3 className={cn(
                      "text-xs font-black uppercase tracking-wider flex items-center gap-1.5",
                      hasLoops ? theme.text : "text-slate-400"
                    )}>
                      {hasLoops && <Repeat className="size-3.5 shrink-0 animate-pulse" />}
                      {category} {hasLoops && '(Repeating)'}
                    </h3>
                    {hasLoops && (
                      <Badge className={cn('text-[9px] uppercase border font-bold shadow-none pointer-events-none', theme.badge, theme.border)}>
                        Repeating Section
                      </Badge>
                    )}
                  </div>

                  {/* Render Scalar Tags */}
                  {scalarTags.length > 0 && (
                    <div className="grid grid-cols-1 gap-2">
                      {scalarTags.map((tag) => (
                        <div
                          key={tag.name}
                          className="group flex flex-col gap-1.5 p-3 rounded-xl border bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-xs transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <code className="text-sm font-bold text-slate-800 font-mono">
                              {tag.name}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleCopy(tag.name)}
                            >
                              {copiedTag === tag.name ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-3.5" />}
                            </Button>
                          </div>
                          <p className="text-xs text-slate-500 leading-normal">{tag.description}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-slate-400 italic">
                              Example: {tag.example}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Render Loops */}
                  {loopStartTags.map((startTag) => {
                    const loopVar = startTag.name.replace('{{#', '').replace('}}', '');
                    const endTagName = `{{/${loopVar}}}`;
                    
                    const childTags = categoryTags.filter(t => t.loopParent === startTag.name);
                    const endTag = categoryTags.find(t => t.name === endTagName || (t.isLoopEnd && t.name.includes(loopVar)));

                    return (
                      <div key={startTag.name} className={cn('p-4 rounded-2xl border flex flex-col gap-3 relative overflow-hidden bg-slate-50/30', theme.border)}>
                        {/* Loop Header */}
                        <div className="flex items-center justify-between bg-white border p-3 rounded-xl shadow-xs">
                          <div className="flex flex-col gap-1 min-w-0">
                            <code className={cn('text-sm font-bold truncate font-mono', theme.text)}>
                              {startTag.name}
                            </code>
                            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center gap-1">
                              <span className="inline-block size-1.5 rounded-full bg-blue-500 animate-pulse" />
                              Loop Open Tag
                            </span>
                            <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                              {startTag.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-[10px] font-bold px-2.5 border-slate-200 hover:bg-slate-50"
                              onClick={() => handleCopyLoopPattern(startTag.name, category)}
                              title="Copy full nested loop code template"
                            >
                              Copy Loop Pattern
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                              onClick={() => handleCopy(startTag.name)}
                            >
                              {copiedTag === startTag.name ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-3.5" />}
                            </Button>
                          </div>
                        </div>

                        {/* Loop Children */}
                        {childTags.length > 0 && (
                          <div className={cn('ml-5 pl-5 border-l-2 border-dashed flex flex-col gap-2.5 my-1', theme.border)}>
                            {childTags.map(childTag => (
                              <div
                                key={childTag.name}
                                className="group flex flex-col gap-1 p-3 rounded-xl border bg-white hover:border-slate-300 hover:shadow-xs transition-all"
                              >
                                <div className="flex items-center justify-between">
                                  <code className="text-xs font-bold text-slate-800 font-mono">
                                    {childTag.name}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleCopy(childTag.name)}
                                  >
                                    {copiedTag === childTag.name ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3" />}
                                  </Button>
                                </div>
                                <p className="text-[11px] text-slate-500">{childTag.description}</p>
                                <span className="text-[9px] text-slate-400 italic font-mono mt-0.5">
                                  Output Ex: {childTag.example}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Loop Footer */}
                        {endTag && (
                          <div className="flex items-center justify-between bg-white border p-3 rounded-xl shadow-xs">
                            <div className="flex flex-col gap-1 min-w-0">
                              <code className="text-sm font-bold truncate text-slate-700 font-mono">
                                {endTag.name}
                              </code>
                              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center gap-1">
                                <span className="inline-block size-1.5 rounded-full bg-slate-400" />
                                Loop Close Tag
                              </span>
                              <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                                {endTag.description}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100 shrink-0"
                              onClick={() => handleCopy(endTag.name)}
                            >
                              {copiedTag === endTag.name ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-3.5" />}
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
