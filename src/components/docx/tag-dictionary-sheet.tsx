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
              <span className="font-bold text-slate-900 block mb-0.5">Repeating Lists (Indexed Tags)</span>
              For repeating lists, add suffixes starting from 1 (e.g., <code className="font-mono bg-white px-1 border rounded font-semibold text-slate-700">{`{{${
                entityType === 'participant' ? 'contact_name' : entityType === 'staff' ? 'qualification_title' : 'participant_name'
              }1}}`}</code>, <code className="font-mono bg-white px-1 border rounded font-semibold text-slate-700">{`{{${
                entityType === 'participant' ? 'contact_name' : entityType === 'staff' ? 'qualification_title' : 'participant_name'
              }2}}`}</code>, <code className="font-mono bg-white px-1 border rounded font-semibold text-slate-700">{`{{${
                entityType === 'participant' ? 'contact_name' : entityType === 'staff' ? 'qualification_title' : 'participant_name'
              }3}}`}</code>) directly into separate rows of your Word document table. Any redundant or empty rows will be left blank after generating and should be manually deleted.
            </div>
          </div>

          {/* Categories Grid */}
          <div className="flex flex-col gap-6">
            {categories.map((category) => {
              const categoryTags = filteredTags.filter(t => t.category === category);
              if (categoryTags.length === 0) return null;

              // Identify if this category contains repeating indexed tags (any tag ending with a digit followed by }})
              const isRepeating = categoryTags.some(t => /\d+}}$/.test(t.name));

              return (
                <div
                  key={category}
                  className={cn(
                    "flex flex-col gap-3 transition-all duration-200",
                    isRepeating && cn("p-4 rounded-2xl border border-dashed", theme.border, theme.bg)
                  )}
                >
                  <div className="flex items-center justify-between border-b pb-1">
                    <h3 className={cn(
                      "text-xs font-black uppercase tracking-wider flex items-center gap-1.5",
                      isRepeating ? theme.text : "text-slate-400"
                    )}>
                      {isRepeating && <Repeat className="size-3.5 shrink-0 animate-pulse" />}
                      {category} {isRepeating && '(Repeating)'}
                    </h3>
                    {isRepeating && (
                      <Badge className={cn('text-[9px] uppercase border font-bold shadow-none pointer-events-none', theme.badge, theme.border)}>
                        Repeating Section
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {categoryTags.map((tag) => (
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
                </div>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
