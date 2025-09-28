import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { meilisearchService } from "@/services/meilisearchService";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AutocompleteSearchProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

export const AutocompleteSearch: React.FC<AutocompleteSearchProps> = ({
  placeholder = "Rechercher des produits...",
  className,
  onSearch,
}) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce pour les suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true);
        try {
          const results = await meilisearchService.getAutocompleteSuggestions(query);
          setSuggestions(results);
          setIsOpen(results.length > 0);
        } catch (error) {
          setSuggestions([]);
          setIsOpen(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Fermer les suggestions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Navigation au clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => prev > 0 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSearch(suggestions[selectedIndex]);
        } else {
          handleSearch(query);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSearch = (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    setQuery(trimmedQuery);
    setIsOpen(false);
    setSelectedIndex(-1);
    
    if (onSearch) {
      onSearch(trimmedQuery);
    } else {
      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSearch(suggestion);
  };

  const clearSearch = () => {
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-md", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors",
                    selectedIndex === index && "bg-accent"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-3 w-3 text-muted-foreground" />
                    <span>{suggestion}</span>
                  </div>
                </button>
              ))}
              
              {/* Option pour rechercher le terme exact */}
              <div className="border-t border-border mt-1 pt-1">
                <button
                  onClick={() => handleSearch(query)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors text-primary"
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-3 w-3" />
                    <span>Rechercher "{query}"</span>
                  </div>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};