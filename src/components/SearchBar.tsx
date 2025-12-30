import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
  isLoading?: boolean;
}

export const SearchBar = ({ 
  value, 
  onChange, 
  onSearch, 
  placeholder = "Search by drug name or NDC...",
  isLoading = false 
}: SearchBarProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl mx-auto">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-12 h-14 text-base"
        />
      </div>
      <Button 
        onClick={onSearch} 
        size="xl" 
        variant="hero"
        disabled={isLoading}
        className="sm:w-auto w-full"
      >
        {isLoading ? "Searching..." : "Search"}
      </Button>
    </div>
  );
};
